const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class PMTAIntegrationController {
  constructor() {
    // PMTA Import Service URL (scripts folder service)
    this.pmtaImportServiceUrl = process.env.PMTA_IMPORT_SERVICE_URL || 'http://localhost:3999';
  }

  /**
   * Proxy requests to PMTA Import Service
   */
  async proxyToPMTAImportService(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.pmtaImportServiceUrl}${endpoint}`,
        timeout: 30000, // 30 seconds
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`Error proxying to PMTA Import Service: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        throw new AppError('PMTA Import Service is not running', 503);
      }
      
      if (error.response) {
        throw new AppError(
          error.response.data?.error || 'PMTA Import Service error',
          error.response.status
        );
      }
      
      throw new AppError('Failed to communicate with PMTA Import Service', 500);
    }
  }

  /**
   * Get PMTA import status
   */
  async getImportStatus(req, res, next) {
    try {
      const status = await this.proxyToPMTAImportService('/api/import-status');
      
      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get latest imported PMTA data
   */
  async getLatestData(req, res, next) {
    try {
      const data = await this.proxyToPMTAImportService('/api/latest-data');
      
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Connect to PMTA server
   */
  async connectToPMTA(req, res, next) {
    try {
      const connectionData = req.body;
      const result = await this.proxyToPMTAImportService('/api/connect', 'POST', connectionData);
      
      logger.info(`PMTA connection initiated by user ${req.user.email}`);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Disconnect from PMTA server
   */
  async disconnectFromPMTA(req, res, next) {
    try {
      const result = await this.proxyToPMTAImportService('/api/disconnect', 'POST');
      
      logger.info(`PMTA disconnection initiated by user ${req.user.email}`);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Force import from PMTA server
   */
  async forceImport(req, res, next) {
    try {
      const result = await this.proxyToPMTAImportService('/api/force-import', 'POST');
      
      logger.info(`PMTA force import initiated by user ${req.user.email}`);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(req, res, next) {
    try {
      const status = await this.proxyToPMTAImportService('/api/connection-status');
      
      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get available files
   */
  async getAvailableFiles(req, res, next) {
    try {
      const files = await this.proxyToPMTAImportService('/api/files/available');
      
      res.status(200).json({
        status: 'success',
        data: files
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Import specific file
   */
  async importFile(req, res, next) {
    try {
      const result = await this.proxyToPMTAImportService('/api/files/import', 'POST', req.body);
      
      logger.info(`File import initiated by user ${req.user.email}: ${JSON.stringify(req.body)}`);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Delete imported file
   */
  async deleteFile(req, res, next) {
    try {
      const { filename } = req.params;
      const result = await this.proxyToPMTAImportService(`/api/files/${filename}`, 'DELETE');
      
      logger.info(`File deletion initiated by user ${req.user.email}: ${filename}`);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Select file for viewing
   */
  async selectFile(req, res, next) {
    try {
      const result = await this.proxyToPMTAImportService('/api/files/select', 'POST', req.body);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get debug state
   */
  async getDebugState(req, res, next) {
    try {
      const debugInfo = await this.proxyToPMTAImportService('/api/debug/state');
      
      res.status(200).json({
        status: 'success',
        data: debugInfo
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Health check for integration
   */
  async healthCheck(req, res, next) {
    try {
      // Check both services
      const pmtaImportHealth = await this.proxyToPMTAImportService('/api/import-status');
      
      res.status(200).json({
        status: 'success',
        data: {
          integration: 'healthy',
          pmtaImportService: {
            available: true,
            status: pmtaImportHealth.status
          },
          pmtaUploadService: {
            available: true,
            status: 'active'
          }
        }
      });
    } catch (error) {
      // Even if PMTA Import Service is down, we can still provide upload functionality
      res.status(200).json({
        status: 'success',
        data: {
          integration: 'partial',
          pmtaImportService: {
            available: false,
            error: error.message
          },
          pmtaUploadService: {
            available: true,
            status: 'active'
          }
        }
      });
    }
  }
}

const pmtaIntegrationController = new PMTAIntegrationController();

module.exports = {
  getImportStatus: pmtaIntegrationController.getImportStatus.bind(pmtaIntegrationController),
  getLatestData: pmtaIntegrationController.getLatestData.bind(pmtaIntegrationController),
  connectToPMTA: pmtaIntegrationController.connectToPMTA.bind(pmtaIntegrationController),
  disconnectFromPMTA: pmtaIntegrationController.disconnectFromPMTA.bind(pmtaIntegrationController),
  forceImport: pmtaIntegrationController.forceImport.bind(pmtaIntegrationController),
  getConnectionStatus: pmtaIntegrationController.getConnectionStatus.bind(pmtaIntegrationController),
  getAvailableFiles: pmtaIntegrationController.getAvailableFiles.bind(pmtaIntegrationController),
  importFile: pmtaIntegrationController.importFile.bind(pmtaIntegrationController),
  deleteFile: pmtaIntegrationController.deleteFile.bind(pmtaIntegrationController),
  selectFile: pmtaIntegrationController.selectFile.bind(pmtaIntegrationController),
  getDebugState: pmtaIntegrationController.getDebugState.bind(pmtaIntegrationController),
  healthCheck: pmtaIntegrationController.healthCheck.bind(pmtaIntegrationController)
};
