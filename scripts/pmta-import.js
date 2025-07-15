#!/usr/bin/env node

import process from "process";
import { NodeSSH } from "node-ssh";
import chokidar from "chokidar";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  pmta: {
    host: process.env.PMTA_HOST || "91.229.239.75",
    port: parseInt(process.env.PMTA_PORT) || 22,
    username: process.env.PMTA_USERNAME || "your_username",
    password: process.env.PMTA_PASSWORD || "your_password",
    logPath: process.env.PMTA_LOG_PATH || "/var/log/pmta",
    logPattern: process.env.PMTA_LOG_PATTERN || "acct-*.csv",
  },
  import: {
    interval: parseInt(process.env.IMPORT_INTERVAL) || 30000, // 30 seconds
    port: parseInt(process.env.IMPORT_PORT) || 3999,
    enabled: process.env.AUTO_IMPORT_ENABLED === "true",
  },
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:5174",
    ],
  },
};

class PMTAImporter {
  constructor() {
    this.ssh = new NodeSSH();
    this.isConnected = false;
    this.importStatus = {
      status: "disconnected",
      lastImport: null,
      lastError: null,
      totalFiles: 0,
      filesProcessed: 0,
      connectionHealth: "unknown",
    };
    this.app = express();
    this.setupExpress();
    this.localDataPath = path.join(__dirname, "..", "public", "imported-data");

    // Add cached data properties for direct server reading
    this.cachedData = [];
    this.lastDataUpdate = null;

    // Track individual files and their data
    this.importedFiles = []; // Array of {filename, data, importTime, recordCount}
    this.selectedFile = "all"; // 'all' for combined view, or specific filename
  }

