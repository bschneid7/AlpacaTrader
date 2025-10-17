# AlpacaTrader - Docker Deployment Guide

Complete guide for deploying AlpacaTrader using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Docker Commands](#docker-commands)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

### Local Development
- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker

### Production Server
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Firewall configured (ports 80, 443)

---

## Quick Start

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.docker.example .env

# Edit environment variables
nano .env
```

### 2. Generate Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 16
```

Update `.env` with generated values.

### 3. Build and Start

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application

- **Application:** http://localhost
- **API:** http://localhost/api
- **Health Check:** http://localhost/api/ping

---

## Detailed Setup

### Environment Configuration

Required variables in `.env`:

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-strong-password

# Application Secrets
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
ENCRYPTION_KEY=your-32-char-encryption-key
SESSION_SECRET=your-session-secret
```

### Docker Compose Services

The stack includes:

1. **MongoDB** - Database (port 27017)
2. **App** - Node.js application (port 3000)
3. **Nginx** - Reverse proxy (ports 80, 443)

### Building the Application

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build app

# Build with no cache (clean build)
docker-compose build --no-cache
```

### Starting Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d app

# Start with build
docker-compose up -d --build

# Scale application (multiple instances)
docker-compose up -d --scale app=3
```

### Stopping Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop app

# Stop and remove containers
docker-compose down

# Stop and remove with volumes (CAUTION: deletes data)
docker-compose down -v
```

---

## Docker Commands

### Container Management

```bash
# List running containers
docker-compose ps

# View all containers (including stopped)
docker-compose ps -a

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app

# Execute command in container
docker-compose exec app sh

# View container logs
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p

# Backup database
docker-compose exec mongodb mongodump \
  --username admin \
  --password yourpassword \
  --authenticationDatabase admin \
  --db alpacatrader \
  --out /data/backup

# Copy backup from container
docker cp alpaca-trader-db:/data/backup ./backup

# Restore database
docker-compose exec -T mongodb mongorestore \
  --username admin \
  --password yourpassword \
  --authenticationDatabase admin \
  --db alpacatrader \
  /data/backup/alpacatrader
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove all containers and volumes
docker-compose down -v

# Remove unused images
docker image prune

# Full cleanup (CAUTION)
docker system prune -a --volumes
```

---

## Monitoring & Logs

### Application Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs app
docker-compose logs nginx
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f app

# View logs since timestamp
docker-compose logs --since 2024-01-01T00:00:00 app

# View logs with timestamps
docker-compose logs -t app
```

### Container Statistics

```bash
# View resource usage
docker stats

# View for specific containers
docker stats alpaca-trader-app alpaca-trader-db
```

### Health Checks

```bash
# Check container health
docker-compose ps

# Inspect service health
docker inspect --format='{{.State.Health.Status}}' alpaca-trader-app

# View health check logs
docker inspect --format='{{json .State.Health}}' alpaca-trader-app | jq
```

### Access Container Shell

```bash
# Access app container
docker-compose exec app sh

# Access as root
docker-compose exec -u root app sh

# Access MongoDB
docker-compose exec mongodb mongosh alpacatrader
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker inspect alpaca-trader-app

# Rebuild container
docker-compose up -d --build --force-recreate app
```

### Database Connection Issues

```bash
# Check MongoDB status
docker-compose ps mongodb

# Test MongoDB connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Network Issues

```bash
# List networks
docker network ls

# Inspect network
docker network inspect alpacatrader_alpaca-network

# Recreate network
docker-compose down
docker-compose up -d
```

### Port Conflicts

```bash
# Check what's using port
lsof -i :80
lsof -i :3000

# Change ports in docker-compose.yml
# Example: "8080:80" instead of "80:80"
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect alpacatrader_mongodb_data

# Remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a

# Remove old volumes
docker volume prune
```

---

## Production Deployment

### 1. Setup Production Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd AlpacaTrader

# Configure environment
cp .env.docker.example .env
nano .env  # Fill in production secrets

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
```

### 3. SSL/TLS Configuration

For HTTPS, use Let's Encrypt with Certbot:

```bash
# Install certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com

# Update docker-compose.yml to mount certificates
# Add under nginx volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 4. Automated Backups

Create backup script `/root/backup-docker.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/alpaca-trader"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump \
  --username admin \
  --password $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db alpacatrader \
  --archive=/data/backup_$TIMESTAMP.archive

# Copy from container
docker cp alpaca-trader-db:/data/backup_$TIMESTAMP.archive $BACKUP_DIR/

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.archive

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t backup_*.archive.gz | tail -n +8 | xargs -r rm

echo "Backup completed: backup_$TIMESTAMP.archive.gz"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /root/backup-docker.sh >> /var/log/backup.log 2>&1
```

### 5. Monitoring Setup

Install Portainer for GUI management:

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 \
  --name=portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# Access at: http://your-server:9000
```

### 6. Logging Configuration

For centralized logging, consider using ELK stack or simple log forwarding:

```bash
# View aggregated logs
docker-compose logs -f > /var/log/alpaca-trader.log &

# Rotate logs with logrotate
cat > /etc/logrotate.d/docker-compose << EOF
/var/log/alpaca-trader.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF
```

---

## Performance Optimization

### Production Docker Compose Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: unless-stopped

  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: unless-stopped
```

Use with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Security Best Practices

1. **Use strong passwords** for all services
2. **Don't expose MongoDB port** publicly (remove from docker-compose.yml)
3. **Use secrets management** for sensitive data
4. **Regular updates**: `docker-compose pull && docker-compose up -d`
5. **Enable firewall**: Only allow ports 80, 443, 22
6. **Use SSL/TLS** in production
7. **Regular backups** of database
8. **Monitor logs** for suspicious activity

---

## Update Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or with zero-downtime
docker-compose build app
docker-compose up -d --no-deps app
```

---

## Comparison: Docker vs Traditional Deployment

| Aspect | Docker | Traditional |
|--------|--------|-------------|
| Setup Time | 5 minutes | 15-20 minutes |
| Isolation | Container-level | Process-level |
| Resource Usage | Moderate | Lower |
| Portability | High | Medium |
| Scaling | Easy | Manual |
| Backups | Volume-based | File/DB-based |
| Updates | Fast rebuild | Gradual deploy |

---

## Quick Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart app
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build

# Access shell
docker-compose exec app sh

# Backup database
docker-compose exec mongodb mongodump ...

# Check status
docker-compose ps
```

---

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Check container health: `docker-compose ps`
4. Inspect container: `docker inspect alpaca-trader-app`

---

**For traditional deployment, see DEPLOYMENT.md**
