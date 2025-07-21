# 📧 PMTA Email Analytics Dashboard

A comprehensive React-based dashboard for analyzing PowerMTA email campaign performance with real-time data import and advanced filtering capabilities.

## ✨ Features

### 📊 **Analytics & Visualization**

- **Overview Statistics**: Total sent, delivered, bounced, and deferred emails
- **Interactive Charts**: Delivery status distribution, bounce analysis, hourly performance
- **VMTA Performance**: Detailed per-VMTA statistics and performance metrics
- **Real-time Updates**: Live data refresh with auto-import functionality

### 🔍 **Advanced Filtering & Search**

- **Multi-field Search**: Search across recipients, senders, subjects, and message IDs
- **Smart Filters**: Filter by delivery status, VMTA, bounce categories, and date ranges
- **Real-time Results**: Instant filtering with live result counts
- **Filter Persistence**: Maintains filter state across sessions

### 📤 **Data Export**

- **Multiple Formats**: CSV, Excel-compatible, JSON, and Summary exports
- **Filtered Exports**: Export only the data you're viewing
- **Smart Naming**: Auto-generated filenames based on applied filters
- **Batch Operations**: Export thousands of records efficiently

### 🔄 **File Management**

- **Auto-Import**: Automatically imports latest PMTA log files
- **Manual Upload**: Drag-and-drop CSV file upload
- **File Switching**: Toggle between different imported datasets
- **Dual-Mode Operation**: Auto-import and manual modes

### 🛡️ **Security & Performance**

- **SSH Connection**: Secure connection to PMTA servers
- **Optimized Loading**: Performance-optimized data processing
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Access to a PowerMTA server (for auto-import)
- PowerMTA CSV log files

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ElhassaneMhd/accReader.git
   cd accReader
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment** (optional, for auto-import)

   ```bash
   cp .env.example .env
   # Edit .env with your PMTA server details
   ```

4. **Start the application**

   ```bash
   npm start
   # This starts both the import service and web interface
   ```

5. **Access the dashboard**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
accReader/
├── src/
│   ├── components/          # React components
│   │   ├── Charts.jsx      # Data visualization components
│   │   ├── DataTable.jsx   # Email data table
│   │   ├── ExportControls.jsx # Export functionality
│   │   ├── FileSelector.jsx   # File management
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useEmailData.js # Data management hook
│   │   └── useConnection.js # SSH connection hook
│   ├── utils/              # Utility functions
│   │   ├── csvParser.js    # CSV parsing logic
│   │   ├── dataAnalysis.js # Analytics calculations
│   │   └── exportUtils.js  # Export functionality
│   └── App.jsx             # Main application component
├── scripts/
│   └── pmta-import.js      # Auto-import service
└── public/                 # Static assets
```

## 🛠️ Usage

### Manual File Upload

1. Click the upload button in the header
2. Select your PowerMTA CSV file
3. Data will be automatically parsed and analyzed

### Auto-Import Setup

1. Configure your PMTA server connection in the environment
2. Click "Enable Auto-Import"
3. The system will automatically fetch and import the latest log files
4. Use the file selector to switch between different imported datasets

### Data Analysis

- View overview statistics at the top of the dashboard
- Explore interactive charts for delivery performance insights
- Check VMTA-specific performance metrics
- Use filters to drill down into specific data segments

### Exporting Data

1. Apply any desired filters to narrow down your data
2. Click the "Export" button in the search results section
3. Choose your preferred format (CSV, Excel, JSON, or Summary)
4. File will be automatically downloaded with a descriptive name

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# PMTA Server Configuration
PMTA_HOST=your-pmta-server.com
PMTA_USER=your-username
PMTA_PRIVATE_KEY_PATH=/path/to/private/key
PMTA_LOG_PATH=/var/log/pmta/
```

### Supported CSV Format

The application expects PowerMTA log files with these columns:

- `type` - Log entry type (d, b, t, etc.)
- `timeLogged` - Timestamp of the log entry
- `timeQueued` - Timestamp when message was queued
- `orig` - Original sender
- `rcpt` - Recipient address
- `dsnAction` - Delivery status (delivered, failed, etc.)
- `dsnStatus` - DSN status code
- `vmta` - VMTA identifier
- `dlvSourceIp` - Delivery source IP
- `bounceCat` - Bounce category
- `dsnDiag` - Diagnostic information

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. Customize the theme by modifying:

- `tailwind.config.js` - Tailwind configuration
- Component-level styles in JSX files

### Adding New Charts

1. Create new chart components in `src/components/`
2. Add chart logic to `src/utils/dataAnalysis.js`
3. Import and use in the main `Charts.jsx` component

