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
    port: parseInt(process.env.IMPORT_PORT) || 3990,
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
      };
      res.json(statusWithData);
    });

    this.app.get("/api/latest-data", async (req, res) => {
      try {
        if (this.cachedData.length > 0) {
          // Return the cached data read directly from server
          res.json({
            data: this.cachedData,
            totalRecords: this.cachedData.length,
            lastUpdate: this.lastDataUpdate,
            source: "server_direct_read",
          });
        } else {
          res.json({
            data: [],
            totalRecords: 0,
            lastUpdate: null,
            source: "server_direct_read",
          });
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

        if (error.message.includes("All configured authentication methods failed")) {
          userFriendlyMessage = "Authentication failed. Please check your username and password.";
          errorMessage = "Invalid credentials or password authentication disabled on server";
        } else if (error.message.includes("timeout")) {
          userFriendlyMessage = "Connection timed out. Please check if the server is reachable.";
          errorMessage = "Connection timeout - server may be unreachable";
        } else if (error.message.includes("refused") || error.message.includes("ECONNREFUSED")) {
          userFriendlyMessage = "Connection refused. Please check if SSH service is running on the server.";
          errorMessage = "Connection refused - SSH service may not be running";
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("EHOSTUNREACH")) {
          userFriendlyMessage = "Host not found. Please check the server address.";
          errorMessage = "Server address not found or unreachable";
        } else {
          userFriendlyMessage = "Connection failed. Please check your connection settings.";
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
        authHandler: ['password', 'keyboard-interactive', 'none'],
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
          return localPath;
        }
      } catch {
        // File doesn't exist, proceed with download
      }

      console.log(`⬇️ Downloading: ${filename}`);
      await this.ssh.getFile(localPath, remotePath);

      // Verify file was downloaded
      const stats = await fs.stat(localPath);
      if (stats.size > 0) {
        console.log(`✅ Downloaded: ${filename} (${stats.size} bytes)`);
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

  async readRemoteData() {
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

      const files = result.stdout.trim().split("\n").filter(Boolean);
      console.log(`📁 Found ${files.length} log files on server`);

      // Set total files count for status reporting
      this.importStatus.totalFiles = files.length;

      if (files.length === 0) {
        console.log("ℹ️ No files found matching pattern");
        return { success: true, data: [], filesProcessed: 0, totalFiles: 0 };
      }

      let allData = [];
      let processedFiles = 0;

      for (const remoteFile of files) {
        const filename = path.basename(remoteFile);

        try {
          console.log(`📖 Reading: ${filename} directly from server`);

          // Read file content directly from server
          const fileResult = await this.ssh.execCommand(`cat "${remoteFile}"`);

          if (fileResult.stderr) {
            console.error(`❌ Error reading ${filename}:`, fileResult.stderr);
            continue;
          }

          if (!fileResult.stdout.trim()) {
            console.log(`⚠️ File ${filename} is empty`);
            continue;
          }

          // Parse CSV content with proper handling of quoted fields
          const lines = fileResult.stdout.trim().split("\n");
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

          allData = allData.concat(fileData);
          console.log(`✅ Read: ${filename} (${fileData.length} records)`);
          processedFiles++;
        } catch (error) {
          console.error(`❌ Failed to read ${filename}:`, error.message);
        }
      }

      // Sort by timeLogged descending (newest first)
      allData.sort((a, b) => {
        const timeA = new Date(a.timeLogged || 0);
        const timeB = new Date(b.timeLogged || 0);
        return timeB - timeA;
      });

      console.log(
        `✅ Read completed: ${processedFiles}/${files.length} files processed, ${allData.length} total records`
      );

      // Store the data in memory for API access
      this.cachedData = allData;
      this.lastDataUpdate = new Date();

      return {
        success: true,
        data: allData,
        filesProcessed: processedFiles,
        totalFiles: files.length,
      };
    } catch (error) {
      console.error("❌ Read error:", error.message);
      return { success: false, data: [] };
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
