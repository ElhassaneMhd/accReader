import React from "react";
import ListManagement from "@/components/admin/ListManagement";
import { useDispatch } from "react-redux";
import { fetchAllLists } from "@/store/slices/mailwizzSlice";
import { Button } from "@/components/ui/button";

const ListManagementPage = () => {
    const dispatch = useDispatch();

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">List Management</h1>
          <p className="text-gray-400">Manage MailWizz lists and subscribers</p>
        </div>
        <Button
          onClick={() => dispatch(fetchAllLists())}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Refresh Lists
        </Button>
      </div>
      <ListManagement />
    </div>
  );
};

export default ListManagementPage;
