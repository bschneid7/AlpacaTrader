#!/bin/bash

###############################################################################
# MongoDB Backup Script for AlpacaTrader
# Creates compressed backups of MongoDB database
###############################################################################

set -e  # Exit on error

# Configuration
DB_NAME="alpacatrader"
BACKUP_DIR="/var/backups/alpaca-trader/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP"
KEEP_BACKUPS=7  # Number of backups to keep

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_info "Starting MongoDB backup for database: $DB_NAME"
print_info "Timestamp: $TIMESTAMP"

# Perform backup
if mongodump --db="$DB_NAME" --out="$BACKUP_FILE" --quiet; then
    print_info "MongoDB dump completed successfully"

    # Compress backup
    print_info "Compressing backup..."
    tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "mongodb_backup_$TIMESTAMP"

    # Remove uncompressed backup
    rm -rf "$BACKUP_FILE"

    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE.tar.gz" | cut -f1)
    print_info "Backup created: $BACKUP_FILE.tar.gz (Size: $BACKUP_SIZE)"

    # Clean up old backups
    print_info "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."
    cd "$BACKUP_DIR"
    ls -t mongodb_backup_*.tar.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm

    # List remaining backups
    BACKUP_COUNT=$(ls -1 mongodb_backup_*.tar.gz 2>/dev/null | wc -l)
    print_info "Current number of backups: $BACKUP_COUNT"

    print_info "Backup completed successfully!"
else
    print_error "MongoDB backup failed!"
    exit 1
fi

# Optional: Upload to cloud storage (uncomment and configure as needed)
# if command -v aws &> /dev/null; then
#     print_info "Uploading to S3..."
#     aws s3 cp "$BACKUP_FILE.tar.gz" "s3://your-bucket/alpaca-trader-backups/"
# fi

exit 0
