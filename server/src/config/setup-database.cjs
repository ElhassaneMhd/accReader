#!/usr/bin/env node

/**
 * Database Setup and Migration Script for AccReader
 * This script helps set up the MySQL database for production use
 */

const { User, SystemConfig } = require("../models/User");
const sequelize = require("./database");
const logger = require("../utils/logger");

const setupDatabase = async () => {
  try {
    // Sync all models to create tables
    await sequelize.sync({ alter: true });
    logger.info("Database tables synchronized");

    // Initialize default system configuration
    const defaultConfigs = [
      {
        key: "MAILWIZZ_API_URL",
        value: process.env.MAILWIZZ_API_URL || "",
        description: "MailWizz API URL",
        isEncrypted: false,
        category: "mailwizz",
      },
      {
        key: "MAILWIZZ_PUBLIC_KEY",
        value: process.env.MAILWIZZ_PUBLIC_KEY || "",
        description: "MailWizz Public Key",
        isEncrypted: true,
        category: "mailwizz",
      },
      {
        key: "MAILWIZZ_PRIVATE_KEY",
        value: process.env.MAILWIZZ_PRIVATE_KEY || "",
        description: "MailWizz Private Key",
        isEncrypted: true,
        category: "mailwizz",
      },
    ];

    // Create or update default configurations
    for (const config of defaultConfigs) {
      const [systemConfig, created] = await SystemConfig.findOrCreate({
        where: { key: config.key },
        defaults: config,
      });

      if (!created) {
        // Update existing config with environment values if they exist
        if (config.value) {
          await systemConfig.update(config);
        }
      }
    }

    logger.info("Default system configuration initialized");

    // Check if admin user exists, create if not
    const adminExists = await User.findOne({ where: { role: "admin" } });
    if (!adminExists) {
      await User.create({
        name: "System Admin",
        email: "admin@system.com",
        password: "admin123",
        role: "admin",
        isActive: true,
      });
      logger.info("Default admin user created");
    }

    logger.info("Database setup completed successfully");
  } catch (error) {
    logger.error("Database setup failed:", error);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("Database setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
