#!/bin/bash

# PMTA Analytics - CentOS 7 VPS Deployment Script
# Run this script on your CentOS 7 VPS to deploy the application

echo "🚀 Starting PMTA Analytics deployment on CentOS 7..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install required packages
echo "🔧 Installing required packages..."
sudo yum install -y yum-utils device-mapper-persistent-data lvm2 git

# Add Docker repository
echo "🐳 Adding Docker repository..."
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
echo "🚀 Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional)
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔨 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone your repository (replace with your actual repo URL)
echo "📁 Cloning repository..."
if [ ! -d "accReader" ]; then
    git clone https://github.com/ElhassaneMhd/accReader.git
fi

cd accReader

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env << EOF
# PMTA Server Configuration
PMTA_HOST=91.229.239.75
PMTA_PORT=22
PMTA_USERNAME=root
PMTA_PASSWORD=Australia@!?0
PMTA_LOG_PATH=/var/log/pmta
PMTA_LOG_PATTERN=acct-*.csv

# Import Settings
IMPORT_INTERVAL=30000
IMPORT_PORT=3990
AUTO_IMPORT_ENABLED=true

# Security (for production) - Add your VPS IP
ALLOWED_ORIGINS=http://localhost:3000,http://0.0.0.0:3000,http://YOUR_VPS_IP:3000
EOF

echo "📝 Please edit .env file and replace YOUR_VPS_IP with your actual VPS IP address"

# Open firewall ports
echo "🔥 Configuring firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3990/tcp
sudo firewall-cmd --reload

# Build and start the application
echo "🔨 Building and starting the application..."
sudo docker-compose build
sudo docker-compose up -d

# Check status
echo "✅ Checking application status..."
sudo docker-compose ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Your PMTA Analytics Dashboard is now running on:"
echo "   Frontend: http://YOUR_VPS_IP:3000"
echo "   API:      http://YOUR_VPS_IP:3990"
echo ""
echo "🔧 Useful commands:"
echo "   Check logs:    sudo docker-compose logs -f"
echo "   Restart app:   sudo docker-compose restart"
echo "   Stop app:      sudo docker-compose down"
echo "   Update app:    git pull && sudo docker-compose build && sudo docker-compose up -d"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Replace YOUR_VPS_IP in .env file with your actual VPS IP"
echo "   2. Update ALLOWED_ORIGINS with your domain if you have one"
echo "   3. Set up SSL certificate for production use"
echo ""
