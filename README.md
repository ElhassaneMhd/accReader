# Email Campaign Analytics Dashboard

A comprehensive React-based dashboard for analyzing PowerMTA email campaign performance with advanced filtering, search capabilities, and interactive visualizations.

## Features

### 📊 **At-a-Glance Overview**

- Total emails processed
- Delivery rates with performance indicators
- Bounce rates and categorization
- Deferred email tracking
- Real-time statistics

### 📈 **Interactive Charts**

- **Timeline Analysis**: Hourly email activity with delivered/bounced/deferred trends
- **Bounce Categories**: Pie chart breakdown of bounce reasons
- **VMTA Performance**: Bar chart comparing delivery rates across VMTAs

### 🖥️ **VMTA Performance Monitoring**

- Individual VMTA performance cards
- Delivery rate tracking with visual indicators
- Bounce rate analysis
- Performance status badges (Excellent/Good/Fair/Poor)

### 🔍 **Advanced Search & Filtering**

- **Search Types**: Recipient, Sender, Diagnostic codes, VMTA, or All fields
- **Filters**: Status (delivered/failed/delayed), VMTA selection, Bounce categories
- Real-time result counting
- Clear filters functionality

### 📋 **Detailed Data Table**

- Paginated email records with customizable rows per page
- Expandable rows for full record details
- Copy-to-clipboard functionality for email addresses
- Status indicators with color coding
- Sortable columns

### 🎨 **Modern UI/UX**

- Glass morphism design with backdrop blur effects
- Responsive layout for desktop and mobile
- Gradient backgrounds and smooth animations
- Material-UI components with custom theming

## Installation

1. **Clone or download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open your browser and navigate to:** `http://localhost:5173`

## Usage

### Uploading CSV Files

1. Click the **"Upload CSV"** button in the header
2. Select a PowerMTA-formatted CSV file from your computer
3. The dashboard will automatically parse and analyze the data

### Supported CSV Format

The dashboard expects PowerMTA log files with the following columns:

- `type` - Record type
- `timeLogged` - Timestamp when logged (supports timezone format: 2025-07-10 11:58:57+0300)
- `timeQueued` - Timestamp when queued
- `orig` - Sender email address
- `rcpt` - Recipient email address
- `dsnAction` - Delivery status (delivered, failed, delayed)
- `dsnStatus` - DSN status code
- `dsnDiag` - Diagnostic message
- `vmta` - Virtual MTA identifier
- `bounceCat` - Bounce category (optional)

### Dashboard Sections

#### 1. Overview Statistics

- View key metrics at the top of the dashboard
- Color-coded performance indicators
- Progress bars for delivery and bounce rates

#### 2. Charts Section

- **Timeline Chart**: Shows email activity over time
- **Bounce Analysis**: Pie chart of bounce categories
- **VMTA Performance**: Comparative bar chart of VMTA delivery rates

#### 3. VMTA Performance Cards

- Individual performance metrics for each VMTA
- Status badges indicating performance level
- Detailed statistics for delivered, bounced, and deferred emails

#### 4. Search and Filters

- Use the search bar to find specific emails or patterns
- Apply filters to narrow down results
- View active filter count and clear all filters

#### 5. Data Table

- Browse all email records with pagination
- Click on rows to expand full details
- Copy email addresses with one click
- Export or analyze specific records

## Technical Details

### Built With

- **React 19** - Modern React with latest features
- **Material-UI (MUI)** - Component library and theming
- **Chart.js** - Interactive charts and visualizations
- **Papa Parse** - Robust CSV parsing with error handling
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and development server

### Key Components

- `Header` - File upload and error handling
- `OverviewStats` - Statistical overview cards
- `Charts` - Chart.js integration for visualizations
- `VmtaPerformance` - VMTA performance cards
- `SearchAndFilters` - Search and filtering interface
- `DataTable` - Paginated data display with expansion

### Custom Hooks

- `useEmailData` - Centralized data management and state

### Utilities

- `csvParser.js` - CSV parsing with timezone support
- `dataAnalysis.js` - Data processing and analytics functions

## Sample Data

The `public/` folder contains sample CSV files for testing:

- `acct-2025-07-10-0000.csv`
- `acct-2025-07-11-0000.csv`
- `acct-2025-07-12-0000.csv`

## Performance Notes

- Handles large CSV files efficiently with streaming parsing
- Lazy loading and pagination for optimal performance
- Memory-efficient data filtering and search
- Responsive design adapts to different screen sizes

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

---

**Built with ❤️ for email campaign analytics**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
