const { createMailWizzService } = require('../services/mailwizzService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Helper function to get MailWizz service instance for user
const getMailWizzServiceForUser = (user) => {
  if (!user.mailwizzApiKey) {
    throw new AppError('MailWizz API key not configured for this user', 400);
  }

  const apiUrl = process.env.MAILWIZZ_API_URL;
  const publicKey = process.env.MAILWIZZ_PUBLIC_KEY;
  
  if (!apiUrl || !publicKey) {
    throw new AppError('MailWizz API configuration missing', 500);
  }

  return createMailWizzService(apiUrl, publicKey, user.mailwizzApiKey);
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       properties:
 *         campaign_id:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: string
 *         type:
 *           type: string
 *         subject:
 *           type: string
 *         from_name:
 *           type: string
 *         from_email:
 *           type: string
 *         reply_to:
 *           type: string
 *         send_at:
 *           type: string
 *         created_at:
 *           type: string
 *         updated_at:
 *           type: string
 */

/**
 * @swagger
 * /api/mailwizz/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of campaigns
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
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Campaign'
 */
const getAllCampaigns = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const campaigns = await mailwizzService.getAllCampaigns(page, perPage);

    res.status(200).json({
      status: 'success',
      data: campaigns
    });
  } catch (error) {
    logger.error('getAllCampaigns error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Campaign'
 */
const getCampaign = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const campaign = await mailwizzService.getCampaign(req.params.id);

    res.status(200).json({
      status: 'success',
      data: campaign
    });
  } catch (error) {
    logger.error('getCampaign error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - from_name
 *               - from_email
 *               - list_uid
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               from_name:
 *                 type: string
 *               from_email:
 *                 type: string
 *               reply_to:
 *                 type: string
 *               list_uid:
 *                 type: string
 *               template:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
const createCampaign = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const campaign = await mailwizzService.createCampaign(req.body);

    res.status(201).json({
      status: 'success',
      data: campaign
    });
  } catch (error) {
    logger.error('createCampaign error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign statistics
 */
const getCampaignStats = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const stats = await mailwizzService.getCampaignStats(req.params.id);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('getCampaignStats error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/lists:
 *   get:
 *     summary: Get all lists
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of mailing lists
 */
const getAllLists = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const lists = await mailwizzService.getAllLists(page, perPage);

    res.status(200).json({
      status: 'success',
      data: lists
    });
  } catch (error) {
    logger.error('getAllLists error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/lists/{id}:
 *   get:
 *     summary: Get list by ID
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List details
 */
const getList = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const list = await mailwizzService.getList(req.params.id);

    res.status(200).json({
      status: 'success',
      data: list
    });
  } catch (error) {
    logger.error('getList error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/lists/{id}/subscribers:
 *   get:
 *     summary: Get subscribers for a list
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of subscribers
 */
const getListSubscribers = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const subscribers = await mailwizzService.getListSubscribers(req.params.id, page, perPage);

    res.status(200).json({
      status: 'success',
      data: subscribers
    });
  } catch (error) {
    logger.error('getListSubscribers error:', error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/mailwizz/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [MailWizz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of templates
 */
const getAllTemplates = async (req, res, next) => {
  try {
    const mailwizzService = getMailWizzServiceForUser(req.user);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const templates = await mailwizzService.getAllTemplates(page, perPage);

    res.status(200).json({
      status: 'success',
      data: templates
    });
  } catch (error) {
    logger.error('getAllTemplates error:', error);
    return next(new AppError(error.message, 500));
  }
};

module.exports = {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  getCampaignStats,
  getAllLists,
  getList,
  getListSubscribers,
  getAllTemplates
};
