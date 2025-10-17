# AlpacaTrader - Quick Deployment Reference

## 🚀 First Time Setup (One Time Only)

### 1. Setup Server (15 minutes)
```bash
scp scripts/setup-server.sh root@146.190.132.152:/tmp/
ssh root@146.190.132.152 'bash /tmp/setup-server.sh'
```

### 2. Configure Environment
```bash
ssh root@146.190.132.152
cd /var/www/alpaca-trader
mkdir -p server
nano server/.env
```

**Copy this and fill in secrets:**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/alpacatrader
JWT_SECRET=YOUR_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_SECRET_HERE
ENCRYPTION_KEY=YOUR_32_CHAR_KEY_HERE
SESSION_SECRET=YOUR_SECRET_HERE
CORS_ORIGIN=http://146.190.132.152
```

**Generate secrets:**
```bash
openssl rand -base64 32  # For JWT secrets
openssl rand -hex 16     # For encryption key
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔄 Regular Deployment

```bash
./deploy.sh
```

That's it! The script handles everything.

---

## 🔍 Quick Health Check

```bash
./scripts/check-deployment.sh
```

Or manually:
```bash
curl http://146.190.132.152/api/ping
# Should return: {"message":"pong"}
```

---

## 📊 Monitoring Commands

| Task | Command |
|------|---------|
| View logs | `ssh root@146.190.132.152 'pm2 logs alpaca-trader-server'` |
| Check status | `ssh root@146.190.132.152 'pm2 status'` |
| Restart app | `ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'` |
| Stop app | `ssh root@146.190.132.152 'pm2 stop alpaca-trader-server'` |
| Monitor resources | `ssh root@146.190.132.152 'pm2 monit'` |

---

## 🐛 Quick Troubleshooting

### App won't start?
```bash
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --err'
```

### Can't access website?
```bash
ssh root@146.190.132.152 'systemctl status nginx'
ssh root@146.190.132.152 'nginx -t'
```

### Database issues?
```bash
ssh root@146.190.132.152 'systemctl status mongod'
```

### Restart everything:
```bash
ssh root@146.190.132.152 'systemctl restart mongod && pm2 restart alpaca-trader-server && systemctl restart nginx'
```

---

## 💾 Backup & Restore

### Manual Backup
```bash
ssh root@146.190.132.152 '/var/www/alpaca-trader/scripts/backup-db.sh'
```

### List Backups
```bash
ssh root@146.190.132.152 'ls -lh /var/backups/alpaca-trader/mongodb/'
```

### Restore
```bash
# Download backup
scp root@146.190.132.152:/var/backups/alpaca-trader/mongodb/mongodb_backup_TIMESTAMP.tar.gz ./

# Extract and restore
tar -xzf mongodb_backup_TIMESTAMP.tar.gz
mongorestore --db alpacatrader ./mongodb_backup_TIMESTAMP/alpacatrader
```

---

## 📍 Important URLs

- **Application:** http://146.190.132.152
- **API:** http://146.190.132.152/api
- **Health Check:** http://146.190.132.152/api/ping

---

## 📁 Important Paths

| What | Where |
|------|-------|
| Application | `/var/www/alpaca-trader` |
| App Logs | `/var/www/alpaca-trader/logs/` |
| Nginx Logs | `/var/log/nginx/` |
| MongoDB Logs | `/var/log/mongodb/` |
| Backups | `/var/backups/alpaca-trader/` |
| Environment | `/var/www/alpaca-trader/server/.env` |

---

## ⚡ One-Liners

```bash
# Full status check
ssh root@146.190.132.152 'pm2 status && systemctl status nginx --no-pager && systemctl status mongod --no-pager'

# Restart everything
ssh root@146.190.132.152 'pm2 restart all && systemctl restart nginx'

# Check disk space
ssh root@146.190.132.152 'df -h'

# Check memory
ssh root@146.190.132.152 'free -h'

# Last 50 log lines
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --lines 50'
```

---

## 🆘 Emergency Procedures

### App completely broken?
```bash
# Stop app
ssh root@146.190.132.152 'pm2 stop alpaca-trader-server'

# Check what went wrong
ssh root@146.190.132.152 'pm2 logs alpaca-trader-server --err --lines 100'

# Try restart
ssh root@146.190.132.152 'pm2 restart alpaca-trader-server'
```

### Rollback to previous version
```bash
ssh root@146.190.132.152 'ls -lt /var/backups/alpaca-trader/backup_*.tar.gz | head -1'
# Note the latest backup file

ssh root@146.190.132.152
cd /var/www/alpaca-trader
pm2 stop alpaca-trader-server
rm -rf *
tar -xzf /var/backups/alpaca-trader/backup_TIMESTAMP.tar.gz
pm2 start alpaca-trader-server
```

---

## 📚 Full Documentation

For detailed information, see:
- **DEPLOYMENT.md** - Complete deployment guide
- **scripts/README.md** - Scripts documentation

---

**Server IP:** 146.190.132.152
**Application:** AlpacaTrader
**Stack:** Node.js + Express + React + MongoDB
