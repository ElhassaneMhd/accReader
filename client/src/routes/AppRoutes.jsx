import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectAuth } from "@/store/slices/authSlice";

// Import pages
import Login from "@/pages/auth/Login";
import ClientDashboard from "@/pages/mailwizz/ClientDashboard";
import CampaignManagement from "@/pages/admin/CampaignManagement";
import UserManagement from "@/pages/admin/UserManagement";
import ListManagementPage from "@/pages/admin/ListManagementPage";
import Settings from "@/pages/admin/Settings";
import OverviewPage from "@/pages/admin/OverviewPage";
import ListSubscribersPage from "@/pages/admin/ListSubscribersPage";

// PowerMTA pages
import DashboardPage from "@/pages/admin/DashboardPage";
import PublicUploadPage from "@/pages/PublicUploadPage";

// Context providers
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { EmailDataProvider } from "@/contexts/EmailDataContext";

// Layout components
import AdminLayout from "@/layouts/AdminLayout";
import ClientLayout from "@/layouts/ClientLayout";

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { user } = useSelector(selectAuth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (user?.role === "admin") {
      return <Navigate to="/admin/campaigns" replace />;
    } else if (user?.role === "client") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Public Route component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { user } = useSelector(selectAuth);

  if (isAuthenticated) {
    // Redirect based on user role
    if (user?.role === "admin") {
      return <Navigate to="/admin/campaigns" replace />;
    } else if (user?.role === "client") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* MailWizz Admin/Client Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Client Routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientLayout>
              <Routes>
                <Route index element={<ClientDashboard />} />
                {/* Add more client routes here as needed */}
              </Routes>
            </ClientLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Routes>
                <Route index element={<OverviewPage />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="campaigns" element={<CampaignManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="lists" element={<ListManagementPage />} />
                <Route
                  path="lists/:listUid"
                  element={<ListSubscribersPage />}
                />
                <Route
                  path="settings"
                  element={
                    <ConnectionProvider>
                      <Settings />
                    </ConnectionProvider>
                  }
                />
                {/* PMTA analytics only inside admin */}
                <Route
                  path="pmta"
                  element={
                    <ConnectionProvider>
                      <EmailDataProvider>
                        <DashboardPage />
                      </EmailDataProvider>
                    </ConnectionProvider>
                  }
                />
                {/* Add more admin routes here as needed */}
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
