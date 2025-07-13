import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:3990";

export const useConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Check connection status on load
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connection-status`);
      if (response.ok) {
        const status = await response.json();
        setIsConnected(status.isConnected);
        setConnectionStatus(status.status);
        if (status.lastError) {
          setConnectionError(status.lastError);
        }
      }
    } catch (error) {
      console.error("Failed to check connection status:", error);
      // API service might not be running
      setConnectionError("Unable to connect to import service");
    }
  };

  const connect = async (connectionData) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connectionData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus("connected");
        setConnectionError(null);
        return { success: true, data: result };
      } else {
        setConnectionError(
          result.details || result.error || "Connection failed"
        );
        return { success: false, error: result.details || result.error };
      }
    } catch (error) {
      console.error("Connection error:", error);
      const errorMessage =
        "Failed to connect to import service. Make sure the service is running on port 3990.";
      setConnectionError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/disconnect`, {
        method: "POST",
      });

      if (response.ok) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        setConnectionError(null);
        return { success: true };
      } else {
        const result = await response.json();
        throw new Error(result.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      // Force local state update even if API call failed
      setIsConnected(false);
      setConnectionStatus("disconnected");
      return { success: false, error: error.message };
    }
  };

  return {
    isConnected,
    isConnecting,
    connectionError,
    connectionStatus,
    connect,
    disconnect,
    checkConnectionStatus,
  };
};
