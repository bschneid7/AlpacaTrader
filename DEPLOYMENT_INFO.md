# AlpacaTrader - Deployment Complete! 🎉

## 🌐 Access Your Application

### Primary URL (HTTPS - Recommended)
**https://<your-server-ip>**

### HTTP URL (redirects to HTTPS)
**http://<your-server-ip>**

⚠️ **SSL Certificate Note**: Your browser will show a security warning because we're using a self-signed certificate. This is normal and safe for your personal use. Click "Advanced" → "Proceed to <your-server-ip>" to continue.

---

## 📊 Deployment Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Frontend** | ✅ Running | React + Vite app served by Nginx |
| **Backend** | ✅ Running | Node.js/Express API server |
| **Database** | ✅ Connected | MongoDB Atlas (Cluster0) |
| **SSL/HTTPS** | ✅ Enabled | Self-signed certificate (valid 365 days) |
| **Docker** | ✅ Running | 2 containers orchestrated by Docker Compose |

---

## 🔧 Server Management

### Quick Commands

Run these commands from your server (SSH: `ssh <username>@<your-server-ip>`):

```bash
# Check application status
./manage-alpacatrader.sh status

# View logs (all services)
./manage-alpacatrader.sh logs

# View server logs only
./manage-alpacatrader.sh logs-server

# View nginx/frontend logs only
./manage-alpacatrader.sh logs-client

# Restart the application
./manage-alpacatrader.sh restart

# Stop the application
./manage-alpacatrader.sh stop

# Start the application
./manage-alpacatrader.sh start

# Update from GitHub (pull latest code and rebuild)
./manage-alpacatrader.sh update
```

---

## 🔐 Environment Configuration

Your environment variables are stored in:
- **Location**: `/home/<username>/AlpacaTrader/server/.env`
- **Configured Variables**:
  - ✅ `DATABASE_URL` - MongoDB Atlas connection
  - ✅ `MONGODB_URI` - MongoDB Atlas connection (alternative)
  - ✅ `JWT_SECRET` - Auto-generated secure secret
  - ✅ `REFRESH_TOKEN_SECRET` - Auto-generated secure secret
  - ✅ `ENCRYPTION_KEY` - Auto-generated secure secret
  - ⚠️ `OPENAI_API_KEY` - **Empty** (add through UI or manually)
  - ⚠️ `ANTHROPIC_API_KEY` - **Empty** (add through UI or manually)

### To Add API Keys Later

```bash
# SSH into your server
ssh <username>@<your-server-ip>

# Edit the .env file
nano ~/AlpacaTrader/server/.env

# Add your keys:
# OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=your-key-here

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart the server
./manage-alpacatrader.sh restart
```

---

## 📁 Application Structure

```
/home/<username>/AlpacaTrader/
├── client/                  # Frontend (React/Vite)
├── server/                  # Backend (Node.js/Express)
│   └── .env                # Environment variables
├── shared/                  # Shared TypeScript types
├── nginx/                   # Nginx configuration
│   ├── default.conf        # Reverse proxy config
│   └── ssl/                # SSL certificates
│       ├── cert.pem        # SSL certificate
│       └── key.pem         # SSL private key
├── Dockerfile.client       # Client container config
├── Dockerfile.server       # Server container config
└── docker-compose.yml      # Docker orchestration
```

---

## 🚀 Next Steps

1. **Access Your App**
   - Open https://<your-server-ip> in your browser
   - Accept the SSL certificate warning
   - You should see the AlpacaTrader login/signup page

2. **Create Your Account**
   - Register a new account
   - The first user you create will be able to use the system

3. **Connect Alpaca API**
   - Log in to your account
   - Go to Settings
   - Add your Alpaca API credentials (Paper Trading recommended first)
   - Test the connection

4. **Configure Trading Strategy**
   - Set up your trading universe (symbols to trade)
   - Configure EMA/ATR parameters
   - Set risk management settings
   - Enable auto-trading when ready

5. **Optional: Add AI API Keys**
   - If you want to use AI features, add your OpenAI/Anthropic keys
   - Edit the .env file as shown above
   - Restart the application

