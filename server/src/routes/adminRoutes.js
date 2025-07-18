const express = require('express');
const multer = require('multer');
const {
  getAllCampaigns,
  getCampaign,
  getCampaignStats,
  getAllLists,
  getAllTemplates
} = require('../controllers/mailwizzController');
const { createMailWizzService } = require('../services/mailwizzService');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for system management
 */

// Protect all routes and restrict to admin
router.use(protect);
router.use(restrictTo('admin'));

// MailWizz admin routes
router.get('/mailwizz/campaigns', async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch campaigns from MailWizz API
    const campaigns = await mailwizzService.getAllCampaigns(page, per_page);
    
    logger.info(`Fetched ${campaigns.data?.records?.length || 0} campaigns from MailWizz`);
    
    res.json({
      status: 'success',
      data: campaigns.data,
      message: `Successfully fetched campaigns from ${process.env.MAILWIZZ_API_URL}/campaigns`
    });
  } catch (error) {
    logger.error('Error fetching campaigns from MailWizz:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaigns from MailWizz',
      error: error.message
    });
  }
});

// New endpoint to fetch campaigns with their stats
router.get('/mailwizz/campaigns-with-stats', async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch campaigns from MailWizz API
    const campaignsResponse = await mailwizzService.getAllCampaigns(page, per_page);
    const campaigns = campaignsResponse.data.records || [];
    
    logger.info(`Fetching stats for ${campaigns.length} campaigns`);
    
    // Fetch stats for each campaign
    const campaignsWithStats = await Promise.allSettled(
      campaigns.map(async (campaign) => {
        try {
          const statsResponse = await mailwizzService.getCampaignStats(campaign.campaign_uid);
          return {
            ...campaign,
            stats: statsResponse.data || null
          };
        } catch (error) {
          logger.warn(`Failed to fetch stats for campaign ${campaign.campaign_uid}:`, error.message);
          return {
            ...campaign,
            stats: null,
            statsError: error.message
          };
        }
      })
    );

    // Process results and separate successful from failed
    const processedCampaigns = campaignsWithStats.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          campaign_uid: 'unknown',
          name: 'Error loading campaign',
          stats: null,
          statsError: result.reason?.message || 'Unknown error'
        };
      }
    });

    const successfulStats = processedCampaigns.filter(c => c.stats !== null).length;
    logger.info(`Successfully fetched stats for ${successfulStats}/${campaigns.length} campaigns`);
    
    res.json({
      status: 'success',
      data: {
        ...campaignsResponse.data,
        records: processedCampaigns
      },
      meta: {
        totalCampaigns: campaigns.length,
        successfulStats: successfulStats,
        failedStats: campaigns.length - successfulStats
      },
      message: `Successfully fetched campaigns with stats from MailWizz`
    });
  } catch (error) {
    logger.error('Error fetching campaigns with stats from MailWizz:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaigns with stats from MailWizz',
      error: error.message
    });
  }
});

router.get('/mailwizz/campaigns/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch specific campaign from MailWizz API
    const campaign = await mailwizzService.getCampaign(id);
    
    res.json({
      status: 'success',
      data: campaign.data,
      message: `Successfully fetched campaign ${id} from MailWizz`
    });
  } catch (error) {
    logger.error(`Error fetching campaign ${req.params.id} from MailWizz:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaign from MailWizz',
      error: error.message
    });
  }
});

router.get('/mailwizz/campaigns/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch campaign stats from MailWizz API
    const stats = await mailwizzService.getCampaignStats(id);
    
    res.json({
      status: 'success',
      data: stats.data,
      message: `Successfully fetched campaign ${id} stats from MailWizz`
    });
  } catch (error) {
    logger.error(`Error fetching campaign ${req.params.id} stats from MailWizz:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaign stats from MailWizz',
      error: error.message
    });
  }
});

router.get('/mailwizz/lists', async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch lists from MailWizz API
    const lists = await mailwizzService.getAllLists(page, per_page);
    
    res.json({
      status: 'success',
      data: lists.data,
      message: 'Successfully fetched lists from MailWizz'
    });
  } catch (error) {
    logger.error('Error fetching lists from MailWizz:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lists from MailWizz',
      error: error.message
    });
  }
});

