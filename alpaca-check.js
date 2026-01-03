#!/usr/bin/env node

/**
 * AlpacaTrader Bot - Enhanced Health Check
 * 
 * Usage:
 *   node alpaca-check.js              Full report (default)
 *   node alpaca-check.js --setup      Configure API keys
 *   node alpaca-check.js --quick      Quick summary only
 *   node alpaca-check.js --positions  Positions detail only
 *   node alpaca-check.js --orders     Recent orders only
 *   node alpaca-check.js --history    Account history/performance
 *   node alpaca-check.js --watch      Auto-refresh every 30 seconds
 */

const https = require('https');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = path.join(process.env.HOME || process.env.USERPROFILE, '.alpaca-config.json');
const SERVER_IP = '146.190.132.152';

// Colors for terminal output
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function load() { 
  try { return JSON.parse(fs.readFileSync(CONFIG)); } catch(e) { return {}; } 
}

function save(cfg) { 
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2)); 
}

function api(endpoint, cfg) {
  return new Promise((resolve, reject) => {
    const base = cfg.paper ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';
    const url = new URL(`https://${base}${endpoint}`);
    https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 
        'APCA-API-KEY-ID': cfg.apiKey, 
        'APCA-API-SECRET-KEY': cfg.secretKey 
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, data: d });
        }
      });
    }).on('error', reject);
  });
}

function httpGet(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : require('http');
    const req = lib.get(url, { rejectUnauthorized: false, timeout: 5000 }, res => {
      resolve({ status: res.statusCode });
    });
    req.on('error', () => resolve({ status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0 }); });
  });
}

// Formatting helpers
function fmt(num, decimals = 2) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(num) {
  return '$' + fmt(num);
}

function fmtPercent(num) {
  const n = Number(num || 0);
  const sign = n >= 0 ? '+' : '';
  return sign + fmt(n) + '%';
}

function fmtPL(num) {
  const n = Number(num || 0);
  const sign = n >= 0 ? '+' : '';
  const color = n >= 0 ? c.green : c.red;
  return color + sign + fmtCurrency(n) + c.reset;
}

function fmtPLPercent(num) {
  const n = Number(num || 0);
  const color = n >= 0 ? c.green : c.red;
  return color + fmtPercent(n) + c.reset;
}

function line(char = '─', len = 60) {
  return char.repeat(len);
}

function header(title) {
  console.log(`\n${c.bold}${c.cyan}═══ ${title} ${'═'.repeat(Math.max(0, 54 - title.length))}${c.reset}`);
}

function subheader(title) {
  console.log(`\n${c.bold}${title}${c.reset}`);
}

// Setup wizard
async function setup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));
  
  console.log(`\n${c.bold}${c.cyan}🔧 Alpaca Health Check Setup${c.reset}\n`);
  
  const apiKey = await ask('Alpaca API Key: ');
  const secretKey = await ask('Alpaca Secret Key: ');
  const paper = (await ask('Is this a Paper account? (y/n): ')).toLowerCase() === 'y';
  rl.close();
  
  const cfg = { apiKey, secretKey, paper };
  console.log('\nTesting connection...');
  
  const res = await api('/v2/account', cfg);
  if (res.status === 200) {
    save(cfg);
    console.log(`${c.green}✓ Connected to ${paper ? 'Paper' : 'Live'} account: ${res.data.account_number}${c.reset}`);
    console.log(`${c.green}✓ Config saved to ${CONFIG}${c.reset}\n`);
  } else {
    console.log(`${c.red}✗ Connection failed: ${res.data.message || 'Invalid credentials'}${c.reset}\n`);
  }
}

// Check server status
async function checkServer() {
  header('SERVER STATUS');
  
  const frontend = await httpGet(`https://${SERVER_IP}/`);
  const backend = await httpGet(`https://${SERVER_IP}/api/auth/me`);
  
  const fStatus = frontend.status === 200 ? `${c.green}✓ Online${c.reset}` : `${c.red}✗ Offline${c.reset}`;
  const bStatus = (backend.status === 200 || backend.status === 401) ? `${c.green}✓ Online${c.reset}` : `${c.red}✗ Offline${c.reset}`;
  
  console.log(`  Frontend/Nginx:  ${fStatus}`);
  console.log(`  Backend API:     ${bStatus}`);
  console.log(`  Server IP:       ${SERVER_IP}`);
}

