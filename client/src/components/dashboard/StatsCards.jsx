import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
} from "lucide-react";

const StatsCards = ({ analysis }) => {
  if (!analysis) return null;

  const stats = [
    {
      title: "Total Emails",
      value: analysis.totalEmails?.toLocaleString() || "0",
      icon: Mail,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700/50",
    },
    {
      title: "Delivered",
      value: analysis.delivered?.toLocaleString() || "0",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700/50",
      percentage: analysis.deliveryRate,
    },
    {
      title: "Bounced",
      value: analysis.bounced?.toLocaleString() || "0",
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
      borderColor: "border-red-700/50",
      percentage: analysis.bounceRate,
    },
    {
      title: "Deferred",
      value: analysis.deferrals?.toLocaleString() || "0",
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      borderColor: "border-yellow-700/50",
      percentage: analysis.deferralRate,
    },
  ];

  const getPerformanceIndicator = (percentage) => {
    if (percentage >= 95) return { icon: TrendingUp, color: "text-green-400" };
    if (percentage >= 85) return { icon: TrendingUp, color: "text-yellow-400" };
    return { icon: TrendingDown, color: "text-red-400" };
  };

  return (
    <>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const performance =
          stat.percentage !== undefined
            ? getPerformanceIndicator(stat.percentage)
            : null;
        const PerformanceIcon = performance?.icon;

        return (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <IconComponent size={24} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
                {performance && (
                  <div className="flex items-center gap-1">
                    <PerformanceIcon size={16} className={performance.color} />
                    <span
                      className={`text-sm font-semibold ${performance.color}`}
                    >
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              {stat.percentage !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stat.color.includes("green")
                          ? "bg-green-400"
                          : stat.color.includes("red")
                          ? "bg-red-400"
                          : stat.color.includes("yellow")
                          ? "bg-yellow-400"
                          : "bg-blue-400"
                      }`}
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default StatsCards;