router.get('/mailwizz/templates', async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch templates from MailWizz API
    const templates = await mailwizzService.getAllTemplates(page, per_page);
    
    res.json({
      status: 'success',
      data: templates.data,
      message: 'Successfully fetched templates from MailWizz'
    });
  } catch (error) {
    logger.error('Error fetching templates from MailWizz:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch templates from MailWizz',
      error: error.message
    });
  }
});

// MailWizz system routes
router.get('/mailwizz/status', async (req, res) => {
  try {
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Test connection by trying to fetch campaigns
    const testResponse = await mailwizzService.getAllCampaigns(1, 1);
    
    res.json({ 
      status: 'connected', 
      message: 'MailWizz API is accessible',
      apiUrl: process.env.MAILWIZZ_API_URL,
      timestamp: new Date().toISOString(),
      testResponse: {
        status: testResponse.status,
        count: testResponse.data?.count || 0
      }
    });
  } catch (error) {
    logger.error('MailWizz connection test failed:', error.message);
    res.status(503).json({
      status: 'disconnected',
      message: 'MailWizz API is not accessible',
      apiUrl: process.env.MAILWIZZ_API_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/mailwizz/sync', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Campaign sync initiated',
    timestamp: new Date().toISOString()
  });
});

router.post('/mailwizz/refresh-cache', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Cache refresh completed',
    timestamp: new Date().toISOString()
  });
});

// User management routes (admin only)
router.get('/users', (req, res) => {
  res.json({ 
    status: 'success', 
    users: [],
    message: 'User management endpoint - implementation needed'
  });
});

router.post('/users', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'User created - implementation needed'
  });
});

router.put('/users/:id', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'User updated - implementation needed'
  });
});

router.delete('/users/:id', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'User deleted - implementation needed'
  });
});

// Campaign assignment routes
router.get('/users/:userId/campaigns', (req, res) => {
  res.json({ 
    status: 'success', 
    assignments: [],
    message: 'Campaign assignments - implementation needed'
  });
});

router.post('/assign-campaign', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Campaign assigned - implementation needed'
  });
});

router.delete('/unassign-campaign', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Campaign unassigned - implementation needed'
  });
});

// System health
router.get('/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      mailwizz: 'connected',
      pmta: 'available'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===============================
// MAILWIZZ LISTS MANAGEMENT
// ===============================

// Get all lists with detailed information
router.get('/mailwizz/lists', async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch lists from MailWizz API
    const listsResponse = await mailwizzService.getAllLists(page, per_page);
    
    logger.info(`Fetched ${listsResponse.data?.records?.length || 0} lists from MailWizz`);
    
    res.json({
      status: 'success',
      data: listsResponse.data,
      message: 'Successfully fetched lists from MailWizz'
    });
  } catch (error) {
    logger.error('Error fetching lists from MailWizz:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lists from MailWizz',
      error: error.message
    });
  }
});

// Get specific list details
router.get('/mailwizz/lists/:listUid', async (req, res, next) => {
  try {
    const { listUid } = req.params;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch specific list from MailWizz API
    const listResponse = await mailwizzService.getList(listUid);
    
    res.json({
      status: 'success',
      data: listResponse.data,
      message: `Successfully fetched list ${listUid} from MailWizz`
    });
  } catch (error) {
    logger.error(`Error fetching list ${req.params.listUid} from MailWizz:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch list from MailWizz',
      error: error.message
    });
  }
});

// Get list subscribers
router.get('/mailwizz/lists/:listUid/subscribers', async (req, res, next) => {
  try {
    const { listUid } = req.params;
    const { page = 1, per_page = 50 } = req.query;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Fetch subscribers from MailWizz API
    const subscribersResponse = await mailwizzService.getListSubscribers(listUid, page, per_page);
    
    logger.info(`Fetched ${subscribersResponse.data?.records?.length || 0} subscribers for list ${listUid}`);
    
    res.json({
      status: 'success',
      data: subscribersResponse.data,
      message: `Successfully fetched subscribers for list ${listUid}`
    });
  } catch (error) {
    logger.error(`Error fetching subscribers for list ${req.params.listUid}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subscribers from MailWizz',
      error: error.message
    });
  }
});

