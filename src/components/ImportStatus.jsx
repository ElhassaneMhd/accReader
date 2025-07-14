import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Activity,
  LogOut,
  Pause,
  Play,
} from "lucide-react";

const ImportStatus = ({
  autoImportEnabled,
  autoRefreshEnabled,
  lastAutoUpdate,
  onEnableAutoImport,
  onDisableAutoImport,
  onToggleAutoRefresh,
  onForceRefresh,
  onDisconnect,
  isConnected,
}) => {
  const [status, setStatus] = useState({
    status: "disconnected",
    lastImport: null,
    lastError: null,
    totalFiles: 0,
    filesProcessed: 0,
    connectionHealth: "unknown",
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch("http://localhost:3990/api/import-status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch import status:", error);
      setStatus((prev) => ({
        ...prev,
        status: "error",
        lastError: "Unable to connect to import service",
      }));
    }
  };

  const forceImport = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3990/api/force-import", {
        method: "POST",
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error("Failed to trigger import:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case "connected":
        return <CheckCircle size={16} className="text-green-400" />;
      case "importing":
        return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
      case "error":
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <WifiOff size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "connected":
        return "bg-green-900/20 text-green-400 border-green-700/50";
      case "importing":
        return "bg-blue-900/20 text-blue-400 border-blue-700/50";
      case "error":
        return "bg-red-900/20 text-red-400 border-red-700/50";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-700/50";
    }
  };

  const getConnectionIcon = () => {
    switch (status.connectionHealth) {
      case "good":
        return <Wifi size={16} className="text-green-400" />;
      case "poor":
        return <WifiOff size={16} className="text-red-400" />;
      default:
        return <Server size={16} className="text-gray-400" />;
    }
  };

  const formatLastImport = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-400" />
            <CardTitle className="text-lg text-gray-100">
              PMTA Auto-Import
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {autoImportEnabled && (
              <Badge 
                variant="outline" 
                className={
                  autoRefreshEnabled
                    ? "bg-green-900/20 text-green-400 border-green-700/50"
                    : "bg-orange-900/20 text-orange-400 border-orange-700/50"
                }
              >
                {autoRefreshEnabled ? (
                  <>
                    <Play size={12} className="mr-1" />
                    Auto-Refresh ON
                  </>
                ) : (
                  <>
                    <Pause size={12} className="mr-1" />
                    Auto-Refresh OFF
                  </>
                )}
              </Badge>
            )}
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1 capitalize">{status.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-300">PMTA Server</span>
          </div>
          <span className="text-sm text-gray-400 capitalize">
            {status.connectionHealth}
          </span>
        </div>

        {/* Import Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Last Import</span>
            </div>
            <span className="text-sm text-gray-300">
              {formatLastImport(status.lastImport)}
            </span>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Download size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Files</span>
            </div>
            <span className="text-sm text-gray-300">
              {status.filesProcessed}/{status.totalFiles}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {status.lastError && (
          <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-xs text-red-400">Last Error</span>
            </div>
            <span className="text-xs text-red-300 break-words">
              {status.lastError}
            </span>
          </div>
        )}

        {/* Progress Bar for Active Import */}
        {status.status === "importing" && status.totalFiles > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Importing files...</span>
              <span className="text-gray-300">
                {Math.round((status.filesProcessed / status.totalFiles) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (status.filesProcessed / status.totalFiles) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={forceImport}
            disabled={loading || status.status === "importing"}
            variant="outline"
            className="flex-1 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Force Import
              </>
            )}
          </Button>

          {autoImportEnabled && onToggleAutoRefresh && (
            <Button
              onClick={onToggleAutoRefresh}
              variant="outline"
              className={`flex-1 ${
                autoRefreshEnabled
                  ? "bg-orange-900/20 border-orange-600 text-orange-400 hover:bg-orange-900/30"
                  : "bg-green-900/20 border-green-600 text-green-400 hover:bg-green-900/30"
              }`}
              title={autoRefreshEnabled ? "Pause auto-refresh" : "Resume auto-refresh"}
            >
              {autoRefreshEnabled ? (
                <>
                  <Pause size={16} className="mr-2" />
                  Pause Refresh
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Resume Refresh
                </>
              )}
            </Button>
          )}

          {autoImportEnabled && onForceRefresh && (
            <Button
              onClick={onForceRefresh}
              variant="outline"
              className="flex-1 bg-blue-900/20 border-blue-600 text-blue-400 hover:bg-blue-900/30"
            >
              <Download size={16} className="mr-2" />
              Refresh Data
            </Button>
          )}

          <Button
            onClick={onDisconnect}
            disabled={loading}
            variant="outline"
            className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/30"
          >
            <LogOut size={16} className="mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStatus;
