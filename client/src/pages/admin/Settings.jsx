import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  KeyRound,
  Bell,
  SlidersHorizontal,
  Save,
  TestTube,
  Eye,
  EyeOff,
} from "lucide-react";
import { useConnectionContext } from "@/hooks/useConnectionContext";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

const API_BASE_URL = import.meta.env.PROD
  ? "http://localhost:4000"
  : "http://localhost:4000";

const GeneralSettings = () => {
  const [, setConfigs] = useState([]); // Used in loadConfigs function
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [formData, setFormData] = useState({
    MAILWIZZ_API_URL: "",
    MAILWIZZ_PUBLIC_KEY: "",
    MAILWIZZ_PRIVATE_KEY: "",
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/config`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data);

        // Populate form with existing values
        const mailwizzConfigs = data.data.filter((config) =>
          config.key.startsWith("MAILWIZZ_")
        );

        const newFormData = {
          MAILWIZZ_API_URL: "",
          MAILWIZZ_PUBLIC_KEY: "",
          MAILWIZZ_PRIVATE_KEY: "",
        };

        mailwizzConfigs.forEach((config) => {
          newFormData[config.key] = config.value || "";
        });
        setFormData(newFormData);
      }
    } catch (error) {
      console.error("Error loading configs:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (
    key,
    value,
    description = "",
    isEncrypted = false,
    category = "mailwizz"
  ) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        key,
        value,
        description,
        isEncrypted,
        category,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save configuration");
    }

    return await response.json();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each configuration
      await Promise.all([
        saveConfig(
          "MAILWIZZ_API_URL",
          formData.MAILWIZZ_API_URL,
          "MailWizz API URL",
          false,
          "mailwizz"
        ),
        saveConfig(
          "MAILWIZZ_PUBLIC_KEY",
          formData.MAILWIZZ_PUBLIC_KEY,
          "MailWizz Public Key",
          true,
          "mailwizz"
        ),
        saveConfig(
          "MAILWIZZ_PRIVATE_KEY",
          formData.MAILWIZZ_PRIVATE_KEY,
          "MailWizz Private Key",
          true,
          "mailwizz"
        ),
      ]);

      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });

      // Reload configs to get updated data
      await loadConfigs();
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (
      !formData.MAILWIZZ_API_URL ||
      !formData.MAILWIZZ_PUBLIC_KEY ||
      !formData.MAILWIZZ_PRIVATE_KEY
    ) {
      toast({
        title: "Error",
        description: "Please fill in all MailWizz configuration fields",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/mailwizz/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            apiUrl: formData.MAILWIZZ_API_URL,
            publicKey: formData.MAILWIZZ_PUBLIC_KEY,
            privateKey: formData.MAILWIZZ_PRIVATE_KEY,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Connection test successful! Found ${data.data.campaignsCount} campaigns.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to MailWizz",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section>
      <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
        <SlidersHorizontal className="h-6 w-6 text-blue-400" /> General Settings
      </h3>

      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              MailWizz API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiUrl" className="text-gray-300">
                API URL
              </Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://your-mailwizz-instance.com/api"
                value={formData.MAILWIZZ_API_URL}
                onChange={(e) =>
                  handleInputChange("MAILWIZZ_API_URL", e.target.value)
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="publicKey" className="text-gray-300">
                Public Key
              </Label>
              <Input
                id="publicKey"
                type="text"
                placeholder="Enter your MailWizz public key"
                value={formData.MAILWIZZ_PUBLIC_KEY}
                onChange={(e) =>
                  handleInputChange("MAILWIZZ_PUBLIC_KEY", e.target.value)
                }
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="privateKey" className="text-gray-300">
                Private Key
              </Label>
              <div className="relative">
                <Input
                  id="privateKey"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="Enter your MailWizz private key"
                  value={formData.MAILWIZZ_PRIVATE_KEY}
                  onChange={(e) =>
                    handleInputChange("MAILWIZZ_PRIVATE_KEY", e.target.value)
                  }
                  className="bg-gray-700 border-gray-600 text-gray-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPrivateKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Configuration"}
              </Button>

              <Button
                onClick={handleTestConnection}
                disabled={testing || loading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {loading && (
              <Alert>
                <AlertDescription>Loading configuration...</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Configuration Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                • API keys are encrypted and stored securely in the database
              </p>
              <p>• Configuration takes precedence over environment variables</p>
              <p>
                • Test your connection before saving to ensure credentials are
                correct
              </p>
              <p>• Changes are applied immediately after saving</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const Settings = () => {
  const { isConnecting, connectionError, connect, isConnected, disconnect } =
    useConnectionContext();

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gray-950 p-4 m-0">
      <main className="w-full flex flex-col p-10 bg-gray-900 rounded-2xl shadow-2xl mb-12">
        <Routes>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<GeneralSettings />} />
          <Route
            path="ssh"
            element={
              <section>
                <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
                  <KeyRound className="h-6 w-6 text-blue-400" /> SSH Connection
                </h3>
                <div className="w-full">
                  <LoginForm
                    onConnect={connect}
                    isConnecting={isConnecting}
                    error={connectionError}
                  />
                  {isConnected && (
                    <button
                      onClick={disconnect}
                      className="mt-6 px-5 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </section>
            }
          />
          <Route
            path="notifications"
            element={
              <section>
                <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-blue-400" /> Notifications
                </h3>
                <div className="text-gray-400">
                  Notification settings will go here.
                </div>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default Settings;
