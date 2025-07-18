import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchListSubscribers,
  addSubscriber,
  updateSubscriber,
  deleteSubscriber,
  selectListSubscribersByListId,
  selectSelectedList,
  selectMailwizzLoading,
  selectMailwizzError
} from '../../store/slices/mailwizzSlice';

const SubscriberManagement = ({ listId }) => {
  const dispatch = useDispatch();
  const subscribers = useSelector(selectListSubscribersByListId(listId));
  const selectedList = useSelector(selectSelectedList);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    console.log('SubscriberManagement: listId changed to:', listId);
    if (listId && listId !== 'undefined') {
      console.log('Fetching subscribers for listId:', listId);
      dispatch(fetchListSubscribers({ listUid: listId }));
    }
  }, [dispatch, listId]);

  useEffect(() => {
    console.log('Subscribers data:', subscribers);
    console.log('Subscribers length:', subscribers?.length);
  }, [subscribers]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!listId || listId === 'undefined') {
      console.error('Invalid listId:', listId);
      return;
    }
    
    if (editingSubscriber) {
      await dispatch(updateSubscriber({
        listUid: listId,
        subscriberUid: editingSubscriber.subscriber_uid,
        subscriberData: formData
      }));
      setEditingSubscriber(null);
    } else {
      await dispatch(addSubscriber({ listUid: listId, subscriberData: formData }));
      setShowAddForm(false);
    }
    
    setFormData({ email: '', first_name: '', last_name: '' });
    dispatch(fetchListSubscribers({ listUid: listId }));
  };

  const handleEdit = (subscriber) => {
    setEditingSubscriber(subscriber);
    setFormData({
      email: subscriber.EMAIL || subscriber.email || '',
      first_name: subscriber.FNAME || subscriber.first_name || '',
      last_name: subscriber.LNAME || subscriber.last_name || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (subscriberId) => {
    if (!listId || listId === 'undefined') {
      console.error('Invalid listId:', listId);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      await dispatch(deleteSubscriber({ listUid: listId, subscriberUid: subscriberId }));
      dispatch(fetchListSubscribers({ listUid: listId }));
    }
  };

  const cancelEdit = () => {
    setEditingSubscriber(null);
    setShowAddForm(false);
    setFormData({ email: '', first_name: '', last_name: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Subscribers for {selectedList?.name || 'List'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage subscribers in this list
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => dispatch(fetchListSubscribers({ listUid: listId }))}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Subscriber
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              {editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editingSubscriber ? 'Update' : 'Add'} Subscriber
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && subscribers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No subscribers found in this list</p>
          </div>
        )}

        {!loading && subscribers.length > 0 && (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Last Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.subscriber_uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscriber.EMAIL || subscriber.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscriber.FNAME || subscriber.first_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscriber.LNAME || subscriber.last_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscriber.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : subscriber.status === 'unsubscribed'
                          ? 'bg-red-100 text-red-800'
                          : subscriber.status === 'blacklisted'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscriber.date_added)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(subscriber)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subscriber.subscriber_uid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default SubscriberManagement;
