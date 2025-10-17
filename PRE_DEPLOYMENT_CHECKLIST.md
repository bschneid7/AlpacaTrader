# Pre-Deployment Checklist for AlpacaTrader

Use this checklist before deploying to production server (146.190.132.152).

---

## 🔧 Local Development Verification

### Code Quality
- [ ] All tests passing locally
- [ ] No TypeScript compilation errors
- [ ] Linter passes without errors: `npm run lint`
- [ ] All recent changes committed to version control

### Build Verification
- [ ] Test local build: `./scripts/deploy-local.sh`
- [ ] Server builds successfully: `cd server && npm run build`
- [ ] Client builds successfully: `cd client && npm run build`
- [ ] Shared module builds successfully: `cd shared && npm run build`

### Environment Configuration
- [ ] `.env` file configured in `server/` directory
- [ ] All required environment variables set
- [ ] Secrets generated securely (use `openssl rand -base64 32`)
- [ ] MongoDB URI is correct
- [ ] API keys (if any) are properly configured

---

## 🖥️ Server Preparation

### Initial Server Setup (One-time)
- [ ] Server is accessible via SSH: `ssh root@146.190.132.152`
- [ ] Server setup script executed: `scripts/setup-server.sh`
- [ ] All required software installed:
  - [ ] Node.js 20+
  - [ ] MongoDB 7.0+
  - [ ] Nginx
  - [ ] PM2
  - [ ] Git
  - [ ] fail2ban

### Server Configuration
- [ ] Firewall configured (UFW):
  - [ ] Port 22 (SSH) open
  - [ ] Port 80 (HTTP) open
  - [ ] Port 443 (HTTPS) open
  - [ ] All other ports blocked
- [ ] MongoDB running: `systemctl status mongod`
- [ ] Nginx running: `systemctl status nginx`
- [ ] Sufficient disk space (at least 5GB free)
- [ ] Sufficient memory (at least 2GB available)

### Application Directories
- [ ] `/var/www/alpaca-trader` directory exists
- [ ] `/var/backups/alpaca-trader` directory exists
- [ ] Proper permissions set on directories

---

## 🔐 Security Configuration

### Credentials
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] Strong JWT_REFRESH_SECRET generated (32+ characters)
- [ ] Strong ENCRYPTION_KEY generated (32 characters)
- [ ] Strong SESSION_SECRET generated (32+ characters)
- [ ] MongoDB credentials configured
- [ ] Alpaca API keys encrypted in database

### Environment File
- [ ] `server/.env` created on server
- [ ] All sensitive data in `.env` (not in code)
- [ ] `.env` file permissions set to 600 (read/write owner only)
- [ ] `.env` not committed to version control

### Security Measures
- [ ] SSH key-based authentication configured (recommended)
- [ ] Root password is strong (if using password auth)
- [ ] fail2ban configured and running
- [ ] Regular security updates scheduled
- [ ] Database authentication enabled

---

## 💾 Database Setup

### MongoDB Configuration
- [ ] MongoDB running on server
- [ ] Database created: `alpacatrader`
- [ ] Database user created with appropriate permissions
- [ ] Connection string tested
- [ ] Backup strategy in place

### Initial Data (Optional)
- [ ] Seed data script available: `server/scripts/seed.ts`
- [ ] Admin user credentials decided
- [ ] Test data prepared (if needed)

---

## 📦 Deployment Files

### Required Files Present
- [ ] `deploy.sh` - Main deployment script
- [ ] `ecosystem.config.js` - PM2 configuration
- [ ] `nginx.conf` - Nginx configuration
- [ ] `scripts/setup-server.sh` - Server setup
- [ ] `scripts/backup-db.sh` - Backup script
- [ ] `scripts/check-deployment.sh` - Health check
- [ ] `scripts/deploy-local.sh` - Local testing

### Scripts Executable
- [ ] `chmod +x deploy.sh` executed
- [ ] `chmod +x scripts/*.sh` executed

---

## 🌐 Network Configuration

### DNS (If using domain)
- [ ] Domain DNS configured (if applicable)
- [ ] A record points to 146.190.132.152
- [ ] DNS propagation complete (check with `nslookup`)

### SSL/TLS (Recommended)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Certificate files in place
- [ ] Nginx HTTPS configuration ready
- [ ] Auto-renewal configured for certificate

### Firewall
- [ ] UFW enabled and configured
- [ ] Only necessary ports open
- [ ] Rate limiting configured (if needed)

---

## 📝 Documentation Review

### Documentation Read
- [ ] Read `DEPLOYMENT.md` fully
- [ ] Read `QUICK_DEPLOY.md` for quick reference
- [ ] Reviewed `DEPLOYMENT_SUMMARY.md`
- [ ] Understood rollback procedure

