import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  CheckCircle,
  Eye,
  MousePointer,
  AlertTriangle,
  UserMinus,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  fetchUserCampaigns,
  selectFilteredCampaigns,
  selectAggregatedStats,
  selectMailwizzLoading,
  selectMailwizzError,
} from "@/store/slices/mailwizzSlice";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import PerformanceChart from "./PerformanceChart";
import CampaignTable from "./CampaignTable";
import ExportControls from "./ExportControls";

const MetricCard = ({ title, value, percentage, icon, color, description }) => {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    gray: "border-gray-700 bg-gray-800 text-gray-300",
  };

  return (
    <Card className={`${colorClasses[color]} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-70">{title}</p>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            {percentage && (
              <p className="text-sm opacity-70">
                {percentage}% {description}
              </p>
            )}
          </div>
          <div className="p-3 rounded-full bg-gray-800 shadow-sm">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const CampaignOverview = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectFilteredCampaigns);
  const aggregatedStats = useSelector(selectAggregatedStats);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);

  useEffect(() => {
    dispatch(fetchUserCampaigns());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUserCampaigns());
  };

  const performanceMetrics = useMemo(() => {
    const {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
    } = aggregatedStats;

    return {
      deliveryRate:
        totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0,
      openRate:
        totalDelivered > 0
          ? ((totalOpened / totalDelivered) * 100).toFixed(1)
          : 0,
      clickRate:
        totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0,
      bounceRate:
        totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : 0,
      unsubscribeRate:
        totalSent > 0 ? ((totalUnsubscribed / totalSent) * 100).toFixed(1) : 0,
    };
  }, [aggregatedStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage error={error} onRetry={handleRefresh} className="m-6" />
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Campaign Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor your email campaign performance and analytics
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center space-x-2 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <ExportControls campaigns={campaigns} />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard
          title="Total Sent"
          value={aggregatedStats.totalSent}
          icon={<Send className="h-6 w-6" />}
          color="blue"
          description="emails sent"
        />

        <MetricCard
          title="Delivered"
          value={aggregatedStats.totalDelivered}
          percentage={performanceMetrics.deliveryRate}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          description="delivery rate"
        />

        <MetricCard
          title="Opened"
          value={aggregatedStats.totalOpened}
          percentage={performanceMetrics.openRate}
          icon={<Eye className="h-6 w-6" />}
          color="purple"
          description="open rate"
        />

        <MetricCard
          title="Clicked"
          value={aggregatedStats.totalClicked}
          percentage={performanceMetrics.clickRate}
          icon={<MousePointer className="h-6 w-6" />}
          color="orange"
          description="click rate"
        />

        <MetricCard
          title="Bounced"
          value={aggregatedStats.totalBounced}
          percentage={performanceMetrics.bounceRate}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
          description="bounce rate"
        />

        <MetricCard
          title="Unsubscribed"
          value={aggregatedStats.totalUnsubscribed}
          percentage={performanceMetrics.unsubscribeRate}
          icon={<UserMinus className="h-6 w-6" />}
          color="gray"
          description="unsubscribe rate"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart campaigns={campaigns} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.reduce((acc, campaign) => {
                acc[campaign.status] = (acc[campaign.status] || 0) + 1;
                return acc;
              }, {}) &&
                Object.entries(
                  campaigns.reduce((acc, campaign) => {
                    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize font-medium">{status}</span>
                    <span className="bg-gray-600 px-2 py-1 rounded text-sm text-white">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>All Campaigns ({campaigns.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignTable campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignOverview;
