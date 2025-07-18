-- =====================================
-- AccReader Application Database Setup
-- MySQL Database Creation Script
-- =====================================

-- Create the database
CREATE DATABASE IF NOT EXISTS accreader 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE accreader;

-- =====================================
-- Core Tables
-- =====================================

-- Users table with authentication and role management
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'client', 'pmta_user') DEFAULT 'client',
  isActive BOOLEAN DEFAULT TRUE,
  passwordChangedAt DATETIME NULL,
  resetPasswordToken VARCHAR(255) NULL,
  resetPasswordExpires DATETIME NULL,
  
  -- MailWizz integration fields
  mailwizzCustomerId VARCHAR(255) NULL,
  mailwizzApiKey VARCHAR(255) NULL,
  
  -- PMTA access fields  
  pmtaAccess BOOLEAN DEFAULT FALSE,
  pmtaServers JSON NULL,
  
  -- Timestamps
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (isActive),
  INDEX idx_reset_token (resetPasswordToken)
) ENGINE=InnoDB;

-- =====================================
-- MailWizz Integration Tables
-- =====================================

-- MailWizz campaigns cache
CREATE TABLE mailwizz_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_uid VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  subject VARCHAR(500) NULL,
  type VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  from_name VARCHAR(255) NULL,
  from_email VARCHAR(255) NULL,
  reply_to VARCHAR(255) NULL,
  send_at DATETIME NULL,
  stats_data JSON NULL,
  campaign_data JSON NULL,
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_campaign_uid (campaign_uid),
  INDEX idx_status (status),
  INDEX idx_last_synced (last_synced)
) ENGINE=InnoDB;

-- Campaign assignments for multi-tenant access
CREATE TABLE campaign_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  campaign_uid VARCHAR(255) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_uid) REFERENCES mailwizz_campaigns(campaign_uid) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Unique constraint
  UNIQUE KEY unique_assignment (user_id, campaign_uid),
  
  -- Indexes
  INDEX idx_user_campaigns (user_id),
  INDEX idx_campaign_users (campaign_uid),
  INDEX idx_active_assignments (is_active)
) ENGINE=InnoDB;

-- Campaign statistics cache for performance
CREATE TABLE campaign_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_uid VARCHAR(255) NOT NULL,
  stats_type VARCHAR(100) NOT NULL, -- 'overview', 'bounces', 'opens', 'clicks', etc.
  stats_data JSON NOT NULL,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  
  -- Foreign keys
  FOREIGN KEY (campaign_uid) REFERENCES mailwizz_campaigns(campaign_uid) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_campaign_stats (campaign_uid, stats_type),
  INDEX idx_expiry (expires_at)
) ENGINE=InnoDB;

-- =====================================
-- PMTA Data Tables
-- =====================================

-- PMTA imported files tracking
CREATE TABLE pmta_imported_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NULL,
  file_size BIGINT NULL,
  record_count INT DEFAULT 0,
  import_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  imported_by INT NULL,
  import_started_at DATETIME NULL,
  import_completed_at DATETIME NULL,
  error_message TEXT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_filename (filename),
  INDEX idx_import_status (import_status),
  INDEX idx_imported_by (imported_by),
  INDEX idx_import_date (import_completed_at)
) ENGINE=InnoDB;

-- PMTA server connections for SSH import
CREATE TABLE pmta_servers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT DEFAULT 22,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(500) NULL, -- Encrypted
  log_path VARCHAR(500) DEFAULT '/var/log/pmta',
  log_pattern VARCHAR(255) DEFAULT 'acct-*.csv',
  is_active BOOLEAN DEFAULT TRUE,
  last_connection DATETIME NULL,
  connection_status ENUM('never_connected', 'connected', 'disconnected', 'error') DEFAULT 'never_connected',
  last_error TEXT NULL,
  created_by INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_host_port (host, port),
  INDEX idx_active (is_active),
  INDEX idx_status (connection_status)
) ENGINE=InnoDB;

-- =====================================
-- System Tables
-- =====================================

-- Application settings and configuration
CREATE TABLE app_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT NULL,
  is_public BOOLEAN DEFAULT FALSE, -- Whether setting can be accessed by non-admin users
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_setting_key (setting_key),
  INDEX idx_public (is_public)
) ENGINE=InnoDB;

