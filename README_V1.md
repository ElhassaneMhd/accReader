# AccReader v1.0 - Email Data Analytics Dashboard

A modern React-based dashboard for analyzing email delivery data with comprehensive VMTA performance metrics and IP tracking.

## ✨ Features

- **📊 Email Analytics Dashboard** - Comprehensive email delivery analytics
- **📈 VMTA Performance Monitoring** - Real-time VMTA statistics with IP tracking
- **🎯 Advanced Filtering** - Search and filter emails by multiple criteria
- **📑 Data Table** - Paginated email records with expandable details
- **📊 Interactive Charts** - Delivery rate trends and performance metrics
- **🌓 Dark Theme** - Modern dark theme optimized for extended use
- **🎨 Responsive Design** - Mobile-first responsive design
- **⚡ Fast Performance** - Optimized for large datasets

## 🛠️ Tech Stack

- **React 19** - Latest React with modern hooks
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons
- **Chart.js** - Interactive charts and visualizations
- **Papa Parse** - Robust CSV parsing
- **Day.js** - Lightweight date manipulation

## 📁 Project Structure

```
accReader/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── Header.jsx       # Main header component
│   │   ├── OverviewStats.jsx # Statistics overview
│   │   ├── Charts.jsx       # Chart components
│   │   ├── VmtaPerformance.jsx # VMTA performance cards
│   │   ├── SearchAndFilters.jsx # Search and filter controls
│   │   └── DataTable.jsx    # Data table with pagination
│   ├── hooks/
│   │   └── useEmailData.js  # Custom hook for data management
│   ├── utils/
│   │   ├── csvParser.js     # CSV parsing utilities
│   │   └── dataAnalysis.js  # Data analysis functions
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── components.json          # Shadcn/ui configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm 9.5.1+

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd accReader
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 📊 CSV Data Format

The application expects CSV files with the following structure:

### Required Fields

- `vmta` - VMTA identifier
- `dsnAction` - Delivery status (delivered, failed, bounced, etc.)
- `dlvSourceIp` - Source IP address
- `timeLogged` - Timestamp
- `recipient` - Recipient email address

### Optional Fields

- `sender` - Sender email address
- `subject` - Email subject
- `dsnMta` - MTA information
- `dsnDiag` - Diagnostic information

### Example CSV Structure

```csv
timeLogged,vmta,recipient,sender,subject,dsnAction,dlvSourceIp,dsnMta,dsnDiag
2025-07-12 10:30:00,vmta01,user@example.com,sender@domain.com,Test Email,delivered,192.168.1.100,smtp.example.com,250 OK
```

## 🎯 Key Features Explained

### VMTA Performance Monitoring

- Real-time tracking of multiple VMTAs
- IP address association and tracking
- Delivery rate calculations
- Performance color coding (Green: >95%, Yellow: >85%, Red: <85%)
- Multiple IP address support per VMTA

### Data Analytics

- Total email volume tracking
- Delivery rate analysis
- Bounce and failure rate monitoring
- Time-based performance trends
- Detailed email record inspection

### Advanced Filtering

- Search by recipient, sender, or subject
- Filter by delivery status
- Date range filtering
- VMTA-specific filtering
- Real-time search results

## 🔧 Configuration

### Tailwind CSS

The application uses a custom Tailwind configuration optimized for dark themes. Configuration can be found in `tailwind.config.js`.

### Shadcn/ui Components

UI components are configured via `components.json` and can be customized as needed.

### Vite Configuration

Build and development settings are in `vite.config.js` with React plugin and path alias support.

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:

- Mobile: `sm` (640px+)
- Tablet: `md` (768px+)
- Desktop: `lg` (1024px+)
- Large Desktop: `xl` (1280px+)

## 🎨 Theming

The application uses a consistent dark theme with:

- Primary backgrounds: `gray-900`, `gray-950`
- Text colors: `gray-100`, `gray-300`, `gray-400`
- Accent colors: Blue (`blue-400`), Green (`green-400`), Red (`red-400`), Yellow (`yellow-400`)
- Hover states and transitions for enhanced UX

## 🚀 Version 2.0 Roadmap

- **Real-time data streaming**
- **Advanced analytics and ML insights**
- **Multi-tenant support**
- **API integration**
- **Export functionality**
- **Alert system**
- **Historical data comparison**

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**v1.0** - Complete conversion to Tailwind CSS + Shadcn/ui with IP tracking functionality
