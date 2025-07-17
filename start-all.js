#!/usr/bin/env node

/**
 * Complete AccReader Application Startup Script
 * Starts all services in the correct order with health checks
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class AccReaderLauncher {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkServiceHealth(url, name, maxAttempts = 30) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await axios.get(url, { timeout: 5000 });
        this.log(`${name} is healthy`);
        return true;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.log(`${name} failed health check after ${maxAttempts} attempts`, 'error');
          return false;
        }
        await this.delay(2000); // Wait 2 seconds between attempts
      }
    }
    return false;
  }

  startProcess(name, command, args, cwd = process.cwd(), env = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Starting ${name}...`);

      const childProcess = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Store process reference
      this.processes.set(name, childProcess);

      // Handle output
      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${name}] ${output}`);
        }
      });

      childProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${name}] ${output}`);
        }
      });

      childProcess.on('error', (error) => {
        this.log(`${name} process error: ${error.message}`, 'error');
        reject(error);
      });

      childProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          this.log(`${name} exited with code ${code} and signal ${signal}`, 'warn');
        }
        this.processes.delete(name);
      });

      // Give the process a moment to start
      setTimeout(() => {
        if (childProcess.pid) {
          this.log(`${name} started with PID ${childProcess.pid}`);
          resolve(childProcess);
        } else {
          reject(new Error(`Failed to start ${name}`));
        }
      }, 1000);
    });
  }

  async startPMTAImportService() {
    try {
      await this.startProcess(
        'PMTA Import Service',
        'node',
        ['scripts/pmta-import.js'],
        path.resolve(__dirname, '..')
      );

      // Wait for service to be ready
      await this.delay(3000);

      // Health check
      const isHealthy = await this.checkServiceHealth(
        'http://localhost:3999/api/import-status',
        'PMTA Import Service'
      );

      if (!isHealthy) {
        throw new Error('PMTA Import Service failed health check');
      }

      return true;
    } catch (error) {
      this.log(`Failed to start PMTA Import Service: ${error.message}`, 'error');
      throw error;
    }
  }

  async startBackendServer() {
    try {
      await this.startProcess(
        'Backend Server',
        'node',
        ['server.js'],
        path.resolve(__dirname, '..', 'server')
      );

      // Wait for service to be ready
      await this.delay(3000);

      // Health check
      const isHealthy = await this.checkServiceHealth(
        'http://localhost:4000/health',
        'Backend Server'
      );

      if (!isHealthy) {
        throw new Error('Backend Server failed health check');
      }

      return true;
    } catch (error) {
      this.log(`Failed to start Backend Server: ${error.message}`, 'error');
      throw error;
    }
  }

  async startFrontend() {
    try {
      await this.startProcess(
        'Frontend',
        'npm',
        ['run', 'dev'],
        path.resolve(__dirname, '..')
      );

      // Wait for service to be ready
      await this.delay(5000);

      // Health check
      const isHealthy = await this.checkServiceHealth(
        'http://localhost:5173',
        'Frontend'
      );

      if (!isHealthy) {
        throw new Error('Frontend failed health check');
      }

      return true;
    } catch (error) {
      this.log(`Failed to start Frontend: ${error.message}`, 'error');
      throw error;
    }
  }

  async testIntegration() {
    try {
      this.log('Testing service integration...');

      // Test Backend to PMTA Import Service integration
      const integrationHealth = await axios.get('http://localhost:4000/api/pmta/integration/health', {
        timeout: 10000
      });

      if (integrationHealth.data.status === 'success') {
        this.log('Service integration test passed');
        return true;
      } else {
        this.log('Service integration test failed', 'warn');
        return false;
      }
    } catch (error) {
      this.log(`Integration test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.log('Shutting down all services...');

    // Kill all child processes
    for (const [name, process] of this.processes) {
      this.log(`Stopping ${name}...`);
      try {
        process.kill('SIGTERM');
        
        // Give it 5 seconds to shut down gracefully
        setTimeout(() => {
          if (!process.killed) {
            this.log(`Force killing ${name}...`, 'warn');
            process.kill('SIGKILL');
          }
        }, 5000);
      } catch (error) {
        this.log(`Error stopping ${name}: ${error.message}`, 'error');
      }
    }

    // Wait a bit for processes to clean up
    await this.delay(2000);
    this.log('Shutdown complete');
    process.exit(0);
  }

  async start() {
    try {
      this.log('🚀 Starting AccReader Application Suite...');

      // Step 1: Start PMTA Import Service
      this.log('Step 1: Starting PMTA Import Service...');
      await this.startPMTAImportService();

      // Step 2: Start Backend Server
      this.log('Step 2: Starting Backend Server...');
      await this.startBackendServer();

      // Step 3: Test Integration
      this.log('Step 3: Testing service integration...');
      await this.testIntegration();

      // Step 4: Start Frontend
      this.log('Step 4: Starting Frontend...');
      await this.startFrontend();

      this.log('🎉 All services started successfully!');
      this.log('');
      this.log('📋 Service URLs:');
      this.log('   Frontend:           http://localhost:5173');
      this.log('   Backend API:        http://localhost:4000');
      this.log('   API Documentation:  http://localhost:4000/api-docs');
      this.log('   PMTA Import API:    http://localhost:3999');
      this.log('');
      this.log('🔧 Integration Endpoints:');
      this.log('   Health Check:       http://localhost:4000/api/pmta/integration/health');
      this.log('   Import Status:      http://localhost:4000/api/pmta/integration/status');
      this.log('   Import Data:        http://localhost:4000/api/pmta/integration/data');
      this.log('');
      this.log('Press Ctrl+C to stop all services');

    } catch (error) {
      this.log(`Failed to start application: ${error.message}`, 'error');
      await this.shutdown();
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
const launcher = new AccReaderLauncher();

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  await launcher.shutdown();
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  await launcher.shutdown();
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await launcher.shutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await launcher.shutdown();
  process.exit(1);
});

// Start the application
launcher.start().catch(async (error) => {
  console.error('💥 Failed to start application:', error);
  await launcher.shutdown();
  process.exit(1);
});
