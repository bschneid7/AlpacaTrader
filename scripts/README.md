# AlpacaTrader Deployment Scripts

This directory contains scripts for deploying and managing the AlpacaTrader application on DigitalOcean Ubuntu server.

## Scripts Overview

### Deployment Scripts

#### 1. `setup-server.sh`
**Purpose:** Initial server setup and configuration

**Run once on the target server before first deployment**

```bash
# Copy to server and run
scp scripts/setup-server.sh root@146.190.132.152:/tmp/
ssh root@146.190.132.152 'bash /tmp/setup-server.sh'
```

**What it does:**
- Installs Node.js, MongoDB, Nginx, PM2
- Configures firewall (UFW)
- Sets up system optimizations
- Creates application directories
- Configures log rotation
- Sets up automated backups

**Time:** ~10-15 minutes

---

#### 2. `deploy.sh` (Root directory)
**Purpose:** Main deployment script

**Run from local machine to deploy application**

```bash
./deploy.sh
```

**What it does:**
- Checks server connectivity
- Creates backup of current deployment
- Builds application locally (client & server)
- Uploads files to server
- Installs dependencies
- Starts application with PM2
- Configures Nginx

**Prerequisites:**
- Server must be set up (run `setup-server.sh` first)
- SSH access to server
- Environment variables configured on server

---

#### 3. `deploy-local.sh`
**Purpose:** Test deployment process locally

**Run before production deployment to verify builds**

```bash
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh
```

**What it does:**
- Cleans previous builds
- Installs all dependencies
- Builds shared, server, and client
- Verifies build artifacts
- Reports build sizes

**Use case:** Testing before actual deployment

---

### Monitoring Scripts

#### 4. `check-deployment.sh`
**Purpose:** Health check for deployed application

```bash
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh
```

**What it checks:**
- Server connectivity
- HTTP service status
- API health (`/api/ping`)
- PM2 process status
- MongoDB status
- Nginx status
- Disk space usage
- Memory usage

**Use case:** Verify deployment success, troubleshoot issues

---

### Maintenance Scripts

#### 5. `backup-db.sh`
**Purpose:** MongoDB database backup

**Runs automatically via cron (daily at 2 AM)**

**Manual run:**
```bash
ssh root@146.190.132.152
/var/www/alpaca-trader/scripts/backup-db.sh
```

**What it does:**
- Creates MongoDB dump
- Compresses backup
- Stores in `/var/backups/alpaca-trader/mongodb/`
- Keeps last 7 backups
- Cleans up old backups

**Backup location:** `/var/backups/alpaca-trader/mongodb/`

---

## Quick Start Guide

### First Time Deployment

1. **Setup Server**
```bash
scp scripts/setup-server.sh root@146.190.132.152:/tmp/
ssh root@146.190.132.152 'bash /tmp/setup-server.sh'
```

2. **Configure Environment**
```bash
ssh root@146.190.132.152
cd /var/www/alpaca-trader
mkdir -p server
nano server/.env
# Copy from .env.production.example and fill in values
```

3. **Deploy Application**
```bash
chmod +x deploy.sh
./deploy.sh
```

4. **Verify Deployment**
```bash
./scripts/check-deployment.sh
```

### Subsequent Deployments

```bash
./deploy.sh
```

---

## Script Permissions

Make scripts executable:

```bash
chmod +x deploy.sh
chmod +x scripts/setup-server.sh
chmod +x scripts/deploy-local.sh
chmod +x scripts/check-deployment.sh
chmod +x scripts/backup-db.sh
```

---

## Common Tasks

### View Application Logs
```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server'
```

### Restart Application
```bash
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
```

### Check Application Status
```bash
ssh root@146.190.132.152 'pm2 status'
```

### View Nginx Logs
```bash
ssh root@146.190.132.152 'tail -f /var/log/nginx/alpaca-trader-access.log'
```

### Manual Database Backup
```bash
ssh root@146.190.132.152 '/var/www/alpaca-trader/scripts/backup-db.sh'
```

### List Backups
```bash
# Database backups
ssh root@146.190.132.152 'ls -lh /var/backups/alpaca-trader/mongodb/'

# Application backups
ssh root@146.190.132.152 'ls -lh /var/backups/alpaca-trader/'
```

---

## Troubleshooting

### Deployment Fails

1. **Check server connectivity:**
```bash
ping 146.190.132.152
ssh root@146.190.132.152 'echo "Connected"'
```

2. **Check disk space:**
```bash
ssh root@146.190.132.152 'df -h'
```

3. **Check logs:**
```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --err'
```

### Application Won't Start

1. **Check environment variables:**
```bash
ssh root@146.190.132.152 'cat /var/www/alpaca-trader/server/.env'
```

2. **Check MongoDB:**
```bash
ssh root@146.190.132.152 'systemctl status mongod'
```

3. **Restart application:**
```bash
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
```

### Database Issues

1. **Check MongoDB status:**
```bash
ssh root@146.190.132.152 'systemctl status mongod'
```

2. **View MongoDB logs:**
```bash
ssh root@146.190.132.152 'tail -f /var/log/mongodb/mongod.log'
```

3. **Restart MongoDB:**
```bash
ssh root@146.190.132.152 'systemctl restart mongod'
```

---

## Environment Variables

Required variables in `server/.env`:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/alpacatrader
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-32-char-key>
SESSION_SECRET=<generate-strong-secret>
```

Generate secrets:
```bash
# JWT secrets
openssl rand -base64 32

# Encryption key
openssl rand -hex 16
```

---

## Backup and Recovery

### Restore Database

1. **Download backup:**
```bash
scp root@146.190.132.152:/var/backups/alpaca-trader/mongodb/mongodb_backup_TIMESTAMP.tar.gz ./
```

2. **Extract:**
```bash
tar -xzf mongodb_backup_TIMESTAMP.tar.gz
```

3. **Restore:**
```bash
mongorestore --db alpacatrader ./mongodb_backup_TIMESTAMP/alpacatrader
```

### Restore Application

Application backups are created automatically before each deployment.

```bash
ssh root@146.190.132.152 'ls -lh /var/backups/alpaca-trader/'
```

---

## Security Notes

1. **Never commit `.env` files to git**
2. **Use strong secrets** - generate with `openssl rand -base64 32`
3. **Keep server updated** - `apt-get update && apt-get upgrade`
4. **Use SSH keys** instead of passwords
5. **Enable SSL/TLS** for production (see DEPLOYMENT.md)
6. **Regularly backup database**
7. **Monitor logs** for suspicious activity

---

## Resources

- **Full Deployment Guide:** See `DEPLOYMENT.md` in root directory
- **Application Logs:** `/var/www/alpaca-trader/logs/`
- **Nginx Logs:** `/var/log/nginx/`
- **MongoDB Logs:** `/var/log/mongodb/`
- **Backups:** `/var/backups/alpaca-trader/`

---

## Support

For issues or questions:
1. Check logs: `pm2 logs alpaca-trader-server`
2. Run health check: `./scripts/check-deployment.sh`
3. Review DEPLOYMENT.md for detailed troubleshooting
4. Check server resources: `pm2 monit`
