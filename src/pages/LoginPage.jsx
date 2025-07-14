import React from "react";
import LoginForm from "../components/LoginForm";
import { useConnectionContext } from "../hooks/useConnectionContext";
import { Mail, Server } from "lucide-react";

const LoginPage = () => {
  const { isConnecting, connectionError, connect } = useConnectionContext();

  const handleConnect = async (connectionData) => {
    const result = await connect(connectionData);
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-6xl flex flex-col md:flex-row items-center gap-8">
        {/* Welcome Section - Hidden on mobile, shown on md+ screens */}
        <div className="hidden h-full md:block  flex-1">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="flex justify-center mb-4">
                <Server className="h-12 w-12 text-blue-500" />
              </div>{" "}
              Email Campaign Analytics
            </h1>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              Upload your PowerMTA CSV files to analyze email delivery
              performance, bounce rates, VMTA statistics, and diagnostic
              information.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Supports CSV files with PowerMTA log format including columns like
              type, timeLogged, timeQueued, orig, rcpt, dsnAction, dsnStatus,
              vmta, and more.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full md:max-w-md">
          <LoginForm
            onConnect={handleConnect}
            isConnecting={isConnecting}
            error={connectionError}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
