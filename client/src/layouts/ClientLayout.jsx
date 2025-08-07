import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Mail,
  BarChart3,
  Download,
  LogOut,
  Menu,
  X,
  Home,
  User,
  Settings,
  Bell,
} from "lucide-react";
import { logoutUser, selectAuth } from "@/store/slices/authSlice";

const ClientLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(selectAuth);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Campaigns", href: "/dashboard/campaigns", icon: Mail },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Reports", href: "/dashboard/reports", icon: Download },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const isActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">
                Client Portal
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.username?.[0]?.toUpperCase() || "C"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-400">Client User</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          isActive(item.href)
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar */}
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-200"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Page title - will be dynamic based on current route */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-white">
                {location.pathname === "/dashboard" && "Dashboard Overview"}
                {location.pathname.startsWith("/dashboard/campaigns") &&
                  "My Campaigns"}
                {location.pathname.startsWith("/dashboard/analytics") &&
                  "Analytics"}
                {location.pathname.startsWith("/dashboard/reports") &&
                  "Reports"}
                {location.pathname.startsWith("/dashboard/profile") &&
                  "Profile Settings"}
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                <Settings className="h-5 w-5" />
              </Button>

              {/* User menu - mobile */}
              <div className="lg:hidden">
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-gray-200">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-950"><Outlet /></main>
      </div>
    </div>
  );
};

export default ClientLayout;
