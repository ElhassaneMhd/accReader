const express = require('express');
const {
  uploadPMTALog,
  uploadAccountingFile,
  uploadBounceFile,
  analyzeData,
  healthCheck
} = require('../controllers/pmtaController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PMTA
 *   description: PMTA file processing and analytics endpoints
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

module.exports = router;
