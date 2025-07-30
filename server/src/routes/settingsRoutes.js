const express = require("express");
const { protect, restrictTo } = require("../middleware/auth");
const {
  getSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  testMailWizzConnection,
} = require("../controllers/settingsController");

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

// System configuration routes
router.get("/config", getSystemConfig);
router.post("/config", updateSystemConfig);
router.delete("/config/:key", deleteSystemConfig);

// MailWizz connection test
router.post("/mailwizz/test", testMailWizzConnection);

module.exports = router;
