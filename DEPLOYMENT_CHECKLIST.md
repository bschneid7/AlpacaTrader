# AlpacaTrader Deployment Checklist

Use this checklist to ensure a smooth deployment to your production server.

## Pre-Deployment Checklist

### Local Environment
- [ ] All code changes committed
- [ ] All tests passing (`npm run lint`)
- [ ] Application runs successfully in development (`npm run start`)
- [ ] No console errors in browser
- [ ] API endpoints tested and working
- [ ] Database seeding scripts tested

### Production Server Access
- [ ] SSH access confirmed: `ssh root@146.190.132.152`
- [ ] Server has Ubuntu LTS installed
- [ ] Root or sudo access available

## Server Setup Checklist

### 1. System Prerequisites
```bash
ssh root@146.190.132.152
```

- [ ] Update system packages
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

- [ ] Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be 18.x or higher
```

- [ ] Install MongoDB
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
sudo systemctl status mongodb  # Should be active
```

- [ ] Install Nginx
```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx  # Should be active
```

- [ ] Install PM2
```bash
sudo npm install -g pm2
pm2 --version  # Verify installation
```

- [ ] Install Git (if using Git deployment)
```bash
sudo apt-get install -y git
```

### 2. Create Application Directory
- [ ] Create directory structure
```bash
mkdir -p /var/www/alpacatrader
mkdir -p /var/www/alpacatrader/logs
mkdir -p /var/backups/mongodb
```

- [ ] Set ownership
```bash
chown -R www-data:www-data /var/www/alpacatrader
```

## Deployment Checklist

### Option A: Automated Deployment (Recommended)

- [ ] Make deployment script executable
```bash
chmod +x deploy.sh
```

- [ ] Run deployment script
```bash
./deploy.sh
```

- [ ] Monitor deployment output for errors

### Option B: Manual Deployment

- [ ] Upload code to server
```bash
cd /pythagora/pythagora-core/workspace
tar -czf AlpacaTrader.tar.gz AlpacaTrader/
scp AlpacaTrader.tar.gz root@146.190.132.152:/tmp/
```

- [ ] Extract on server
```bash
ssh root@146.190.132.152
cd /var/www/alpacatrader
tar -xzf /tmp/AlpacaTrader.tar.gz --strip-components=1
```

- [ ] Install dependencies
```bash
cd /var/www/alpacatrader
npm install
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

- [ ] Build application
```bash
cd /var/www/alpacatrader
npm run build
```

## Configuration Checklist

### 1. Environment Variables
- [ ] Copy production env template
```bash
cd /var/www/alpacatrader/server
cp .env.production .env
```

- [ ] Generate JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy output and update JWT_SECRET in .env

- [ ] Generate ENCRYPTION_KEY
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output and update ENCRYPTION_KEY in .env

- [ ] Update MongoDB URI in .env
```env
MONGODB_URI=mongodb://localhost:27017/alpacatrader
```

- [ ] Update CORS_ORIGIN in .env
```env
CORS_ORIGIN=http://146.190.132.152
```

- [ ] Set NODE_ENV to production
```env
NODE_ENV=production
```

- [ ] Verify all required variables are set
```bash
cat /var/www/alpacatrader/server/.env
```

### 2. Nginx Configuration
- [ ] Copy Nginx config
```bash
sudo cp /var/www/alpacatrader/nginx.conf /etc/nginx/sites-available/alpacatrader
```

- [ ] Create symlink
```bash
sudo ln -s /etc/nginx/sites-available/alpacatrader /etc/nginx/sites-enabled/
```

- [ ] Test Nginx configuration
```bash
sudo nginx -t
```

- [ ] Remove default site (optional)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

- [ ] Restart Nginx
```bash
sudo systemctl restart nginx
```

- [ ] Verify Nginx is running
```bash
sudo systemctl status nginx
```

### 3. PM2 Configuration
- [ ] Start application with PM2
```bash
cd /var/www/alpacatrader
pm2 start ecosystem.config.js
```

- [ ] Verify application is running
```bash
pm2 status
```

- [ ] Save PM2 configuration
```bash
pm2 save
```

- [ ] Setup PM2 to start on boot
```bash
pm2 startup
# Follow the command output instructions
```

- [ ] Test auto-restart
```bash
pm2 restart alpacatrader-server
pm2 status  # Should show online
```

### 4. Firewall Configuration
- [ ] Configure UFW firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (for future SSL)
sudo ufw enable
sudo ufw status
```

