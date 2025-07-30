const { SystemConfig } = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const crypto = require("crypto");

// Encryption key for sensitive data (should be stored in environment)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here";

// Helper function to encrypt sensitive data
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

// Helper function to decrypt sensitive data
const decrypt = (text) => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  const decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * @swagger
 * /api/admin/settings/config:
 *   get:
 *     summary: Get all system configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configuration retrieved successfully
 */
const getSystemConfig = async (req, res, next) => {
  try {
    const configs = await SystemConfig.findAll({
      order: [
        ["category", "ASC"],
        ["key", "ASC"],
      ],
    });

    // Decrypt sensitive values
    const decryptedConfigs = configs.map((config) => {
      const configData = config.toJSON();
      if (configData.isEncrypted && configData.value) {
        try {
          configData.value = decrypt(configData.value);
        } catch (error) {
          logger.error("Error decrypting config value:", error);
          configData.value = "[ENCRYPTED]";
        }
      }
      return configData;
    });

    res.status(200).json({
      status: "success",
      data: decryptedConfigs,
    });
  } catch (error) {
    logger.error("getSystemConfig error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/admin/settings/config:
 *   post:
 *     summary: Create or update system configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               isEncrypted:
 *                 type: boolean
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
const updateSystemConfig = async (req, res, next) => {
  try {
    const {
      key,
      value,
      description,
      isEncrypted = false,
      category = "general",
    } = req.body;

    if (!key || value === undefined) {
      return next(new AppError("Key and value are required", 400));
    }

    // Encrypt value if needed
    let finalValue = value;
    if (isEncrypted && value) {
      finalValue = encrypt(value);
    }

    // Find existing config or create new one
    const [config, created] = await SystemConfig.findOrCreate({
      where: { key },
      defaults: {
        value: finalValue,
        description,
        isEncrypted,
        category,
      },
    });

    if (!created) {
      // Update existing config
      await config.update({
        value: finalValue,
        description,
        isEncrypted,
        category,
      });
    }

    // Return decrypted value for response
    let responseValue = finalValue;
    if (isEncrypted && finalValue) {
      try {
        responseValue = decrypt(finalValue);
      } catch (error) {
        responseValue = "[ENCRYPTED]";
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        id: config.id,
        key: config.key,
        value: responseValue,
        description: config.description,
        isEncrypted: config.isEncrypted,
        category: config.category,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    logger.error("updateSystemConfig error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/admin/settings/config/{key}:
 *   delete:
 *     summary: Delete system configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
const deleteSystemConfig = async (req, res, next) => {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOne({ where: { key } });
    if (!config) {
      return next(new AppError("Configuration not found", 404));
    }

    await config.destroy();

    res.status(200).json({
      status: "success",
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    logger.error("deleteSystemConfig error:", error);
    return next(new AppError(error.message, 500));
  }
};

/**
 * @swagger
 * /api/admin/settings/mailwizz/test:
 *   post:
 *     summary: Test MailWizz API connection
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiUrl
 *               - publicKey
 *               - privateKey
 *             properties:
 *               apiUrl:
 *                 type: string
 *               publicKey:
 *                 type: string
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection test result
 */
const testMailWizzConnection = async (req, res, next) => {
  try {
    const { apiUrl, publicKey, privateKey } = req.body;

    if (!apiUrl || !publicKey || !privateKey) {
      return next(
        new AppError("API URL, Public Key, and Private Key are required", 400)
      );
    }

    const { createMailWizzService } = require("../services/mailwizzService");

    const mailwizzService = createMailWizzService(
      apiUrl,
      publicKey,
      privateKey
    );

    // Test with a simple API call
    const campaigns = await mailwizzService.getAllCampaigns(1, 5);

    res.status(200).json({
      status: "success",
      message: "MailWizz connection test successful",
      data: {
        apiUrl,
        publicKey: publicKey.substring(0, 10) + "...",
        privateKey: privateKey.substring(0, 10) + "...",
        campaignsCount: campaigns.data?.count || 0,
        sampleCampaigns: campaigns.data?.records?.slice(0, 2) || [],
      },
    });
  } catch (error) {
    logger.error("testMailWizzConnection error:", error);
    res.status(500).json({
      status: "error",
      message: "MailWizz connection test failed",
      error: error.message,
    });
  }
};

module.exports = {
  getSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  testMailWizzConnection,
};