// Account overview
async function showAccount(cfg) {
  const res = await api('/v2/account', cfg);
  if (res.status !== 200) {
    console.log(`${c.red}Error fetching account: ${res.data.message}${c.reset}`);
    return null;
  }
  
  const a = res.data;
  const equity = Number(a.equity);
  const lastEquity = Number(a.last_equity);
  const dayPL = equity - lastEquity;
  const dayPLPct = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0;
  
  header('ACCOUNT OVERVIEW');
  console.log(`  Account:         ${a.account_number} ${cfg.paper ? c.yellow + '(PAPER)' + c.reset : c.green + '(LIVE)' + c.reset}`);
  console.log(`  Status:          ${a.status === 'ACTIVE' ? c.green + a.status + c.reset : c.yellow + a.status + c.reset}`);
  console.log(`  Pattern Day Trader: ${a.pattern_day_trader ? c.yellow + 'Yes' + c.reset : 'No'}`);
  
  subheader('Portfolio Value');
  console.log(`  Equity:          ${c.bold}${fmtCurrency(a.equity)}${c.reset}`);
  console.log(`  Cash:            ${fmtCurrency(a.cash)}`);
  console.log(`  Buying Power:    ${fmtCurrency(a.buying_power)}`);
  console.log(`  Day P&L:         ${fmtPL(dayPL)} (${fmtPLPercent(dayPLPct)})`);
  
  subheader('Margin Details');
  console.log(`  Initial Margin:  ${fmtCurrency(a.initial_margin)}`);
  console.log(`  Maint. Margin:   ${fmtCurrency(a.maintenance_margin)}`);
  console.log(`  Daytrading BP:   ${fmtCurrency(a.daytrading_buying_power)}`);
  console.log(`  Regt BP:         ${fmtCurrency(a.regt_buying_power)}`);
  
  if (Number(a.sma) > 0) {
    console.log(`  SMA:             ${fmtCurrency(a.sma)}`);
  }
  
  return a;
}

// Positions detail
async function showPositions(cfg) {
  const res = await api('/v2/positions', cfg);
  if (res.status !== 200) {
    console.log(`${c.red}Error fetching positions: ${res.data.message}${c.reset}`);
    return [];
  }
  
  const positions = res.data;
  header('CURRENT POSITIONS');
  
  if (positions.length === 0) {
    console.log(`  ${c.dim}No open positions${c.reset}`);
    return positions;
  }
  
  // Table header
  console.log(`  ${c.dim}${'Symbol'.padEnd(8)} ${'Qty'.padStart(6)} ${'Avg Cost'.padStart(10)} ${'Current'.padStart(10)} ${'Value'.padStart(12)} ${'P&L'.padStart(12)} ${'P&L %'.padStart(10)}${c.reset}`);
  console.log(`  ${c.dim}${line('─', 76)}${c.reset}`);
  
  let totalValue = 0;
  let totalPL = 0;
  let totalCost = 0;
  
  for (const p of positions) {
    const qty = Number(p.qty);
    const avgCost = Number(p.avg_entry_price);
    const current = Number(p.current_price);
    const value = Number(p.market_value);
    const pl = Number(p.unrealized_pl);
    const plPct = Number(p.unrealized_plpc) * 100;
    const cost = qty * avgCost;
    
    totalValue += value;
    totalPL += pl;
    totalCost += cost;
    
    const plColor = pl >= 0 ? c.green : c.red;
    const plSign = pl >= 0 ? '+' : '';
    
    console.log(`  ${p.symbol.padEnd(8)} ${qty.toString().padStart(6)} ${('$' + fmt(avgCost)).padStart(10)} ${('$' + fmt(current)).padStart(10)} ${('$' + fmt(value)).padStart(12)} ${plColor}${(plSign + '$' + fmt(Math.abs(pl))).padStart(12)}${c.reset} ${plColor}${(plSign + fmt(plPct) + '%').padStart(10)}${c.reset}`);
  }
  
  console.log(`  ${c.dim}${line('─', 76)}${c.reset}`);
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  console.log(`  ${c.bold}${'TOTAL'.padEnd(8)} ${' '.padStart(6)} ${' '.padStart(10)} ${' '.padStart(10)} ${('$' + fmt(totalValue)).padStart(12)} ${fmtPL(totalPL).padStart(12)} ${fmtPLPercent(totalPLPct).padStart(10)}${c.reset}`);
  
  return positions;
}

