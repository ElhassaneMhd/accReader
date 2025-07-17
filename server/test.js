console.log('Testing Node.js...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

try {
  require('dotenv').config();
  console.log('dotenv loaded successfully');
  console.log('Environment:', process.env.NODE_ENV);
} catch (error) {
  console.error('Error loading dotenv:', error.message);
}

try {
  const express = require('express');
  console.log('Express loaded successfully');
} catch (error) {
  console.error('Error loading express:', error.message);
}
