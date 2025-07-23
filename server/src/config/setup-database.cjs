#!/usr/bin/env node

/**
 * Database Setup and Migration Script for AccReader
 * This script helps set up the MySQL database for production use
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'accreader',
  multipleStatements: true
};

const SETUP_CONFIG = {
  ...DB_CONFIG,
  database: undefined // Don't specify database for initial setup
};

async function createDatabase() {
  console.log('📊 Setting up AccReader MySQL Database...\n');
  
  let connection;
  
  try {
    // Connect without specifying database
    console.log('🔌 Connecting to MySQL server...');
    connection = await mysql.createConnection(SETUP_CONFIG);
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log(`🏗️  Creating database '${DB_CONFIG.database}'...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${DB_CONFIG.database}' created/verified`);
    
    // Switch to the new database
    await connection.execute(`USE \`${DB_CONFIG.database}\``);
    
    // Read and execute the SQL setup script
    console.log('📋 Reading database setup script...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
    
    console.log('⚙️  Executing database setup...');
    await connection.execute(sqlScript);
    
    console.log('✅ Database setup completed successfully!\n');
    
    // Display summary
    const [tableResults] = await connection.execute(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [DB_CONFIG.database]);
    
    const [userResults] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
    
    console.log('📊 Setup Summary:');
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   Tables Created: ${tableResults[0].table_count}`);
    console.log(`   Initial Users: ${userResults[0].user_count}`);
    console.log(`   Default Admin: admin@accreader.com / admin123`);
    console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}\n`);
    
    console.log('🚀 Next Steps:');
    console.log('1. Update your .env file with the database connection details');
    console.log('2. Change the default admin password');
    console.log('3. Create additional users as needed');
    console.log('4. Configure MailWizz API settings');
    console.log('5. Set up PMTA server connections\n');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Please check:');
      console.log('   - MySQL username and password are correct');
      console.log('   - User has sufficient privileges to create databases');
      console.log('   - MySQL server is running and accessible');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Please check:');
      console.log('   - MySQL server is running');
      console.log('   - Host and port are correct');
      console.log('   - Firewall allows connections');
    }
    
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function testConnection() {
  console.log('🧪 Testing database connection...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Successfully connected to database');
    
    // Test basic operations
    const [results] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Database accessible - ${results[0].count} users found`);
    
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [DB_CONFIG.database]);
    
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table.table_name}`));
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateEnvFile() {
  const envPath = path.join(__dirname, 'server', '.env');
  const envExamplePath = path.join(__dirname, 'server', '.env.example');
  
  console.log('📝 Updating environment configuration...\n');
  
  try {
    // Check if .env exists
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env file');
    } else if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      console.log('✅ Using .env.example as template');
    } else {
      console.log('⚠️  No .env file found, creating basic configuration');
    }
    
    // Update database configuration
    const dbUpdates = {
      'NODE_ENV': 'production',
      'DB_DIALECT': 'mysql',
      'DB_HOST': DB_CONFIG.host,
      'DB_PORT': DB_CONFIG.port,
      'DB_NAME': DB_CONFIG.database,
      'DB_USER': DB_CONFIG.user,
      'DB_PASSWORD': DB_CONFIG.password
    };
    
    Object.entries(dbUpdates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file updated');
    
  } catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await createDatabase();
      await updateEnvFile();
      break;
      
    case 'test':
      await testConnection();
      break;
      
    case 'env':
      await updateEnvFile();
      break;
      
    default:
      console.log('🗄️  AccReader Database Setup Tool\n');
      console.log('Usage:');
      console.log('  node setup-database.cjs setup  - Create database and tables');
      console.log('  node setup-database.cjs test   - Test database connection');
      console.log('  node setup-database.cjs env    - Update .env file\n');
      console.log('Environment variables:');
      console.log('  DB_HOST     - MySQL host (default: localhost)');
      console.log('  DB_PORT     - MySQL port (default: 3306)');
      console.log('  DB_USER     - MySQL username (default: root)');
      console.log('  DB_PASSWORD - MySQL password (default: empty)');
      console.log('  DB_NAME     - Database name (default: accreader)\n');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createDatabase, testConnection, updateEnvFile };
