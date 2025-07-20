import React from "react";
import { useLocation } from "react-router-dom";
import { KeyRound, Bell, SlidersHorizontal } from "lucide-react";
import { useConnectionContext } from "@/hooks/useConnectionContext";
import LoginForm from "@/components/LoginForm";

function useTabQuery() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get("tab") || "ssh";
}

const Settings = () => {
  const tab = useTabQuery();
  const { isConnecting, connectionError, connect, isConnected, disconnect } =
    useConnectionContext();

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gray-950 p-4 m-0">
      <main className="w-full  flex flex-col p-10 bg-gray-900 rounded-2xl shadow-2xl  mb-12">
        {tab === "ssh" && (
          <section>
            <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-blue-400" /> SSH Connection
            </h3>
            <div className="max-w-lg">
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
        )}
        {tab === "general" && (
          <section>
            <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
              <SlidersHorizontal className="h-6 w-6 text-blue-400" /> General
              Settings
            </h3>
            <div className="text-gray-400">General settings will go here.</div>
          </section>
        )}
        {tab === "notifications" && (
          <section>
            <h3 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-400" /> Notifications
            </h3>
            <div className="text-gray-400">
              Notification settings will go here.
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Settings;
