import React from 'react';
import { ListManagement } from '../../components/mailwizz';

const ListManagementPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">List Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your MailWizz lists and subscribers
        </p>
      </div>
      
      <ListManagement />
    </div>
  );
};

export default ListManagementPage;
