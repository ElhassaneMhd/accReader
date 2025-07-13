# PMTA Auto-Import Setup Guide

## 🚀 Quick Setup for Real-time Email Analytics

This guide will help you set up automatic data import from your PMTA server at `91.229.239.75` to enable real-time email analytics in AccReader.

## 📋 Prerequisites

- AccReader v1.0 installed and working
- SSH access to your PMTA server (91.229.239.75)
- Node.js 20.19.0+ installed
- Network connectivity between your development machine and PMTA server

## 🔧 Configuration Steps

### Step 1: Configure PMTA Credentials

1. **Open the `.env` file** in your AccReader root directory
2. **Update the credentials** with your actual PMTA server details:

```env
# PMTA Server Configuration
PMTA_HOST=91.229.239.75
PMTA_PORT=22
PMTA_USERNAME=your_actual_username
PMTA_PASSWORD=your_actual_password
PMTA_LOG_PATH=/var/log/pmta
PMTA_LOG_PATTERN=acct-*.csv

# Import Settings
IMPORT_INTERVAL=30000
IMPORT_PORT=3001
AUTO_IMPORT_ENABLED=true

# Security (for production)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### Step 2: Install Dependencies

Run the following command to ensure all dependencies are installed:

```bash
npm install
```

### Step 3: Start the Enhanced Application

Use the new combined start command:

```bash
npm run pmta:start
```

This command will:

- Start the PMTA import service on port 3001
- Start the frontend development server on port 5173
- Display logs from both services with colored prefixes

## 🎯 What You'll See

### Frontend (Green)

```
FRONTEND | > accreader@1.0.0 dev
FRONTEND | > vite
FRONTEND |
FRONTEND |   VITE v7.0.4  ready
FRONTEND |
FRONTEND |   ➜  Local:   http://localhost:5173/
FRONTEND |   ➜  Network: use --host to expose
```

### PMTA Import Service (Blue)

```
PMTA | 🚀 Starting PMTA Auto-Import Service
PMTA | 📡 Target server: 91.229.239.75:22
PMTA | 📂 Remote path: /var/log/pmta/acct-*.csv
PMTA | 🔄 Import interval: 30s
PMTA | 🚀 PMTA Import API running on port 3001
PMTA | 🔐 Connecting to PMTA server: 91.229.239.75:22
PMTA | ✅ Successfully connected to PMTA server
PMTA | 📋 Found 5 log files on server
PMTA | ⬇️ Downloading: acct-2025-07-13-1200.csv
PMTA | ✅ Downloaded: acct-2025-07-13-1200.csv (2.4MB)
```

## 🖥️ Dashboard Features

Once running, your AccReader dashboard will show:

### 1. **Import Status Card**

- Real-time connection status to PMTA server
- Last import timestamp
- Files processed count
- Manual "Force Import" button
- Connection health indicator

### 2. **Auto-Updating Data**

- Data refreshes automatically every 30 seconds
- Visual indicators when new data is being imported
- Seamless transition between manual and auto-import modes

### 3. **Enhanced User Experience**

- Toggle between manual file upload and auto-import
- Real-time status monitoring
- Error handling with detailed messages

## 🔧 Alternative Commands

### Run Services Separately

If you prefer to run services separately:

```bash
# Terminal 1: Start PMTA Import Service
npm run pmta:import

# Terminal 2: Start Frontend
npm run dev
```

### Frontend Only (Manual Mode)

To use only manual file uploads without auto-import:

```bash
npm run dev
```

## 🛠️ Troubleshooting

### Connection Issues

1. **Verify SSH credentials** in `.env` file
2. **Check network connectivity**:
   ```bash
   ssh your_username@91.229.239.75
   ```
3. **Verify PMTA log path exists**:
   ```bash
   ls -la /var/log/pmta/acct-*.csv
   ```

### Import Service Issues

1. **Check if port 3001 is available**:
   ```bash
   netstat -tulpn | grep :3001
   ```
2. **Review import service logs** in the terminal
3. **Manually test API endpoint**:
   ```bash
   curl http://localhost:3001/api/import-status
   ```

### Frontend Issues

1. **Clear browser cache** and reload
2. **Check browser console** for JavaScript errors
3. **Verify frontend can reach import API**

## 📊 Data Flow

```
PMTA Server (91.229.239.75)
    ↓ SSH Connection
Auto-Import Service (Port 3001)
    ↓ HTTP API
Frontend Dashboard (Port 5173)
    ↓ Real-time Updates
User Interface
```

## 🔒 Security Notes

- **SSH credentials** are stored in `.env` file (add to `.gitignore`)
- **API endpoints** are CORS-protected
- **Only specified origins** can access the import service
- **Consider using SSH keys** instead of passwords for production

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Both services start without errors
- ✅ Import Status card shows "Connected"
- ✅ Data appears automatically in the dashboard
- ✅ "Last Import" timestamp updates every 30 seconds
- ✅ VMTA Performance cards show real-time data

## 📞 Support

If you encounter issues:

1. Check the terminal logs for error messages
2. Verify your PMTA server credentials
3. Ensure network connectivity to 91.229.239.75
4. Review the troubleshooting section above

---

**🚀 You're now ready to experience real-time email analytics with AccReader!**
