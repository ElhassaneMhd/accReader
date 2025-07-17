const { NodeSSH } = require('node-ssh');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const logger = require('../utils/logger');
const { createReadStream } = require('fs');
const csv = require('csv-parser');

class PMTASSHImportService {
  constructor() {
    this.ssh = new NodeSSH();
    this.isConnected = false;
    this.importStatus = {
      status: 'disconnected',
      lastImport: null,
      lastError: null,
      totalFiles: 0,
      filesProcessed: 0,
      connectionHealth: 'unknown',
    };
    
    // Configuration from environment
    this.config = {
      host: process.env.PMTA_HOST || '91.229.239.75',
      port: parseInt(process.env.PMTA_PORT) || 22,
      username: process.env.PMTA_USERNAME || 'your_username',
      password: process.env.PMTA_PASSWORD || 'your_password',
      logPath: process.env.PMTA_LOG_PATH || '/var/log/pmta',
      logPattern: process.env.PMTA_LOG_PATTERN || 'acct-*.csv',
      interval: parseInt(process.env.IMPORT_INTERVAL) || 30000,
      enabled: process.env.AUTO_IMPORT_ENABLED === 'true',
    };

    this.localDataPath = path.join(process.cwd(), process.env.PMTA_LOCAL_DATA_PATH || 'pmta-data');
    
    // Data storage
    this.cachedData = [];
    this.lastDataUpdate = null;
    this.importedFiles = [];
    this.selectedFile = 'all';
    this.availableFiles = [];
    this.importTimer = null;

    // Initialize
    this.ensureLocalDataDirectory();
  }

  async ensureLocalDataDirectory() {
    try {
      await fs.access(this.localDataPath);
    } catch {
      await fs.mkdir(this.localDataPath, { recursive: true });
      logger.info(`Created PMTA data directory: ${this.localDataPath}`);
    }
  }

  // Test network connectivity
  async testConnectivity() {
    try {
      const net = require('net');
      const socket = new net.Socket();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, 10000);

        socket.connect(this.config.port, this.config.host, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve(true);
        });

