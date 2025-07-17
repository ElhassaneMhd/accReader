#!/usr/bin/env node

/**
 * Simple integration test script
 */

import axios from 'axios';

async function testIntegration() {
  try {
    console.log('🧪 Testing AccReader Integration...\n');

    // Test 1: Backend API Root
    console.log('📡 Test 1: Backend API Root');
    try {
      const response = await axios.get('http://localhost:4000/');
      console.log('✅ Backend API is responding');
      console.log(`   Endpoints: ${Object.keys(response.data.endpoints).join(', ')}`);
      console.log(`   Services: ${Object.keys(response.data.services || {}).join(', ')}`);
    } catch (error) {
      console.log('❌ Backend API failed:', error.message);
    }

    console.log('');

    // Test 2: PMTA Import Service
    console.log('📡 Test 2: PMTA Import Service');
    try {
      const response = await axios.get('http://localhost:3999/api/import-status');
      console.log('✅ PMTA Import Service is responding');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Total Records: ${response.data.totalRecords || 0}`);
    } catch (error) {
      console.log('❌ PMTA Import Service failed:', error.message);
    }

    console.log('');

    // Test 3: Integration Health (without auth)
    console.log('📡 Test 3: Integration Health Check');
    try {
      const response = await axios.get('http://localhost:4000/health');
      console.log('✅ Backend health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Environment: ${response.data.environment}`);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }

    console.log('');

    // Test 4: API Documentation
    console.log('📡 Test 4: API Documentation');
    try {
      const response = await axios.get('http://localhost:4000/api-docs/');
      if (response.status === 200) {
        console.log('✅ API Documentation is accessible');
        console.log('   URL: http://localhost:4000/api-docs/');
      }
    } catch (error) {
      console.log('❌ API Documentation failed:', error.message);
    }

    console.log('');
    console.log('🎉 Integration test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   Frontend (if running):    http://localhost:5173');
    console.log('   Backend API:              http://localhost:4000');
    console.log('   PMTA Import Service:      http://localhost:3999');
    console.log('   API Documentation:        http://localhost:4000/api-docs');
    console.log('');
    console.log('🔗 Integration endpoints:');
    console.log('   /api/pmta/integration/*   (requires authentication)');

  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
    process.exit(1);
  }
}

testIntegration();
