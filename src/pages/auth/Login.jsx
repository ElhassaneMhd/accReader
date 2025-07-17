import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building,
} from "lucide-react";
import {
  loginUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  clearError,
  setLoginType,
  selectAuth,
} from "@/store/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const { loginType } = useSelector(selectAuth);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when component mounts or login type changes
  React.useEffect(() => {
    dispatch(clearError());
  }, [dispatch, loginType]);

  // Redirect if already authenticated
  const from = location.state?.from?.pathname || "/";
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      return;
    }

    dispatch(
      loginUser({
        ...formData,
        userType: loginType,
      })
    );
  };

  const handleLoginTypeChange = (type) => {
    dispatch(setLoginType(type));
    dispatch(clearError());
    setFormData({ username: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Email Analytics Platform
          </h2>
          <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Type Selector */}
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleLoginTypeChange("admin")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "admin"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Admin Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoginTypeChange("client")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "client"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Client Portal</span>
          </button>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {loginType === "admin" ? "Administrator Login" : "Client Login"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.username || !formData.password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to{" "}
                    {loginType === "admin" ? "Admin Panel" : "Client Dashboard"}
                  </>
                )}
              </Button>
            </form>

            {/* Access Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {loginType === "admin" ? "Admin Access" : "Client Access"}
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {loginType === "admin" ? (
                  <>
                    <li>• Full access to PMTA analytics</li>
                    <li>• MailWizz campaign management</li>
                    <li>• User and permission management</li>
                    <li>• System health monitoring</li>
                  </>
                ) : (
                  <>
                    <li>• Access to assigned campaigns only</li>
                    <li>• Performance analytics and reports</li>
                    <li>• Data export capabilities</li>
                    <li>• Mobile-responsive dashboard</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2025 Email Analytics Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