### 5. Database Setup
- [ ] Verify MongoDB is accessible
```bash
mongosh alpacatrader --eval "db.stats()"
```

- [ ] Run database seeding (optional)
```bash
cd /var/www/alpacatrader/server
npm run seed
```

- [ ] Verify admin user created
```bash
mongosh alpacatrader --eval "db.users.findOne({email: 'admin@alpacatrader.com'})"
```

## Verification Checklist

### 1. Application Health Checks
- [ ] Check PM2 status
```bash
pm2 status
# alpacatrader-server should be 'online'
```

- [ ] Check application logs
```bash
pm2 logs alpacatrader-server --lines 50
# Should see "Server running at http://localhost:3000"
# Should see "MongoDB Connected"
```

- [ ] Test API endpoint
```bash
curl http://localhost:3000/api/ping
# Should return: {"message":"pong"}
```

### 2. Nginx Health Checks
- [ ] Check Nginx status
```bash
sudo systemctl status nginx
# Should be active (running)
```

- [ ] Test Nginx from localhost
```bash
curl http://localhost
# Should return HTML
```

- [ ] Test API proxy through Nginx
```bash
curl http://localhost/api/ping
# Should return: {"message":"pong"}
```

### 3. External Access Checks
- [ ] Test from external network
```bash
# From your local machine (not on server)
curl http://146.190.132.152/api/ping
```

- [ ] Open in browser
```
http://146.190.132.152
```

- [ ] Verify frontend loads correctly

- [ ] Test user registration/login

- [ ] Test API endpoints from frontend

### 4. Database Checks
- [ ] Verify MongoDB connection
```bash
sudo systemctl status mongodb
```

- [ ] Check database exists
```bash
mongosh alpacatrader --eval "db.stats()"
```

- [ ] Verify collections created
```bash
mongosh alpacatrader --eval "db.getCollectionNames()"
```

## Post-Deployment Checklist

### 1. Security Hardening
- [ ] Change default passwords
- [ ] Verify .env file permissions (should be 600)
```bash
chmod 600 /var/www/alpacatrader/server/.env
```

- [ ] Setup fail2ban (optional but recommended)
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

- [ ] Review firewall rules
```bash
sudo ufw status verbose
```

### 2. SSL/HTTPS Setup (Highly Recommended)
- [ ] Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

- [ ] Obtain SSL certificate (requires domain name)
```bash
sudo certbot --nginx -d yourdomain.com
```

- [ ] Test certificate renewal
```bash
sudo certbot renew --dry-run
```

- [ ] Update CORS_ORIGIN to use https://
```bash
nano /var/www/alpacatrader/server/.env
# Change to: CORS_ORIGIN=https://yourdomain.com
pm2 restart alpacatrader-server
```

### 3. Backup Setup
- [ ] Create backup script
```bash
sudo nano /usr/local/bin/backup-alpacatrader.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --db alpacatrader --out $BACKUP_DIR/$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} + 2>/dev/null
echo "Backup completed: $DATE"
```

- [ ] Make backup script executable
```bash
sudo chmod +x /usr/local/bin/backup-alpacatrader.sh
```

- [ ] Test backup script
```bash
sudo /usr/local/bin/backup-alpacatrader.sh
```

- [ ] Setup automated backups (cron)
```bash
sudo crontab -e
# Add this line: 0 2 * * * /usr/local/bin/backup-alpacatrader.sh
```

