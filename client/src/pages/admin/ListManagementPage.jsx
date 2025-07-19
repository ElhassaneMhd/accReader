import React from 'react';
import { ListManagement } from '../../components/mailwizz';

const ListManagementPage = () => {
  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">List Management</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your MailWizz lists and subscribers
        </p>
      </div>
      
      <ListManagement />
    </div>
  );
};

export default ListManagementPage;
