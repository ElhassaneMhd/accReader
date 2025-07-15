import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useConnectionContext } from "../hooks/useConnectionContext";
import { Mail, Server, Upload } from "lucide-react";

const LoginPage = () => {
  const { isConnecting, connectionError, connect } = useConnectionContext();
  const navigate = useNavigate();

  const handleConnect = async (connectionData) => {
    const result = await connect(connectionData);
    return result;
  };

  const handleGetStarted = () => {
    navigate("/upload");
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
            <div className="mt-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                <Upload className="h-5 w-5" />
                Get Started
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Try the public upload without authentication
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full md:max-w-md">
          <div className="md:hidden mb-6">
            <div className="text-center mb-4">
              <Server className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-white mb-2">
                Email Campaign Analytics
              </h1>
              <p className="text-sm text-gray-400">
                Analyze PowerMTA CSV files for delivery performance
              </p>
            </div>
            <button
              onClick={handleGetStarted}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 mb-4"
            >
              <Upload className="h-5 w-5" />
              Get Started
            </button>
            <div className="text-center text-sm text-gray-500 mb-4">
              Or connect to your dashboard
            </div>
          </div>
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
