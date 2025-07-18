const express = require('express');
const {
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
  healthCheck
} = require('../controllers/pmtaController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: PMTA-Public
 *     description: Public PMTA SSH connection and data access endpoints
 */

// Health check (public)
router.get('/health', healthCheck);

// Public SSH connection endpoints (no authentication required)
router.post('/connect', connectSSH);
router.post('/disconnect', disconnectSSH);
router.get('/connection-status', getConnectionStatus);
router.get('/ssh/status', getSSHStatus);

// Data access endpoints (public after connection)
router.post('/ssh/import', importFiles);
router.get('/ssh/files', getFiles);
router.get('/ssh/data', getData);
router.post('/ssh/import-file', importSpecificFile);
router.delete('/ssh/delete-file', deleteImportedFile);
router.post('/ssh/periodic-import', togglePeriodicImport);

// Frontend compatibility routes (public)
router.get('/import-status', getImportStatus);
router.get('/latest-data', getLatestData);
router.get('/files/available', getAvailableFiles);
router.post('/files/import', importFilesCompatibility);
router.post('/files/import-latest-only', importLatestOnly);
router.post('/files/select', selectFile);
router.delete('/files/:filename', deleteFileCompatibility);
router.get('/files', getFilesCompatibility);

// Additional compatibility routes
router.post('/ssh/connect', connectSSH);
router.post('/ssh/disconnect', disconnectSSH);

module.exports = router;
