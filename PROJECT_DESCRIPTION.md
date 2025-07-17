# 📧 PMTA Email Analytics Dashboard (accReader)

**A comprehensive React-based email analytics platform designed for PowerMTA (Port25) email campaign analysis with real-time data processing, advanced visualization, and intelligent file management.**

## 🎯 Project Overview

The **accReader** is a sophisticated web application built to analyze PowerMTA email delivery logs with enterprise-grade features including real-time data import, advanced filtering, interactive visualization, and comprehensive export capabilities. It serves as a complete solution for email marketers, system administrators, and analysts who need deep insights into email campaign performance.

## 🏗️ Architecture & Technology Stack

### **Frontend (React 19 + Vite)**
- **React 19**: Latest React with concurrent features and improved performance
- **Vite**: Lightning-fast build tool with HMR (Hot Module Replacement)
- **Redux Toolkit**: State management for complex data flows
- **React Router Dom**: Client-side routing with nested routes
- **TailwindCSS**: Utility-first CSS framework with custom animations
- **Chart.js + React-ChartJS-2**: Interactive data visualization
- **Radix UI**: Accessible, customizable UI components
- **Lucide React**: Modern SVG icon library

### **Backend (Node.js + Express)**
- **Express.js**: RESTful API server with middleware support
- **Node SSH**: Secure shell connections to PowerMTA servers
- **Chokidar**: File system watching for real-time imports
- **Papa Parse**: High-performance CSV parsing
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing configuration

### **DevOps & Deployment**
- **Docker**: Containerized deployment with multi-stage builds
- **Docker Compose**: Service orchestration for production
- **CentOS 7**: Linux deployment with automated scripts
- **PM2**: Process management for production stability
- **Nginx**: Reverse proxy and static file serving

## 🔧 Core Functionalities

### 1. **Real-Time Data Import System**

#### **Auto-Import Service (pmta-import.js)**
- **SSH Connection**: Secure connection to PowerMTA servers using Node SSH
- **File Monitoring**: Real-time monitoring of PMTA log directories using chokidar
- **Incremental Sync**: Downloads only new or modified CSV files
- **Error Recovery**: Automatic reconnection and retry mechanisms
- **Multiple File Sources**: Support for various PMTA log formats and naming conventions

```javascript
// Configuration example
const CONFIG = {
  pmta: {
    host: "91.229.239.75",
    port: 22,
    username: "pmta_user",
    password: "secure_password",
    logPath: "/var/log/pmta",
    logPattern: "acct-*.csv"
  },
  import: {
    interval: 30000, // 30 seconds
    enabled: true
  }
};
```

#### **Manual Upload System**
- **Drag & Drop Interface**: Modern file upload with visual feedback
- **CSV Validation**: Real-time validation of CSV structure and content
- **Batch Processing**: Support for multiple file uploads
- **Progress Tracking**: Real-time upload progress with error handling

### 2. **Advanced Analytics Engine**

#### **Email Performance Metrics**
- **Delivery Statistics**: Total sent, delivered, bounced, deferred emails
- **Delivery Rates**: Percentage calculations with trending analysis
- **Bounce Analysis**: Categorized bounce reasons with severity classification
- **VMTA Performance**: Per-VMTA delivery statistics and comparisons
- **Time-based Analysis**: Hourly, daily, and custom time range analytics

#### **Data Processing Pipeline**
```javascript
// Core analytics functions
const analyzeEmailData = (data) => {
  return {
    overview: calculateOverviewStats(data),
    bounceAnalysis: categorizeBounces(data),
    vmtaPerformance: analyzeVMTAs(data),
    timelineData: generateTimeline(data),
    diagnosticCodes: extractDiagnostics(data)
  };
};
```

### 3. **Interactive Data Visualization**

#### **Chart Components (Chart.js Integration)**
- **Timeline Charts**: Delivery performance over time with multi-dataset support
- **Pie Charts**: Bounce category distribution with dynamic colors
- **Bar Charts**: VMTA performance comparison with drill-down capabilities
- **Real-time Updates**: Live chart updates with smooth animations

