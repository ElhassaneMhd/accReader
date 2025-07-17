const express = require('express');
const {
  getImportStatus,
  getLatestData,
  connectToPMTA,
  disconnectFromPMTA,
  forceImport,
  getConnectionStatus,
  getAvailableFiles,
  importFile,
  deleteFile,
  selectFile,
  getDebugState,
  healthCheck
} = require('../controllers/pmtaIntegrationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PMTA Integration
 *   description: Integration with PMTA Import Service (scripts folder)
 */

// Health check (public)
router.get('/integration/health', healthCheck);

// Protect all other routes and restrict to pmta_user and admin
router.use(protect);
router.use(restrictTo('admin', 'pmta_user'));

/**
 * @swagger
 * /api/pmta/integration/status:
 *   get:
 *     summary: Get PMTA import status
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import status retrieved successfully
 */
router.get('/integration/status', getImportStatus);

/**
 * @swagger
 * /api/pmta/integration/data:
 *   get:
 *     summary: Get latest imported PMTA data
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest data retrieved successfully
 */
router.get('/integration/data', getLatestData);

/**
 * @swagger
 * /api/pmta/integration/connect:
 *   post:
 *     summary: Connect to PMTA server
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
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
 *               logPath:
 *                 type: string
 *               logPattern:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection successful
 */
router.post('/integration/connect', connectToPMTA);

/**
 * @swagger
 * /api/pmta/integration/disconnect:
 *   post:
 *     summary: Disconnect from PMTA server
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disconnection successful
 */
router.post('/integration/disconnect', disconnectFromPMTA);

/**
 * @swagger
 * /api/pmta/integration/import:
 *   post:
 *     summary: Force import from PMTA server
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import triggered successfully
 */
router.post('/integration/import', forceImport);

/**
 * @swagger
 * /api/pmta/integration/connection-status:
 *   get:
 *     summary: Get PMTA connection status
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 */
router.get('/integration/connection-status', getConnectionStatus);

/**
 * @swagger
 * /api/pmta/integration/files:
 *   get:
 *     summary: Get available files from PMTA server
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available files retrieved successfully
 */
router.get('/integration/files', getAvailableFiles);

/**
 * @swagger
 * /api/pmta/integration/files/import:
 *   post:
 *     summary: Import specific file from PMTA server
 *     tags: [PMTA Integration]
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
 *               importAll:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: File import successful
 */
router.post('/integration/files/import', importFile);

/**
 * @swagger
 * /api/pmta/integration/files/{filename}:
 *   delete:
 *     summary: Delete imported file
 *     tags: [PMTA Integration]
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
router.delete('/integration/files/:filename', deleteFile);

/**
 * @swagger
 * /api/pmta/integration/files/select:
 *   post:
 *     summary: Select file for viewing
 *     tags: [PMTA Integration]
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
 *     responses:
 *       200:
 *         description: File selected successfully
 */
router.post('/integration/files/select', selectFile);

/**
 * @swagger
 * /api/pmta/integration/debug:
 *   get:
 *     summary: Get debug state information
 *     tags: [PMTA Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug information retrieved successfully
 */
router.get('/integration/debug', getDebugState);

module.exports = router;