        socket.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  // Connect to PMTA server
  async connectToServer() {
    try {
      logger.info(`Attempting SSH connection to: ${this.config.host}:${this.config.port}`);
      
      // Test basic connectivity first
      const isReachable = await this.testConnectivity();
      if (!isReachable) {
        throw new Error('Server is not reachable on port 22');
      }

      const connectionConfig = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 30000,
        keepaliveInterval: 5000,
        tryKeyboard: true,
      };

      await this.ssh.connect(connectionConfig);

      this.isConnected = true;
      this.importStatus.status = 'connected';
      this.importStatus.connectionHealth = 'good';
      this.importStatus.lastError = null;

      logger.info('Successfully connected to PMTA server');

      // Test the connection
      const testResult = await this.ssh.execCommand('pwd');
      logger.info(`Server working directory: ${testResult.stdout}`);

      return true;
    } catch (error) {
      logger.error(`Failed to connect to PMTA server: ${error.message}`);
      this.importStatus.status = 'error';
      this.importStatus.connectionHealth = 'poor';
      this.importStatus.lastError = error.message;
      this.isConnected = false;
      return false;
    }
  }

  // Disconnect from server
  async disconnect() {
    try {
      logger.info('Disconnecting from PMTA server...');

      if (this.importTimer) {
        clearInterval(this.importTimer);
        this.importTimer = null;
      }

      if (this.ssh && this.isConnected) {
        this.ssh.dispose();
      }

      this.isConnected = false;
      this.importStatus.status = 'disconnected';
      this.importStatus.connectionHealth = 'unknown';
      this.importStatus.lastError = null;

      logger.info('Successfully disconnected from PMTA server');
      return true;
    } catch (error) {
      logger.error(`Error during disconnect: ${error.message}`);
      this.isConnected = false;
      this.importStatus.status = 'disconnected';
      return false;
    }
  }

  // List remote files
  async listRemoteFiles() {
    if (!this.isConnected) {
      throw new Error('Not connected to PMTA server');
    }

    try {
      const result = await this.ssh.execCommand(
        `find ${this.config.logPath} -name "${this.config.logPattern}" -type f -mtime -7 | sort -r`
      );

      if (result.code !== 0) {
        throw new Error(`Failed to list files: ${result.stderr}`);
      }

      const files = result.stdout
        .trim()
        .split('\n')
        .filter((f) => f.length > 0);
      
      this.importStatus.totalFiles = files.length;
      logger.info(`Found ${files.length} log files on server`);
      return files;
    } catch (error) {
      logger.error('Error listing remote files:', error);
      throw error;
    }
  }

  // Download file from server
  async downloadFile(remotePath) {
    const filename = path.basename(remotePath);
    const localPath = path.join(this.localDataPath, filename);

    try {
      // Check if file already exists and is recent
      try {
        const stats = await fs.stat(localPath);
        const ageInMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
        if (ageInMinutes < 5) {
          logger.info(`Using existing file: ${filename}`);
          return localPath;
        }
      } catch {
        // File doesn't exist, proceed with download
      }

      logger.info(`Downloading: ${filename}`);
      await this.ssh.getFile(localPath, remotePath);

      const stats = await fs.stat(localPath);
      if (stats.size > 0) {
        logger.info(`Downloaded: ${filename} (${stats.size} bytes)`);
        return localPath;
      } else {
        throw new Error('Downloaded file is empty');
      }
    } catch (error) {
      logger.error(`Failed to download ${filename}: ${error.message}`);
      throw error;
    }
  }

  // Parse CSV file
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const filename = path.basename(filePath);

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Add filename to each record
          data._filename = filename;
          data._lineNumber = results.length + 1;
          results.push(data);
        })
        .on('end', () => {
          logger.info(`Parsed ${filename}: ${results.length} records`);
          resolve(results);
        })
        .on('error', (error) => {
          logger.error(`Error parsing ${filename}: ${error.message}`);
          reject(error);
        });
    });
  }

  // Import files from server
  async importFiles(importAllFiles = false) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to server');
      }

      const allFiles = await this.listRemoteFiles();
      if (allFiles.length === 0) {
        logger.info('No files found matching pattern');
        return { success: true, data: [], filesProcessed: 0, totalFiles: 0 };
      }

      const filesToImport = importAllFiles ? allFiles : [allFiles[0]];
      
      if (!importAllFiles) {
        logger.info(`Performance mode: Downloading only the latest file (${path.basename(filesToImport[0])})`);
      } else {
        logger.info(`Full import mode: Downloading all ${filesToImport.length} files`);
      }

      let allData = [];
      let processedFiles = 0;

      // Store available files
      this.availableFiles = allFiles.map((file) => ({
        filename: path.basename(file),
        fullPath: file,
        imported: false,
        available: true,
      }));

      // Clear previous imported files
      this.importedFiles = [];

      for (const remoteFile of filesToImport) {
        const filename = path.basename(remoteFile);

        try {
          // Download file
          const localPath = await this.downloadFile(remoteFile);
          
          // Parse CSV content
          const fileData = await this.parseCSVFile(localPath);

          // Store individual file data
          this.importedFiles.push({
            filename: filename,
            data: fileData,
            recordCount: fileData.length,
            importTime: new Date().toISOString(),
            localPath: localPath,
          });

          allData = allData.concat(fileData);
          processedFiles++;

          // Mark as imported in available files
          const availableFile = this.availableFiles.find(f => f.filename === filename);
          if (availableFile) {
            availableFile.imported = true;
          }

        } catch (error) {
          logger.error(`Failed to process ${filename}: ${error.message}`);
        }
      }

      // Sort by timeLogged descending
      allData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      // Store the data in memory
      this.cachedData = allData;
      this.lastDataUpdate = new Date();

      logger.info(`Import completed: ${processedFiles}/${filesToImport.length} files processed, ${allData.length} total records`);

      return {
        success: true,
        data: allData,
        filesProcessed: processedFiles,
        totalFiles: allFiles.length,
        importedFiles: filesToImport.length,
        availableFiles: allFiles.length,
      };
    } catch (error) {
      logger.error(`Import error: ${error.message}`);
      return { success: false, data: [], error: error.message };
    }
  }

  // Import specific file
  async importSpecificFile(filename) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to server');
      }

      // Check if file is already imported
      const existingFile = this.importedFiles.find(f => f.filename === filename);
      if (existingFile) {
        return {
          success: true,
          message: `File ${filename} is already imported`,
          recordCount: existingFile.recordCount,
          skipped: true,
        };
      }

      // Find the file in available files
      const availableFile = this.availableFiles.find(f => f.filename === filename);
      if (!availableFile) {
        throw new Error(`File ${filename} not found in available files`);
      }

      logger.info(`Importing specific file: ${filename}`);

      // Download and parse file
      const localPath = await this.downloadFile(availableFile.fullPath);
      const fileData = await this.parseCSVFile(localPath);

      // Add to imported files
      this.importedFiles.push({
        filename: filename,
        data: fileData,
        recordCount: fileData.length,
        importTime: new Date().toISOString(),
        localPath: localPath,
      });

      // Mark as imported
      availableFile.imported = true;

      // Update cached data
      this.cachedData = this.cachedData.concat(fileData);
      this.cachedData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      this.lastDataUpdate = new Date();

      logger.info(`Successfully imported ${filename} (${fileData.length} records)`);

      return {
        success: true,
        message: `Successfully imported ${filename}`,
        recordCount: fileData.length,
        totalRecords: this.cachedData.length,
        imported: true,
      };
    } catch (error) {
      logger.error(`Failed to import ${filename}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        imported: false,
      };
    }
  }

  // Delete imported file
  async deleteImportedFile(filename) {
    try {
      const fileIndex = this.importedFiles.findIndex(f => f.filename === filename);
      if (fileIndex === -1) {
        throw new Error('File not found in imported files');
      }

      const file = this.importedFiles[fileIndex];

      // Remove from imported files array
      this.importedFiles.splice(fileIndex, 1);

      // Remove from cached data
      this.cachedData = this.cachedData.filter(record => record._filename !== filename);

      // Delete physical file if it exists
      if (file.localPath) {
        try {
          await fs.unlink(file.localPath);
          logger.info(`Deleted physical file: ${file.localPath}`);
        } catch (error) {
          logger.warn(`Could not delete physical file ${file.localPath}: ${error.message}`);
        }
      }

      // Update available files
      const availableFile = this.availableFiles.find(f => f.filename === filename);
      if (availableFile) {
        availableFile.imported = false;
      }

      // If deleted file was selected, switch to "all"
      if (this.selectedFile === filename) {
        this.selectedFile = 'all';
      }

      this.lastDataUpdate = new Date();

      logger.info(`Successfully deleted ${filename} from imported files`);

      return {
        success: true,
        message: `Successfully deleted ${filename}`,
        remainingFiles: this.importedFiles.length,
        remainingRecords: this.cachedData.length,
      };
    } catch (error) {
      logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  // Start periodic import
  async startPeriodicImport() {
    if (this.importTimer) {
      clearInterval(this.importTimer);
    }

    logger.info(`Starting periodic import every ${this.config.interval / 1000} seconds`);

    this.importTimer = setInterval(async () => {
      try {
        if (this.isConnected) {
          await this.importFiles(false); // Import only latest file
        }
      } catch (error) {
        logger.error(`Periodic import error: ${error.message}`);
      }
    }, this.config.interval);
  }

  // Stop periodic import
  stopPeriodicImport() {
    if (this.importTimer) {
      clearInterval(this.importTimer);
      this.importTimer = null;
      logger.info('Stopped periodic import');
    }
  }

  // Load existing imported files
  async loadExistingImportedFiles() {
    try {
      logger.info('Loading existing imported files...');

      const files = await fs.readdir(this.localDataPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));

      logger.info(`Found ${csvFiles.length} existing files: ${csvFiles.join(', ')}`);

      for (const filename of csvFiles) {
        try {
          const filePath = path.join(this.localDataPath, filename);
          const stats = await fs.stat(filePath);
          const fileData = await this.parseCSVFile(filePath);

          this.importedFiles.push({
            filename,
            data: fileData,
            importTime: stats.mtime.toISOString(),
            recordCount: fileData.length,
            localPath: filePath,
          });

          this.cachedData = this.cachedData.concat(fileData);

          logger.info(`Loaded ${filename}: ${fileData.length} records`);
        } catch (fileError) {
          logger.error(`Failed to load ${filename}: ${fileError.message}`);
        }
      }

      // Sort cached data
      this.cachedData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      this.lastDataUpdate = new Date();

      logger.info(`Successfully loaded ${this.importedFiles.length} imported files with ${this.cachedData.length} total records`);

      // Set default selected file
      if (this.importedFiles.length > 0) {
        const latestFile = this.importedFiles.sort(
          (a, b) => new Date(b.importTime) - new Date(a.importTime)
        )[0];
        this.selectedFile = latestFile.filename;
        logger.info(`Auto-selected latest file: ${this.selectedFile}`);
      }
    } catch (error) {
      logger.error(`Failed to load existing imported files: ${error.message}`);
    }
  }

  // Get data for selected file or all files
  getData() {
    if (this.selectedFile === 'all') {
      return {
        data: this.cachedData,
        totalRecords: this.cachedData.length,
        selectedFile: 'all',
        source: 'combined_files',
      };
    } else {
      const file = this.importedFiles.find(f => f.filename === this.selectedFile);
      if (file) {
        return {
          data: file.data,
          totalRecords: file.recordCount,
          selectedFile: this.selectedFile,
          source: 'individual_file',
        };
      } else {
        // Fallback to combined data
        return {
          data: this.cachedData,
          totalRecords: this.cachedData.length,
          selectedFile: 'all',
          source: 'combined_files',
        };
      }
    }
  }

  // Update connection configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('PMTA SSH configuration updated');
  }

  // Get status
  getStatus() {
    return {
      ...this.importStatus,
      totalRecords: this.cachedData.length,
      lastDataUpdate: this.lastDataUpdate,
      importedFiles: this.importedFiles.length,
      selectedFile: this.selectedFile,
      periodicImportActive: !!this.importTimer,
    };
  }
}

module.exports = PMTASSHImportService;