#### **Responsive Design**
- **Mobile-First**: Optimized for all device sizes
- **Touch Interactions**: Gesture support for mobile charts
- **Progressive Enhancement**: Graceful degradation for older browsers

### 4. **Sophisticated Search & Filtering System**

#### **Multi-Field Search Engine**
- **Global Search**: Search across recipient emails, subjects, message IDs
- **Smart Matching**: Fuzzy search with relevance scoring
- **Regular Expression**: Advanced pattern matching support
- **Real-time Results**: Instant search with debounced input

#### **Advanced Filtering Options**
```javascript
// Filter configuration
const filterOptions = {
  status: ['delivered', 'bounced', 'deferred'],
  vmta: ['vmta1', 'vmta2', 'vmta3'],
  bounceCategory: ['hard', 'soft', 'technical'],
  dateRange: { start: Date, end: Date },
  customFields: { field: 'value' }
};
```

#### **Filter Persistence**
- **Session Storage**: Maintains filters across page refreshes
- **URL Parameters**: Shareable filter states via URL
- **Filter Presets**: Save and load common filter combinations

### 5. **Comprehensive Export System**

#### **Multiple Export Formats**
- **CSV Export**: Standard comma-separated values with custom delimiters
- **Excel-Compatible**: XLSX format with formatting and formulas
- **JSON Export**: Structured data for API integration
- **Summary Reports**: Executive-level PDF reports with charts

#### **Smart Export Features**
- **Filtered Exports**: Export only visible/filtered data
- **Custom Columns**: Select specific fields for export
- **Batch Processing**: Handle large datasets efficiently
- **Auto-Naming**: Intelligent filename generation based on filters

### 6. **File Management System**

#### **Dual-Mode Operation**
- **Auto-Import Mode**: Continuous monitoring and importing
- **Manual Mode**: User-controlled file uploads and processing
- **Hybrid Mode**: Combination of both with priority handling

#### **File Status Tracking**
- **Import History**: Complete audit trail of all imports
- **File Validation**: Integrity checks and error reporting
- **Version Control**: Track file modifications and updates
- **Storage Management**: Automatic cleanup and archiving

### 7. **Connection Management**

#### **SSH Connection Handling**
- **Connection Pooling**: Efficient resource management
- **Auto-Reconnection**: Automatic recovery from connection drops
- **Timeout Handling**: Configurable timeouts with fallback strategies
- **Security**: Key-based authentication support

#### **Real-time Status Monitoring**
```javascript
// Connection status interface
const connectionStatus = {
  status: 'connected' | 'disconnected' | 'connecting' | 'error',
  lastConnection: Date,
  uptime: Number,
  errorCount: Number,
  latency: Number
};
```

## 🎨 User Interface Components

### **Dashboard Layout**
- **Header Navigation**: Breadcrumbs, user menu, and system status
- **Sidebar Menu**: Contextual navigation with active state indicators
- **Main Content**: Responsive grid layout with dynamic resizing
- **Footer**: System information and version details

### **Key UI Components**

#### **OverviewStats.jsx**
- Real-time statistics cards with animated counters
- Percentage indicators with color-coded trends
- Click-through navigation to detailed views

#### **DataTable.jsx**
- Virtualized table for handling large datasets
- Column sorting with multi-field support
- Row selection with bulk operations
- Pagination with configurable page sizes

#### **SearchAndFilters.jsx**
- Advanced search interface with autocomplete
- Filter chips with easy removal
- Saved searches with user preferences

#### **ImportStatus.jsx**
- Real-time import progress indicators
- Connection status with visual feedback
- Error display with actionable solutions

## 🔄 State Management Architecture

### **Redux Store Structure**
```javascript
// Store configuration
const store = {
  files: {
    availableFiles: [],
    importedFiles: [],
    currentFile: null,
    isLoading: false,
    error: null
  },
  connection: {
    status: 'disconnected',
    config: {},
    history: []
  },
  ui: {
    filters: {},
    searchTerm: '',
    selectedRows: []
  }
};
```

