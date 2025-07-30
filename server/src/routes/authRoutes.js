const express = require("express");
const {
  signup,
  login,
  logout,
  getMe,
  updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  validateSignup,
  validateLogin,
  validatePasswordUpdate,
} = require("../validators/authValidator");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

// Public routes
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

// Token verification route (needs to be before protect middleware)
router.get("/verify", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token provided",
      });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = require("../models/User");

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
});

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get("/me", getMe);
router.patch("/updatePassword", validatePasswordUpdate, updatePassword);

module.exports = router;