  setupExpress() {
    // Configure CORS with more flexible options
    this.app.use(
      cors({
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          // Allow localhost on any port for development
          if (
            origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:")
          ) {
            return callback(null, true);
          }

          // Check against configured origins
          if (CONFIG.security.allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
          }

          return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
      })
    );

    this.app.use(express.json());

    // Add request logging for debugging
    this.app.use((req, res, next) => {
      console.log(
        `📡 ${req.method} ${req.path} from ${req.get("Origin") || "no origin"}`
      );
      next();
    });

    // API Routes
    this.app.get("/api/import-status", (req, res) => {
      const statusWithData = {
        ...this.importStatus,
        totalRecords: this.cachedData.length,
        lastDataUpdate: this.lastDataUpdate,
        note: "Files are downloaded and kept for management. Use delete controls to remove when needed.",
      };
      res.json(statusWithData);
    });

    this.app.get("/api/latest-data", async (req, res) => {
      try {
        if (this.selectedFile === "all") {
          // Return combined data from all files
          res.json({
            data: this.cachedData,
            totalRecords: this.cachedData.length,
            lastUpdate: this.lastDataUpdate,
            source: "downloaded_files_processed",
            selectedFile: "all",
            availableFiles: this.importedFiles.map((f) => ({
              filename: f.filename,
              recordCount: f.recordCount,
            })),
          });
        } else {
          // Return data from selected file
          const selectedFileData = this.importedFiles.find(
            (f) => f.filename === this.selectedFile
          );
          if (selectedFileData) {
            res.json({
              data: selectedFileData.data,
              totalRecords: selectedFileData.recordCount,
              lastUpdate: this.lastDataUpdate,
              source: "downloaded_files_processed",
              selectedFile: this.selectedFile,
              availableFiles: this.importedFiles.map((f) => ({
                filename: f.filename,
                recordCount: f.recordCount,
              })),
            });
          } else {
            // Fallback to combined data if selected file not found
            res.json({
              data: this.cachedData,
              totalRecords: this.cachedData.length,
              lastUpdate: this.lastDataUpdate,
              source: "downloaded_files_processed",
              selectedFile: "all",
              availableFiles: this.importedFiles.map((f) => ({
                filename: f.filename,
                recordCount: f.recordCount,
              })),
            });
          }
        }
      } catch (error) {
        console.error("Error serving latest data:", error);
        res.status(500).json({ error: "Failed to get latest data" });
      }
    });

    this.app.post("/api/force-import", async (req, res) => {
      try {
        await this.performImport();
        res.json({
          success: true,
          message: "Import triggered successfully",
          totalRecords: this.cachedData.length,
        });
      } catch (error) {
        console.error("Force import error:", error);
        res
          .status(500)
          .json({ error: "Import failed", details: error.message });
      }
    });

    // Connection Management Endpoints
    this.app.post("/api/connect", async (req, res) => {
      try {
        const { host, port, username, password, logPath, logPattern } =
          req.body;

        if (!host || !port || !username || !password) {
          return res.status(400).json({
            error: "Missing required connection parameters",
          });
        }

        // Disconnect existing connection
        if (this.isConnected) {
          await this.disconnect();
        }

        // Update config with new connection details
        CONFIG.pmta = {
          host,
          port: parseInt(port),
          username,
          password,
          logPath: logPath || "/var/log/pmta",
          logPattern: logPattern || "acct-*.csv",
        };

        // Test the connection
        console.log(`🔄 Attempting to connect to ${host}:${port}...`);
        await this.connectToServer();

        res.json({
          success: true,
          message: "Connected successfully",
          connectionStatus: this.importStatus,
        });

        // Start periodic imports if connection successful
        this.startPeriodicImport();
      } catch (error) {
        console.error("❌ Connection failed:", error);
        this.importStatus.status = "connection_failed";
        this.importStatus.connectionHealth = "poor";

        // Provide more specific error messages
        let errorMessage = error.message;
        let userFriendlyMessage = "";

        if (
          error.message.includes("All configured authentication methods failed")
        ) {
          userFriendlyMessage =
            "Authentication failed. Please check your username and password.";
          errorMessage =
            "Invalid credentials or password authentication disabled on server";
        } else if (error.message.includes("timeout")) {
          userFriendlyMessage =
            "Connection timed out. Please check if the server is reachable.";
          errorMessage = "Connection timeout - server may be unreachable";
        } else if (
          error.message.includes("refused") ||
          error.message.includes("ECONNREFUSED")
        ) {
          userFriendlyMessage =
            "Connection refused. Please check if SSH service is running on the server.";
          errorMessage = "Connection refused - SSH service may not be running";
        } else if (
          error.message.includes("ENOTFOUND") ||
          error.message.includes("EHOSTUNREACH")
        ) {
          userFriendlyMessage =
            "Host not found. Please check the server address.";
          errorMessage = "Server address not found or unreachable";
        } else {
          userFriendlyMessage =
            "Connection failed. Please check your connection settings.";
        }

        this.importStatus.lastError = errorMessage;

        res.status(500).json({
          error: "Connection failed",
          details: userFriendlyMessage,
          technicalDetails: error.message,
        });
      }
    });

    this.app.post("/api/disconnect", async (req, res) => {
      try {
        await this.disconnect();
        res.json({
          success: true,
          message: "Disconnected successfully",
          connectionStatus: this.importStatus,
        });
      } catch (error) {
        console.error("❌ Disconnect failed:", error);
        res.status(500).json({
          error: "Disconnect failed",
          details: error.message,
        });
      }
    });

    this.app.get("/api/connection-status", (req, res) => {
      res.json({
        isConnected: this.isConnected,
        connectionHealth: this.importStatus.connectionHealth,
        status: this.importStatus.status,
        lastError: this.importStatus.lastError,
      });
    });

    // File Management Endpoints
    this.app.get("/api/files", (req, res) => {
      try {
        const filesInfo = this.importedFiles.map((file) => ({
          filename: file.filename,
          recordCount: file.recordCount,
          importTime: file.importTime,
          selected: this.selectedFile === file.filename,
        }));

        res.json({
          files: filesInfo,
          selectedFile: this.selectedFile,
          totalFiles: this.importedFiles.length,
          combinedRecords: this.cachedData.length,
        });
      } catch (error) {
        console.error("Error getting files info:", error);
        res.status(500).json({ error: "Failed to get files information" });
      }
    });

    this.app.post("/api/files/select", async (req, res) => {
      try {
        const { filename } = req.body;
        console.log(`🔄 File selection request: ${filename}`);
        console.log(
          `📋 Available imported files: ${this.importedFiles
            .map((f) => f.filename)
            .join(", ")}`
        );

        // Debug: Check download folder contents
        try {
          const folderContents = await fs.readdir(this.localDataPath);
          console.log(
            `📂 Download folder contents: ${
              folderContents.length > 0 ? folderContents.join(", ") : "EMPTY"
            }`
          );

          // Check if any CSV files exist
          const csvFiles = folderContents.filter((f) => f.endsWith(".csv"));
          console.log(
            `📄 CSV files in folder: ${
              csvFiles.length > 0 ? csvFiles.join(", ") : "NONE"
            }`
          );
        } catch (error) {
          console.log(`❌ Error reading download folder: ${error.message}`);
        }

        if (filename === "all") {
          this.selectedFile = "all";
          console.log(`✅ Switched to combined view`);
          res.json({
            success: true,
            selectedFile: "all",
            message: "Switched to combined view (all files)",
            recordCount: this.cachedData.length,
          });
        } else {
          const file = this.importedFiles.find((f) => f.filename === filename);
          if (!file) {
            console.log(`❌ File not found in imported files: ${filename}`);
            console.log(
              `📂 Available imported files: ${this.importedFiles
                .map((f) => f.filename)
                .join(", ")}`
            );
            console.log(
              `💾 Total imported files: ${this.importedFiles.length}`
            );
            console.log(`🎯 Cached data records: ${this.cachedData.length}`);

            // Additional debugging - check if file exists in cached data
            const dataForFile = this.cachedData.filter(
              (record) => record._filename === filename
            );
            console.log(
              `📊 Records for ${filename} in cache: ${dataForFile.length}`
            );

            return res.status(404).json({
              error: `File not found: ${filename}`,
              details: `File ${filename} is not in the imported files list. Available files: ${this.importedFiles
                .map((f) => f.filename)
                .join(", ")}`,
              importedFilesCount: this.importedFiles.length,
              cachedDataCount: this.cachedData.length,
            });
          }

          this.selectedFile = filename;
          console.log(
            `✅ Switched to file: ${filename} (${file.recordCount} records)`
          );
          res.json({
            success: true,
            selectedFile: filename,
            message: `Switched to file: ${filename}`,
            recordCount: file.recordCount,
          });
        }
      } catch (error) {
        console.error("❌ Error selecting file:", error);
        res
          .status(500)
          .json({ error: "Failed to select file", details: error.message });
      }
    });

    this.app.get("/api/file-data/:filename", (req, res) => {
      try {
        const { filename } = req.params;

        if (filename === "all") {
          res.json({
            data: this.cachedData,
            totalRecords: this.cachedData.length,
            filename: "all",
            source: "combined_files",
          });
        } else {
          const file = this.importedFiles.find((f) => f.filename === filename);
          if (!file) {
            return res.status(404).json({ error: "File not found" });
          }

          res.json({
            data: file.data,
            totalRecords: file.recordCount,
            filename: file.filename,
            importTime: file.importTime,
            source: "individual_file",
          });
        }
      } catch (error) {
        console.error("Error getting file data:", error);
        res.status(500).json({ error: "Failed to get file data" });
      }
    });

    // Manual File Import Endpoints
    this.app.get("/api/files/available", (req, res) => {
      try {
        const availableFiles = this.availableFiles || [];
        const importedFiles = this.importedFiles || [];

        const filesWithStatus = availableFiles.map((file) => ({
          filename: file.filename,
          imported: importedFiles.some(
            (imported) => imported.filename === file.filename
          ),
          available: true,
          recordCount:
            importedFiles.find(
              (imported) => imported.filename === file.filename
            )?.recordCount || 0,
        }));

        res.json({
          files: filesWithStatus,
          totalAvailable: availableFiles.length,
          totalImported: importedFiles.length,
          latestFile:
            availableFiles.length > 0 ? availableFiles[0].filename : null,
        });
      } catch (error) {
        console.error("Error getting available files:", error);
        res.status(500).json({ error: "Failed to get available files" });
      }
    });

    this.app.post("/api/files/import", async (req, res) => {
      try {
        const { filename, importAll } = req.body;

        if (!this.isConnected) {
          return res.status(400).json({ error: "Not connected to server" });
        }

        if (importAll) {
          console.log("🔄 Importing all available files...");
          const result = await this.readRemoteData(true);

          res.json({
            success: result.success,
            message: `Imported all ${result.importedFiles} files`,
            filesImported: result.importedFiles,
            totalRecords: result.data.length,
          });
        } else if (filename) {
          console.log(`🔄 Importing specific file: ${filename}`);
          const result = await this.importSpecificFile(filename);

          res.json(result);
        } else {
          res
            .status(400)
            .json({ error: "Must specify filename or importAll=true" });
        }
      } catch (error) {
        console.error("Error importing files:", error);
        res.status(500).json({
          error: "Failed to import files",
          details: error.message,
        });
      }
    });

    this.app.post("/api/files/import-latest-only", async (req, res) => {
      try {
        if (!this.isConnected) {
          return res.status(400).json({ error: "Not connected to server" });
        }

        console.log("⚡ Importing latest file only (performance mode)...");
        const result = await this.readRemoteData(false);

        res.json({
          success: result.success,
          message: "Imported latest file only",
          filesImported: result.importedFiles,
          totalRecords: result.data.length,
          availableFiles: result.availableFiles,
        });
      } catch (error) {
        console.error("Error importing latest file:", error);
        res.status(500).json({
          error: "Failed to import latest file",
          details: error.message,
        });
      }
    });

    // Manual cleanup endpoint
    this.app.post("/api/files/cleanup", async (req, res) => {
      try {
        console.log("🧹 Manual cleanup triggered via API...");
        const result = await this.cleanupAllDownloadedFiles();

        res.json({
          success: true,
          message: `Cleaned up ${result.cleaned} downloaded files`,
          filesDeleted: result.cleaned,
          error: result.error || null,
        });
      } catch (error) {
        console.error("Error during manual cleanup:", error);
        res.status(500).json({
          error: "Failed to cleanup files",
          details: error.message,
        });
      }
    });

    // Delete specific file endpoint
    this.app.delete("/api/files/:filename", async (req, res) => {
      try {
        const { filename } = req.params;
        console.log(`🗑️ Delete request for file: ${filename}`);

        // Find the file in imported files
        const fileIndex = this.importedFiles.findIndex(
          (f) => f.filename === filename
        );

        if (fileIndex === -1) {
          return res.status(404).json({
            error: "File not found in imported files",
            available: this.importedFiles.map((f) => f.filename),
          });
        }

        const file = this.importedFiles[fileIndex];

        // Remove from imported files array
        this.importedFiles.splice(fileIndex, 1);

        // Remove from cached data
        this.cachedData = this.cachedData.filter(
          (record) => record._filename !== filename
        );

        // Try to delete physical file if it exists
        let physicalFileDeleted = false;
        if (file.localPath) {
          try {
            await fs.unlink(file.localPath);
            console.log(`🗑️ Deleted physical file: ${file.localPath}`);
            physicalFileDeleted = true;
          } catch (error) {
            console.warn(
              `⚠️ Could not delete physical file ${file.localPath}: ${error.message}`
            );
          }
        }

        // Update available files to mark as not imported
        if (this.availableFiles) {
          const availableFileIndex = this.availableFiles.findIndex(
            (f) => f.filename === filename
          );
          if (availableFileIndex !== -1) {
            this.availableFiles[availableFileIndex].imported = false;
          }
        }

        // If the deleted file was selected, switch to "all"
        if (this.selectedFile === filename) {
          this.selectedFile = "all";
        }

        // Update last data update timestamp
        this.lastDataUpdate = new Date();

        console.log(`✅ Successfully deleted ${filename} from imported files`);
        console.log(
          `📊 Remaining imported files: ${this.importedFiles.length}`
        );
        console.log(`📋 Remaining records: ${this.cachedData.length}`);

        res.json({
          success: true,
          message: `Successfully deleted ${filename}`,
          filename: filename,
          physicalFileDeleted: physicalFileDeleted,
          remainingFiles: this.importedFiles.length,
          remainingRecords: this.cachedData.length,
          currentSelection: this.selectedFile,
        });
      } catch (error) {
        console.error(`❌ Error deleting file:`, error);
        res.status(500).json({
          error: "Failed to delete file",
          details: error.message,
        });
      }
    });

    // Debug endpoint to check current state
    this.app.get("/api/debug/state", async (req, res) => {
      try {
        // Check folder contents
        let folderContents = [];
        let csvFiles = [];
        try {
          folderContents = await fs.readdir(this.localDataPath);
          csvFiles = folderContents.filter((f) => f.endsWith(".csv"));
        } catch (error) {
          console.log(`❌ Error reading folder: ${error.message}`);
        }

        const debugInfo = {
          connection: {
            isConnected: this.isConnected,
            status: this.importStatus.status,
            connectionHealth: this.importStatus.connectionHealth,
            lastError: this.importStatus.lastError,
          },
          data: {
            cachedDataCount: this.cachedData.length,
            importedFilesCount: this.importedFiles.length,
            selectedFile: this.selectedFile,
            lastDataUpdate: this.lastDataUpdate,
          },
          importedFiles: this.importedFiles.map((f) => ({
            filename: f.filename,
            recordCount: f.recordCount,
            importTime: f.importTime,
            hasLocalPath: !!f.localPath,
            localPath: f.localPath,
          })),
          availableFiles: this.availableFiles
            ? this.availableFiles.map((f) => ({
                filename: f.filename,
                imported: f.imported,
                available: f.available,
              }))
            : [],
          filesystem: {
            localDataPath: this.localDataPath,
            folderExists: folderContents.length >= 0,
            totalFiles: folderContents.length,
            csvFiles: csvFiles.length,
            fileList: csvFiles,
          },
        };

        console.log(
          `🔍 Debug state requested - Current imported files: ${this.importedFiles
            .map((f) => f.filename)
            .join(", ")}`
        );
        console.log(
          `📂 Folder contains: ${
            csvFiles.length > 0 ? csvFiles.join(", ") : "NO CSV FILES"
          }`
        );

        res.json(debugInfo);
      } catch (error) {
        console.error("❌ Error getting debug state:", error);
        res
          .status(500)
          .json({ error: "Failed to get debug state", details: error.message });
      }
    });

    // Start server
    this.app.listen(CONFIG.import.port, () => {
      console.log(`🚀 PMTA Import API running on port ${CONFIG.import.port}`);
    });
  }

