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

// PowerMTA pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
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
      {/* PowerMTA Analytics Routes */}
      <Route 
        path="/pmta" 
        element={
          <ConnectionProvider>
            <EmailDataProvider>
              <LoginPage />
            </EmailDataProvider>
          </ConnectionProvider>
        } 
      />
      <Route 
        path="/pmta-dashboard" 
        element={
          <ConnectionProvider>
            <EmailDataProvider>
              <DashboardPage />
            </EmailDataProvider>
          </ConnectionProvider>
        } 
      />
      <Route 
        path="/pmta-upload" 
        element={<PublicUploadPage />} 
      />

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
                <Route
                  index
                  element={<Navigate to="/admin/campaigns" replace />}
                />
                <Route path="campaigns" element={<CampaignManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="lists" element={<ListManagementPage />} />
                {/* Add more admin routes here as needed */}
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirects to PowerMTA login */}
      <Route path="/" element={<Navigate to="/pmta" replace />} />

      {/* Catch all - redirect to PowerMTA login */}
      <Route path="*" element={<Navigate to="/pmta" replace />} />
    </Routes>
  );
};

export default AppRoutes;
