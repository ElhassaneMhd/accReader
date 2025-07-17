# 📊 MailWizz Client Campaign Dashboard - Implementation Plan

## 🎯 Integration Strategy

This document outlines the implementation plan for integrating the **MailWizz Client Campaign Dashboard** into the existing **accReader** PMTA analytics project. The integration will create a unified platform offering both PMTA analytics and client-facing MailWizz campaign insights.

---

## 🏗️ Enhanced Architecture

### **Unified Application Structure**

```
accReader/ (Enhanced)
├── src/
│   ├── components/
│   │   ├── pmta/              # Existing PMTA components
│   │   │   ├── Charts.jsx
│   │   │   ├── DataTable.jsx
│   │   │   └── ...
│   │   ├── mailwizz/          # New MailWizz components
│   │   │   ├── client/        # Client-facing components
│   │   │   │   ├── CampaignOverview.jsx
│   │   │   │   ├── CampaignDetails.jsx
│   │   │   │   ├── PerformanceCharts.jsx
│   │   │   │   └── ExportControls.jsx
│   │   │   ├── admin/         # Admin management components
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── CampaignAssignment.jsx
│   │   │   │   └── SystemHealth.jsx
│   │   │   └── shared/        # Shared MailWizz components
│   │   │       ├── MailWizzCharts.jsx
│   │   │       └── CampaignCard.jsx
│   │   └── shared/            # Shared across both platforms
│   │       ├── Navigation.jsx
│   │       ├── Layout.jsx
│   │       └── AuthGuard.jsx
│   ├── pages/
│   │   ├── pmta/              # PMTA pages
│   │   │   └── PmtaDashboard.jsx
│   │   ├── mailwizz/          # MailWizz pages
│   │   │   ├── ClientDashboard.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   └── CampaignDetails.jsx
│   │   ├── auth/              # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   └── ClientLogin.jsx
│   │   └── Home.jsx           # Unified home page
│   ├── services/
│   │   ├── pmta/              # Existing PMTA services
│   │   ├── mailwizz/          # New MailWizz services
│   │   │   ├── mailwizzApi.js
│   │   │   ├── campaignService.js
│   │   │   └── authService.js
│   │   └── shared/            # Shared services
│   │       └── httpClient.js
│   └── store/
│       ├── slices/
│       │   ├── pmtaSlice.js   # Existing PMTA state
│       │   ├── mailwizzSlice.js # New MailWizz state
│       │   ├── authSlice.js   # Enhanced auth state
│       │   └── uiSlice.js     # Global UI state
│       └── store.js
├── scripts/
│   ├── pmta-import.js         # Existing PMTA import
│   └── mailwizz-sync.js       # New MailWizz sync service
├── database/
│   ├── migrations/            # Database migrations
│   ├── models/                # Database models
│   │   ├── User.js
│   │   ├── Campaign.js
│   │   └── CampaignAssignment.js
│   └── seeders/               # Initial data
└── config/
    ├── database.js
    ├── mailwizz.js
    └── redis.js
```

---

## 🔧 Implementation Phases

### **Phase 1: Backend Infrastructure**

#### **1.1 Database Setup**

```sql
-- Users table for client authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'client') DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MailWizz campaigns cache
CREATE TABLE mailwizz_campaigns (
  id SERIAL PRIMARY KEY,
  campaign_uid VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign assignments (multi-tenant)
CREATE TABLE campaign_assignments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  campaign_uid VARCHAR(255) REFERENCES mailwizz_campaigns(campaign_uid),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT REFERENCES users(id),
  UNIQUE(user_id, campaign_uid)
);

-- Campaign statistics cache
CREATE TABLE campaign_stats (
  id SERIAL PRIMARY KEY,
  campaign_uid VARCHAR(255) REFERENCES mailwizz_campaigns(campaign_uid),
  stats_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

#### **1.2 MailWizz API Service**

```javascript
// services/mailwizz/mailwizzApi.js
class MailWizzAPIService {
  constructor() {
    this.baseURL = process.env.MAILWIZZ_API_URL;
    this.apiKey = process.env.MAILWIZZ_API_KEY;
    this.cache = redis.createClient();
  }

  async getCampaigns() {
    const cacheKey = "mailwizz:campaigns";
    let campaigns = await this.cache.get(cacheKey);

    if (!campaigns) {
      const response = await axios.get(`${this.baseURL}/campaigns`, {
        headers: { "X-MW-PUBLIC-KEY": this.apiKey },
      });
      campaigns = response.data;
      await this.cache.setex(cacheKey, 300, JSON.stringify(campaigns)); // 5min cache
    }

    return JSON.parse(campaigns);
  }

