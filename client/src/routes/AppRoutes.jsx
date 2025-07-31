import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectAuth } from "@/store/slices/authSlice";

import Login from "@/pages/auth/Login";
import ClientDashboard from "@/pages/mailwizz/ClientDashboard";
import CampaignManagement from "@/pages/admin/CampaignManagement";
import UserManagement from "@/pages/admin/UserManagement";
import ListManagementPage from "@/pages/admin/ListManagementPage";
import Settings from "@/pages/admin/Settings";
import OverviewPage from "@/pages/admin/OverviewPage";
import ListSubscribersPage from "@/pages/admin/ListSubscribersPage";

import DashboardPage from "@/pages/admin/DashboardPage";
import PublicUploadPage from "@/pages/PublicUploadPage";

import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { EmailDataProvider } from "@/contexts/EmailDataContext";

import AdminLayout from "@/layouts/AdminLayout";
import ClientLayout from "@/layouts/ClientLayout";

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { user } = useSelector(selectAuth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
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

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { user } = useSelector(selectAuth);

  if (isAuthenticated) {
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
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientLayout>
              <Routes>
                <Route index element={<ClientDashboard />} />
              </Routes>
            </ClientLayout>
          </ProtectedRoute>
        }
      />

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
                  path="settings/*"
                  element={
                    <ConnectionProvider>
                      <Settings />
                    </ConnectionProvider>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <ConnectionProvider>
                      <EmailDataProvider>
                        <DashboardPage />
                      </EmailDataProvider>
                    </ConnectionProvider>
                  }
                />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
