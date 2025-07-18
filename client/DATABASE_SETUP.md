# 🗄️ AccReader Database Setup Guide

## Quick Setup

### 1. **Automatic Setup (Recommended)**

```bash
# Install MySQL2 dependency for the setup script
npm install mysql2

# Run the automated setup
node setup-database.cjs setup
```

### 2. **Manual Setup**

```bash
# Connect to MySQL
mysql -u root -p

# Run the setup script
source database-setup.sql

# Or copy-paste the content from database-setup.sql
```

## 📋 Database Schema Overview

### **Core Tables**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User authentication & management | `id`, `email`, `role`, `pmtaAccess` |
| `mailwizz_campaigns` | MailWizz campaign cache | `campaign_uid`, `name`, `status` |
| `campaign_assignments` | User-campaign relationships | `user_id`, `campaign_uid` |
| `pmta_imported_files` | PMTA import tracking | `filename`, `record_count`, `import_status` |

### **User Roles**

- **`admin`** - Full system access, user management
- **`client`** - MailWizz campaigns access
- **`pmta_user`** - PMTA import functionality

### **Default Admin Account**

- **Email:** `admin@accreader.com`
- **Password:** `admin123` 
- **⚠️ Change this password immediately after setup!**

## 🔧 Configuration

### **Environment Variables (.env)**

```env
# Database Configuration
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=accreader
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
```

### **MySQL User Setup (Optional)**

```sql
-- Create dedicated user for AccReader
CREATE USER 'accreader_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON accreader.* TO 'accreader_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🚀 Verification Steps

### **1. Test Database Connection**
```bash
node setup-database.cjs test
```

### **2. Check Tables Created**
```sql
USE accreader;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### **3. Verify Backend Connection**
```bash
cd server
npm start
# Should show: "Database connection established successfully"
```

## 📊 Database Features

### **Performance Optimizations**
- ✅ Proper indexes on frequently queried columns
- ✅ Composite indexes for complex queries
- ✅ JSON columns for flexible data storage
- ✅ Views for common dashboard queries

### **Data Management**
- ✅ Automated cleanup of expired sessions
- ✅ Audit logging for security tracking
- ✅ Soft deletes with foreign key constraints
- ✅ Timestamp tracking on all records

### **Security Features**
- ✅ Encrypted password storage (bcrypt)
- ✅ Session management
- ✅ Role-based access control
- ✅ Audit trail for sensitive operations

## 🛠️ Common Operations

### **Create New User**
```sql
INSERT INTO users (name, email, password, role) 
VALUES ('John Doe', 'john@example.com', '$2a$12$...', 'client');
```

### **Assign Campaign to User**
```sql
INSERT INTO campaign_assignments (user_id, campaign_uid) 
VALUES (2, 'campaign_uid_here');
```

### **Check PMTA Import Status**
```sql
SELECT filename, record_count, import_status, import_completed_at 
FROM pmta_imported_files 
ORDER BY createdAt DESC 
LIMIT 10;
```

### **View User Dashboard Data**
```sql
CALL GetUserDashboard(2); -- Replace 2 with actual user ID
```

## 🔍 Troubleshooting

### **Connection Issues**
```bash
# Test MySQL connection
mysql -h localhost -u root -p

# Check MySQL service status
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS
net start mysql  # Windows
```

### **Permission Issues**
```sql
-- Grant additional privileges if needed
GRANT ALL PRIVILEGES ON accreader.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### **Reset Admin Password**
```sql
-- Generate new password hash first (use bcrypt online tool or Node.js)
UPDATE users 
SET password = '$2a$12$new_hashed_password_here' 
WHERE email = 'admin@accreader.com';
```

## 📈 Maintenance

### **Enable Automatic Cleanup**
```sql
-- Enable event scheduler for automated maintenance
SET GLOBAL event_scheduler = ON;

-- Verify cleanup event is active
SHOW EVENTS;
```

### **Manual Cleanup**
```sql
-- Clean expired sessions
CALL CleanupExpiredSessions();

-- Remove old audit logs (90+ days)
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### **Backup Database**
```bash
# Create backup
mysqldump -u root -p accreader > accreader_backup.sql

# Restore from backup
mysql -u root -p accreader < accreader_backup.sql
```

## 🎯 Next Steps After Setup

1. **Security**: Change default admin password
2. **Configuration**: Update MailWizz API credentials
3. **Users**: Create additional user accounts
4. **PMTA**: Configure SSH server connections
5. **Testing**: Verify all application features work
6. **Monitoring**: Set up database monitoring and backups

---

## 📞 Support

If you encounter issues:

1. Check the setup script output for specific error messages
2. Verify MySQL server is running and accessible
3. Ensure user has sufficient database privileges
4. Review the application logs for detailed error information
5. Test the database connection independently of the application
