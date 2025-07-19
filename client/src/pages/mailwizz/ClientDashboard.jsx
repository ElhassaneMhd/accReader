import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUser,
  selectPermissions,
} from "@/store/slices/authSlice";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import page components
import CampaignOverview from "@/components/mailwizz/client/CampaignOverview";
import CampaignDetails from "@/components/mailwizz/client/CampaignDetails";

const MailWizzDashboard = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const permissions = useSelector(selectPermissions);

  useEffect(() => {
    // Token verification happens automatically in authSlice
    // No additional verification needed here
  }, []);

  // Check if user has permission to access MailWizz
  if (!permissions.canAccessMailWizz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-400">
            You don't have permission to access the MailWizz dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Campaign Dashboard
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, {user?.username}
              </p>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {user?.username}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user?.role} Account
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6">
        <Routes>
          <Route index element={<CampaignOverview />} />
          <Route path="overview" element={<CampaignOverview />} />
          <Route path="campaign/:campaignId" element={<CampaignDetails />} />
          <Route
            path="*"
            element={<Navigate to="/mailwizz/overview" replace />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default MailWizzDashboard;
