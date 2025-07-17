const PMTAService = require('../services/pmtaService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const path = require('path');

const pmtaService = new PMTAService();

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
      return next(new AppError('No file uploaded', 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, 'pmta_log');

    // Parse the PMTA log file
    const result = await pmtaService.parsePMTALog(req.file.path);
    
    // Generate statistics
    const statistics = pmtaService.generateStatistics(result.data, 'pmta_log');

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(`PMTA log processed: ${req.file.filename} - ${result.data.length} records`);

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100) // Return first 100 records as sample
      }
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }
    
    logger.error('uploadPMTALog error:', error);
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
      return next(new AppError('No file uploaded', 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, 'accounting');

    // Parse the accounting file
    const result = await pmtaService.parseAccountingFile(req.file.path);
    
    // Generate statistics
    const statistics = pmtaService.generateStatistics(result.data, 'accounting');

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(`Accounting file processed: ${req.file.filename} - ${result.data.length} records`);

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100) // Return first 100 records as sample
      }
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }
    
    logger.error('uploadAccountingFile error:', error);
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
      return next(new AppError('No file uploaded', 400));
    }

    // Validate file format
    pmtaService.validateFileFormat(req.file.filename, 'bounces');

    // Parse the bounce file
    const result = await pmtaService.processBounceFile(req.file.path);
    
    // Generate statistics
    const statistics = pmtaService.generateStatistics(result.data, 'bounces');

    // Clean up the uploaded file
    await pmtaService.cleanupFile(req.file.path);

    logger.info(`Bounce file processed: ${req.file.filename} - ${result.data.length} records`);

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        totalRecords: result.data.length,
        errors: result.errors,
        statistics,
        processedData: result.data.slice(0, 100) // Return first 100 records as sample
      }
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await pmtaService.cleanupFile(req.file.path);
    }
    
    logger.error('uploadBounceFile error:', error);
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
      return next(new AppError('Invalid data provided for analysis', 400));
    }

    if (!analysisType || !['pmta_log', 'accounting', 'bounces'].includes(analysisType)) {
      return next(new AppError('Invalid analysis type', 400));
    }

    // Generate comprehensive statistics
    const statistics = pmtaService.generateStatistics(data, analysisType);

    logger.info(`Data analysis completed for ${data.length} records of type ${analysisType}`);

    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    logger.error('analyzeData error:', error);
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
    status: 'success',
    service: 'PMTA Processing Service',
    timestamp: new Date().toISOString(),
    supportedFormats: ['CSV', 'TXT', 'LOG'],
    maxFileSize: '50MB'
  });
};

module.exports = {
  uploadPMTALog,
  uploadAccountingFile,
  uploadBounceFile,
  analyzeData,
  healthCheck
};
