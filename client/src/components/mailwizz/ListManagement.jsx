import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllLists, 
  fetchListDetails,
  selectAllLists,
  selectSelectedList,
  selectMailwizzLoading,
  selectMailwizzError
} from '../../store/slices/mailwizzSlice';
import SubscriberManagement from './SubscriberManagement';
import CSVImport from './CSVImport';

const ListManagement = () => {
  const dispatch = useDispatch();
  const allLists = useSelector(selectAllLists);
  const selectedList = useSelector(selectSelectedList);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);
  
  const [activeTab, setActiveTab] = useState('lists');
  const [selectedListId, setSelectedListId] = useState(null);

  useEffect(() => {
    // Fetch all lists on component mount
    dispatch(fetchAllLists());
  }, [dispatch]);

  useEffect(() => {
    // Debug: Log the lists data structure
    console.log('All lists data:', allLists);
  }, [allLists]);

  const handleListSelect = (listId) => {
    console.log('Selected list ID:', listId); // Debug log
    setSelectedListId(listId);
    dispatch(fetchListDetails(listId));
    setActiveTab('subscribers');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderListsTab = () => (
    <div className="bg-gray-800 border border-gray-700 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg leading-6 font-medium text-white">
            MailWizz Lists
          </h3>
          <button
            onClick={() => dispatch(fetchAllLists())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh Lists
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <div className="mt-2 text-sm text-red-200">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && allLists.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No lists found</p>
          </div>
        )}

        {!loading && allLists.length > 0 && (
          <div className="overflow-x-auto shadow ring-1 ring-gray-700 ring-opacity-50 md:rounded-lg">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      List Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Display Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Subscribers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                {allLists.map((list) => {
                  // Handle both flattened and nested structures
                  const listUid = list.list_uid || list.general?.list_uid;
                  const listName = list.name || list.general?.name;
                  const displayName = list.display_name || list.general?.display_name;
                  
                  return (
                    <tr key={listUid} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {listName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {list.subscribers_count || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {list.date_added ? formatDate(list.date_added) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleListSelect(listUid)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Manage Subscribers
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-800">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('lists')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lists'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            }`}
          >
            Lists Overview
          </button>
          {selectedListId && selectedListId !== 'undefined' && (
            <>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscribers'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                Subscribers
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                CSV Import
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'lists' && renderListsTab()}
      
      {activeTab === 'subscribers' && selectedListId && selectedListId !== 'undefined' && (
        <SubscriberManagement listId={selectedListId} />
      )}
      
      {activeTab === 'import' && selectedListId && selectedListId !== 'undefined' && (
        <CSVImport listId={selectedListId} />
      )}
    </div>
  );
};

export default ListManagement;
