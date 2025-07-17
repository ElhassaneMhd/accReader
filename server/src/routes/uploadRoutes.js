const express = require('express');
const { uploadSingle } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: General file upload endpoints
 */

// Protect all routes
router.use(protect);

/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
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
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: number
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    logger.info(`File uploaded: ${req.file.filename} by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('File upload error:', error);
    return next(new AppError('Error uploading file', 500));
  }
};

router.post('/file', uploadSingle('file'), uploadFile);

module.exports = router;
