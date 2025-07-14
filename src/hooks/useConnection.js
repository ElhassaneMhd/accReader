import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:3990";
const SESSION_KEY = "pmta_session";

export const useConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Check for existing session on load
  useEffect(() => {
    const checkSession = () => {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          const sessionData = JSON.parse(session);
          // Check if session is still valid (within 24 hours)
          const sessionAge = Date.now() - sessionData.timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (sessionAge < twentyFourHours) {
            // Verify the connection is still active
            verifyActiveConnection();
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        localStorage.removeItem(SESSION_KEY);
      }
    };

    checkSession();
  }, []);

  const verifyActiveConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connection-status`);
      if (response.ok) {
        const status = await response.json();
        if (status.isConnected) {
          setIsConnected(true);
          setConnectionStatus(status.status);
        } else {
          // Connection is not active, clear session
          localStorage.removeItem(SESSION_KEY);
        }
      } else {
        // API not available, clear session
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error("Failed to verify connection:", error);
      // API service might not be running, don't set as connected
      localStorage.removeItem(SESSION_KEY);
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
        
        // Save session to localStorage
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          timestamp: Date.now(),
          connected: true
        }));
        
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
        
        // Clear session from localStorage
        localStorage.removeItem(SESSION_KEY);
        
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
      
      // Clear session from localStorage
      localStorage.removeItem(SESSION_KEY);
      
      return { success: false, error: error.message };
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setConnectionError(null);
  };

  return {
    isConnected,
    isConnecting,
    connectionError,
    connectionStatus,
    connect,
    disconnect,
    clearSession,
    checkConnectionStatus: verifyActiveConnection,
  };
};
