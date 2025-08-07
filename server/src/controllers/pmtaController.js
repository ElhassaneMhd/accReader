const PMTAService = require("../services/pmtaService");
const PMTASSHImportService = require("../services/pmtaSSHImportService");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const path = require("path");

const pmtaService = new PMTAService();
const pmtaSSHService = new PMTASSHImportService();

/**
 * @swagger
 * components:
 *   schemas:
 *     PMTAUploadResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *             totalRecords:
 *               type: integer
 *             errors:
 *               type: array
 *               items:
 *                 type: string
 *             statistics:
 *               type: object
 *     PMTAStatistics:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: integer
 *         dateRange:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               format: date-time
 *             end:
 *               type: string
 *               format: date-time
 *         summary:
 *           type: object
 */

/**
 * @swagger
 * /api/pmta/upload/log:
 *   post:
 *     summary: Upload and process PMTA log file
 *     tags: [PMTA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PMTA log file (CSV/TXT format)
 *     responses:
 *       200:
 *         description: File processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMTAUploadResponse'
 */
const uploadPMTALog = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, "pmta_log");

    // Parse the PMTA log file
    const result = await pmtaService.parsePMTALog(req.file.path);

    // Generate statistics
    const statistics = pmtaService.generateStatistics(result.data, "pmta_log");

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(
      `PMTA log processed: ${req.file.filename} - ${result.data.length} records`
    );

    res.status(200).json({
      status: "success",
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100), // Return first 100 records as sample
      },
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }

    logger.error("uploadPMTALog error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/upload/accounting:
 *   post:
 *     summary: Upload and process PMTA accounting file
 *     tags: [PMTA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PMTA accounting file (CSV format)
 *     responses:
 *       200:
 *         description: File processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMTAUploadResponse'
 */
const uploadAccountingFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, "accounting");

    // Parse the accounting file
    const result = await pmtaService.parseAccountingFile(req.file.path);

    // Generate statistics
    const statistics = pmtaService.generateStatistics(
      result.data,
      "accounting"
    );

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(
      `Accounting file processed: ${req.file.filename} - ${result.data.length} records`
    );

    res.status(200).json({
      status: "success",
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100), // Return first 100 records as sample
      },
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }

    logger.error("uploadAccountingFile error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/upload/bounces:
 *   post:
 *     summary: Upload and process PMTA bounce file
 *     tags: [PMTA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PMTA bounce file (CSV format)
 *     responses:
 *       200:
 *         description: File processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PMTAUploadResponse'
 */
const uploadBounceFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, "bounces");

    // Parse the bounce file
    const result = await pmtaService.processBounceFile(req.file.path);

    // Generate statistics
    const statistics = pmtaService.generateStatistics(result.data, "bounces");

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(
      `Bounce file processed: ${req.file.filename} - ${result.data.length} records`
    );

    res.status(200).json({
      status: "success",
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100), // Return first 100 records as sample
      },
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }

    logger.error("uploadBounceFile error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/analyze:
 *   post:
 *     summary: Analyze uploaded PMTA data
 *     tags: [PMTA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 description: PMTA data to analyze
 *               analysisType:
 *                 type: string
 *                 enum: [pmta_log, accounting, bounces]
 *                 description: Type of analysis to perform
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PMTAStatistics'
 */
const analyzeData = async (req, res, next) => {
  try {
    const { data, analysisType } = req.body;

    if (!data || !Array.isArray(data)) {
      return next(new AppError("Invalid data provided for analysis", 400));
    }

    if (
      !analysisType ||
      !["pmta_log", "accounting", "bounces"].includes(analysisType)
    ) {
      return next(new AppError("Invalid analysis type", 400));
    }

    // Generate comprehensive statistics
    const statistics = pmtaService.generateStatistics(data, analysisType);

    logger.info(
      `Data analysis completed for ${data.length} records of type ${analysisType}`
    );

    res.status(200).json({
      status: "success",
      data: statistics,
    });
  } catch (error) {
    logger.error("analyzeData error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/health:
 *   get:
 *     summary: Check PMTA service health
 *     tags: [PMTA]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
const healthCheck = (req, res) => {
  res.status(200).json({
    status: "success",
    service: "PMTA Processing Service",
    timestamp: new Date().toISOString(),
    supportedFormats: ["CSV", "TXT", "LOG"],
    maxFileSize: "50MB",
  });
};

// SSH Import Endpoints

/**
 * @swagger
 * /api/pmta/ssh/connect:
 *   post:
 *     summary: Connect to PMTA SSH server
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connected successfully
 */
const connectSSH = async (req, res, next) => {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      pmtaSSHService.updateConfig(req.body);
    }

    const connected = await pmtaSSHService.connectToServer();

    if (connected) {
      // Load existing files after connection
      await pmtaSSHService.loadExistingImportedFiles();

      res.status(200).json({
        status: "success",
        message: "Connected to PMTA server successfully",
        data: pmtaSSHService.getStatus(),
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Failed to connect to PMTA server",
        data: pmtaSSHService.getStatus(),
      });
    }
  } catch (error) {
    logger.error("SSH connect error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/disconnect:
 *   post:
 *     summary: Disconnect from PMTA SSH server
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disconnected successfully
 */
const disconnectSSH = async (req, res, next) => {
  try {
    const disconnected = await pmtaSSHService.disconnect();

    res.status(200).json({
      status: "success",
      message: "Disconnected from PMTA server",
      disconnected,
    });
  } catch (error) {
    logger.error("SSH disconnect error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/status:
 *   get:
 *     summary: Get SSH connection status
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 */
const getSSHStatus = (req, res) => {
  const status = pmtaSSHService.getStatus();
  res.status(200).json({
    status: "success",
    data: status,
  });
};

/**
 * @swagger
 * /api/pmta/ssh/import:
 *   post:
 *     summary: Import files from PMTA server
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               importAll:
 *                 type: boolean
 *                 description: Import all available files (default: false)
 *     responses:
 *       200:
 *         description: Import completed successfully
 */
const importFiles = async (req, res, next) => {
  try {
    const { importAll = false } = req.body;

    const result = await pmtaSSHService.importFiles(importAll);

    res.status(200).json({
      status: "success",
      message: "Import completed",
      data: result,
    });
  } catch (error) {
    logger.error("SSH import error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/files:
 *   get:
 *     summary: Get available and imported files
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 */
const getFiles = async (req, res, next) => {
  try {
    const data = pmtaSSHService.getData();

    res.status(200).json({
      status: "success",
      data: {
        ...data,
        availableFiles: pmtaSSHService.availableFiles,
        importedFiles: pmtaSSHService.importedFiles.map((f) => ({
          filename: f.filename,
          recordCount: f.recordCount,
          importTime: f.importTime,
        })),
      },
    });
  } catch (error) {
    logger.error("Get files error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/data:
 *   get:
 *     summary: Get imported PMTA data
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: file
 *         schema:
 *           type: string
 *         description: Specific file to get data from (default: all)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 */
const getData = (req, res) => {
  try {
    const { file = "all", limit, offset } = req.query;

    // Update selected file if provided
    if (file !== pmtaSSHService.selectedFile) {
      pmtaSSHService.selectedFile = file;
    }

    let data = pmtaSSHService.getData();

    // Apply pagination if provided
    if (limit || offset) {
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + (parseInt(limit) || data.data.length);
      data.data = data.data.slice(startIndex, endIndex);
      data.pagination = {
        offset: startIndex,
        limit: parseInt(limit) || data.data.length,
        total: data.totalRecords,
      };
    }

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    logger.error("Get data error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/pmta/ssh/import-file:
 *   post:
 *     summary: Import specific file
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Name of the file to import
 *     responses:
 *       200:
 *         description: File imported successfully
 */
const importSpecificFile = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return next(new AppError("Filename is required", 400));
    }

    const result = await pmtaSSHService.importSpecificFile(filename);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Import specific file error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/delete-file:
 *   delete:
 *     summary: Delete imported file
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Name of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
const deleteImportedFile = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return next(new AppError("Filename is required", 400));
    }

    const result = await pmtaSSHService.deleteImportedFile(filename);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Delete file error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/ssh/periodic-import:
 *   post:
 *     summary: Start/stop periodic import
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Enable or disable periodic import
 *     responses:
 *       200:
 *         description: Periodic import setting updated
 */
const togglePeriodicImport = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    if (enabled) {
      await pmtaSSHService.startPeriodicImport();
    } else {
      pmtaSSHService.stopPeriodicImport();
    }

    res.status(200).json({
      status: "success",
      message: `Periodic import ${enabled ? "started" : "stopped"}`,
      data: pmtaSSHService.getStatus(),
    });
  } catch (error) {
    logger.error("Toggle periodic import error:", error);
    return next(new AppError(error.message, 500));
  }
};

// Frontend Compatibility Endpoints (matching old service)

/**
 * @swagger
 * /api/pmta/import-status:
 *   get:
 *     summary: Get import status (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import status retrieved successfully
 */
const getImportStatus = (req, res) => {
  try {
    const status = pmtaSSHService.getStatus();

    // Transform to match frontend expectations
    const compatibilityStatus = {
      ...status,
      isConnected: status.status === "connected",
      note: "Files are downloaded and kept for management. Use delete controls to remove when needed.",
    };

    res.status(200).json(compatibilityStatus);
  } catch (error) {
    logger.error("Get import status error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/pmta/latest-data:
 *   get:
 *     summary: Get latest data (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest data retrieved successfully
 */
const getLatestData = (req, res) => {
  try {
    // Force reload data if requested
    const forceReload = req.query.forceReload === "true";

    if (forceReload) {
      logger.info("Force reload requested for latest data");
      pmtaSSHService
        .forceReloadData()
        .then(() => {
          logger.info("Force reload completed");
        })
        .catch((err) => {
          logger.error("Force reload failed:", err);
        });
    }

    const data = pmtaSSHService.getData();

    // Transform to match frontend expectations
    const response = {
      ...data,
      lastUpdate: pmtaSSHService.lastDataUpdate,
      source: "downloaded_files_processed",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Get latest data error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/pmta/connection-status:
 *   get:
 *     summary: Get connection status (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 */
const getConnectionStatus = (req, res) => {
  try {
    const status = pmtaSSHService.getStatus();

    // Transform to match frontend expectations
    const connectionStatus = {
      isConnected: status.status === "connected",
      connectionHealth: status.connectionHealth,
      status: status.status,
      lastError: status.lastError,
    };

    res.status(200).json(connectionStatus);
  } catch (error) {
    logger.error("Get connection status error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/pmta/files/available:
 *   get:
 *     summary: Get available files (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available files retrieved successfully
 */
const getAvailableFiles = async (req, res, next) => {
  try {
    if (!pmtaSSHService.isConnected) {
      return res.status(200).json({
        files: [],
        message: "Not connected to server",
      });
    }

    const remoteFiles = await pmtaSSHService.listRemoteFiles();

    const availableFiles = remoteFiles.map((filePath) => ({
      filename: require("path").basename(filePath),
      fullPath: filePath,
      available: true,
    }));

    res.status(200).json({
      files: availableFiles,
    });
  } catch (error) {
    logger.error("Get available files error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/files/import:
 *   post:
 *     summary: Import files (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *               importAllFiles:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Files imported successfully
 */
const importFilesCompatibility = async (req, res, next) => {
  try {
    const { files, importAllFiles = false, filename } = req.body;

    logger.info(`Import request received:`, {
      files,
      importAllFiles,
      filename,
    });

    // Handle single filename parameter (frontend compatibility)
    if (filename) {
      logger.info(`Importing specific file: ${filename}`);
      const result = await pmtaSSHService.importSpecificFile(filename);

      logger.info(`Import result for ${filename}:`, result);

      res.status(200).json({
        success: result.success,
        message: result.message || `Imported ${filename}`,
        data: result,
      });
      return;
    }

    if (files && files.length > 0) {
      // Import specific files
      const results = [];
      for (const file of files) {
        const result = await pmtaSSHService.importSpecificFile(file);
        results.push(result);
      }

      res.status(200).json({
        success: true,
        message: `Imported ${files.length} files`,
        results,
      });
    } else {
      // Import all or latest
      const result = await pmtaSSHService.importFiles(importAllFiles);

      res.status(200).json({
        success: result.success,
        message: "Import completed",
        data: result,
      });
    }
  } catch (error) {
    logger.error("Import files compatibility error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/files/import-latest-only:
 *   post:
 *     summary: Import only latest file (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest file imported successfully
 */
const importLatestOnly = async (req, res, next) => {
  try {
    const result = await pmtaSSHService.importFiles(false); // Import only latest

    res.status(200).json({
      success: result.success,
      message: "Latest file imported",
      data: result,
    });
  } catch (error) {
    logger.error("Import latest only error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/files/select:
 *   post:
 *     summary: Select file for viewing (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *     responses:
 *       200:
 *         description: File selected successfully
 */
const selectFile = (req, res) => {
  try {
    const { filename } = req.body;
    const selected = filename || "all";
    pmtaSSHService.selectedFile = selected;

    // If not "all", ensure the file's data is loaded
    if (selected !== "all") {
      let file = pmtaSSHService.importedFiles.find(f => f.filename === selected);
      if (!file) {
        // Try to load from disk if not in memory
        const path = require("path");
        const fs = require("fs");
        const filePath = path.join(pmtaSSHService.localDataPath, selected);
        if (fs.existsSync(filePath)) {
          pmtaSSHService.parseCSVFile(filePath).then(data => {
            pmtaSSHService.importedFiles.push({
              filename: selected,
              data,
              recordCount: data.length,
              importTime: new Date().toISOString(),
              localPath: filePath,
            });
            pmtaSSHService.lastDataUpdate = new Date();
            res.status(200).json({
              success: true,
              message: `Selected file: ${selected} (loaded from disk)`,
              selectedFile: selected,
            });
          }).catch(error => {
            logger.error("Error loading selected file from disk:", error);
            res.status(500).json({
              success: false,
              message: `Failed to load file: ${error.message}`,
            });
          });
          return;
        } else {
          return res.status(404).json({
            success: false,
            message: `File not found: ${selected}`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Selected file: ${selected}`,
      selectedFile: selected,
    });
  } catch (error) {
    logger.error("Select file error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/pmta/files/{filename}:
 *   delete:
 *     summary: Delete file (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
const deleteFileCompatibility = async (req, res, next) => {
  try {
    const { filename } = req.params;

    const result = await pmtaSSHService.deleteImportedFile(filename);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Delete file compatibility error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/pmta/files:
 *   get:
 *     summary: Get all files info (frontend compatibility)
 *     tags: [PMTA-SSH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files info retrieved successfully
 */
const getFilesCompatibility = (req, res) => {
  try {
    const filesInfo = pmtaSSHService.importedFiles.map((file) => ({
      filename: file.filename,
      recordCount: file.recordCount,
      importTime: file.importTime,
      selected: pmtaSSHService.selectedFile === file.filename,
    }));

    const data = pmtaSSHService.getData();

    res.status(200).json({
      files: filesInfo,
      selectedFile: pmtaSSHService.selectedFile,
      totalRecords: data.totalRecords,
      availableFiles: pmtaSSHService.availableFiles || [],
    });
  } catch (error) {
    logger.error("Get files compatibility error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  uploadPMTALog,
  uploadAccountingFile,
  uploadBounceFile,
  analyzeData,
  healthCheck,
  // SSH Import functions
  connectSSH,
  disconnectSSH,
  getSSHStatus,
  importFiles,
  getFiles,
  getData,
  importSpecificFile,
  deleteImportedFile,
  togglePeriodicImport,
  // Frontend compatibility endpoints
  getImportStatus,
  getLatestData,
  getConnectionStatus,
  getAvailableFiles,
  importFilesCompatibility,
  importLatestOnly,
  selectFile,
  deleteFileCompatibility,
  getFilesCompatibility,
};