### Custom Filters

Add new filter types in:

1. `src/hooks/useEmailData.js` - Filter logic
2. `src/components/SearchAndFilters.jsx` - UI components

## 📊 Performance

- **Large Datasets**: Efficiently handles files with 100K+ records
- **Real-time Filtering**: Instant search results with debounced input
- **Memory Optimization**: Optimized data structures for large datasets
- **Background Processing**: Auto-import runs independently of the main UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the project files for detailed implementation guides
- **Issues**: Report bugs on the GitHub Issues page
- **Feature Requests**: Submit enhancement requests

## 🚀 Roadmap

- [ ] Real-time dashboard with WebSocket updates
- [ ] Advanced bounce analysis with ML insights
- [ ] Multi-server PMTA support
- [ ] Custom dashboard widgets
- [ ] API endpoints for external integrations
- [ ] Scheduled report generation

---

**Built with ❤️ using React, Vite, and Tailwind CSS**

## 🚀 Deployment

### Prerequisites for Deployment

- Production server or cloud platform
- Node.js 18+ on the target server
- Access to your PMTA server (for auto-import functionality)
- Domain name (optional but recommended)

### 🌐 Deployment Options

#### 1. **Vercel (Recommended for Frontend)**

Vercel is perfect for the React frontend with serverless functions:

```bash
# Install Vercel CLI
npm install -g vercel

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    },
    {
      "src": "scripts/pmta-import.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/scripts/pmta-import.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "PMTA_HOST": "@pmta-host",
    "PMTA_USER": "@pmta-user",
    "PMTA_PRIVATE_KEY_PATH": "@pmta-key-path"
  }
}
```

#### 2. **Netlify**

Deploy the frontend to Netlify:

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

**Netlify Configuration** (`netlify.toml`):

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. **Docker Deployment**

Create a containerized deployment:

**Dockerfile**:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000 4000

# Start both services
CMD ["npm", "start"]
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: "3.8"

services:
  pmta-analytics:
    build: .
    ports:
      - "3000:3000"
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PMTA_HOST=${PMTA_HOST}
      - PMTA_USER=${PMTA_USER}
      - PMTA_PRIVATE_KEY_PATH=/app/keys/pmta_key
    volumes:
      - ./pmta-keys:/app/keys:ro
      - pmta-data:/app/data
    restart: unless-stopped

volumes:
  pmta-data:
```

Deploy with Docker:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

#### 4. **VPS/Server Deployment**

Deploy to your own server (Ubuntu/CentOS):

```bash
# On your server
git clone https://github.com/ElhassaneMhd/accReader.git
cd accReader

# Install dependencies
npm install

# Build the project
npm run build

# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
```

**PM2 Configuration** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: "pmta-analytics-web",
      script: "npx serve dist -s -l 3000",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "pmta-import-service",
      script: "scripts/pmta-import.js",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
      },
    },
  ],
};
```

Start with PM2:

```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 5. **Nginx Configuration**

Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 🔐 Environment Configuration for Production

Create production environment file:

```bash
# .env.production
NODE_ENV=production
PMTA_HOST=your-production-pmta-server.com
PMTA_USER=pmta_user
PMTA_PRIVATE_KEY_PATH=/path/to/production/key
PMTA_LOG_PATH=/var/log/pmta/
AUTO_IMPORT_PORT=4000
AUTO_IMPORT_INTERVAL=300000
```

### 📊 Monitoring & Logging

#### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all
```

#### Log Management

```bash
# Rotate logs
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **SSH Keys**: Store private keys securely with proper permissions (600)
3. **Firewall**: Configure firewall to allow only necessary ports
4. **SSL/TLS**: Use HTTPS in production with Let's Encrypt
5. **CORS**: Configure CORS properly for your domain

### 🚀 Quick Deploy Commands

#### Development to Production Checklist

```bash
# 1. Build and test locally
npm run build
npm run preview

# 2. Update environment variables
cp .env.example .env.production

# 3. Deploy to your chosen platform
# Vercel:
vercel --prod

# Netlify:
netlify deploy --prod --dir=dist

# Docker:
docker-compose up -d

# VPS:
pm2 start ecosystem.config.js
```

### 📈 Performance Optimization for Production

1. **Build Optimization**: Ensure production build is used
2. **Caching**: Configure proper HTTP caching headers
3. **CDN**: Use CDN for static assets
4. **Gzip**: Enable gzip compression
5. **Monitoring**: Set up application monitoring

Choose the deployment method that best fits your infrastructure and requirements!