// Recent orders
async function showOrders(cfg, limit = 10) {
  const res = await api(`/v2/orders?status=all&limit=${limit}&direction=desc`, cfg);
  if (res.status !== 200) {
    console.log(`${c.red}Error fetching orders: ${res.data.message}${c.reset}`);
    return [];
  }
  
  const orders = res.data;
  header(`RECENT ORDERS (Last ${limit})`);
  
  if (orders.length === 0) {
    console.log(`  ${c.dim}No recent orders${c.reset}`);
    return orders;
  }
  
  for (const o of orders) {
    const time = new Date(o.created_at).toLocaleString();
    const status = o.status.toUpperCase();
    const side = o.side.toUpperCase();
    const symbol = o.symbol;
    const qty = o.qty;
    const type = o.type.toUpperCase();
    
    let statusIcon, statusColor;
    switch(status) {
      case 'FILLED': statusIcon = '✓'; statusColor = c.green; break;
      case 'PARTIALLY_FILLED': statusIcon = '◐'; statusColor = c.yellow; break;
      case 'CANCELED': case 'EXPIRED': statusIcon = '✗'; statusColor = c.dim; break;
      case 'REJECTED': statusIcon = '⊘'; statusColor = c.red; break;
      case 'NEW': case 'ACCEPTED': statusIcon = '○'; statusColor = c.blue; break;
      default: statusIcon = '?'; statusColor = c.white;
    }
    
    const sideColor = side === 'BUY' ? c.green : c.red;
    
    console.log(`  ${statusColor}${statusIcon} ${status.padEnd(10)}${c.reset} ${c.dim}${time}${c.reset}`);
    console.log(`    ${sideColor}${side}${c.reset} ${qty} ${c.bold}${symbol}${c.reset} (${type})`);
    
    if (o.filled_avg_price && Number(o.filled_avg_price) > 0) {
      console.log(`    Filled @ ${fmtCurrency(o.filled_avg_price)} | Qty: ${o.filled_qty}/${o.qty}`);
    }
    if (o.limit_price) {
      console.log(`    Limit: ${fmtCurrency(o.limit_price)}`);
    }
    if (o.stop_price) {
      console.log(`    Stop: ${fmtCurrency(o.stop_price)}`);
    }
    console.log('');
  }
  
  return orders;
}

// Portfolio history
async function showHistory(cfg) {
  const res = await api('/v2/account/portfolio/history?period=1M&timeframe=1D', cfg);
  if (res.status !== 200) {
    console.log(`${c.red}Error fetching history: ${res.data.message}${c.reset}`);
    return;
  }
  
  const h = res.data;
  header('PORTFOLIO HISTORY (30 Days)');
  
  if (!h.equity || h.equity.length === 0) {
    console.log(`  ${c.dim}No history available${c.reset}`);
    return;
  }
  
  const startEquity = h.equity[0];
  const endEquity = h.equity[h.equity.length - 1];
  const totalReturn = endEquity - startEquity;
  const totalReturnPct = startEquity > 0 ? (totalReturn / startEquity) * 100 : 0;
  
  // Find high and low
  const high = Math.max(...h.equity);
  const low = Math.min(...h.equity);
  const highDate = new Date(h.timestamp[h.equity.indexOf(high)] * 1000).toLocaleDateString();
  const lowDate = new Date(h.timestamp[h.equity.indexOf(low)] * 1000).toLocaleDateString();
  
  console.log(`  Period Return:   ${fmtPL(totalReturn)} (${fmtPLPercent(totalReturnPct)})`);
  console.log(`  Starting Value:  ${fmtCurrency(startEquity)}`);
  console.log(`  Current Value:   ${fmtCurrency(endEquity)}`);
  console.log(`  Period High:     ${fmtCurrency(high)} ${c.dim}(${highDate})${c.reset}`);
  console.log(`  Period Low:      ${fmtCurrency(low)} ${c.dim}(${lowDate})${c.reset}`);
  
  // Simple ASCII chart
  subheader('Equity Chart');
  const width = 50;
  const height = 8;
  const range = high - low || 1;
  const step = Math.ceil(h.equity.length / width);
  
  const chart = [];
  for (let i = 0; i < height; i++) chart.push(new Array(width).fill(' '));
  
  for (let i = 0; i < width; i++) {
    const idx = Math.min(i * step, h.equity.length - 1);
    const val = h.equity[idx];
    const y = Math.floor(((val - low) / range) * (height - 1));
    chart[height - 1 - y][i] = '█';
  }
  
  console.log(`  ${c.dim}${fmtCurrency(high).padStart(10)}${c.reset} ┤`);
  for (const row of chart) {
    console.log(`             │${c.cyan}${row.join('')}${c.reset}`);
  }
  console.log(`  ${c.dim}${fmtCurrency(low).padStart(10)}${c.reset} ┤${'─'.repeat(width)}`);
  console.log(`             ${c.dim}30 days ago${' '.repeat(width - 22)}today${c.reset}`);
}

