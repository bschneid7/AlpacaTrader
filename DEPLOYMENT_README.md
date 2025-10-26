# AlpacaTrader - Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20.x (for local development only)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository

```bash
git clone https://github.com/bschneid7/AlpacaTrader.git
cd AlpacaTrader
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit with your actual credentials
nano server/.env
```

**Required variables:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `DATABASE_URL` - Same as MONGODB_URI
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `REFRESH_TOKEN_SECRET` - Generate with: `openssl rand -hex 32`
- `ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`

**Optional variables:**
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features

### 3. Set Up SSL Certificates

#### For Production (Self-Signed):

```bash
mkdir -p nginx/ssl
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj '/C=US/ST=State/L=City/O=Organization/CN=your-server-ip-or-domain'
cd ../..
```

#### For Production (Let's Encrypt):

If you have a domain name, you can use Let's Encrypt after deployment:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 4. Build and Start

```bash
# Build Docker images
docker-compose build

# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access the Application

- **HTTPS (Recommended):** https://your-server-ip
- **HTTP (Redirects to HTTPS):** http://your-server-ip

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Internet / Users                  │
└────────────────┬────────────────────────────┘
                 │
        ┌────────▼────────┐
        │   Port 80/443   │
        │  (HTTP/HTTPS)   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Nginx Container │
        │  Static Files   │
        │  Reverse Proxy  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Server Container│
        │  Node.js API    │
        │   Port 3000     │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ MongoDB Atlas   │
        │    (Cloud)      │
        └─────────────────┘
```

---

## Docker Services

### Client Container
- **Image:** nginx:alpine
- **Ports:** 80, 443
- **Purpose:** Serves React frontend and proxies API requests
- **Build:** Multi-stage (Node.js builder → Nginx runtime)

### Server Container
- **Image:** node:20-alpine
- **Ports:** 3000
- **Purpose:** Runs Node.js/Express backend API
- **Dependencies:** MongoDB Atlas, Environment variables

---

## Management Commands

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client

# Check status
docker-compose ps

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

### Using Management Script

The deployment includes a management script for easier operations:

```bash
# Make it executable (first time only)
chmod +x manage-alpacatrader.sh

# Available commands
./manage-alpacatrader.sh status
./manage-alpacatrader.sh start
./manage-alpacatrader.sh stop
./manage-alpacatrader.sh restart
./manage-alpacatrader.sh logs
./manage-alpacatrader.sh logs-server
./manage-alpacatrader.sh logs-client
./manage-alpacatrader.sh update  # Pull from git and rebuild
```

---

## Updating the Application

### From Git

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Or use the management script

```bash
./manage-alpacatrader.sh update
```

---

## Monitoring

### Health Checks

```bash
# Check if containers are running
docker-compose ps

# Check resource usage
docker stats --no-stream

# Test frontend
curl -k https://localhost

# Test backend
curl -k https://localhost/api/health
```

### Logs

```bash
# Real-time logs (all services)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Server logs only
docker-compose logs -f server

# Search logs
docker-compose logs | grep ERROR
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs server

# Common issues:
# 1. Missing .env file
# 2. Invalid MongoDB connection string
# 3. Port already in use
```

### Database Connection Failed

```bash
# Verify MongoDB Atlas:
# 1. Cluster is running (not paused)
# 2. Network access allows your server IP
# 3. Database user credentials are correct

# Test connection from server
docker-compose exec server sh
# Inside container:
npm run test:connection
```

### Port Conflicts

```bash
# Check what's using the ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Stop conflicting services
sudo systemctl stop apache2  # or nginx
```

### SSL Certificate Issues

```bash
# Regenerate self-signed certificate
cd nginx/ssl
rm cert.pem key.pem
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj '/C=US/ST=State/L=City/O=Org/CN=your-ip'

# Restart containers
docker-compose restart
```

### Rebuild from Scratch

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file to Git
   - Use strong, randomly generated secrets
   - Rotate secrets periodically

2. **SSL/TLS**
   - Use Let's Encrypt for production with domain
   - Keep certificates up to date
   - Enforce HTTPS (HTTP redirects enabled)

3. **MongoDB**
   - Use MongoDB Atlas (managed, secure)
   - Enable network access restrictions
   - Use strong database passwords

4. **Docker**
   - Keep Docker and images updated
   - Use non-root users in containers (already configured)
   - Limit container resources if needed

5. **Firewall**
   - Only expose necessary ports (80, 443)
   - Block direct access to port 3000 externally

---

## Production Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with strong password
- [ ] Network access configured in MongoDB Atlas
- [ ] `.env` file created and configured
- [ ] SSL certificates generated
- [ ] Firewall rules configured
- [ ] Docker and Docker Compose installed
- [ ] Application built and running
- [ ] HTTPS accessible from browser
- [ ] API endpoints responding
- [ ] Background jobs running
- [ ] Backups configured for MongoDB
- [ ] Monitoring set up
- [ ] Alert notifications configured

---

## Backup & Recovery

### Backup Environment File

```bash
# Create backup
cp server/.env server/.env.backup

# Copy to safe location
scp server/.env user@backup-server:/backups/
```

### MongoDB Backup

MongoDB Atlas provides automated backups. Configure them in the Atlas dashboard:
1. Go to your cluster
2. Click Backup tab
3. Enable Cloud Backup
4. Configure retention policy

### Container Data

Docker volumes are ephemeral. All persistent data is in MongoDB Atlas.

---

## Performance Tuning

### Docker Resources

Edit `docker-compose.yml` to set resource limits:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Node.js Memory

Set in `docker-compose.yml`:

```yaml
services:
  server:
    environment:
      - NODE_OPTIONS=--max-old-space-size=1024
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Support

For issues specific to this application:
1. Check the logs: `docker-compose logs`
2. Review `DEPLOYMENT_INFO.md`
3. Check MongoDB Atlas dashboard
4. Verify environment variables

---

**Last Updated:** October 18, 2025