-- Audit log for tracking important system events
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NULL, -- 'user', 'campaign', 'pmta_file', etc.
  resource_id VARCHAR(255) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_user_action (user_id, action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Session management (optional - for persistent sessions)
CREATE TABLE user_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  session_data TEXT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_sessions (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================
-- Initial Data Setup
-- =====================================

-- Create default admin user
-- Password: 'admin123' (hashed with bcrypt)
INSERT INTO users (name, email, password, role, isActive) VALUES 
('System Administrator', 'admin@accreader.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwdnJo/YKP1O2v6', 'admin', TRUE);

-- Insert default application settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', 'AccReader', 'string', 'Application name', TRUE),
('app_version', '1.0.0', 'string', 'Application version', TRUE),
('mailwizz_sync_interval', '3600', 'number', 'MailWizz sync interval in seconds', FALSE),
('pmta_import_enabled', 'true', 'boolean', 'Enable PMTA import functionality', FALSE),
('max_file_size', '52428800', 'number', 'Maximum file upload size in bytes (50MB)', FALSE),
('session_timeout', '86400', 'number', 'Session timeout in seconds (24 hours)', FALSE);

-- =====================================
-- Views for Common Queries
-- =====================================

-- Active users with their campaign counts
CREATE VIEW user_campaign_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.isActive,
    COUNT(DISTINCT ca.campaign_uid) as assigned_campaigns,
    u.createdAt
FROM users u
LEFT JOIN campaign_assignments ca ON u.id = ca.user_id AND ca.is_active = TRUE
WHERE u.isActive = TRUE
GROUP BY u.id, u.name, u.email, u.role, u.isActive, u.createdAt;

-- Recent PMTA imports summary
CREATE VIEW recent_pmta_imports AS
SELECT 
    pif.id,
    pif.filename,
    pif.record_count,
    pif.import_status,
    u.name as imported_by_name,
    pif.import_completed_at,
    pif.createdAt
FROM pmta_imported_files pif
LEFT JOIN users u ON pif.imported_by = u.id
ORDER BY pif.createdAt DESC;

-- Campaign performance overview
CREATE VIEW campaign_performance AS
SELECT 
    mc.campaign_uid,
    mc.name,
    mc.status,
    mc.type,
    mc.subject,
    mc.from_email,
    mc.send_at,
    COUNT(DISTINCT ca.user_id) as assigned_users,
    mc.last_synced,
    mc.createdAt
FROM mailwizz_campaigns mc
LEFT JOIN campaign_assignments ca ON mc.campaign_uid = ca.campaign_uid AND ca.is_active = TRUE
GROUP BY mc.campaign_uid, mc.name, mc.status, mc.type, mc.subject, mc.from_email, mc.send_at, mc.last_synced, mc.createdAt;

-- =====================================
-- Stored Procedures
-- =====================================

DELIMITER //

-- Procedure to clean up expired sessions
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    DELETE FROM campaign_stats WHERE expires_at < NOW();
END //

-- Procedure to get user dashboard data
CREATE PROCEDURE GetUserDashboard(IN user_id_param INT)
BEGIN
    -- User's assigned campaigns
    SELECT 
        mc.campaign_uid,
        mc.name,
        mc.status,
        mc.type,
        mc.subject,
        ca.assigned_at
    FROM campaign_assignments ca
    JOIN mailwizz_campaigns mc ON ca.campaign_uid = mc.campaign_uid
    WHERE ca.user_id = user_id_param AND ca.is_active = TRUE
    ORDER BY ca.assigned_at DESC;
    
    -- Recent activity count
    SELECT COUNT(*) as recent_activity_count
    FROM audit_logs 
    WHERE user_id = user_id_param 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
END //

DELIMITER ;

-- =====================================
-- Indexes for Performance
-- =====================================

-- Additional composite indexes for common queries
CREATE INDEX idx_user_role_active ON users(role, isActive);
CREATE INDEX idx_campaign_status_sync ON mailwizz_campaigns(status, last_synced);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_pmta_status_date ON pmta_imported_files(import_status, import_completed_at);

-- =====================================
-- Database Maintenance Events
-- =====================================

-- Create event to clean up old data (requires event scheduler to be enabled)
-- To enable: SET GLOBAL event_scheduler = ON;

DELIMITER //

CREATE EVENT IF NOT EXISTS cleanup_old_data
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Clean up expired sessions
    CALL CleanupExpiredSessions();
    
    -- Clean up old audit logs (keep 90 days)
    DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Clean up old failed PMTA imports (keep 30 days)
    DELETE FROM pmta_imported_files 
    WHERE import_status = 'failed' 
      AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
END //

DELIMITER ;

-- =====================================
-- Database Setup Complete
-- =====================================

-- Grant permissions (adjust as needed for your setup)
-- CREATE USER 'accreader_user'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON accreader.* TO 'accreader_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Display setup completion message
SELECT 'AccReader database setup completed successfully!' as message;
SELECT 'Database: accreader' as database_name;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'accreader';
SELECT 'Default admin user created: admin@accreader.com / admin123' as admin_info;