### **Context API Integration**
- **EmailDataContext**: Global email data state
- **ConnectionContext**: SSH connection management
- **UIContext**: User interface state and preferences

## 🚀 Deployment & Infrastructure

### **Development Environment**
```bash
# Quick start
npm install
npm start  # Starts both backend and frontend
```

### **Production Deployment**

#### **Docker Containerization**
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
FROM nginx:alpine AS production
```

#### **CentOS 7 VPS Deployment**
```bash
# Automated deployment script
./deploy-centos7.sh
# Installs Docker, builds containers, configures nginx
```

#### **Environment Configuration**
```env
# Production environment variables
PMTA_HOST=192.168.1.100
PMTA_PORT=22
PMTA_USERNAME=pmta_user
PMTA_PASSWORD=secure_password
PMTA_LOG_PATH=/var/log/pmta
AUTO_IMPORT_ENABLED=true
IMPORT_INTERVAL=30000
```

## 🔒 Security Features

### **Connection Security**
- SSH key-based authentication
- Encrypted password storage
- Connection timeout management
- Failed attempt monitoring

### **Data Security**
- Input validation and sanitization
- CORS configuration for API security
- File upload restrictions
- Error message sanitization

### **Access Control**
- Environment-based configuration
- Resource usage monitoring
- Request rate limiting
- Audit logging

## 📊 Performance Optimizations

### **Frontend Optimizations**
- **Code Splitting**: Dynamic imports for route-based splitting
- **Virtual Scrolling**: Handle large datasets efficiently
- **Memoization**: React.memo and useMemo for expensive computations
- **Lazy Loading**: Progressive loading of non-critical components

### **Backend Optimizations**
- **Streaming**: Stream large CSV files for memory efficiency
- **Caching**: In-memory caching of processed data
- **Connection Pooling**: Efficient SSH connection management
- **Compression**: Gzip compression for API responses

### **Data Processing**
- **Worker Threads**: Offload CPU-intensive tasks
- **Batch Processing**: Process large files in chunks
- **Incremental Updates**: Only process new/changed data

## 🧪 Testing & Quality Assurance

### **Code Quality**
- **ESLint**: Comprehensive linting with custom rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Type safety for critical components
- **Git Hooks**: Pre-commit validation

### **Performance Monitoring**
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Performance Metrics**: Core Web Vitals tracking
- **Error Tracking**: Comprehensive error logging
- **Resource Monitoring**: Memory and CPU usage tracking

## 📈 Scalability Considerations

### **Horizontal Scaling**
- Microservice architecture support
- Load balancer configuration
- Database clustering preparation
- CDN integration for static assets

### **Vertical Scaling**
- Memory-efficient data structures
- CPU optimization for data processing
- Storage optimization for large files
- Network optimization for real-time updates

## 🔮 Future Enhancements

### **Planned Features**
- **Machine Learning**: Predictive analytics for delivery optimization
- **API Gateway**: RESTful API for third-party integrations
- **Mobile App**: Native mobile application
- **Advanced Reporting**: Custom report builder with templates

### **Technical Improvements**
- **GraphQL**: Query optimization for complex data requests
- **WebSockets**: Real-time data streaming
- **PWA**: Progressive Web App capabilities
- **Microservices**: Service decomposition for better scalability

## 📋 System Requirements

### **Development**
- Node.js 18+
- RAM: 4GB minimum, 8GB recommended
- Storage: 1GB for application, additional for data
- Network: SSH access to PowerMTA servers

### **Production**
- CPU: 2+ cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 10GB+ depending on data volume
- Network: High-speed internet for real-time imports

## 🤝 Contributing

The project follows modern development practices with:
- **Git Flow**: Feature branches with pull request reviews
- **Semantic Versioning**: Clear version management
- **Documentation**: Comprehensive inline and external documentation
- **Community**: Open-source with community contributions welcome

---

**accReader** represents a complete solution for PowerMTA email analytics, combining modern web technologies with enterprise-grade features to deliver actionable insights for email marketing professionals and system administrators.
