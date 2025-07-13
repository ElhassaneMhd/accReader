#!/usr/bin/env node

import process from "process";
import { NodeSSH } from "node-ssh";
import net from "net";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const CONFIG = {
  pmta: {
    host: process.env.PMTA_HOST || "91.229.239.75",
    port: parseInt(process.env.PMTA_PORT) || 2525,
    username: process.env.PMTA_USERNAME || "root",
    password: process.env.PMTA_PASSWORD || "Australia@!?0",
  },
};

console.log("🧪 SSH Connection Test Script");
console.log("===============================");

// Test 1: Basic network connectivity
async function testNetworkConnectivity() {
  console.log("\n📡 Test 1: Network Connectivity");
  console.log("--------------------------------");

  try {
    const socket = new net.Socket();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        console.log("❌ FAILED: Connection timeout (10s)");
        console.log("   → Server may not be reachable");
        resolve(false);
      }, 10000);

      socket.connect(CONFIG.pmta.port, CONFIG.pmta.host, () => {
        clearTimeout(timeout);
        console.log("✅ SUCCESS: TCP connection established");
        console.log(
          `   → Server ${CONFIG.pmta.host}:${CONFIG.pmta.port} is reachable`
        );
        socket.destroy();
        resolve(true);
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        console.log(`❌ FAILED: ${err.message}`);
        console.log("   → Check server availability and firewall settings");
        resolve(false);
      });
    });
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return false;
  }
}

// Test 2: SSH Connection with minimal settings
async function testBasicSSH() {
  console.log("\n🔐 Test 2: Basic SSH Connection");
  console.log("--------------------------------");

  const ssh = new NodeSSH();

  try {
    console.log(
      `Attempting connection to: ${CONFIG.pmta.username}@${CONFIG.pmta.host}:${CONFIG.pmta.port}`
    );

    await ssh.connect({
      host: CONFIG.pmta.host,
      port: CONFIG.pmta.port,
      username: CONFIG.pmta.username,
      password: CONFIG.pmta.password,
      readyTimeout: 15000,
      debug: console.log,
    });

    console.log("✅ SUCCESS: SSH connection established");

    // Test command execution
    const result = await ssh.execCommand("whoami");
    console.log(`   → Current user: ${result.stdout}`);

    await ssh.dispose();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);

    if (error.message.includes("authentication")) {
      console.log("   💡 Authentication issue detected:");
      console.log("      - Check username and password");
      console.log("      - Verify password authentication is enabled");
      console.log(
        "      - Try: ssh -o PreferredAuthentications=password root@91.229.239.75"
      );
    } else if (error.message.includes("timeout")) {
      console.log("   💡 Timeout issue detected:");
      console.log("      - Server may be slow to respond");
      console.log("      - Check network latency");
    }

    await ssh.dispose();
    return false;
  }
}

// Test 3: SSH with different authentication methods
async function testEnhancedSSH() {
  console.log("\n🔧 Test 3: Enhanced SSH Configuration");
  console.log("--------------------------------------");

  const ssh = new NodeSSH();

  try {
    const config = {
      host: CONFIG.pmta.host,
      port: CONFIG.pmta.port,
      username: CONFIG.pmta.username,
      password: CONFIG.pmta.password,
      readyTimeout: 30000,
      tryKeyboard: true,
      algorithms: {
        kex: [
          "diffie-hellman-group14-sha256",
          "diffie-hellman-group1-sha1",
          "diffie-hellman-group14-sha1",
        ],
        cipher: [
          "aes128-ctr",
          "aes192-ctr",
          "aes256-ctr",
          "aes128-cbc",
          "aes192-cbc",
          "aes256-cbc",
        ],
        serverHostKey: ["ssh-rsa", "ssh-dss"],
        hmac: ["hmac-sha2-256", "hmac-sha2-512", "hmac-sha1"],
      },
    };

    console.log("Attempting enhanced SSH connection...");
    await ssh.connect(config);

    console.log("✅ SUCCESS: Enhanced SSH connection established");

    // Test multiple commands
    const commands = ["pwd", "ls -la", "date"];
    for (const cmd of commands) {
      const result = await ssh.execCommand(cmd);
      console.log(`   → ${cmd}: ${result.stdout.trim()}`);
    }

    await ssh.dispose();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    await ssh.dispose();
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`Testing connection to: ${CONFIG.pmta.host}:${CONFIG.pmta.port}`);
  console.log(`Username: ${CONFIG.pmta.username}`);
  console.log(`Password: ${"*".repeat(CONFIG.pmta.password.length)}`);

  const test1 = await testNetworkConnectivity();

  if (test1) {
    const test2 = await testBasicSSH();
    if (!test2) {
      await testEnhancedSSH();
    }
  }

  console.log("\n📋 Test Summary");
  console.log("================");
  console.log("If all tests failed, please check:");
  console.log("1. Server is online and accessible");
  console.log("2. SSH service is running on port 22");
  console.log("3. Username and password are correct");
  console.log("4. Firewall allows SSH connections");
  console.log("5. Try manual connection: ssh root@91.229.239.75");
}

runAllTests().catch(console.error);
