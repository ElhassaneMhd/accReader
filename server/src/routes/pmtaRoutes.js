const express = require('express');
const {
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
  getFilesCompatibility
} = require('../controllers/pmtaController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: PMTA
 *     description: PMTA file processing and analytics endpoints
 *   - name: PMTA-SSH
 *     description: PMTA SSH import functionality
 */

// Health check (public)
router.get('/health', healthCheck);

// Protect all other routes and restrict to pmta_user and admin
router.use(protect);
router.use(restrictTo('admin', 'pmta_user'));

// File upload routes
router.post('/upload/log', uploadSingle('file'), uploadPMTALog);
router.post('/upload/accounting', uploadSingle('file'), uploadAccountingFile);
router.post('/upload/bounces', uploadSingle('file'), uploadBounceFile);

// Analysis route
router.post('/analyze', analyzeData);

// SSH Import routes
router.post('/ssh/connect', connectSSH);
router.post('/ssh/disconnect', disconnectSSH);
router.get('/ssh/status', getSSHStatus);
router.post('/ssh/import', importFiles);
router.get('/ssh/files', getFiles);
router.get('/ssh/data', getData);
router.post('/ssh/import-file', importSpecificFile);
router.delete('/ssh/delete-file', deleteImportedFile);
router.post('/ssh/periodic-import', togglePeriodicImport);

// Frontend compatibility routes (matching old service endpoints)
router.get('/import-status', getImportStatus);
router.get('/latest-data', getLatestData);
router.get('/connection-status', getConnectionStatus);
router.get('/files/available', getAvailableFiles);
router.post('/files/import', importFilesCompatibility);
router.post('/files/import-latest-only', importLatestOnly);
router.post('/files/select', selectFile);
router.delete('/files/:filename', deleteFileCompatibility);
router.get('/files', getFilesCompatibility);

// Additional compatibility routes
router.post('/connect', connectSSH);
router.post('/disconnect', disconnectSSH);

module.exports = router;
