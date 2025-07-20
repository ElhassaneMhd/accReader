import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllLists,
  fetchListDetails,
  selectAllLists,
  selectMailwizzLoading,
  selectMailwizzError,
} from "../../../store/slices/mailwizzSlice";
import SubscriberManagement from "./SubscriberManagement";
import CSVImport from "../CSVImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, List as ListIcon } from "lucide-react";

const ListManagement = () => {
  const dispatch = useDispatch();
  const allLists = useSelector(selectAllLists);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);

  const [activeTab, setActiveTab] = useState("lists");
  const [selectedListId, setSelectedListId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllLists());
  }, [dispatch]);

  const handleListSelect = (listId) => {
    setSelectedListId(listId);
    dispatch(fetchListDetails(listId));
    setActiveTab("subscribers");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filtered lists logic
  const filteredLists = (allLists || []).filter((list) => {
    const listName = list.name || list.general?.name || "";
    const displayName = list.display_name || list.general?.display_name || "";
    const matchesSearch =
      listName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderListsTable = () => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <ListIcon className="h-5 w-5 mr-2" />
          MailWizz Lists ({filteredLists.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {error && (
          <Alert
            variant="destructive"
            className="bg-red-900/20 border-red-700 mb-4"
          >
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {!loading && filteredLists.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No lists found</p>
          </div>
        )}
        {!loading && filteredLists.length > 0 && (
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
                  {filteredLists.map((list) => {
                    const listUid = list.list_uid || list.general?.list_uid;
                    const listName = list.name || list.general?.name;
                    const displayName =
                      list.display_name || list.general?.display_name;
                    return (
                      <tr key={listUid} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {listName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {list.subscribers_count || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {list.date_added ? formatDate(list.date_added) : "-"}
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
      </CardContent>
    </Card>
  );

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

      {/* Search & Filter Bar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            {/* Placeholder for future filter */}
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 cursor-default"
              disabled
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter (coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lists Table */}
      {activeTab === "lists" && renderListsTable()}
      {activeTab === "subscribers" &&
        selectedListId &&
        selectedListId !== "undefined" && (
          <SubscriberManagement listId={selectedListId} />
        )}
      {activeTab === "import" &&
        selectedListId &&
        selectedListId !== "undefined" && <CSVImport listId={selectedListId} />}
    </div>
  );
};

export default ListManagement;