### Monitoring Setup
- [ ] Know how to check logs: `pm2 logs`
- [ ] Know how to check status: `pm2 status`
- [ ] Health check script tested: `./scripts/check-deployment.sh`
- [ ] Monitoring strategy planned

---

## 🚀 Pre-Deployment Actions

### Backup Current State
- [ ] Backup any existing deployment (if updating)
- [ ] Database backup taken (if updating)
- [ ] Rollback plan documented

### Communication
- [ ] Team notified of deployment
- [ ] Maintenance window communicated (if applicable)
- [ ] Rollback contact person identified

### Testing Strategy
- [ ] Test plan prepared
- [ ] Test user accounts ready
- [ ] Post-deployment verification steps listed

---

## 🎯 Deployment Execution

### Pre-Deployment Verification
- [ ] All checklist items above completed
- [ ] Local build successful
- [ ] Server accessible and ready
- [ ] Team ready for deployment

### Deployment Steps
- [ ] Run deployment: `./deploy.sh`
- [ ] Monitor deployment progress
- [ ] Wait for completion message
- [ ] Note any errors or warnings

### Post-Deployment Verification
- [ ] Run health check: `./scripts/check-deployment.sh`
- [ ] Application accessible: http://146.190.132.152
- [ ] API responding: http://146.190.132.152/api/ping
- [ ] PM2 status shows "online"
- [ ] No errors in logs: `pm2 logs --lines 50`

---

## ✅ Post-Deployment Testing

### Functional Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] API endpoints responding
- [ ] Database operations working

### Integration Testing
- [ ] Alpaca API connection (if configured)
- [ ] Auto-trading toggle works
- [ ] Position tracking works
- [ ] Order placement works (paper trading)

### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times < 200ms
- [ ] No memory leaks observed
- [ ] CPU usage reasonable

---

## 🔄 Monitoring & Maintenance

### Immediate Post-Deployment
- [ ] Monitor logs for errors (first 30 minutes)
- [ ] Check application status every 15 minutes (first hour)
- [ ] Verify database operations
- [ ] Monitor server resources

### Ongoing Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Schedule regular backups (daily at 2 AM)
- [ ] Plan weekly health checks

---

## 🆘 Emergency Contacts & Procedures

### Contact Information
- Server IP: `146.190.132.152`
- SSH Access: `ssh root@146.190.132.152`
- Emergency Email: [Your email]
- Team Slack/Discord: [Your channel]

### Emergency Procedures
- **Application Down**:
  ```bash
  ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
  ```
- **Database Issues**:
  ```bash
  ssh root@146.190.132.152 'systemctl restart mongod'
  ```
- **Full Rollback**: See DEPLOYMENT.md → Rollback Procedure

---

## 📊 Success Criteria

Deployment is successful when ALL of these are true:

✅ **Application Status**
- [ ] Application accessible at http://146.190.132.152
- [ ] API health check returns 200 OK
- [ ] PM2 shows status "online"
- [ ] No errors in application logs

✅ **Services Status**
- [ ] Nginx running and configured
- [ ] MongoDB running and connected
- [ ] PM2 process manager active
- [ ] Firewall configured correctly

✅ **Functionality**
- [ ] Users can register/login
- [ ] Dashboard loads correctly
- [ ] API requests succeed
- [ ] Database reads/writes work

✅ **Performance**
- [ ] Memory usage < 500MB
- [ ] CPU usage < 20% (idle)
- [ ] API response time < 200ms
- [ ] Page load time < 3 seconds

✅ **Security**
- [ ] HTTPS enabled (recommended)
- [ ] Firewall active
- [ ] Secrets not exposed
- [ ] Database authenticated

---

## 📋 Final Sign-Off

### Deployment Information
- **Date:** _______________
- **Time:** _______________
- **Deployed By:** _______________
- **Version:** _______________
- **Deployment Method:** [ ] Traditional [ ] Docker

### Sign-Off
- [ ] All checklist items completed
- [ ] All tests passing
- [ ] No critical errors
- [ ] Team notified of completion

**Signature:** _____________________

**Date:** _____________________

---

## 🎉 Post-Deployment

### Documentation Updates
- [ ] Update deployment date in docs
- [ ] Document any issues encountered
- [ ] Update runbook with any new procedures
- [ ] Share deployment notes with team

### Next Steps
- [ ] Monitor application for 24 hours
- [ ] Plan next iteration/updates
- [ ] Schedule first backup verification
- [ ] Review and optimize as needed

---

**Remember:** If anything goes wrong, don't panic!
1. Check logs: `pm2 logs`
2. Run health check: `./scripts/check-deployment.sh`
3. Review DEPLOYMENT.md troubleshooting section
4. Rollback if necessary (see DEPLOYMENT.md)

**Good luck with your deployment! 🚀**