// Market clock
async function showMarketStatus(cfg) {
  const res = await api('/v2/clock', cfg);
  if (res.status !== 200) return;
  
  const clock = res.data;
  const isOpen = clock.is_open;
  const nextOpen = new Date(clock.next_open);
  const nextClose = new Date(clock.next_close);
  
  header('MARKET STATUS');
  console.log(`  Market:          ${isOpen ? c.green + '🟢 OPEN' + c.reset : c.red + '🔴 CLOSED' + c.reset}`);
  
  if (isOpen) {
    const timeToClose = nextClose - new Date();
    const hours = Math.floor(timeToClose / 3600000);
    const mins = Math.floor((timeToClose % 3600000) / 60000);
    console.log(`  Closes in:       ${hours}h ${mins}m`);
    console.log(`  Close time:      ${nextClose.toLocaleTimeString()}`);
  } else {
    console.log(`  Next open:       ${nextOpen.toLocaleString()}`);
  }
}

// Activities (dividends, transfers, etc.)
async function showActivities(cfg) {
  const res = await api('/v2/account/activities?activity_types=DIV,DIVCGL,DIVCGS,DIVNRA,DIVFT,DIVTXEX&limit=5', cfg);
  if (res.status !== 200 || !res.data.length) return;
  
  header('RECENT DIVIDENDS');
  for (const a of res.data) {
    const date = new Date(a.date).toLocaleDateString();
    console.log(`  ${date}: ${c.green}+${fmtCurrency(a.net_amount)}${c.reset} from ${c.bold}${a.symbol}${c.reset}`);
  }
}

// Full report
async function fullReport(cfg) {
  console.log(`\n${c.bold}${c.magenta}╔════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║         ALPACATRADER BOT - HEALTH CHECK REPORT            ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`${c.dim}  Generated: ${new Date().toLocaleString()}${c.reset}`);
  
  await checkServer();
  await showMarketStatus(cfg);
  await showAccount(cfg);
  await showPositions(cfg);
  await showOrders(cfg, 5);
  await showActivities(cfg);
  
  console.log(`\n${c.dim}${line('─', 60)}${c.reset}`);
  console.log(`${c.dim}  Run with --help for more options${c.reset}\n`);
}

// Quick summary
async function quickReport(cfg) {
  const [accRes, posRes] = await Promise.all([
    api('/v2/account', cfg),
    api('/v2/positions', cfg)
  ]);
  
  if (accRes.status !== 200) {
    console.log(`${c.red}Error: ${accRes.data.message}${c.reset}`);
    return;
  }
  
  const a = accRes.data;
  const positions = posRes.data || [];
  const dayPL = Number(a.equity) - Number(a.last_equity);
  
  console.log(`\n${c.bold}Portfolio: ${fmtCurrency(a.equity)}${c.reset} | Day: ${fmtPL(dayPL)} | Cash: ${fmtCurrency(a.cash)} | Positions: ${positions.length}\n`);
}

// Watch mode
async function watchMode(cfg) {
  const refresh = async () => {
    console.clear();
    console.log(`${c.dim}Auto-refreshing every 30s (Ctrl+C to stop)${c.reset}`);
    await quickReport(cfg);
    await showPositions(cfg);
  };
  
  await refresh();
  setInterval(refresh, 30000);
}

// Help
function showHelp() {
  console.log(`
${c.bold}AlpacaTrader Bot -
 Health Check${c.reset}

${c.cyan}Usage:${c.reset}
  node alpaca-check.js              Full report (default)
  node alpaca-check.js --setup      Configure API keys
  node alpaca-check.js --quick      Quick one-line summary
  node alpaca-check.js --positions  Positions detail only
  node alpaca-check.js --orders     Recent orders (last 10)
  node alpaca-check.js --history    30-day performance chart
  node alpaca-check.js --watch      Auto-refresh every 30s
  node alpaca-check.js --help       Show this help

${c.cyan}Examples:${c.reset}
  node alpaca-check.js --orders 20  Show last 20 orders
`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--setup')) {
    await setup();
    return;
  }
  
  const cfg = load();
  if (!cfg.apiKey) {
    console.log(`${c.yellow}No API keys configured. Run: node alpaca-check.js --setup${c.reset}`);
    return;
  }
  
  if (args.includes('--quick') || args.includes('-q')) {
    await quickReport(cfg);
  } else if (args.includes('--positions') || args.includes('-p')) {
    await showPositions(cfg);
  } else if (args.includes('--orders') || args.includes('-o')) {
    const limitIdx = args.indexOf('--orders') + 1;
    const limit = args[limitIdx] && !args[limitIdx].startsWith('-') ? parseInt(args[limitIdx]) : 10;
    await showOrders(cfg, limit);
  } else if (args.includes('--history') || args.includes('-H')) {
    await showHistory(cfg);
  } else if (args.includes('--watch') || args.includes('-w')) {
    await watchMode(cfg);
  } else {
    await fullReport(cfg);
  }
}

main().catch(err => console.error(`${c.red}Error: ${err.message}${c.reset}`));
