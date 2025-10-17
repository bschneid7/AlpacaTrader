#!/bin/bash

###############################################################################
# AlpacaTrader Deployment Script
# Deploys the application to DigitalOcean Ubuntu server
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="root"
SERVER_IP="146.190.132.152"
APP_NAME="alpaca-trader"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if server is reachable
check_server() {
    print_info "Checking server connectivity..."
    if ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'Server reachable'" &>/dev/null; then
        print_info "Server is reachable"
        return 0
    else
        print_error "Cannot connect to server at $SERVER_IP"
        return 1
    fi
}

# Function to create backup
create_backup() {
    print_info "Creating backup on server..."
    ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        APP_DIR="/var/www/alpaca-trader"
        BACKUP_DIR="/var/backups/alpaca-trader"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)

        # Create backup directory if it doesn't exist
        mkdir -p "$BACKUP_DIR"

        # Backup current deployment if it exists
        if [ -d "$APP_DIR" ]; then
            echo "Creating backup of current deployment..."
            tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$APP_DIR" . 2>/dev/null || true
            echo "Backup created: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

            # Keep only last 5 backups
            cd "$BACKUP_DIR"
            ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm
        fi
ENDSSH
    print_info "Backup completed"
}

# Function to build application locally
build_application() {
    print_info "Building application locally..."

    # Install dependencies
    print_info "Installing root dependencies..."
    npm install

    # Build server
    print_info "Building server..."
    cd server
    npm install
    npm run build
    cd ..

    # Build client
    print_info "Building client..."
    cd client
    npm install
    npm run build
    cd ..

    print_info "Build completed successfully"
}

# Function to deploy files
deploy_files() {
    print_info "Deploying files to server..."

    # Create temporary deployment directory
    TEMP_DIR=$(mktemp -d)
    print_info "Created temporary directory: $TEMP_DIR"

    # Copy necessary files
    print_info "Copying files to temporary directory..."

    # Server files
    mkdir -p "$TEMP_DIR/server"
    cp -r server/dist "$TEMP_DIR/server/"
    cp -r server/node_modules "$TEMP_DIR/server/" || print_warning "Server node_modules not found, will install on server"
    cp server/package*.json "$TEMP_DIR/server/"

    # Client build
    mkdir -p "$TEMP_DIR/client"
    cp -r client/dist "$TEMP_DIR/client/"

    # Root files
    cp package*.json "$TEMP_DIR/"
    cp ecosystem.config.js "$TEMP_DIR/"

    # Config files
    cp -r shared "$TEMP_DIR/" 2>/dev/null || true

    # Nginx config
    cp nginx.conf "$TEMP_DIR/" 2>/dev/null || true

    # Create deployment archive
    print_info "Creating deployment archive..."
    cd "$TEMP_DIR"
    tar -czf "/tmp/deploy.tar.gz" .
    cd - > /dev/null

    # Upload to server
    print_info "Uploading files to server..."
    scp "/tmp/deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

    # Extract on server
    print_info "Extracting files on server..."
    ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
        # Stop application if running
        pm2 stop alpaca-trader-server 2>/dev/null || true

        # Create app directory
        mkdir -p "$APP_DIR"

        # Extract files
        cd "$APP_DIR"
        tar -xzf /tmp/deploy.tar.gz

        # Clean up
        rm /tmp/deploy.tar.gz

        # Install server dependencies if needed
        if [ ! -d "server/node_modules" ]; then
            echo "Installing server dependencies..."
            cd server
            npm ci --production
            cd ..
        fi

        echo "Files deployed successfully"
ENDSSH

    # Clean up local temp files
    rm -rf "$TEMP_DIR"
    rm /tmp/deploy.tar.gz

    print_info "File deployment completed"
}

# Function to setup environment
setup_environment() {
    print_info "Setting up environment on server..."

    ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        APP_DIR="/var/www/alpaca-trader"
        cd "$APP_DIR"

        # Check if .env exists in server directory
        if [ ! -f "server/.env" ]; then
            echo "WARNING: server/.env file not found!"
            echo "Please create server/.env file with required environment variables"
            echo "You can copy from server/.env.example if available"
        else
            echo "Environment file found"
        fi
ENDSSH
}

# Function to start application
start_application() {
    print_info "Starting application on server..."

    ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        APP_DIR="/var/www/alpaca-trader"
        cd "$APP_DIR"

        # Create logs directory
        mkdir -p logs

        # Start with PM2
        pm2 delete alpaca-trader-server 2>/dev/null || true
        pm2 start ecosystem.config.js
        pm2 save

        # Show status
        pm2 status
ENDSSH

    print_info "Application started successfully"
}

# Function to setup nginx
setup_nginx() {
    print_info "Setting up Nginx..."

    ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        APP_DIR="/var/www/alpaca-trader"

        # Copy nginx config if exists
        if [ -f "$APP_DIR/nginx.conf" ]; then
            echo "Copying Nginx configuration..."
            cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/alpaca-trader

            # Create symbolic link
            ln -sf /etc/nginx/sites-available/alpaca-trader /etc/nginx/sites-enabled/alpaca-trader

            # Remove default site if exists
            rm -f /etc/nginx/sites-enabled/default

            # Test nginx configuration
            nginx -t

            # Reload nginx
            systemctl reload nginx

            echo "Nginx configured successfully"
        else
            echo "WARNING: nginx.conf not found, skipping Nginx setup"
        fi
ENDSSH
}

# Main deployment flow
main() {
    print_info "Starting deployment of AlpacaTrader to $SERVER_IP..."
    echo ""

    # Check server connectivity
    if ! check_server; then
        print_error "Deployment aborted due to connectivity issues"
        exit 1
    fi

    # Confirm deployment
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi

    # Create backup
    create_backup

    # Build application
    build_application

    # Deploy files
    deploy_files

    # Setup environment
    setup_environment

    # Start application
    start_application

    # Setup nginx
    setup_nginx

    echo ""
    print_info "=========================================="
    print_info "Deployment completed successfully!"
    print_info "=========================================="
    print_info "Application URL: http://$SERVER_IP"
    print_info "API URL: http://$SERVER_IP/api"
    print_info ""
    print_info "Useful commands:"
    print_info "  - View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs alpaca-trader-server'"
    print_info "  - Restart app: ssh $SERVER_USER@$SERVER_IP 'pm2 restart alpaca-trader-server'"
    print_info "  - Stop app: ssh $SERVER_USER@$SERVER_IP 'pm2 stop alpaca-trader-server'"
    print_info "=========================================="
}

# Run main function
main
