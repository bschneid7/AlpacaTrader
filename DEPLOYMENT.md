# AlpacaTrader - Deployment Guide

Complete guide for deploying AlpacaTrader to DigitalOcean Ubuntu server (146.190.132.152).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Initial Configuration](#initial-configuration)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Local Machine Requirements

- Node.js 18+ and npm
- SSH access to the server
- Git
- bash shell

### Server Requirements

- Ubuntu 20.04 LTS or higher
- At least 2GB RAM
- 20GB disk space
- Root or sudo access

---

## Server Setup

### Step 1: Initial Server Setup

SSH into your server:

```bash
ssh root@146.190.132.152
```

### Step 2: Run Setup Script

Transfer and run the server setup script:

```bash
# From your local machine
scp scripts/setup-server.sh root@146.190.132.152:/tmp/
ssh root@146.190.132.152 'bash /tmp/setup-server.sh'
```

This script will:
- Update system packages
- Install Node.js, MongoDB, Nginx, PM2
- Configure firewall
- Set up logging and monitoring
- Create necessary directories

**Note:** The script takes 10-15 minutes to complete.

---

## Initial Configuration

### Step 3: Configure Environment Variables

1. **Create production environment file on server:**

```bash
ssh root@146.190.132.152
cd /var/www/alpaca-trader
mkdir -p server
nano server/.env
```

2. **Copy configuration from `.env.production.example` and fill in actual values:**

Required variables:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/alpacatrader
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-32-char-key>
SESSION_SECRET=<generate-strong-secret>
```

3. **Generate secure secrets:**

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate encryption key (32 characters)
openssl rand -hex 16
```

### Step 4: Configure MongoDB

1. **Create database and user:**

```bash
mongo
```

```javascript
use alpacatrader

db.createUser({
  user: "alpacatrader",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [{ role: "readWrite", db: "alpacatrader" }]
})

exit
```

2. **Update MongoDB URI in .env:**

```env
MONGODB_URI=mongodb://alpacatrader:STRONG_PASSWORD_HERE@localhost:27017/alpacatrader
```

---

## Deployment Process

### Step 5: Deploy Application

From your **local machine** (in project root):

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The deployment script will:
1. Check server connectivity
2. Create backup of current deployment
3. Build the application locally
4. Upload files to server
5. Install dependencies
6. Start application with PM2
7. Configure Nginx

**Expected output:**
```
[INFO] Starting deployment of AlpacaTrader to 146.190.132.152...
[INFO] Server is reachable
Continue with deployment? (y/n) y
[INFO] Creating backup...
[INFO] Building application locally...
[INFO] Deploying files to server...
[INFO] Starting application...
[INFO] Deployment completed successfully!
```

---

## Post-Deployment

### Step 6: Verify Deployment

1. **Check application status:**

```bash
ssh root@146.190.132.152 'pm2 status'
```

Expected output:
```
┌─────┬──────────────────────────┬─────────────┬─────────┬─────────┐
│ id  │ name                     │ mode        │ status  │ cpu     │
├─────┼──────────────────────────┼─────────────┼─────────┼─────────┤
│ 0   │ alpaca-trader-server     │ cluster     │ online  │ 0%      │
└─────┴──────────────────────────┴─────────────┴─────────┴─────────┘
```

2. **Check logs:**

```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --lines 50'
```

3. **Test application endpoints:**

```bash
# Health check
curl http://146.190.132.152/api/ping

# Expected: {"message":"pong"}
```

4. **Access the application:**

Open browser: `http://146.190.132.152`

You should see the AlpacaTrader login page.

### Step 7: Seed Initial Data (Optional)

```bash
ssh root@146.190.132.152
cd /var/www/alpaca-trader/server
npm run seed
```

This creates an admin user and sample data for testing.

---

## Monitoring & Maintenance

### Application Monitoring

**View real-time logs:**
```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server'
```

**Monitor resources:**
```bash
ssh root@146.190.132.152 'pm2 monit'
```

**Application status:**
```bash
ssh root@146.190.132.152 'pm2 status'
```

### Application Management

**Restart application:**
```bash
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
```

**Stop application:**
```bash
ssh root@146.190.132.152 'pm2 stop alpaca-trader-server'
```

**Start application:**
```bash
ssh root@146.190.132.152 'pm2 start alpaca-trader-server'
```

**Reload (zero-downtime):**
```bash
ssh root@146.190.132.152 'pm2 reload alpaca-trader-server'
```

### Nginx Management

**Check Nginx status:**
```bash
ssh root@146.190.132.152 'systemctl status nginx'
```

**Reload Nginx config:**
```bash
ssh root@146.190.132.152 'nginx -t && systemctl reload nginx'
```

**View Nginx logs:**
```bash
ssh root@146.190.132.152 'tail -f /var/log/nginx/alpaca-trader-access.log'
ssh root@146.190.132.152 'tail -f /var/log/nginx/alpaca-trader-error.log'
```

### MongoDB Management

**Check MongoDB status:**
```bash
ssh root@146.190.132.152 'systemctl status mongod'
```

**Connect to MongoDB:**
```bash
ssh root@146.190.132.152 'mongo alpacatrader'
```

---

## Troubleshooting

### Common Issues

#### 1. Application won't start

**Check logs:**
```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --err'
```

**Common causes:**
- Missing environment variables → Check `server/.env`
- MongoDB connection failed → Verify MongoDB is running
- Port already in use → Check if another process is using port 3000

#### 2. Can't access application

**Check Nginx:**
```bash
ssh root@146.190.132.152 'nginx -t'
ssh root@146.190.132.152 'systemctl status nginx'
```

**Check firewall:**
```bash
ssh root@146.190.132.152 'ufw status'
```

**Verify port 80 is open:**
```bash
ssh root@146.190.132.152 'netstat -tuln | grep :80'
```

#### 3. Database connection errors

**Verify MongoDB is running:**
```bash
ssh root@146.190.132.152 'systemctl status mongod'
```

**Test connection:**
```bash
ssh root@146.190.132.152 'mongo --eval "db.adminCommand({ping: 1})"'
```

**Check MongoDB logs:**
```bash
ssh root@146.190.132.152 'tail -f /var/log/mongodb/mongod.log'
```

#### 4. High memory usage

**Check memory:**
```bash
ssh root@146.190.132.152 'free -h'
```

**Restart application:**
```bash
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
```

---

## Backup & Recovery

### Automated Backups

Backups run automatically daily at 2 AM via cron job.

**Manual backup:**
```bash
ssh root@146.190.132.152 '/var/www/alpaca-trader/scripts/backup-db.sh'
```

**List backups:**
```bash
ssh root@146.190.132.152 'ls -lh /var/backups/alpaca-trader/mongodb/'
```

### Restore from Backup

```bash
# Download backup from server
scp root@146.190.132.152:/var/backups/alpaca-trader/mongodb/mongodb_backup_TIMESTAMP.tar.gz ./

# Extract backup
tar -xzf mongodb_backup_TIMESTAMP.tar.gz

# Restore to MongoDB
mongorestore --db alpacatrader ./mongodb_backup_TIMESTAMP/alpacatrader
```

### Application Backup

Application backups are created automatically before each deployment in:
```
/var/backups/alpaca-trader/backup_TIMESTAMP.tar.gz
```

**Manual application backup:**
```bash
ssh root@146.190.132.152 << 'EOF'
  cd /var/www/alpaca-trader
  tar -czf /var/backups/alpaca-trader/manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
EOF
```

---

## Security Best Practices

### 1. SSL/TLS Configuration

**Install Certbot for Let's Encrypt:**
```bash
ssh root@146.190.132.152
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 2. Update Environment Secrets

Regularly rotate:
- JWT secrets
- Encryption keys
- Database passwords

### 3. Keep System Updated

```bash
ssh root@146.190.132.152 'apt-get update && apt-get upgrade -y'
```

### 4. Monitor Security

**Check failed login attempts:**
```bash
ssh root@146.190.132.152 'grep "Failed password" /var/log/auth.log | tail -20'
```

**View fail2ban status:**
```bash
ssh root@146.190.132.152 'fail2ban-client status'
```

---

## Redeployment

To deploy updates:

```bash
# From local machine
./deploy.sh
```

This will:
- Create backup of current version
- Build new version
- Deploy with zero downtime

---

## Useful Commands Reference

### Quick Commands

```bash
# Deploy application
./deploy.sh

# Restart app
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'

# View logs
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server'

# Backup database
ssh root@146.190.132.152 '/var/www/alpaca-trader/scripts/backup-db.sh'

# Check status
ssh root@146.190.132.152 'pm2 status && systemctl status nginx && systemctl status mongod'
```

---

## Support & Resources

- **Application Logs:** `/var/www/alpaca-trader/logs/`
- **Nginx Logs:** `/var/log/nginx/`
- **MongoDB Logs:** `/var/log/mongodb/`
- **Backups:** `/var/backups/alpaca-trader/`

---

## Deployment Checklist

- [ ] Server setup script executed
- [ ] Environment variables configured
- [ ] MongoDB database created
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Application deployed successfully
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] Health check endpoint responding
- [ ] Frontend accessible via browser
- [ ] Automated backups configured
- [ ] SSL certificate installed (optional)
- [ ] Monitoring configured

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Server IP:** 146.190.132.152

**Application URL:** http://146.190.132.152

**Version:** _________________
