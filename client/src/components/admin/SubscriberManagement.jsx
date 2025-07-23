import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchListSubscribers,
  addSubscriber,
  updateSubscriber,
  deleteSubscriber,
  selectListSubscribersByListId,
  selectSelectedList,
  selectMailwizzLoading,
  selectMailwizzError,
} from "@/store/slices/mailwizzSlice";
import DataTable from "@/components/DataTable";

const SubscriberManagement = ({ listId }) => {
  const dispatch = useDispatch();
  const subscribers = useSelector(selectListSubscribersByListId(listId));
  const selectedList = useSelector(selectSelectedList);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Server-side pagination info
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch subscribers when page or perPage changes (no search)
  useEffect(() => {
    if (listId && listId !== "undefined") {
      dispatch(fetchListSubscribers({ listUid: listId, page, perPage })).then(
        (action) => {
          const data = action.payload?.data;
          if (
            data &&
            typeof data.count === "number" &&
            typeof data.total_pages === "number"
          ) {
            setTotalSubscribers(data.count);
            setTotalPages(data.total_pages);
          } else if (Array.isArray(action.payload?.records)) {
            setTotalSubscribers(action.payload.records.length);
            setTotalPages(1);
          }
        }
      );
    }
  }, [dispatch, listId, page, perPage]);

  useEffect(() => {
    console.log("Subscribers data:", subscribers);
    console.log("Subscribers length:", subscribers?.length);
  }, [subscribers]);

  useEffect(() => {
    // Reset search and page when listId changes
    setSearchTerm("");
    setPage(1);
  }, [listId]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listId || listId === "undefined") {
      console.error("Invalid listId:", listId);
      return;
    }

    if (editingSubscriber) {
      await dispatch(
        updateSubscriber({
          listUid: listId,
          subscriberUid: editingSubscriber.subscriber_uid,
          subscriberData: formData,
        })
      );
      setEditingSubscriber(null);
    } else {
      await dispatch(
        addSubscriber({ listUid: listId, subscriberData: formData })
      );
      setShowAddForm(false);
    }

    setFormData({ email: "", first_name: "", last_name: "" });
    dispatch(fetchListSubscribers({ listUid: listId }));
  };

  const handleEdit = (subscriber) => {
    setEditingSubscriber(subscriber);
    setFormData({
      email: subscriber.EMAIL || subscriber.email || "",
      first_name: subscriber.FNAME || subscriber.first_name || "",
      last_name: subscriber.LNAME || subscriber.last_name || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (subscriberId) => {
    if (!listId || listId === "undefined") {
      console.error("Invalid listId:", listId);
      return;
    }

    if (window.confirm("Are you sure you want to delete this subscriber?")) {
      await dispatch(
        deleteSubscriber({ listUid: listId, subscriberUid: subscriberId })
      );
      dispatch(fetchListSubscribers({ listUid: listId }));
    }
  };

  const cancelEdit = () => {
    setEditingSubscriber(null);
    setShowAddForm(false);
    setFormData({ email: "", first_name: "", last_name: "" });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // DataTable columns for subscribers
  const subscriberColumns = [
    {
      accessorKey: "email",
      header: "Email",
      cell: (row) => row.EMAIL || row.email,
    },
    {
      accessorKey: "first_name",
      header: "First Name",
      cell: (row) => row.FNAME || row.first_name || "-",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      cell: (row) => row.LNAME || row.last_name || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === "confirmed"
              ? "bg-green-100 text-green-800"
              : row.status === "unsubscribed"
              ? "bg-red-100 text-red-800"
              : row.status === "blacklisted"
              ? "bg-gray-600 text-gray-200"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      accessorKey: "date_added",
      header: "Added",
      cell: (row) => formatDate(row.date_added),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-400 hover:text-blue-300 mr-4"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.subscriber_uid)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </>
      ),
    },
  ];

  // Client-side filtering of loaded subscribers
  const filteredSubscribers = (subscribers || []).filter((sub) => {
    const email = (sub.EMAIL || sub.email || "").toLowerCase();
    const fname = (sub.FNAME || sub.first_name || "").toLowerCase();
    const lname = (sub.LNAME || sub.last_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      email.includes(search) || fname.includes(search) || lname.includes(search)
    );
  });

  return (
    <div className="bg-gray-800 border border-gray-700 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-white">
              Subscribers for {selectedList?.name || "List"}
              {totalSubscribers ? (
                <span className="ml-2 text-blue-400 text-base font-semibold">
                  ({totalSubscribers})
                </span>
              ) : null}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Manage subscribers in this list
            </p>
          </div>
          <div className="flex space-x-2">
            {/* Old search component: client-side filtering */}
            {/* You can re-add your original search/filter logic here if needed */}
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              style={{ minWidth: 200 }}
            />
            <button
              onClick={() =>
                dispatch(
                  fetchListSubscribers({ listUid: listId, page, perPage })
                )
              }
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
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-white mb-4">
              {editingSubscriber ? "Edit Subscriber" : "Add New Subscriber"}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editingSubscriber ? "Update" : "Add"} Subscriber
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
          <div className="bg-red-900 border border-red-700 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && subscribers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No subscribers found in this list</p>
          </div>
        )}

        {!loading && subscribers.length > 0 && (
          <DataTable
            columns={subscriberColumns}
            data={filteredSubscribers}
            title={`Subscribers for ${selectedList?.name || "List"}`}
            loading={loading}
            footer={
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg mt-4">
                <div className="text-gray-400 text-sm">
                  Showing{" "}
                  <span className="font-semibold text-gray-100">
                    {(page - 1) * perPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-100">
                    {Math.min(page * perPage, filteredSubscribers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-100">
                    {filteredSubscribers.length}
                  </span>{" "}
                  subscribers
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  >
                    Previous
                  </button>
                  <span className="text-gray-400 text-sm px-2">
                    Page{" "}
                    <span className="font-semibold text-gray-100">{page}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-100">
                      {totalPages}
                    </span>
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  >
                    Next
                  </button>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="ml-2 px-2 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-700 transition"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default SubscriberManagement;