  async getCampaignStats(campaignUid) {
    const cacheKey = `mailwizz:stats:${campaignUid}`;
    let stats = await this.cache.get(cacheKey);

    if (!stats) {
      const response = await axios.get(
        `${this.baseURL}/campaigns/${campaignUid}/stats`,
        { headers: { "X-MW-PUBLIC-KEY": this.apiKey } }
      );
      stats = response.data;
      await this.cache.setex(cacheKey, 600, JSON.stringify(stats)); // 10min cache
    }

    return JSON.parse(stats);
  }
}
```

#### **1.3 Enhanced Express Server**

```javascript
// Enhanced scripts/pmta-import.js
import { MailWizzAPIService } from "../services/mailwizz/mailwizzApi.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

// Add MailWizz routes to existing Express server
app.use("/api/mailwizz", authMiddleware);

// Client routes
app.get("/api/mailwizz/campaigns", async (req, res) => {
  try {
    const userId = req.user.id;
    const assignedCampaigns = await getUserCampaigns(userId);
    const campaignStats = await Promise.all(
      assignedCampaigns.map((campaign) =>
        mailwizzService.getCampaignStats(campaign.campaign_uid)
      )
    );
    res.json({ campaigns: campaignStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
app.use("/api/admin", roleMiddleware("admin"));
app.get("/api/admin/campaigns", async (req, res) => {
  const allCampaigns = await mailwizzService.getCampaigns();
  res.json(allCampaigns);
});

app.post("/api/admin/assign-campaign", async (req, res) => {
  const { userId, campaignUid } = req.body;
  await assignCampaignToUser(userId, campaignUid, req.user.id);
  res.json({ success: true });
});
```

### **Phase 2: Frontend Development**

#### **2.1 Enhanced Navigation System**

```jsx
// components/shared/Navigation.jsx
const Navigation = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      label: "PMTA Analytics",
      path: "/pmta",
      icon: <Server />,
      roles: ["admin", "pmta_user"],
    },
    {
      label: "Campaign Dashboard",
      path: "/mailwizz",
      icon: <Mail />,
      roles: ["admin", "client"],
    },
    {
      label: "Admin Panel",
      path: "/admin",
      icon: <Settings />,
      roles: ["admin"],
    },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Logo />
            {isAuthenticated && (
              <div className="flex space-x-4">
                {navigationItems
                  .filter((item) => item.roles.includes(user.role))
                  .map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                        location.pathname.startsWith(item.path)
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
              </div>
            )}
          </div>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};
```

#### **2.2 Client Dashboard Components**

```jsx
// components/mailwizz/client/CampaignOverview.jsx
const CampaignOverview = () => {
  const { campaigns, loading, error } = useSelector((state) => state.mailwizz);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUserCampaigns());
  }, [dispatch]);

  const aggregatedStats = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.totalSent += campaign.stats.sent || 0;
        acc.totalDelivered += campaign.stats.delivered || 0;
        acc.totalOpened += campaign.stats.opened || 0;
        acc.totalClicked += campaign.stats.clicked || 0;
        return acc;
      },
      { totalSent: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0 }
    );
  }, [campaigns]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sent"
          value={aggregatedStats.totalSent.toLocaleString()}
          icon={<Send />}
          color="blue"
        />
        <MetricCard
          title="Delivered"
          value={aggregatedStats.totalDelivered.toLocaleString()}
          percentage={(
            (aggregatedStats.totalDelivered / aggregatedStats.totalSent) *
            100
          ).toFixed(1)}
          icon={<CheckCircle />}
          color="green"
        />
        <MetricCard
          title="Opened"
          value={aggregatedStats.totalOpened.toLocaleString()}
          percentage={(
            (aggregatedStats.totalOpened / aggregatedStats.totalDelivered) *
            100
          ).toFixed(1)}
          icon={<Eye />}
          color="purple"
        />
        <MetricCard
          title="Clicked"
          value={aggregatedStats.totalClicked.toLocaleString()}
          percentage={(
            (aggregatedStats.totalClicked / aggregatedStats.totalOpened) *
            100
          ).toFixed(1)}
          icon={<MousePointer />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart campaigns={campaigns} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignList campaigns={campaigns.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            All Campaigns
            <ExportButton campaigns={campaigns} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignTable campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### **2.3 Admin Management Panel**

```jsx
// components/mailwizz/admin/CampaignAssignment.jsx
const CampaignAssignment = () => {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleAssignCampaign = async (campaignUid) => {
    if (!selectedUser) return;

    try {
      await dispatch(
        assignCampaignToUser({
          userId: selectedUser.id,
          campaignUid,
        })
      );

      toast.success("Campaign assigned successfully");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to assign campaign");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Assignment</h2>
        <UserSelector
          users={users}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
        />
      </div>

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignGrid
                campaigns={allCampaigns.filter(
                  (c) =>
                    !assignments.some(
                      (a) =>
                        a.campaign_uid === c.uid &&
                        a.user_id === selectedUser.id
                    )
                )}
                onCampaignSelect={handleAssignCampaign}
                actionLabel="Assign"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignGrid
                campaigns={allCampaigns.filter((c) =>
                  assignments.some(
                    (a) =>
                      a.campaign_uid === c.uid && a.user_id === selectedUser.id
                  )
                )}
                onCampaignSelect={handleUnassignCampaign}
                actionLabel="Remove"
                variant="assigned"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
```

### **Phase 3: Authentication & Security**

#### **3.1 Enhanced Authentication System**

```jsx
// store/slices/authSlice.js
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
  },
});
```

#### **3.2 Role-Based Route Protection**

```jsx
// components/shared/AuthGuard.jsx
const AuthGuard = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// App.jsx routing
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/client-login" element={<ClientLogin />} />

        <Route
          path="/pmta/*"
          element={
            <AuthGuard requiredRole="admin">
              <PmtaDashboard />
            </AuthGuard>
          }
        />

        <Route
          path="/mailwizz/*"
          element={
            <AuthGuard>
              <MailWizzDashboard />
            </AuthGuard>
          }
        />

        <Route
          path="/admin/*"
          element={
            <AuthGuard requiredRole="admin">
              <AdminPanel />
            </AuthGuard>
          }
        />

        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};
```

---

## 🚀 Deployment Strategy

### **Enhanced Environment Configuration**

```env
# Existing PMTA configuration
PMTA_HOST=91.229.239.75
PMTA_PORT=22
PMTA_USERNAME=pmta_user
PMTA_PASSWORD=secure_password

# New MailWizz configuration
MAILWIZZ_API_URL=https://your-mailwizz.com/api
MAILWIZZ_API_KEY=your-mailwizz-api-key

# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/accreader
REDIS_URL=redis://localhost:6379

# JWT configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h

# Application settings
NODE_ENV=production
PORT=3999
```

### **Enhanced Docker Configuration**

```dockerfile
# Multi-stage build for both PMTA and MailWizz features
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN apk add --no-cache postgresql-client redis

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./

EXPOSE 3999
CMD ["npm", "run", "start:prod"]
```

---

## 📋 Migration & Integration Plan

### **Step 1: Database Migration**

```bash
# Create migration scripts
npm run create-migration add-mailwizz-tables
npm run migrate
```

### **Step 2: Gradual Feature Rollout**

1. **Backend API** - Implement MailWizz API integration
2. **Authentication** - Enhance existing auth system
3. **Client Dashboard** - Add client-facing components
4. **Admin Panel** - Add campaign assignment features
5. **Testing & QA** - Comprehensive testing of both systems

### **Step 3: Production Deployment**

```bash
# Enhanced deployment script
./deploy-enhanced.sh
```

---

## 🎯 Expected Outcomes

### **For Clients**

- **Secure Access**: Private dashboard with their campaign data only
- **Rich Analytics**: Interactive charts and detailed performance metrics
- **Export Capabilities**: PDF, Excel, and CSV reports
- **Mobile Responsive**: Access insights on any device

### **For Administrators**

- **Unified Platform**: Manage both PMTA and MailWizz analytics in one place
- **User Management**: Complete control over client access and permissions
- **Campaign Assignment**: Flexible system for granting campaign access
- **System Monitoring**: Health checks and performance monitoring

### **Technical Benefits**

- **Scalable Architecture**: Multi-tenant system ready for growth
- **Security First**: Role-based access and data isolation
- **Performance Optimized**: Caching and efficient API usage
- **Maintainable Code**: Clean separation of concerns and modular design

---

This implementation plan provides a roadmap for successfully integrating the MailWizz Client Campaign Dashboard into the existing accReader application, creating a powerful unified analytics platform.