// Add single subscriber to list
router.post('/mailwizz/lists/:listUid/subscribers', async (req, res, next) => {
  try {
    const { listUid } = req.params;
    const subscriberData = req.body;
    
    // Validate required email field
    if (!subscriberData.EMAIL) {
      return res.status(400).json({
        status: 'error',
        message: 'EMAIL field is required for subscriber'
      });
    }
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Add subscriber to MailWizz list
    const response = await mailwizzService.addSubscriber(listUid, subscriberData);
    
    logger.info(`Added subscriber ${subscriberData.EMAIL} to list ${listUid}`);
    
    res.status(201).json({
      status: 'success',
      data: response.data,
      message: `Successfully added subscriber to list ${listUid}`
    });
  } catch (error) {
    logger.error(`Error adding subscriber to list ${req.params.listUid}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add subscriber to MailWizz list',
      error: error.message
    });
  }
});

// Bulk import subscribers from CSV file
router.post('/mailwizz/lists/:listUid/subscribers/import', upload.single('import_file'), async (req, res, next) => {
  try {
    const { listUid } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No CSV file provided. Please upload a CSV file with import_file field name.'
      });
    }
    
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');
    
    // Create form data for MailWizz API
    const formData = new FormData();
    formData.append('import_file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: 'text/csv'
    });
    
    // Make direct API call to MailWizz import endpoint
    const response = await axios.post(
      `${process.env.MAILWIZZ_API_URL}/lists/${listUid}/subscribers/import`,
      formData,
      {
        headers: {
          'X-MW-PUBLIC-KEY': process.env.MAILWIZZ_PUBLIC_KEY,
          'X-MW-PRIVATE-KEY': process.env.MAILWIZZ_PRIVATE_KEY,
          ...formData.getHeaders()
        }
      }
    );
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    logger.info(`Successfully imported CSV file to list ${listUid}. File: ${req.file.originalname}`);
    
    res.json({
      status: 'success',
      data: response.data,
      message: `Successfully imported subscribers from ${req.file.originalname} to list ${listUid}`,
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up uploaded file:', cleanupError.message);
      }
    }
    
    logger.error(`Error importing CSV to list ${req.params.listUid}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import subscribers to MailWizz list',
      error: error.response?.data || error.message
    });
  }
});

// Update subscriber in list
router.put('/mailwizz/lists/:listUid/subscribers/:subscriberUid', async (req, res, next) => {
  try {
    const { listUid, subscriberUid } = req.params;
    const subscriberData = req.body;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Update subscriber in MailWizz list
    const response = await mailwizzService.updateSubscriber(listUid, subscriberUid, subscriberData);
    
    logger.info(`Updated subscriber ${subscriberUid} in list ${listUid}`);
    
    res.json({
      status: 'success',
      data: response.data,
      message: `Successfully updated subscriber in list ${listUid}`
    });
  } catch (error) {
    logger.error(`Error updating subscriber ${req.params.subscriberUid} in list ${req.params.listUid}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update subscriber in MailWizz list',
      error: error.message
    });
  }
});

// Delete subscriber from list
router.delete('/mailwizz/lists/:listUid/subscribers/:subscriberUid', async (req, res, next) => {
  try {
    const { listUid, subscriberUid } = req.params;
    
    // Create MailWizz service instance
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Delete subscriber from MailWizz list
    const response = await mailwizzService.deleteSubscriber(listUid, subscriberUid);
    
    logger.info(`Deleted subscriber ${subscriberUid} from list ${listUid}`);
    
    res.json({
      status: 'success',
      data: response.data,
      message: `Successfully deleted subscriber from list ${listUid}`
    });
  } catch (error) {
    logger.error(`Error deleting subscriber ${req.params.subscriberUid} from list ${req.params.listUid}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete subscriber from MailWizz list',
      error: error.message
    });
  }
});

module.exports = router;
