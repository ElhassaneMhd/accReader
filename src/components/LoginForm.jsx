import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Server, Eye, EyeOff } from "lucide-react";

const LoginForm = ({ onConnect, isConnecting, error }) => {
  const [formData, setFormData] = useState({
    host: "91.229.239.75",
    port: "22",
    username: "root",
    password: "",
    logPath: "/var/log/pmta",
    logPattern: "acct-*.csv",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(formData);
  };

  return (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">
          Connect to PMTA Server
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Enter your PowerMTA server credentials to begin monitoring
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Host */}
          <div className="space-y-2">
            <Label htmlFor="host" className="text-gray-300">
              Server Host
            </Label>
            <Input
              id="host"
              name="host"
              type="text"
              value={formData.host}
              onChange={handleInputChange}
              placeholder="91.229.239.75"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label htmlFor="port" className="text-gray-300">
              SSH Port
            </Label>
            <Input
              id="port"
              name="port"
              type="number"
              value={formData.port}
              onChange={handleInputChange}
              placeholder="22"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="root"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Log Path */}
          <div className="space-y-2">
            <Label htmlFor="logPath" className="text-gray-300">
              Log Directory Path
            </Label>
            <Input
              id="logPath"
              name="logPath"
              type="text"
              value={formData.logPath}
              onChange={handleInputChange}
              placeholder="/var/log/pmta"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Log Pattern */}
          <div className="space-y-2">
            <Label htmlFor="logPattern" className="text-gray-300">
              Log File Pattern
            </Label>
            <Input
              id="logPattern"
              name="logPattern"
              type="text"
              value={formData.logPattern}
              onChange={handleInputChange}
              placeholder="acct-*.csv"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-600 bg-red-900/20">
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect to Server"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Your credentials are used only to establish a secure SSH connection
            to your PMTA server and are not stored permanently.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
