#!/bin/bash

###############################################################################
# Deployment Health Check Script
# Checks if the application is properly deployed and running
###############################################################################

# Configuration
SERVER_IP="146.190.132.152"
APP_URL="http://$SERVER_IP"
API_URL="$APP_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "=========================================="
echo "AlpacaTrader Deployment Health Check"
echo "Server: $SERVER_IP"
echo "=========================================="
echo ""

# Check 1: Server connectivity
echo "1. Checking server connectivity..."
if ping -c 1 -W 2 "$SERVER_IP" &>/dev/null; then
    print_info "Server is reachable"
else
    print_error "Server is not reachable"
fi
echo ""

# Check 2: HTTP service
echo "2. Checking HTTP service..."
if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200\|301\|302"; then
    print_info "HTTP service is responding"
else
    print_error "HTTP service is not responding"
fi
echo ""

# Check 3: API health check
echo "3. Checking API health..."
API_RESPONSE=$(curl -s "$API_URL/ping" 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "pong"; then
    print_info "API is healthy: $API_RESPONSE"
else
    print_error "API is not responding correctly"
fi
echo ""

# Check 4: Application status on server
echo "4. Checking application status on server..."
if command -v ssh &>/dev/null; then
    SSH_OUTPUT=$(ssh -o ConnectTimeout=5 root@"$SERVER_IP" "pm2 status" 2>/dev/null)
    if echo "$SSH_OUTPUT" | grep -q "online"; then
        print_info "Application is running (PM2 status: online)"
    else
        print_warning "Cannot verify PM2 status (SSH required)"
    fi
else
    print_warning "SSH not available - skipping PM2 check"
fi
echo ""

# Check 5: MongoDB status
echo "5. Checking MongoDB status on server..."
if command -v ssh &>/dev/null; then
    MONGO_STATUS=$(ssh -o ConnectTimeout=5 root@"$SERVER_IP" "systemctl is-active mongod" 2>/dev/null)
    if [ "$MONGO_STATUS" = "active" ]; then
        print_info "MongoDB is running"
    else
        print_warning "Cannot verify MongoDB status"
    fi
else
    print_warning "SSH not available - skipping MongoDB check"
fi
echo ""

# Check 6: Nginx status
echo "6. Checking Nginx status on server..."
if command -v ssh &>/dev/null; then
    NGINX_STATUS=$(ssh -o ConnectTimeout=5 root@"$SERVER_IP" "systemctl is-active nginx" 2>/dev/null)
    if [ "$NGINX_STATUS" = "active" ]; then
        print_info "Nginx is running"
    else
        print_warning "Cannot verify Nginx status"
    fi
else
    print_warning "SSH not available - skipping Nginx check"
fi
echo ""

# Check 7: Disk space
echo "7. Checking disk space on server..."
if command -v ssh &>/dev/null; then
    DISK_USAGE=$(ssh -o ConnectTimeout=5 root@"$SERVER_IP" "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'" 2>/dev/null)
    if [ -n "$DISK_USAGE" ]; then
        if [ "$DISK_USAGE" -lt 80 ]; then
            print_info "Disk usage: ${DISK_USAGE}%"
        else
            print_warning "Disk usage high: ${DISK_USAGE}%"
        fi
    fi
else
    print_warning "SSH not available - skipping disk check"
fi
echo ""

# Check 8: Memory usage
echo "8. Checking memory usage on server..."
if command -v ssh &>/dev/null; then
    MEMORY_INFO=$(ssh -o ConnectTimeout=5 root@"$SERVER_IP" "free -h | grep Mem | awk '{print \$3\"/\"\$2}'" 2>/dev/null)
    if [ -n "$MEMORY_INFO" ]; then
        print_info "Memory usage: $MEMORY_INFO"
    fi
else
    print_warning "SSH not available - skipping memory check"
fi
echo ""

# Summary
echo "=========================================="
echo "Health Check Summary"
echo "=========================================="
echo "Application URL: $APP_URL"
echo "API URL: $API_URL/ping"
echo ""
echo "For detailed logs, run:"
echo "  ssh root@$SERVER_IP 'pm2 logs alpaca-trader-server'"
echo "=========================================="
