const express = require('express');
const {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  getCampaignStats,
  getAllLists,
  getList,
  getListSubscribers,
  getAllTemplates
} = require('../controllers/mailwizzController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MailWizz
 *   description: MailWizz API integration endpoints
 */

// Protect all routes
router.use(protect);

// Campaign routes
router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns', restrictTo('admin', 'client'), createCampaign);
router.get('/campaigns/:id/stats', getCampaignStats);

// List routes
router.get('/lists', getAllLists);
router.get('/lists/:id', getList);
router.get('/lists/:id/subscribers', getListSubscribers);

// Template routes
router.get('/templates', getAllTemplates);

module.exports = router;