  async ensureLocalDataDirectory() {
    try {
      await fs.access(this.localDataPath);
    } catch {
      await fs.mkdir(this.localDataPath, { recursive: true });
      console.log(`📁 Created local data directory: ${this.localDataPath}`);
    }
  }

  // Test basic network connectivity
  async testConnectivity() {
    try {
      console.log("🌐 Testing network connectivity...");

      // Test basic TCP connection without SSH
      const socket = new net.Socket();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          console.log("❌ Connection timeout - server may not be reachable");
          resolve(false);
        }, 10000);

        socket.connect(CONFIG.pmta.port, CONFIG.pmta.host, () => {
          clearTimeout(timeout);
          console.log("✅ TCP connection successful - server is reachable");
          socket.destroy();
          resolve(true);
        });

        socket.on("error", (err) => {
          clearTimeout(timeout);
          console.log(`❌ TCP connection failed: ${err.message}`);
          resolve(false);
        });
      });
    } catch (error) {
      console.error("❌ Connectivity test error:", error.message);
      return false;
    }
  }

  async connectToServer() {
    try {
      // First test basic connectivity
      console.log("🔍 Step 1: Testing basic connectivity...");
      const isReachable = await this.testConnectivity();

      if (!isReachable) {
        throw new Error("Server is not reachable on port 22");
      }

      console.log(
        `🔐 Step 2: Attempting SSH connection to: ${CONFIG.pmta.host}:${CONFIG.pmta.port}`
      );
      console.log(`👤 Username: ${CONFIG.pmta.username}`);
      console.log(`🔑 Password: ${"*".repeat(CONFIG.pmta.password.length)}`);

      // Enhanced SSH connection configuration
      const connectionConfig = {
        host: CONFIG.pmta.host,
        port: CONFIG.pmta.port,
        username: CONFIG.pmta.username,
        password: CONFIG.pmta.password,
        readyTimeout: 30000,
        keepaliveInterval: 5000,
        // Try password authentication first, then keyboard-interactive
        tryKeyboard: true,
        // Add auth method order
        authHandler: ["password", "keyboard-interactive", "none"],
        // Add additional SSH options for better compatibility
        algorithms: {
          kex: [
            "diffie-hellman-group1-sha1",
            "diffie-hellman-group14-sha1",
            "diffie-hellman-group14-sha256",
            "diffie-hellman-group16-sha512",
            "diffie-hellman-group18-sha512",
            "ecdh-sha2-nistp256",
            "ecdh-sha2-nistp384",
            "ecdh-sha2-nistp521",
          ],
          cipher: [
            "aes128-ctr",
            "aes192-ctr",
            "aes256-ctr",
            "aes128-gcm",
            "aes256-gcm",
            "aes128-cbc",
            "aes192-cbc",
            "aes256-cbc",
            "3des-cbc",
          ],
          serverHostKey: [
            "ssh-rsa",
            "ssh-dss",
            "ssh-ed25519",
            "ecdsa-sha2-nistp256",
            "ecdsa-sha2-nistp384",
            "ecdsa-sha2-nistp521",
          ],
          hmac: ["hmac-sha2-256", "hmac-sha2-512", "hmac-sha1", "hmac-md5"],
        },
        debug: (msg) => {
          console.log(`🔍 SSH Debug: ${msg}`);
        },
      };

      await this.ssh.connect(connectionConfig);

      this.isConnected = true;
      this.importStatus.status = "connected";
      this.importStatus.connectionHealth = "good";
      this.importStatus.lastError = null;

      console.log("✅ Successfully connected to PMTA server");

      // Test the connection by running a simple command
      const testResult = await this.ssh.execCommand("pwd");
      console.log(`📁 Server working directory: ${testResult.stdout}`);

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to PMTA server:", error.message);
      console.error("🔍 Full error details:", error);

      // Enhanced error reporting
      if (error.message.includes("authentication")) {
        console.log("💡 Authentication failed. Possible solutions:");
        console.log("   1. Verify username and password are correct");
        console.log("   2. Check if SSH is enabled on the server");
        console.log("   3. Verify user has SSH access permissions");
        console.log("   4. Test manually: ssh root@91.229.239.75");
        console.log(
          "   5. Check if password authentication is allowed in sshd_config"
        );
      } else if (error.message.includes("timeout")) {
        console.log("💡 Connection timeout. Please check:");
        console.log("   1. Server is reachable: ping 91.229.239.75");
        console.log("   2. Port 22 is open and accessible");
        console.log("   3. Firewall settings allow SSH connections");
        console.log("   4. Network connectivity is stable");
      } else if (error.message.includes("refused")) {
        console.log("💡 Connection refused. Please check:");
        console.log("   1. SSH service is running on the server");
        console.log("   2. Port 22 is the correct SSH port");
        console.log("   3. Server is not blocking your IP address");
        console.log("   4. Maximum connection limits not exceeded");
      }

      this.importStatus.status = "error";
      this.importStatus.connectionHealth = "poor";
      this.importStatus.lastError = error.message;
      this.isConnected = false;
      return false;
    }
  }

  async listRemoteFiles() {
    if (!this.isConnected) {
      throw new Error("Not connected to PMTA server");
    }

    try {
      const result = await this.ssh.execCommand(
        `find ${CONFIG.pmta.logPath} -name "${CONFIG.pmta.logPattern}" -type f -mtime -7 | sort -r`
      );

      if (result.code !== 0) {
        throw new Error(`Failed to list files: ${result.stderr}`);
      }

      const files = result.stdout
        .trim()
        .split("\n")
        .filter((f) => f.length > 0);
      this.importStatus.totalFiles = files.length;

      console.log(`📋 Found ${files.length} log files on server`);
      return files;
    } catch (error) {
      console.error("Error listing remote files:", error);
      throw error;
    }
  }

  async downloadFile(remotePath) {
    const filename = path.basename(remotePath);
    const localPath = path.join(this.localDataPath, filename);

    try {
      // Check if file already exists and is recent
      try {
        const stats = await fs.stat(localPath);
        const ageInMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
        if (ageInMinutes < 5) {
          console.log(`⏭️ Skipping ${filename} (recently downloaded)`);
          console.log(`📁 Existing file found at: ${localPath}`);
          console.log(`🧪 TESTING MODE: Using existing file`);
          return localPath;
        }
      } catch {
        // File doesn't exist, proceed with download
      }

      console.log(`⬇️ Downloading: ${filename}`);
      console.log(`📍 Local path: ${localPath}`);
      await this.ssh.getFile(localPath, remotePath);

      // Verify file was downloaded
      const stats = await fs.stat(localPath);
      if (stats.size > 0) {
        console.log(`✅ Downloaded: ${filename} (${stats.size} bytes)`);
        console.log(`📁 File saved to: ${localPath}`);
        console.log(`🧪 TESTING MODE: File will be kept for inspection`);

        // Immediate verification - check if file exists in folder
        try {
          const folderContents = await fs.readdir(this.localDataPath);
          const csvFiles = folderContents.filter((f) => f.endsWith(".csv"));
          console.log(
            `📂 Folder now contains ${
              csvFiles.length
            } CSV files: ${csvFiles.join(", ")}`
          );
        } catch (error) {
          console.log(`❌ Error verifying folder contents: ${error.message}`);
        }

        return localPath;
      } else {
        throw new Error("Downloaded file is empty");
      }
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
      throw error;
    }
  }

  async getLatestDataFile() {
    try {
      const files = await fs.readdir(this.localDataPath);
      const csvFiles = files
        .filter((f) => f.endsWith(".csv"))
        .sort()
        .reverse();
      return csvFiles.length > 0
        ? path.join(this.localDataPath, csvFiles[0])
        : null;
    } catch {
      return null;
    }
  }
  async readRemoteData(importAllFiles = false) {
    try {
      if (!this.isConnected) {
        console.log("❌ Not connected to server");
        return { success: false, data: [] };
      }

      // List files matching the pattern, get latest 10 files
      const result = await this.ssh.execCommand(
        `find ${CONFIG.pmta.logPath} -name "${CONFIG.pmta.logPattern}" -type f | sort -r | head -10`
      );

      if (result.stderr) {
        console.error("❌ Error listing files:", result.stderr);
        return { success: false, data: [] };
      }

      const allFiles = result.stdout.trim().split("\n").filter(Boolean);
      console.log(`📁 Found ${allFiles.length} log files on server`);

      // Set total files count for status reporting
      this.importStatus.totalFiles = allFiles.length;

      if (allFiles.length === 0) {
        console.log("ℹ️ No files found matching pattern");
        return { success: true, data: [], filesProcessed: 0, totalFiles: 0 };
      }

      // Decide which files to import
      const filesToImport = importAllFiles ? allFiles : [allFiles[0]]; // Only latest file by default

      if (!importAllFiles) {
        console.log(
          `⚡ Performance mode: Downloading only the latest file (${path.basename(
            filesToImport[0]
          )})`
        );
        console.log(
          `📋 ${allFiles.length - 1} older files available for manual import`
        );
      } else {
        console.log(
          `📥 Full import mode: Downloading all ${filesToImport.length} files`
        );
      }

      let allData = [];
      let processedFiles = 0;
      let downloadedFiles = []; // Track downloaded files for cleanup

      // Store available files (even if not imported)
      this.availableFiles = allFiles.map((file) => ({
        filename: path.basename(file),
        fullPath: file,
        imported: false,
        available: true,
      }));

      // Clear previous imported files for fresh import
      this.importedFiles = [];

      for (const remoteFile of filesToImport) {
        const filename = path.basename(remoteFile);

        try {
          console.log(`⬇️ Downloading: ${filename} from server`);

          // Download file locally first
          const localPath = await this.downloadFile(remoteFile);
          downloadedFiles.push(localPath); // Track for cleanup

          console.log(`📖 Reading downloaded file: ${filename}`);

          // Read the downloaded local file
          const fileContent = await fs.readFile(localPath, "utf8");

          if (!fileContent.trim()) {
            console.log(`⚠️ File ${filename} is empty`);
            continue;
          }

          // Parse CSV content with proper handling of quoted fields
          const lines = fileContent.trim().split("\n");
          if (lines.length < 2) {
            console.log(`⚠️ File ${filename} has no data rows`);
            continue;
          }

          // Function to properly parse CSV line with quoted fields
          const parseCSVLine = (line) => {
            const result = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];

              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                result.push(current);
                current = "";
              } else {
                current += char;
              }
            }

            // Add the last field
            result.push(current);
            return result;
          };

          const headers = parseCSVLine(lines[0]);

          // Convert CSV to JSON objects
          const fileData = lines.slice(1).map((line, index) => {
            const values = parseCSVLine(line);
            const record = {};
            headers.forEach((header, i) => {
              // Clean up field values by removing quotes and trimming
              record[header] = values[i]
                ? values[i].replace(/^"|"$/g, "").trim()
                : "";
            });
            record._filename = filename;
            record._lineNumber = index + 2; // +2 because we skip header and 0-index
            return record;
          });

          // Store individual file data
          this.importedFiles.push({
            filename: filename,
            data: fileData,
            recordCount: fileData.length,
            importTime: new Date().toISOString(),
            headers: headers,
            localPath: localPath, // Store local path for potential cleanup
          });

          console.log(`📋 Added to importedFiles: ${filename}`);
          console.log(
            `💾 Current importedFiles count: ${this.importedFiles.length}`
          );
          console.log(
            `📄 All imported files: ${this.importedFiles
              .map((f) => f.filename)
              .join(", ")}`
          );

          allData = allData.concat(fileData);
          console.log(`✅ Processed: ${filename} (${fileData.length} records)`);
          processedFiles++;
        } catch (error) {
          console.error(`❌ Failed to process ${filename}:`, error.message);
        }
      }

      // Sort by timeLogged descending (newest first)
      allData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      console.log(
        `✅ Download and processing completed: ${processedFiles}/${filesToImport.length} files processed, ${allData.length} total records`
      );

      // Store the data in memory for API access
      this.cachedData = allData;
      this.lastDataUpdate = new Date();

      // Files are kept permanently for user management
      console.log(`📁 Downloaded files kept in ${this.localDataPath}`);

      // Debug: List files currently in directory
      try {
        const currentFiles = await fs.readdir(this.localDataPath);
        console.log(
          `📂 Files currently in directory: ${
            currentFiles.length > 0 ? currentFiles.join(", ") : "EMPTY"
          }`
        );
      } catch (error) {
        console.log(`❌ Error reading directory: ${error.message}`);
      }

      return {
        success: true,
        data: allData,
        filesProcessed: processedFiles,
        totalFiles: allFiles.length,
        importedFiles: filesToImport.length,
        availableFiles: allFiles.length,
      };
    } catch (error) {
      console.error("❌ Download and read error:", error.message);
      return { success: false, data: [] };
    }
  }

  // Clean up downloaded files after processing statistics
  async cleanupDownloadedFiles(filePaths) {
    if (!filePaths || filePaths.length === 0) {
      return;
    }

    console.log(`🧹 Cleaning up ${filePaths.length} downloaded files...`);

    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted: ${path.basename(filePath)}`);
      } catch (error) {
        console.warn(
          `⚠️ Failed to delete ${path.basename(filePath)}: ${error.message}`
        );
      }
    }

    console.log(`✅ Cleanup completed: ${filePaths.length} files processed`);
  }

  // Clean up all downloaded files in local directory (manual cleanup)
  async cleanupAllDownloadedFiles() {
    try {
      const files = await fs.readdir(this.localDataPath);
      const csvFiles = files
        .filter((f) => f.endsWith(".csv"))
        .map((f) => path.join(this.localDataPath, f));

      if (csvFiles.length === 0) {
        console.log("📁 No CSV files found in local directory");
        return { cleaned: 0 };
      }

      console.log(
        `🧹 Cleaning up all ${csvFiles.length} CSV files from local directory...`
      );

      let cleaned = 0;
      for (const filePath of csvFiles) {
        try {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted: ${path.basename(filePath)}`);
          cleaned++;
        } catch (error) {
          console.warn(
            `⚠️ Failed to delete ${path.basename(filePath)}: ${error.message}`
          );
        }
      }

      console.log(
        `✅ Manual cleanup completed: ${cleaned}/${csvFiles.length} files deleted`
      );
      return { cleaned };
    } catch (error) {
      console.error("❌ Error during manual cleanup:", error.message);
      return { cleaned: 0, error: error.message };
    }
  }

  async performImport() {
    console.log("🔄 Starting import process...");
    this.importStatus.status = "importing";

    try {
      if (!this.isConnected) {
        await this.connectToServer();
      }

      if (!this.isConnected) {
        throw new Error("Unable to connect to PMTA server");
      }

      // Read data directly from server instead of downloading
      const result = await this.readRemoteData();

      if (result.success) {
        this.importStatus.status = "connected";
        this.importStatus.lastImport = new Date().toISOString();
        this.importStatus.connectionHealth = "good";
        this.importStatus.filesProcessed = result.filesProcessed;
        this.importStatus.totalFiles = result.totalFiles;

        console.log(
          `✅ Import completed: ${result.data.length} records read from ${result.filesProcessed}/${result.totalFiles} files`
        );
      } else {
        throw new Error("Failed to read data from server");
      }
    } catch (error) {
      console.error("❌ Import failed:", error.message);
      this.importStatus.status = "error";
      this.importStatus.lastError = error.message;
      this.importStatus.connectionHealth = "poor";

      // Try to reconnect on next cycle
      this.isConnected = false;
      if (this.ssh.isConnected()) {
        this.ssh.dispose();
      }
    }
  }

  async startPeriodicImport() {
    console.log(
      `⏰ Starting periodic import every ${
        CONFIG.import.interval / 1000
      } seconds`
    );

    // Initial import
    await this.performImport();

    // Set up periodic imports
    setInterval(async () => {
      await this.performImport();
    }, CONFIG.import.interval);
  }

  async startFileWatcher() {
    console.log(`👀 Watching local data directory: ${this.localDataPath}`);

    const watcher = chokidar.watch(this.localDataPath, {
      ignored: /[/\\]\./,
      persistent: true,
    });

    watcher.on("add", (filePath) => {
      console.log(`📄 New file detected: ${path.basename(filePath)}`);
    });

    watcher.on("change", (filePath) => {
      console.log(`📝 File updated: ${path.basename(filePath)}`);
    });
  }

  async start() {
    console.log("🚀 Starting PMTA Auto-Import Service");
    console.log(`📡 Service will wait for connection via API`);
    console.log(`🌐 Web interface available on port ${CONFIG.import.port}`);

    // Only prepare local directory - don't auto-connect
    await this.ensureLocalDataDirectory();
  }

  async stop() {
    console.log("🛑 Stopping PMTA Auto-Import Service");
    if (this.ssh.isConnected()) {
      this.ssh.dispose();
    }
  }

  async disconnect() {
    try {
      console.log("🔌 Disconnecting from PMTA server...");

      // Clear periodic import if running
      if (this.importTimer) {
        clearInterval(this.importTimer);
        this.importTimer = null;
      }

      // Close SSH connection
      if (this.ssh && this.isConnected) {
        this.ssh.dispose();
      }

      // Reset connection state
      this.isConnected = false;
      this.importStatus.status = "disconnected";
      this.importStatus.connectionHealth = "unknown";
      this.importStatus.lastError = null;
      this.cachedData = [];
      this.lastDataUpdate = null;

      console.log("✅ Successfully disconnected from PMTA server");
      return true;
    } catch (error) {
      console.error("❌ Error during disconnect:", error.message);
      // Force reset even if there was an error
      this.isConnected = false;
      this.importStatus.status = "disconnected";
      return false;
    }
  }

  async importSpecificFile(filename) {
    try {
      if (!this.isConnected) {
        throw new Error("Not connected to server");
      }

      // Check if file is already imported
      const existingFile = this.importedFiles.find(
        (f) => f.filename === filename
      );
      if (existingFile) {
        return {
          success: true,
          message: `File ${filename} is already imported`,
          recordCount: existingFile.recordCount,
          skipped: true,
        };
      }

      // Find the file in available files
      const availableFile = this.availableFiles.find(
        (f) => f.filename === filename
      );
      if (!availableFile) {
        throw new Error(`File ${filename} not found in available files`);
      }

      console.log(`⬇️ Downloading and importing specific file: ${filename}`);

      // Download file locally first
      const localPath = await this.downloadFile(availableFile.fullPath);

      console.log(`📖 Reading downloaded file: ${filename}`);

      // Read the downloaded local file
      const fileContent = await fs.readFile(localPath, "utf8");

      if (!fileContent.trim()) {
        throw new Error(`File ${filename} is empty`);
      }

      // Parse CSV content
      const lines = fileContent.trim().split("\n");
      if (lines.length < 2) {
        throw new Error(`File ${filename} has no data rows`);
      }

      // Parse CSV with same logic as readRemoteData
      const parseCSVLine = (line) => {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
          } else {
            current += char;
          }
        }

        result.push(current);
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const fileData = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const record = {};
        headers.forEach((header, i) => {
          record[header] = values[i]
            ? values[i].replace(/^"|"$/g, "").trim()
            : "";
        });
        record._filename = filename;
        record._lineNumber = index + 2;
        return record;
      });

      // Add to imported files
      this.importedFiles.push({
        filename: filename,
        data: fileData,
        recordCount: fileData.length,
        importTime: new Date().toISOString(),
        headers: headers,
        imported: true,
        localPath: localPath, // Store local path for potential cleanup
      });

      console.log(`📋 Added ${filename} to importedFiles (specific import)`);
      console.log(
        `💾 Current importedFiles count: ${this.importedFiles.length}`
      );
      console.log(
        `📄 All imported files: ${this.importedFiles
          .map((f) => f.filename)
          .join(", ")}`
      );

      // Mark as imported in available files
      availableFile.imported = true;

      // Update cached data (combine with existing data)
      this.cachedData = this.cachedData.concat(fileData);

      // Sort combined data by timeLogged
      this.cachedData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      this.lastDataUpdate = new Date();

      console.log(
        `✅ Successfully imported ${filename} (${fileData.length} records)`
      );

      // Files are kept permanently for user management
      console.log(`📁 Downloaded file kept at ${localPath}`);

      // Debug: List files currently in directory
      try {
        const currentFiles = await fs.readdir(this.localDataPath);
        console.log(
          `📂 Files currently in directory: ${
            currentFiles.length > 0 ? currentFiles.join(", ") : "EMPTY"
          }`
        );
      } catch (error) {
        console.log(`❌ Error reading directory: ${error.message}`);
      }

      return {
        success: true,
        message: `Successfully imported ${filename}`,
        recordCount: fileData.length,
        totalRecords: this.cachedData.length,
        imported: true,
      };
    } catch (error) {
      console.error(`❌ Failed to import ${filename}:`, error.message);
      return {
        success: false,
        error: error.message,
        imported: false,
      };
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the service
const importer = new PMTAImporter();
importer.start().catch((error) => {
  console.error("💥 Failed to start PMTA importer:", error);
  process.exit(1);
});