---

## 🛠️ Troubleshooting

### Application Not Loading?

```bash
# Check if containers are running
./manage-alpacatrader.sh status

# Check server logs for errors
./manage-alpacatrader.sh logs-server

# Restart if needed
./manage-alpacatrader.sh restart
```

### Database Connection Issues?

```bash
# Check MongoDB Atlas:
# 1. Cluster is running (not paused)
# 2. Network access allows your server IP (<your-server-ip>)
# 3. Database user credentials are correct

# Check connection in logs
./manage-alpacatrader.sh logs-server | grep MongoDB
```

### SSL Certificate Expired? (After 365 days)

```bash
# SSH into server
ssh <username>@<your-server-ip>

# Regenerate certificate
cd ~/AlpacaTrader/nginx/ssl
sudo rm cert.pem key.pem
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj '/C=US/ST=California/L=Sacramento/O=AlpacaTrader/CN=<your-server-ip>'

# Restart containers
cd ~/AlpacaTrader
sudo docker-compose restart
```

---

## 📊 Monitoring & Logs

### View Real-time Logs

```bash
# All logs
./manage-alpacatrader.sh logs

# Server only
./manage-alpacatrader.sh logs-server

# Press Ctrl+C to stop viewing logs
```

### Check Docker Container Health

```bash
cd ~/AlpacaTrader
sudo docker-compose ps
sudo docker stats --no-stream
```

---

## 🔄 Updating the Application

When you push new code to GitHub:

```bash
# SSH into server
ssh <username>@<your-server-ip>

# Update application
./manage-alpacatrader.sh update

# This will:
# 1. Pull latest code from GitHub
# 2. Rebuild Docker images
# 3. Restart containers with new code
```

---

## 🔒 Security Notes

1. **SSL Certificate**: Self-signed (browser warning is normal)
2. **Firewall**: Ports 80 and 443 are open for web access
3. **Secrets**: All secrets are auto-generated and secure
4. **MongoDB**: Credentials stored in .env file
5. **Alpaca API**: Users add their own credentials through UI

### To Add a Proper SSL Certificate (Optional)

If you get a domain name later, you can use Let's Encrypt for free SSL:

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

## 📝 Important Files

| File | Purpose | Backup? |
|------|---------|---------|
| `/home/<username>/AlpacaTrader/server/.env` | Environment variables & secrets | ✅ Yes |
| `/home/<username>/AlpacaTrader/nginx/ssl/` | SSL certificates | ⚠️ Regenerable |
| `/home/<username>/manage-alpacatrader.sh` | Management script | ⚠️ Regenerable |

### Backup Your .env File

```bash
# Create backup
cp ~/AlpacaTrader/server/.env ~/AlpacaTrader/server/.env.backup

# Copy to your local machine
scp <username>@<your-server-ip>:~/AlpacaTrader/server/.env ~/Desktop/alpacatrader-env-backup.txt
```

---

## 🆘 Support

If you encounter issues:

1. Check the logs: `./manage-alpacatrader.sh logs-server`
2. Verify MongoDB Atlas cluster is running
3. Ensure Docker containers are up: `./manage-alpacatrader.sh status`
4. Try restarting: `./manage-alpacatrader.sh restart`

---

## 🎯 Generated Secrets

Your application is secured with these auto-generated secrets:

- **JWT Secret**: `<your-generated-secret-here>`
- **Refresh Token Secret**: `<your-generated-secret-here>`
- **Encryption Key**: `<your-generated-secret-here>`

**Keep these safe!** They're stored in your .env file and should not be shared.

---

## 🎊 Deployment Complete!

Your AlpacaTrader application is now live and running at:

### **https://<your-server-ip>**

The application will automatically start when the server reboots thanks to Docker's restart policy.

---

**Deployment Date**: October 18, 2025 02:54 UTC
**Server**: Ubuntu 22.04 LTS on DigitalOcean
**Docker Version**: 28.2.2
**Node.js Version**: 20.19.5
