import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:4000/api/auth/signup';
const ADMIN_USER = {
  name: 'Administrator',
  email: 'admin@example.com',
  password: 'Admin123456',
  role: 'admin'
};

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const response = await axios.post(API_URL, ADMIN_USER);
    
    if (response.data.status === 'success') {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', ADMIN_USER.email);
      console.log('🔑 Password:', ADMIN_USER.password);
      console.log('🔗 Login URL: http://localhost:5173/login');
      console.log('\nSteps to access the dashboard:');
      console.log('1. Go to http://localhost:5173/login');
      console.log('2. Select "Admin Portal" tab');
      console.log('3. Use the credentials above');
    } else {
      console.error('❌ Failed to create admin user:', response.data);
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  Admin user already exists!');
      console.log('📧 Email:', ADMIN_USER.email);
      console.log('🔑 Password:', ADMIN_USER.password);
      console.log('🔗 Login URL: http://localhost:5173/login');
    } else {
      console.error('❌ Error creating admin user:', error.response?.data || error.message);
      console.error('⚠️  Make sure the backend server is running on port 4000');
    }
  }
}

createAdminUser();
