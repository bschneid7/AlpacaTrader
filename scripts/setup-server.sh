#!/bin/bash

###############################################################################
# Server Setup Script for AlpacaTrader
# Prepares Ubuntu server for application deployment
# Run this ONCE on the target server before first deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

print_info "Starting server setup for AlpacaTrader..."
echo ""

# Update system
print_info "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
print_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_info "Node.js installed: $(node --version)"
else
    print_info "Node.js already installed: $(node --version)"
fi

# Install MongoDB
print_info "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    # Import MongoDB public GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

    # Create list file for MongoDB
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

    # Update package database
    apt-get update

    # Install MongoDB
    apt-get install -y mongodb-org

    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod

    print_info "MongoDB installed and started"
else
    print_info "MongoDB already installed"
    systemctl status mongod --no-pager || systemctl start mongod
fi

# Install Nginx
print_info "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_info "Nginx installed and started"
else
    print_info "Nginx already installed"
fi

# Install PM2 globally
print_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2

    # Setup PM2 to start on system boot
    pm2 startup systemd -u root --hp /root

    print_info "PM2 installed"
else
    print_info "PM2 already installed: $(pm2 --version)"
fi

# Install build essentials (for native npm modules)
print_info "Installing build essentials..."
apt-get install -y build-essential

# Install Git (useful for deployment)
print_info "Installing Git..."
apt-get install -y git

# Create application directory
print_info "Creating application directory..."
mkdir -p /var/www/alpaca-trader
mkdir -p /var/backups/alpaca-trader
mkdir -p /var/log/alpaca-trader

# Set proper permissions
chown -R root:root /var/www/alpaca-trader
chmod -R 755 /var/www/alpaca-trader

# Setup firewall (UFW)
print_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    # Allow SSH
    ufw allow 22/tcp

    # Allow HTTP
    ufw allow 80/tcp

    # Allow HTTPS
    ufw allow 443/tcp

    # Enable firewall
    ufw --force enable

    print_info "Firewall configured"
else
    print_warning "UFW not available, skipping firewall configuration"
fi

# Create MongoDB database and user
print_info "Setting up MongoDB database..."
mongo << EOF
use alpacatrader
db.createUser({
    user: "alpacatrader",
    pwd: "$(openssl rand -base64 32)",
    roles: [{ role: "readWrite", db: "alpacatrader" }]
})
EOF

# Create systemd service for monitoring (optional)
print_info "Creating systemd service..."
cat > /etc/systemd/system/alpaca-trader.service << 'EOF'
[Unit]
Description=AlpacaTrader Application
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/alpaca-trader
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

# Install logrotate configuration
print_info "Setting up log rotation..."
cat > /etc/logrotate.d/alpaca-trader << EOF
/var/www/alpaca-trader/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create backup cron job
print_info "Setting up automated backups..."
cat > /etc/cron.d/alpaca-trader-backup << 'EOF'
# Daily database backup at 2 AM
0 2 * * * root /var/www/alpaca-trader/scripts/backup-db.sh >> /var/log/alpaca-trader/backup.log 2>&1
EOF

# Install fail2ban for security (optional)
print_info "Installing fail2ban for security..."
apt-get install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Optimize MongoDB for production
print_info "Optimizing MongoDB..."
cat >> /etc/mongod.conf << EOF

# Security
security:
  authorization: enabled

# Network
net:
  bindIp: 127.0.0.1
  port: 27017

# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
EOF

systemctl restart mongod

# System optimization
print_info "Applying system optimizations..."
cat >> /etc/sysctl.conf << EOF

# AlpacaTrader optimizations
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
fs.file-max = 65536
EOF

sysctl -p

echo ""
print_info "=========================================="
print_info "Server setup completed successfully!"
print_info "=========================================="
print_info ""
print_info "Next steps:"
print_info "1. Configure MongoDB connection string in application .env file"
print_info "2. Set up application environment variables"
print_info "3. Run deployment script from local machine"
print_info ""
print_info "Installed versions:"
print_info "  - Node.js: $(node --version)"
print_info "  - npm: $(npm --version)"
print_info "  - MongoDB: $(mongod --version | head -n 1)"
print_info "  - Nginx: $(nginx -v 2>&1)"
print_info "  - PM2: $(pm2 --version)"
print_info "=========================================="
