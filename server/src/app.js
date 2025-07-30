// Load environment variables first

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const mailwizzRoutes = require("./routes/mailwizzRoutes");
const pmtaRoutes = require("./routes/pmtaRoutes");
const pmtaPublicRoutes = require("./routes/pmtaPublicRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoute = require("./routes/adminRoute");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AccReader Backend API",
      version: "1.0.0",
      description:
        "Backend API for AccReader with MailWizz integration and PMTA import server",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Test MailWizz connectivity (no auth required)
app.get("/test-mailwizz", async (req, res) => {
  try {
    const { createMailWizzService } = require("./services/mailwizzService");
    const logger = require("./utils/logger");

    logger.info("Testing MailWizz connectivity...");

    const mailwizzService = createMailWizzService(
      process.env.MAILWIZZ_API_URL,
      process.env.MAILWIZZ_PUBLIC_KEY,
      process.env.MAILWIZZ_PRIVATE_KEY
    );

    // Test with a simple API call
    const campaigns = await mailwizzService.getAllCampaigns(1, 5);

    logger.info("MailWizz test successful:", {
      status: campaigns.status,
      count: campaigns.data?.count,
      records: campaigns.data?.records?.length,
    });

    res.json({
      status: "success",
      message: "MailWizz connection test successful",
      data: {
        apiUrl: process.env.MAILWIZZ_API_URL,
        publicKey: process.env.MAILWIZZ_PUBLIC_KEY
          ? "***configured***"
          : "missing",
        privateKey: process.env.MAILWIZZ_PRIVATE_KEY
          ? "***configured***"
          : "missing",
        campaignsCount: campaigns.data?.count || 0,
        sampleCampaigns: campaigns.data?.records?.slice(0, 2) || [],
      },
    });
  } catch (error) {
    const logger = require("./utils/logger");
    logger.error("MailWizz test failed:", error);
    res.status(500).json({
      status: "error",
      message: "MailWizz connection test failed",
      error: error.message,
      config: {
        apiUrl: process.env.MAILWIZZ_API_URL,
        publicKey: process.env.MAILWIZZ_PUBLIC_KEY
          ? "***configured***"
          : "missing",
        privateKey: process.env.MAILWIZZ_PRIVATE_KEY
          ? "***configured***"
          : "missing",
      },
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/mailwizz", mailwizzRoutes);
app.use("/api/pmta-admin", pmtaRoutes); // Admin-only PMTA routes
app.use("/api/pmta", pmtaPublicRoutes); // Public PMTA routes (no auth required)
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/admin/settings", settingsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AccReader Backend API",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      auth: "/api/auth",
      mailwizz: "/api/mailwizz",
      pmta: "/api/pmta",
      pmtaSSH: "/api/pmta/ssh",
      users: "/api/users",
      upload: "/api/upload",
      admin: "/api/admin",
    },
    services: {
      pmtaUpload: "Built-in PMTA file upload and processing",
      pmtaSSHImport: "SSH-based PMTA import service",
      mailwizz: "MailWizz API integration",
      auth: "JWT-based authentication",
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested endpoint ${req.originalUrl} does not exist`,
  });
});

module.exports = app;
