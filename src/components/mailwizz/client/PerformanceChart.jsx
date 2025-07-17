import React from "react";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PerformanceChart = ({ campaigns, type = "timeline" }) => {
  const chartColors = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#8b5cf6",
    secondary: "#6b7280",
  };

  // Timeline chart for campaign performance over time
  const generateTimelineData = () => {
    if (!campaigns || campaigns.length === 0) return null;

    // Group campaigns by date and aggregate stats
    const dailyStats = campaigns.reduce((acc, campaign) => {
      const date = new Date(campaign.created_at).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      }

      const stats = campaign.stats || {};
      acc[date].sent += stats.sent || 0;
      acc[date].delivered += stats.delivered || 0;
      acc[date].opened += stats.opened || 0;
      acc[date].clicked += stats.clicked || 0;

      return acc;
    }, {});

    const sortedDates = Object.keys(dailyStats).sort();

    return {
      labels: sortedDates.map((date) => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: "Sent",
          data: sortedDates.map((date) => dailyStats[date].sent),
          borderColor: chartColors.info,
          backgroundColor: `${chartColors.info}20`,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Delivered",
          data: sortedDates.map((date) => dailyStats[date].delivered),
          borderColor: chartColors.success,
          backgroundColor: `${chartColors.success}20`,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Opened",
          data: sortedDates.map((date) => dailyStats[date].opened),
          borderColor: chartColors.primary,
          backgroundColor: `${chartColors.primary}20`,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Clicked",
          data: sortedDates.map((date) => dailyStats[date].clicked),
          borderColor: chartColors.warning,
          backgroundColor: `${chartColors.warning}20`,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  };

  // Performance distribution pie chart
  const generatePerformanceDistribution = () => {
    if (!campaigns || campaigns.length === 0) return null;

    const totalStats = campaigns.reduce(
      (acc, campaign) => {
        const stats = campaign.stats || {};
        acc.delivered += stats.delivered || 0;
        acc.opened += stats.opened || 0;
        acc.clicked += stats.clicked || 0;
        acc.bounced += stats.bounced || 0;
        acc.unsubscribed += stats.unsubscribed || 0;
        return acc;
      },
      { delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 }
    );

    return {
      labels: ["Delivered", "Opened", "Clicked", "Bounced", "Unsubscribed"],
      datasets: [
        {
          data: [
            totalStats.delivered,
            totalStats.opened,
            totalStats.clicked,
            totalStats.bounced,
            totalStats.unsubscribed,
          ],
          backgroundColor: [
            chartColors.success,
            chartColors.primary,
            chartColors.warning,
            chartColors.danger,
            chartColors.secondary,
          ],
          borderColor: [
            chartColors.success,
            chartColors.primary,
            chartColors.warning,
            chartColors.danger,
            chartColors.secondary,
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Campaign comparison bar chart
  const generateCampaignComparison = () => {
    if (!campaigns || campaigns.length === 0) return null;

    const topCampaigns = campaigns
      .filter((c) => c.stats && c.stats.sent > 0)
      .sort((a, b) => (b.stats?.sent || 0) - (a.stats?.sent || 0))
      .slice(0, 10);

    return {
      labels: topCampaigns.map((c) =>
        c.name.length > 20 ? `${c.name.substring(0, 20)}...` : c.name
      ),
      datasets: [
        {
          label: "Delivery Rate (%)",
          data: topCampaigns.map((c) => {
            const stats = c.stats || {};
            return stats.sent > 0
              ? ((stats.delivered / stats.sent) * 100).toFixed(1)
              : 0;
          }),
          backgroundColor: chartColors.success,
          borderColor: chartColors.success,
          borderWidth: 1,
        },
        {
          label: "Open Rate (%)",
          data: topCampaigns.map((c) => {
            const stats = c.stats || {};
            return stats.delivered > 0
              ? ((stats.opened / stats.delivered) * 100).toFixed(1)
              : 0;
          }),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 1,
        },
        {
          label: "Click Rate (%)",
          data: topCampaigns.map((c) => {
            const stats = c.stats || {};
            return stats.opened > 0
              ? ((stats.clicked / stats.opened) * 100).toFixed(1)
              : 0;
          }),
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text:
          type === "timeline"
            ? "Campaign Performance Over Time"
            : type === "distribution"
            ? "Performance Distribution"
            : "Top Campaigns Comparison",
      },
    },
    scales:
      type !== "distribution"
        ? {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  if (type === "comparison") {
                    return value + "%";
                  }
                  return value.toLocaleString();
                },
              },
            },
          }
        : undefined,
  };

  const renderChart = () => {
    switch (type) {
      case "timeline": {
        const timelineData = generateTimelineData();
        if (!timelineData)
          return (
            <div className="text-center text-gray-500 py-8">
              No data available
            </div>
          );
        return <Line data={timelineData} options={chartOptions} />;
      }

      case "distribution": {
        const distributionData = generatePerformanceDistribution();
        if (!distributionData)
          return (
            <div className="text-center text-gray-500 py-8">
              No data available
            </div>
          );
        return <Pie data={distributionData} options={chartOptions} />;
      }

      case "comparison": {
        const comparisonData = generateCampaignComparison();
        if (!comparisonData)
          return (
            <div className="text-center text-gray-500 py-8">
              No data available
            </div>
          );
        return <Bar data={comparisonData} options={chartOptions} />;
      }

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Invalid chart type
          </div>
        );
    }
  };

  return (
    <div className="w-full" style={{ height: "400px" }}>
      {renderChart()}
    </div>
  );
};

export default PerformanceChart;
