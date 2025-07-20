import React from "react";
import { Users, Mail, List, BarChart3 } from "lucide-react";

const AdminOverview = () => {
  // TODO: Replace with real data from API/store
  const stats = [
    {
      title: "Total Users",
      value: 42,
      icon: <Users className="h-7 w-7 text-blue-300" />,
      color: "bg-gray-800 border-gray-700",
      iconBg: "bg-blue-900/40",
    },
    {
      title: "Total Campaigns",
      value: 128,
      icon: <Mail className="h-7 w-7 text-green-300" />,
      color: "bg-gray-800 border-gray-700",
      iconBg: "bg-green-900/40",
    },
    {
      title: "Total Lists",
      value: 17,
      icon: <List className="h-7 w-7 text-yellow-200" />,
      color: "bg-gray-800 border-gray-700",
      iconBg: "bg-yellow-900/40",
    },
    {
      title: "Total Emails",
      value: 12000,
      icon: <BarChart3 className="h-7 w-7 text-purple-300" />,
      color: "bg-gray-800 border-gray-700",
      iconBg: "bg-purple-900/40",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-950 w-full p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 p-6 rounded-xl ${stat.color} shadow hover:shadow-lg transition-all`}
          >
            <div
              className={`p-3 rounded-lg ${stat.iconBg} flex items-center justify-center`}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-100">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-gray-300 text-sm font-medium mt-1">
                {stat.title}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Add more admin overview widgets here as needed */}
    </div>
  );
};

export default AdminOverview;
