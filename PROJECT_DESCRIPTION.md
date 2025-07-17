# 📧 Unified Email Analytics Platform (accReader + MailWizz Dashboard)

**A comprehensive email analytics platform combining PowerMTA log analysis with MailWizz campaign management, featuring real-time data processing, advanced visualization, multi-tenant client access, and enterprise-grade security.**

## 🎯 Project Overview

The **accReader** platform has evolved into a unified email analytics solution that serves two distinct but complementary purposes:

1. **PowerMTA Analytics**: Advanced log analysis for email delivery monitoring and performance optimization
2. **MailWizz Client Dashboard**: Secure, multi-tenant client portal for campaign performance insights

This dual-purpose platform abstracts the complexity of both PowerMTA logs and MailWizz APIs, providing tailored experiences for system administrators, email marketers, and end clients through role-based access control and sophisticated data visualization.

## 🏗️ Enhanced Architecture & Technology Stack

### **Frontend (React 19 + Vite)**

- **React 19**: Latest React with concurrent features and improved performance
- **Vite**: Lightning-fast build tool with HMR (Hot Module Replacement)
- **Redux Toolkit**: Advanced state management for complex data flows across multiple modules
- **React Router Dom**: Client-side routing with role-based route protection
- **TailwindCSS + shadcn/ui**: Modern design system with accessible components
- **Chart.js + React-ChartJS-2**: Interactive data visualization for both PMTA and MailWizz data
- **Radix UI**: Accessible, customizable UI components
- **Lucide React**: Modern SVG icon library

### **Backend (Node.js + Express)**

- **Express.js**: RESTful API server with comprehensive middleware support
- **Node SSH**: Secure shell connections to PowerMTA servers
- **Chokidar**: File system watching for real-time PMTA log imports
- **Papa Parse**: High-performance CSV parsing for PMTA logs
- **Multer**: File upload handling for manual PMTA imports
- **MailWizz API Integration**: Custom service layer for MailWizz communication
- **JWT Authentication**: Secure, role-based authentication system
- **CORS**: Cross-origin resource sharing configuration

### **Database & Caching**

- **PostgreSQL**: Primary database for user management and campaign assignments
- **Redis**: High-performance caching for MailWizz API responses and session data
- **File System**: PMTA log storage and processing

### **DevOps & Deployment**

- **Docker**: Containerized deployment with multi-stage builds
- **Docker Compose**: Service orchestration for production environments
- **CentOS 7**: Linux deployment with automated deployment scripts
- **PM2**: Process management for production stability
- **Nginx**: Reverse proxy and static file serving

## 🔧 Comprehensive Platform Features

### **Dual-Platform Architecture**

#### **1. PowerMTA Analytics Module**

##### **Real-Time Data Import System**

- **SSH Connection**: Secure connection to PowerMTA servers using Node SSH
- **File Monitoring**: Real-time monitoring of PMTA log directories using chokidar
- **Incremental Sync**: Downloads only new or modified CSV files
- **Error Recovery**: Automatic reconnection and retry mechanisms
- **Multiple File Sources**: Support for various PMTA log formats and naming conventions

##### **Advanced Analytics Engine**

- **Email Performance Metrics**: Total sent, delivered, bounced, deferred emails
- **Delivery Rates**: Percentage calculations with trending analysis
- **Bounce Analysis**: Categorized bounce reasons with severity classification
- **VMTA Performance**: Per-VMTA delivery statistics and comparisons
- **Time-based Analysis**: Hourly, daily, and custom time range analytics

##### **Manual Upload System**

- **Drag & Drop Interface**: Modern file upload with visual feedback
- **CSV Validation**: Real-time validation of CSV structure and content
- **Batch Processing**: Support for multiple file uploads
- **Progress Tracking**: Real-time upload progress with error handling

#### **2. MailWizz Client Dashboard Module**

##### **Secure Multi-Tenant System**

- **Client Authentication**: JWT-based secure login system for client users
- **Campaign Assignment**: Granular control over which campaigns each client can access
- **Data Isolation**: Complete separation of client data ensuring privacy and security
- **Role-Based Access**: Different permission levels for admins, clients, and PMTA users

##### **MailWizz API Integration**

- **Real-Time Data Sync**: Automatic synchronization with MailWizz campaigns
- **Comprehensive Statistics**: Open rates, click rates, bounce analysis, unsubscribe tracking
- **Campaign Management**: View campaign details, performance metrics, and historical data
- **Caching Strategy**: Redis-based caching to optimize API performance and reduce rate limiting

##### **Client Dashboard Features**

- **Campaign Overview**: High-level performance metrics across all assigned campaigns
- **Detailed Analytics**: Drill-down views for individual campaign analysis
- **Interactive Charts**: Time-series performance graphs and distribution charts
- **Export Capabilities**: PDF, Excel, and CSV reports for client use
- **Mobile Responsive**: Full functionality across all device types

##### **Administrative Control Panel**

- **User Management**: Create, update, and manage client accounts
- **Campaign Assignment**: Intuitive interface for assigning campaigns to specific clients
- **System Monitoring**: Health checks for MailWizz API connectivity and system performance
- **Bulk Operations**: Efficient management of multiple users and campaigns

### **3. Unified Features Across Both Platforms**

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
  status: ["delivered", "bounced", "deferred"],
  vmta: ["vmta1", "vmta2", "vmta3"],
  bounceCategory: ["hard", "soft", "technical"],
  dateRange: { start: Date, end: Date },
  customFields: { field: "value" },
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
  status: "connected" | "disconnected" | "connecting" | "error",
  lastConnection: Date,
  uptime: Number,
  errorCount: Number,
  latency: Number,
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
    error: null,
  },
  connection: {
    status: "disconnected",
    config: {},
    history: [],
  },
  ui: {
    filters: {},
    searchTerm: "",
    selectedRows: [],
  },
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
