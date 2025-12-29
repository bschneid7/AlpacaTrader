#!/usr/bin/env node

/**
 * AlpacaTrader Health Check Module (Enhanced)
 * This script runs from your local MacOS Terminal to check the status of your 
 * trading bot deployed on 146.190.132.152.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVER_IP = '146.190.132.152';
const CONFIG_FILE = path.join(__dirname, '.health-check-auth.json');

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m"
};

function printHeader() {
  console.log(`\n${colors.bright}${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}       ALPACATRADER BOT - ENHANCED HEALTH CHECK${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Time:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.cyan}Server:${colors.reset} ${SERVER_IP}`);
  console.log(`${colors.cyan}Bot Type:${colors.reset} Enhanced (EMA/ATR Strategy)`);
  console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function saveAuth(token) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }));
}

function loadAuth() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE)).token;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function request(url, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      method,
      rejectUnauthorized: false,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsedData = data;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          data: parsedData,
          ok: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        ok: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login() {
  console.log(`${colors.yellow}Authentication required to view holdings.${colors.reset}`);
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = await new Promise(resolve => readline.question('Email: ', resolve));
  const password = await new Promise(resolve => {
    // Simple way to hide password in terminal
    process.stdout.write('Password: ');
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.pause();
          break;
        default:
          process.stdout.write("\x1b[2K\x1b[200DPassword: " + Array(readline.line.length + 1).join("*"));
          break;
      }
    });
    readline.question('', resolve);
  });
  readline.close();

  const res = await request(`https://${SERVER_IP}/api/auth/login`, 'POST', { email, password });
  if (res.ok && res.data.token) {
    saveAuth(res.data.token);
    console.log(`${colors.green}✅ Login successful!${colors.reset}\n`);
    return res.data.token;
  } else {
    console.log(`${colors.red}❌ Login failed: ${res.data.message || 'Invalid credentials'}${colors.reset}\n`);
    return null;
  }
}

async function runHealthCheck() {
  printHeader();

  console.log(`${colors.bright}Checking Services...${colors.reset}`);
  
  // 1. Check Frontend/Nginx
  const frontendCheck = await request(`https://${SERVER_IP}/`);
  if (frontendCheck.ok) {
    console.log(`${colors.green}✅ Frontend/Nginx:${colors.reset} Online (Status ${frontendCheck.statusCode})`);
  } else {
    console.log(`${colors.red}❌ Frontend/Nginx:${colors.reset} Offline or Unreachable (${frontendCheck.error || frontendCheck.statusCode})`);
  }

  // 2. Check Backend API
  const apiCheck = await request(`https://${SERVER_IP}/api/auth/me`);
  if (apiCheck.ok || apiCheck.statusCode === 401) {
    console.log(`${colors.green}✅ Backend API:${colors.reset} Online (Status ${apiCheck.statusCode})`);
  } else {
    console.log(`${colors.red}❌ Backend API:${colors.reset} Offline or Returning Error (${apiCheck.error || apiCheck.statusCode})`);
  }

  if (!frontendCheck.ok || (apiCheck.statusCode !== 200 && apiCheck.statusCode !== 401)) {
    console.log(`\n${colors.red}${colors.bright}❌ BOT HAS CRITICAL ISSUES - CHECK SERVER LOGS${colors.reset}`);
    console.log(`\n${colors.cyan}Troubleshooting Command:${colors.reset}`);
    console.log(`ssh bryan@${SERVER_IP} "cd ~/AlpacaTrader && docker-compose logs --tail 50 server"`);
    console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
    return;
  }

  // 3. Get Detailed Summary (Requires Auth)
  let token = loadAuth();
  let summaryRes = await request(`https://${SERVER_IP}/api/monitoring/health-summary`, 'GET', null, token);

  if (summaryRes.statusCode === 401) {
    token = await login();
    if (token) {
      summaryRes = await request(`https://${SERVER_IP}/api/monitoring/health-summary`, 'GET', null, token);
    }
  }

  if (summaryRes.ok) {
    const s = summaryRes.data;
    
    console.log(`\n${colors.bright}Trading Status:${colors.reset}`);
    const statusColor = s.trading.enabled ? colors.green : colors.yellow;
    console.log(`${colors.cyan}Auto-Trading:${colors.reset} ${statusColor}${s.trading.enabled ? 'ENABLED' : 'DISABLED'}${colors.reset}`);
    console.log(`${colors.cyan}Engine Status:${colors.reset} ${s.trading.status.toUpperCase()}`);
    
    if (s.account) {
      console.log(`\n${colors.bright}Account Overview:${colors.reset}`);
      console.log(`${colors.cyan}Portfolio Value:${colors.reset} $${s.account.portfolioValue.toLocaleString()}`);
      const plColor = s.account.todayPL >= 0 ? colors.green : colors.red;
      console.log(`${colors.cyan}Today's P&L:${colors.reset} ${plColor}$${s.account.todayPL.toLocaleString()} (${s.account.todayPLPercent.toFixed(2)}%)${colors.reset}`);
      console.log(`${colors.cyan}Buying Power:${colors.reset} $${s.account.buyingPower.toLocaleString()}`);
    }

    console.log(`\n${colors.bright}Current Holdings:${colors.reset}`);
    if (s.holdings && s.holdings.length > 0) {
      console.log(`${colors.gray}Symbol    Qty      Price      Value      P&L%${colors.reset}`);
      s.holdings.forEach(h => {
        const plColor = h.unrealizedPL >= 0 ? colors.green : colors.red;
        const symbol = h.symbol.padEnd(10);
        const qty = h.quantity.toString().padEnd(8);
        const price = `$${h.currentPrice.toFixed(2)}`.padEnd(10);
        const value = `$${h.positionSize.toLocaleString()}`.padEnd(11);
        const pl = `${plColor}${h.unrealizedPLPercent.toFixed(2)}%${colors.reset}`;
        console.log(`${symbol}${qty}${price}${value}${pl}`);
      });
    } else {
      console.log(`${colors.gray}No open positions.${colors.reset}`);
    }

    if (s.recentAlerts && s.recentAlerts.length > 0) {
      console.log(`\n${colors.bright}Recent Alerts:${colors.reset}`);
      s.recentAlerts.forEach(a => {
        const typeColor = a.type === 'critical' ? colors.red : (a.type === 'warning' ? colors.yellow : colors.cyan);
        console.log(`${typeColor}[${a.type.toUpperCase()}]${colors.reset} ${a.title}: ${a.message}`);
      });
    }
  } else {
    console.log(`\n${colors.yellow}Note: Could not fetch detailed account info (${summaryRes.statusCode}).${colors.reset}`);
  }

  console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runHealthCheck();
