import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useConnectionContext } from "../hooks/useConnectionContext";
import { Mail, Server, Upload } from "lucide-react";

const LoginPage = () => {
  const { isConnected, isConnecting, connectionError, connect } =
    useConnectionContext();
  const navigate = useNavigate();

  // Check if already connected and redirect
  useEffect(() => {
    if (isConnected) {
      navigate("/pmta");
    }
  }, [isConnected, navigate]);

  const handleConnect = async (connectionData) => {
    const result = await connect(connectionData);
    if (result.success) {
      // Navigate to dashboard on successful connection
      navigate("/pmta");
    }
    return result;
  };

  const handleGetStarted = () => {
    navigate("/pmta-upload");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full flex flex-col items-center justify-center gap-8">
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
          {/* Remove SSH connection form here */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
