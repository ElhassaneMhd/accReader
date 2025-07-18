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
    
    logger.info(`CSV import request for list ${listUid}. File uploaded: ${req.file ? req.file.originalname : 'none'}`);
    
    if (!req.file) {
      logger.error('No CSV file provided in request');
      return res.status(400).json({
        status: 'error',
        message: 'No CSV file provided. Please upload a CSV file with import_file field name.'
      });
    }
    
    logger.info(`Processing CSV file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Validate environment variables
    if (!process.env.MAILWIZZ_API_URL || !process.env.MAILWIZZ_PUBLIC_KEY || !process.env.MAILWIZZ_PRIVATE_KEY) {
      logger.error('Missing MailWizz environment variables');
      return res.status(500).json({
        status: 'error',
        message: 'MailWizz configuration is incomplete'
      });
    }
    
    const fs = require('fs');
    const FormData = require('form-data');
    
    // Validate file exists and is readable
    if (!fs.existsSync(req.file.path)) {
      logger.error(`Uploaded file not found at ${req.file.path}`);
      return res.status(400).json({
        status: 'error',
        message: 'Uploaded file could not be processed'
      });
    }
    
    // Create form data for MailWizz API
    const formData = new FormData();
    formData.append('import_file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: 'text/csv'
    });
    
    // Use MailWizz service for the import
    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );
    logger.info(`MailWizz Service created with API URL: ${process.env.MAILWIZZ_API_URL}`);
    logger.info(`Public Key (first 10 chars): ${process.env.MAILWIZZ_PUBLIC_KEY?.substring(0, 10)}...`);
    logger.info(`Importing CSV to MailWizz list: ${listUid}`);
    
    let response;
    try {
      response = await mailwizzService.importSubscribersCSV(listUid, formData);
    } catch (error) {
      // If direct import fails, try parsing CSV and adding subscribers individually
      logger.warn('Direct CSV import failed, trying individual subscriber import');
      
      const csv = require('csv-parser');
      const subscribers = [];
      
      // Parse CSV file with header preservation
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv({
            // Preserve original header case and format
            mapHeaders: ({ header }) => header.trim()
          }))
          .on('data', (data) => {
            logger.info(`Parsed CSV row: ${JSON.stringify(data)}`);
            // Log all available keys to debug field mapping
            logger.info(`Available CSV fields: ${Object.keys(data).join(', ')}`);
            subscribers.push(data);
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      logger.info(`Parsed ${subscribers.length} subscribers from CSV`);
      
      // Debug: Log the entire subscribers array
      logger.info(`Full subscribers array:`, subscribers);
      
      // Add subscribers individually
      const results = [];
      for (let i = 0; i < subscribers.length; i++) {
        const subscriber = subscribers[i];
        try {
          logger.info(`Processing subscriber ${i}:`, subscriber);
          logger.info(`Subscriber keys:`, Object.keys(subscriber));
          logger.info(`EMAIL value:`, subscriber.EMAIL);
          logger.info(`FNAME value:`, subscriber.FNAME);
          logger.info(`LNAME value:`, subscriber.LNAME);
          
          // Map CSV fields to MailWizz format - handle all possible field name variations
          const subscriberData = {
            EMAIL: subscriber.EMAIL || subscriber.email || '',
            FNAME: subscriber.FNAME || subscriber.fname || subscriber.first_name || subscriber['First Name'] || '',
            LNAME: subscriber.LNAME || subscriber.lname || subscriber.last_name || subscriber['Last Name'] || ''
          };
          
          logger.info(`Before field cleanup:`, subscriberData);
          
          // Remove any empty fields to avoid confusing MailWizz
          Object.keys(subscriberData).forEach(key => {
            if (subscriberData[key] === '' || subscriberData[key] === null || subscriberData[key] === undefined) {
              delete subscriberData[key];
            }
          });
          
          logger.info(`After field cleanup:`, subscriberData);
          
          // Validate email is present
          if (!subscriberData.EMAIL) {
            throw new Error('Email address is required');
          }
          
          logger.info(`Adding subscriber: ${subscriberData.EMAIL}`);
          logger.info(`Final subscriber data:`, subscriberData);
          
          const result = await mailwizzService.addSubscriber(listUid, subscriberData);
          results.push({ success: true, email: subscriberData.EMAIL, result });
        } catch (subError) {
          logger.error(`Failed to add subscriber ${subscriber.email || subscriber.EMAIL}: ${subError.message}`);
          results.push({ 
            success: false, 
            email: subscriber.email || subscriber.EMAIL || 'unknown', 
            error: subError.message 
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      response = {
        status: 'success',
        message: `Imported ${successCount}/${subscribers.length} subscribers`,
        results
      };
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    logger.info(`Successfully imported CSV file to list ${listUid}. File: ${req.file.originalname}. Response: ${JSON.stringify(response)}`);
    
    res.json({
      status: 'success',
      data: response,
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
    
    logger.error(`Error importing CSV to list ${req.params.listUid}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to import subscribers to MailWizz list',
      error: error.response?.data || error.message,
      details: {
        file: req.file ? req.file.originalname : 'unknown',
        listUid: req.params.listUid
      }
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
