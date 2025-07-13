import React from "react";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const OverviewStats = ({ overview }) => {
  const stats = [
    {
      title: "Total Emails",
      value: overview.totalEmails.toLocaleString(),
      icon: Mail,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700/50",
    },
    {
      title: "Delivered",
      value: overview.delivered.toLocaleString(),
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700/50",
      percentage: overview.deliveryRate,
    },
    {
      title: "Bounced",
      value: overview.bounced.toLocaleString(),
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
      borderColor: "border-red-700/50",
      percentage: overview.bounceRate,
    },
    {
      title: "Deferred",
      value: overview.deferrals.toLocaleString(),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      borderColor: "border-yellow-700/50",
    },
  ];

  const getPerformanceIndicator = (percentage) => {
    if (percentage >= 95) return { icon: TrendingUp, color: "text-green-400" };
    if (percentage >= 85) return { icon: TrendingUp, color: "text-yellow-400" };
    return { icon: TrendingDown, color: "text-red-400" };
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const performance = stat.percentage
          ? getPerformanceIndicator(stat.percentage)
          : null;
        const PerformanceIcon = performance?.icon;

        return (
          <div
            key={index}
            className={`bg-gray-900 border ${stat.borderColor} rounded-lg p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200`}
          >
            {/* Header with icon and title */}
            <div className="flex gap-3 items-center mb-3">
              <div
                className={`${stat.bgColor} p-2 rounded-md mr-3 flex items-center justify-center`}
              >
                <IconComponent size={20} className={stat.color} />
              </div>
              {/* Value */}
              <div className="text-2xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <h3 className="text-gray-300 text-sm font-semibold">
                {stat.title}
              </h3>
            </div>

            {/* Performance indicator and progress bar */}
            {stat.percentage !== undefined && (
              <div>
                <div className="flex items-center mb-2">
                  <span
                    className={`text-sm font-semibold ${performance?.color} mr-1`}
                  >
                    {stat.percentage}%
                  </span>
                  {PerformanceIcon && (
                    <PerformanceIcon size={16} className={performance.color} />
                  )}
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      stat.color.includes("green")
                        ? "bg-green-400"
                        : stat.color.includes("red")
                        ? "bg-red-400"
                        : stat.color.includes("yellow")
                        ? "bg-yellow-400"
                        : "bg-blue-400"
                    }`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OverviewStats;
