import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const VmtaPerformance = ({ data, vmtaPerformance }) => {
  // Use vmtaPerformance prop first, fall back to data prop for backwards compatibility
  const vmtaData = vmtaPerformance || data;

  // Calculate VMTA statistics
  const calculateVmtaStats = () => {
    if (!vmtaData || vmtaData.length === 0) return [];

    const vmtaStats = {};

    vmtaData.forEach((record) => {
      const vmta = record.vmta || "Unknown";
      const status = record.dsnAction?.toLowerCase() || "unknown";
      const ip =
        record.ip ||
        record.srcIp ||
        record.sourceIp ||
        record.dlvSourceIp ||
        "Unknown";

      if (!vmtaStats[vmta]) {
        vmtaStats[vmta] = {
          total: 0,
          delivered: 0,
          failed: 0,
          bounced: 0,
          delayed: 0,
          deferred: 0,
          other: 0,
          ip: ip,
          ips: new Set(), // Track multiple IPs for this VMTA
        };
      }

      // Add IP to the set of IPs for this VMTA
      if (ip !== "Unknown") {
        vmtaStats[vmta].ips.add(ip);
        // Update the main IP (use the most recent or first one)
        if (vmtaStats[vmta].ip === "Unknown") {
          vmtaStats[vmta].ip = ip;
        }
      }

      vmtaStats[vmta].total++;

      switch (status) {
        case "delivered":
        case "relayed":
          vmtaStats[vmta].delivered++;
          break;
        case "failed":
          vmtaStats[vmta].failed++;
          break;
        case "bounced":
          vmtaStats[vmta].bounced++;
          break;
        case "delayed":
          vmtaStats[vmta].delayed++;
          break;
        case "deferred":
          vmtaStats[vmta].deferred++;
          break;
        default:
          vmtaStats[vmta].other++;
      }
    });

    return Object.entries(vmtaStats)
      .map(([vmta, stats]) => ({
        vmta,
        ...stats,
        ip: stats.ip,
        ipCount: stats.ips.size,
        allIps: Array.from(stats.ips),
        deliveryRate: ((stats.delivered / stats.total) * 100).toFixed(1),
        failureRate: (
          ((stats.failed + stats.bounced) / stats.total) *
          100
        ).toFixed(1),
      }))
      .sort((a, b) => b.total - a.total);
  };

  const vmtaStats = calculateVmtaStats();

  const getPerformanceColor = (deliveryRate) => {
    if (deliveryRate >= 95)
      return "bg-green-900/20 text-green-400 border-green-700/50";
    if (deliveryRate >= 85)
      return "bg-yellow-900/20 text-yellow-400 border-yellow-700/50";
    return "bg-red-900/20 text-red-400 border-red-700/50";
  };

  const getPerformanceIcon = (deliveryRate) => {
    if (deliveryRate >= 95)
      return <TrendingUp size={16} className="text-green-400" />;
    if (deliveryRate >= 85)
      return <TrendingDown size={16} className="text-yellow-400" />;
    return <AlertTriangle size={16} className="text-red-400" />;
  };

  const getProgressBarColor = (deliveryRate) => {
    if (deliveryRate >= 95) return "bg-green-500";
    if (deliveryRate >= 85) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!vmtaData || vmtaData.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server size={20} className="text-blue-400" />
            <CardTitle className="text-gray-100">VMTA Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Server size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            No VMTA data available
          </h3>
          <p className="text-sm text-gray-400">
            Upload email data to see VMTA performance metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <Server size={20} className="text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-100">
          VMTA Performance
        </h2>
        <Badge
          variant="outline"
          className="bg-blue-900/20 border-blue-700/50 text-blue-400"
        >
          {vmtaStats.length} VMTAs
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vmtaStats.map((vmta) => (
          <Card
            key={vmta.vmta}
            className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-gray-100 truncate">
                    {vmta.vmta}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">IP:</span>
                    <span className="text-xs text-blue-400 font-mono">
                      {vmta.ip}
                    </span>
                    {vmta.ipCount > 1 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-900/20 border-blue-700/50 text-blue-400 text-xs px-1 py-0"
                      >
                        +{vmta.ipCount - 1} more
                      </Badge>
                    )}
                  </div>
                </div>
                {getPerformanceIcon(parseFloat(vmta.deliveryRate))}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getPerformanceColor(parseFloat(vmta.deliveryRate))}
                >
                  {vmta.deliveryRate}% delivered
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery Rate</span>
                  <span className="text-gray-300">{vmta.deliveryRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressBarColor(
                      parseFloat(vmta.deliveryRate)
                    )}`}
                    style={{ width: `${vmta.deliveryRate}%` }}
                  />
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-gray-300 font-medium">
                      {vmta.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Delivered:</span>
                    <span className="text-green-400 font-medium">
                      {vmta.delivered.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Failed:</span>
                    <span className="text-red-400 font-medium">
                      {vmta.failed.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-red-400">Bounced:</span>
                    <span className="text-red-400 font-medium">
                      {vmta.bounced.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Delayed:</span>
                    <span className="text-yellow-400 font-medium">
                      {vmta.delayed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Deferred:</span>
                    <span className="text-yellow-400 font-medium">
                      {vmta.deferred.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Failure Rate */}
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Failure Rate:</span>
                  <span className="text-red-400 font-medium">
                    {vmta.failureRate}%
                  </span>
                </div>
              </div>

              {/* IP Addresses - Show all IPs if multiple */}
              {vmta.ipCount > 1 && (
                <div className="pt-2 border-t border-gray-700">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">
                      All IP Addresses:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {vmta.allIps.map((ip, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-800 text-blue-400 px-2 py-1 rounded font-mono"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">
            Overall Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-400">
                {vmtaStats.length}
              </div>
              <div className="text-sm text-gray-400">Active VMTAs</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-300">
                {vmtaStats
                  .reduce((sum, vmta) => sum + vmta.total, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Emails</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-400">
                {(
                  (vmtaStats.reduce((sum, vmta) => sum + vmta.delivered, 0) /
                    vmtaStats.reduce((sum, vmta) => sum + vmta.total, 0)) *
                    100 || 0
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-400">Avg Delivery Rate</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-400">
                {(
                  (vmtaStats.reduce(
                    (sum, vmta) => sum + vmta.failed + vmta.bounced,
                    0
                  ) /
                    vmtaStats.reduce((sum, vmta) => sum + vmta.total, 0)) *
                    100 || 0
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-400">Avg Failure Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VmtaPerformance;
