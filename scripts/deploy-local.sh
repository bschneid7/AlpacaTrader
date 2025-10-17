#!/bin/bash

###############################################################################
# Local Deployment Test Script
# Tests deployment process locally before pushing to production
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info "Starting local deployment test..."
echo ""

# Check if we're in project root
if [ ! -f "package.json" ]; then
    print_warning "Please run this script from the project root directory"
    exit 1
fi

# Clean previous builds
print_info "Cleaning previous builds..."
rm -rf server/dist
rm -rf client/dist

# Install dependencies
print_info "Installing dependencies..."
npm install

# Build shared
print_info "Building shared module..."
cd shared
npm install
npm run build
cd ..

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

# Verify builds
print_info "Verifying builds..."
if [ ! -d "server/dist" ]; then
    print_warning "Server build failed - dist directory not found"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    print_warning "Client build failed - dist directory not found"
    exit 1
fi

print_info "Server build size:"
du -sh server/dist

print_info "Client build size:"
du -sh client/dist

# Test server build
print_info "Testing server build..."
if [ ! -f "server/dist/server.js" ]; then
    print_warning "Server entry point not found"
    exit 1
fi

# Check environment file
if [ ! -f "server/.env" ]; then
    print_warning "Warning: server/.env file not found!"
    print_warning "Create server/.env before running in production"
fi

echo ""
print_info "=========================================="
print_info "Local deployment test completed successfully!"
print_info "=========================================="
print_info "Build artifacts ready for deployment"
print_info ""
print_info "Next steps:"
print_info "1. Review build sizes above"
print_info "2. Ensure server/.env is configured"
print_info "3. Run './deploy.sh' to deploy to production"
print_info "=========================================="