### 4. Monitoring Setup
- [ ] Setup PM2 monitoring
```bash
pm2 install pm2-logrotate
```

- [ ] Configure log rotation
```bash
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

- [ ] Test monitoring
```bash
pm2 monit
```

### 5. Performance Optimization
- [ ] Enable Nginx gzip compression (already in config)

- [ ] Verify compression is working
```bash
curl -H "Accept-Encoding: gzip" -I http://localhost
# Should see: Content-Encoding: gzip
```

- [ ] Check MongoDB indexes
```bash
mongosh alpacatrader --eval "db.users.getIndexes()"
```

### 6. Documentation
- [ ] Document server credentials (in secure location)
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create runbook for common issues

## Troubleshooting Checklist

### Application Won't Start
- [ ] Check PM2 logs: `pm2 logs alpacatrader-server`
- [ ] Verify .env file exists: `ls -la /var/www/alpacatrader/server/.env`
- [ ] Check MongoDB is running: `sudo systemctl status mongodb`
- [ ] Check port 3000 is free: `sudo netstat -tlnp | grep 3000`
- [ ] Verify Node.js version: `node --version`

### Can't Access from Browser
- [ ] Check Nginx is running: `sudo systemctl status nginx`
- [ ] Check firewall: `sudo ufw status`
- [ ] Test locally first: `curl http://localhost`
- [ ] Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Database Connection Issues
- [ ] Check MongoDB status: `sudo systemctl status mongodb`
- [ ] Verify connection string: `cat /var/www/alpacatrader/server/.env | grep MONGODB_URI`
- [ ] Test connection: `mongosh alpacatrader`
- [ ] Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongodb.log`

### API Errors
- [ ] Check application logs: `pm2 logs alpacatrader-server`
- [ ] Verify JWT_SECRET is set: `cat /var/www/alpacatrader/server/.env | grep JWT_SECRET`
- [ ] Check CORS settings: `cat /var/www/alpacatrader/server/.env | grep CORS_ORIGIN`
- [ ] Test API directly: `curl http://localhost:3000/api/ping`

## Success Criteria

Deployment is successful when all of the following are true:

- [✓] Server is accessible via SSH
- [✓] MongoDB is running and accessible
- [✓] Nginx is running and serving traffic
- [✓] PM2 shows application as "online"
- [✓] Application accessible at http://146.190.132.152
- [✓] API endpoint responds: http://146.190.132.152/api/ping
- [✓] Frontend loads without errors
- [✓] Can register/login successfully
- [✓] Database operations work correctly
- [✓] Logs show no critical errors
- [✓] Application auto-restarts on server reboot
- [✓] Firewall configured correctly
- [✓] Backups scheduled and tested

## Rollback Plan

If deployment fails:

1. **Stop the new version**
```bash
pm2 stop alpacatrader-server
```

2. **Restore from backup** (if backup exists)
```bash
cd /var/www/alpacatrader
tar -xzf /tmp/alpacatrader-backup-TIMESTAMP.tar.gz
```

3. **Restart application**
```bash
pm2 restart alpacatrader-server
```

4. **Verify old version works**
```bash
curl http://146.190.132.152/api/ping
```

## Contact Information

**Server Details:**
- IP: 146.190.132.152
- OS: Ubuntu LTS
- Application Path: /var/www/alpacatrader
- Logs Path: /var/www/alpacatrader/logs

**Key Commands:**
- View logs: `pm2 logs alpacatrader-server`
- Restart app: `pm2 restart alpacatrader-server`
- Check status: `pm2 status`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## Next Steps After Successful Deployment

1. Test all features thoroughly
2. Connect Alpaca paper trading account (test mode)
3. Test auto-trading with small amounts
4. Monitor logs for 24-48 hours
5. Setup SSL certificate with domain
6. Configure email notifications
7. Setup monitoring alerts
8. Create disaster recovery plan

---

**Last Updated:** January 2025
**Deployment Date:** _________________
**Deployed By:** _________________
**Notes:** _________________
