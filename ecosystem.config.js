/**
 * PM2 Ecosystem Configuration
 * Production process management for AlpacaTrader application
 */

module.exports = {
  apps: [
    {
      name: 'alpaca-trader-server',
      script: './server/dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};
