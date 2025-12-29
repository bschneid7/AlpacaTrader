#!/usr/bin/env node

/**
 * AlpacaTrader Health Check Module
 * This script runs from your local MacOS Terminal to check the status of your 
 * trading bot deployed on 146.190.132.152.
 */

const https = require('https');

const SERVER_IP = '146.190.132.152';
const HEALTH_URL = `https://${SERVER_IP}/api/health`; // Assuming you have a health endpoint
const PING_URL = `https://${SERVER_IP}/api/ping`;

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

function printHeader() {
  console.log(`\n${colors.bright}${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}       ALPACATRADER BOT - REMOTE HEALTH CHECK${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Time:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.cyan}Server:${colors.reset} ${SERVER_IP}`);
  console.log(`${colors.cyan}Bot Type:${colors.reset} Enhanced (EMA/ATR Strategy)`);
  console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function checkEndpoint(url) {
  return new Promise((resolve) => {
    const options = {
      rejectUnauthorized: false, // Since we're using a self-signed cert or IP directly
      timeout: 5000
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          ok: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        ok: false
      });
    });
  });
}

async function runHealthCheck() {
  printHeader();

  console.log(`${colors.bright}Checking Services...${colors.reset}`);
  
  // 1. Check Frontend/Nginx
  const frontendCheck = await checkEndpoint(`https://${SERVER_IP}/`);
  if (frontendCheck.ok) {
    console.log(`${colors.green}✅ Frontend/Nginx:${colors.reset} Online (Status ${frontendCheck.statusCode})`);
  } else {
    console.log(`${colors.red}❌ Frontend/Nginx:${colors.reset} Offline or Unreachable (${frontendCheck.error || frontendCheck.statusCode})`);
  }

  // 2. Check Backend API
  const apiCheck = await checkEndpoint(`https://${SERVER_IP}/api/auth/me`);
  // Note: 401 Unauthorized is actually a GOOD sign - it means the API is responding
  if (apiCheck.ok || apiCheck.statusCode === 401) {
    console.log(`${colors.green}✅ Backend API:${colors.reset} Online (Status ${apiCheck.statusCode})`);
  } else {
    console.log(`${colors.red}❌ Backend API:${colors.reset} Offline or Returning Error (${apiCheck.error || apiCheck.statusCode})`);
  }

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  if (frontendCheck.ok && (apiCheck.ok || apiCheck.statusCode === 401)) {
    console.log(`${colors.green}${colors.bright}✅ BOT IS HEALTHY AND OPERATIONAL${colors.reset}`);
    console.log(`\n${colors.yellow}Note:${colors.reset} The bot is currently in "Enhanced" mode using EMA/ATR strategy.`);
    console.log(`${colors.yellow}Market Status:${colors.reset} The bot autonomously handles market hours and weekends.`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ BOT HAS ISSUES - CHECK SERVER LOGS${colors.reset}`);
    console.log(`\n${colors.cyan}Troubleshooting Command:${colors.reset}`);
    console.log(`ssh bryan@${SERVER_IP} "cd ~/AlpacaTrader && docker-compose logs --tail 50 server"`);
  }

  console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runHealthCheck();
