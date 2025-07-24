const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const sequelize = require('./src/config/database');

async function createTestAdmin() {
  try {
    // Sync database
    await sequelize.sync();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@test.com' } });
    if (existingAdmin) {
      console.log('Test admin already exists: admin@test.com');
      return;
    }
    
    // Create test admin
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    
    console.log('Test admin created successfully:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    
    // Create test client
    const existingClient = await User.findOne({ where: { email: 'client@test.com' } });
    if (!existingClient) {
      const client = await User.create({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'client123',
        role: 'client',
        isActive: true
      });
      
      console.log('\nTest client created successfully:');
      console.log('Email: client@test.com');
      console.log('Password: client123');
      console.log('Role:', client.role);
    }
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();
