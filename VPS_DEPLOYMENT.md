# 🚀 CentOS 7 VPS Deployment Guide

## Quick Deployment Steps

### 1. Connect to your VPS

```bash
ssh root@your-vps-ip
```

### 2. Download and run the deployment script

```bash
# Download the deployment script
curl -O https://raw.githubusercontent.com/ElhassaneMhd/accReader/master/deploy-centos7.sh

# Make it executable
chmod +x deploy-centos7.sh

# Run the deployment
./deploy-centos7.sh
```

### 3. Update environment variables

```bash
# Edit the .env file with your VPS IP
nano .env

# Replace YOUR_VPS_IP with your actual VPS IP address
# Example: http://192.168.1.100:3000
```

### 4. Access your application

- **Frontend**: http://YOUR_VPS_IP:3000
- **API**: http://YOUR_VPS_IP:3999

## Manual Deployment (Alternative)

If you prefer manual deployment:

### 1. Install Docker on CentOS 7

```bash
# Update system
sudo yum update -y

# Install required packages
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Install Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone and deploy your application

```bash
# Clone repository
git clone https://github.com/ElhassaneMhd/accReader.git
cd accReader

# Create environment file
cp .env.example .env
nano .env  # Edit with your settings

# Open firewall ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3999/tcp
sudo firewall-cmd --reload

# Build and start
sudo docker-compose build
sudo docker-compose up -d
```

## Fixed Issues

### ✅ Auto-refresh Problem Fixed

- **Issue**: Latest imported data wasn't showing without manual reload
- **Solution**:
  - Added automatic UI refresh every 15 seconds when auto-import is enabled
  - Added "Refresh Data" button in ImportStatus component for manual refresh
  - Fixed data synchronization between backend imports and frontend display

### 🔧 Changes Made:

1. **useEmailData.js**: Added `forceRefresh` function and improved auto-refresh mechanism
2. **ImportStatus.jsx**: Added "Refresh Data" button for manual refresh
3. **App.jsx**: Connected forceRefresh function to ImportStatus component
4. **.env**: Updated ALLOWED_ORIGINS for external access

## Management Commands

```bash
# Check application status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f

# Restart application
sudo docker-compose restart

# Stop application
sudo docker-compose down

# Update application
git pull
sudo docker-compose build
sudo docker-compose up -d

# Check Docker status
sudo systemctl status docker
```

## Troubleshooting

### If the application doesn't start:

1. Check Docker status: `sudo systemctl status docker`
2. Check logs: `sudo docker-compose logs`
3. Verify ports are open: `sudo firewall-cmd --list-ports`

### If you can't access from outside:

1. Check your VPS provider's firewall settings
2. Verify .env ALLOWED_ORIGINS includes your IP
3. Check if ports 3000 and 3999 are accessible

### To enable SSL (recommended for production):

1. Get a domain name pointing to your VPS
2. Use Let's Encrypt with nginx reverse proxy
3. Update ALLOWED_ORIGINS with https:// URLs

## Security Notes

For production deployment:

- Use environment variables for sensitive data
- Set up SSL/TLS certificates
- Configure proper firewall rules
- Regular backup of data
- Monitor logs for security issues
