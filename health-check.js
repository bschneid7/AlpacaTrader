#!/usr/bin/env node

/**
 * AlpacaTrader Health Check Module (Enhanced)
 * 
 * Usage:
 *   node health-check.js                     # Uses saved credentials or shows basic health
 *   node health-check.js --login EMAIL PASS  # Login and save credentials
 *   node health-check.js --logout            # Clear saved credentials
 * 
 * Server: 146.190.132.152
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
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }, null, 2));
  } catch (e) {
    console.log(`${colors.yellow}Warning: Could not save auth token.${colors.reset}`);
  }
}

function loadAuth() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')).token;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function clearAuth() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    console.log(`${colors.green}✅ Credentials cleared.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}No saved credentials found.${colors.reset}`);
  }
}

function request(url, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
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

    const req = https.request(options, (res) => {
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

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Request timed out',
        ok: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(email, password) {
  console.log(`${colors.cyan}Logging in as ${email}...${colors.reset}`);
  const res = await request(`https://${SERVER_IP}/api/auth/login`, 'POST', { email, password });
  if (res.ok && res.data.accessToken) {
    saveAuth(res.data.accessToken);
    console.log(`${colors.green}✅ Login successful! Credentials saved.${colors.reset}\n`);
    return res.data.accessToken;
  } else {
    console.log(`${colors.red}❌ Login failed: ${res.data?.message || 'Invalid credentials'}${colors.reset}`);
    return null;
  }
}

async function runHealthCheck(token) {
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
  if (!token) {
    console.log(`\n${colors.yellow}To view holdings and account details, login first:${colors.reset}`);
    console.log(`${colors.cyan}node health-check.js --login bryan@trader.local TradingBot2024!${colors.reset}`);
    console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
    return;
  }

  const summaryRes = await request(`https://${SERVER_IP}/api/monitoring/health-summary`, 'GET', null, token);

  if (summaryRes.statusCode === 401) {
    console.log(`\n${colors.yellow}Session expired. Please login again:${colors.reset}`);
    console.log(`${colors.cyan}node health-check.js --login bryan@trader.local TradingBot2024!${colors.reset}`);
    clearAuth();
    console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
    return;
  }

  if (summaryRes.statusCode === 404) {
    console.log(`\n${colors.yellow}Note: Health summary endpoint not found (404).${colors.reset}`);
    console.log(`${colors.yellow}Please update the server:${colors.reset}`);
    console.log(`${colors.cyan}ssh bryan@${SERVER_IP} "cd ~/AlpacaTrader && git pull origin main && docker-compose up -d --build server"${colors.reset}`);
    console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
    return;
  }

  if (summaryRes.ok) {
    const s = summaryRes.data;
    
    console.log(`\n${colors.bright}Trading Status:${colors.reset}`);
    if (s.trading) {
      const statusColor = s.trading.enabled ? colors.green : colors.yellow;
      console.log(`${colors.cyan}Auto-Trading:${colors.reset} ${statusColor}${s.trading.enabled ? 'ENABLED' : 'DISABLED'}${colors.reset}`);
      console.log(`${colors.cyan}Engine Status:${colors.reset} ${(s.trading.status || 'unknown').toUpperCase()}`);
    }
    
    if (s.account) {
      console.log(`\n${colors.bright}Account Overview:${colors.reset}`);
      console.log(`${colors.cyan}Portfolio Value:${colors.reset} $${Number(s.account.portfolioValue || 0).toLocaleString()}`);
      const plColor = (s.account.todayPL || 0) >= 0 ? colors.green : colors.red;
      console.log(`${colors.cyan}Today's P&L:${colors.reset} ${plColor}$${Number(s.account.todayPL || 0).toLocaleString()} (${(s.account.todayPLPercent || 0).toFixed(2)}%)${colors.reset}`);
      console.log(`${colors.cyan}Buying Power:${colors.reset} $${Number(s.account.buyingPower || 0).toLocaleString()}`);
    }

    console.log(`\n${colors.bright}Current Holdings:${colors.reset}`);
    if (s.holdings && s.holdings.length > 0) {
      console.log(`${colors.gray}Symbol    Qty      Price      Value      P&L%${colors.reset}`);
      s.holdings.forEach(h => {
        const plColor = (h.unrealizedPL || 0) >= 0 ? colors.green : colors.red;
        const symbol = (h.symbol || '').padEnd(10);
        const qty = String(h.quantity || 0).padEnd(8);
        const price = `$${(h.currentPrice || 0).toFixed(2)}`.padEnd(10);
        const value = `$${Number(h.positionSize || 0).toLocaleString()}`.padEnd(11);
        const pl = `${plColor}${(h.unrealizedPLPercent || 0).toFixed(2)}%${colors.reset}`;
        console.log(`${symbol}${qty}${price}${value}${pl}`);
      });
    } else {
      console.log(`${colors.gray}No open positions.${colors.reset}`);
    }

    if (s.recentAlerts && s.recentAlerts.length > 0) {
      console.log(`\n${colors.bright}Recent Alerts:${colors.reset}`);
      s.recentAlerts.forEach(a => {
        const typeColor = a.type === 'critical' ? colors.red : (a.type === 'warning' ? colors.yellow : colors.cyan);
        console.log(`${typeColor}[${(a.type || 'info').toUpperCase()}]${colors.reset} ${a.title || ''}: ${a.message || ''}`);
      });
    }
  } else {
    console.log(`\n${colors.yellow}Note: Could not fetch detailed account info (${summaryRes.statusCode}).${colors.reset}`);
  }

  console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--logout') {
    clearAuth();
    return;
  }

  if (args[0] === '--login') {
    const email = args[1];
    const password = args[2];
    if (!email || !password) {
      console.log(`${colors.red}Usage: node health-check.js --login EMAIL PASSWORD${colors.reset}`);
      console.log(`${colors.cyan}Example: node health-check.js --login bryan@trader.local TradingBot2024!${colors.reset}`);
      return;
    }
    const token = await login(email, password);
    if (token) {
      await runHealthCheck(token);
    }
    return;
  }

  // Default: run health check with saved token (if any)
  const token = loadAuth();
  await runHealthCheck(token);
}

main();
