import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Shield,
  Home,
  Database,
  List,
  ChevronDown,
} from "lucide-react";
import { logoutUser, selectAuth } from "@/store/slices/authSlice";

const AdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(selectAuth);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigation = [
    { name: "Overview", href: "/admin/overview", icon: Home },
    { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
    { name: "Lists", href: "/admin/lists", icon: List },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "PMTA Dashboard", href: "/admin/pmta", icon: Database },
  ];

  const settingsSubmenu = [
    { name: "SSH Connection", href: "/admin/settings/ssh" },
    { name: "General", href: "/admin/settings/general" },
    { name: "Notifications", href: "/admin/settings/notifications" },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const isActive = (href) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
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
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">
                Admin Panel
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
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
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
                            ? "bg-gray-700 text-white"
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
              {/* Settings Nested Menu */}
              <li>
                <button
                  type="button"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors focus:outline-none justify-between
                    ${
                      location.pathname.startsWith("/admin/settings")
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }
                  `}
                  onClick={() => setSettingsOpen((open) => !open)}
                  aria-expanded={settingsOpen}
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5" />
                    <span className="">Settings</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 ml-96 transition-transform  ${
                      settingsOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {settingsOpen && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {settingsSubmenu.map((sub) => (
                      <li key={sub.name}>
                        <Link
                          to={sub.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${
                              location.pathname === sub.href
                                ? "bg-gray-700 text-white"
                                : "text-gray-300 hover:text-white hover:bg-gray-700"
                            }
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span>{sub.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
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
      <div className="flex-1">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-gray-900 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-gray-200"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="bg-gray-950 min-h-full">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
