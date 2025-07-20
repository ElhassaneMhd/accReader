import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllLists,
  fetchListDetails,
  selectAllLists,
  selectMailwizzLoading,
} from "../../../store/slices/mailwizzSlice";
import SubscriberManagement from "./SubscriberManagement";
import CSVImport from "../CSVImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, List as ListIcon } from "lucide-react";
import DataTable from "@/components/DataTable";

const ListManagement = () => {
  const dispatch = useDispatch();
  const allLists = useSelector(selectAllLists);
  const loading = useSelector(selectMailwizzLoading);

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

  // Filtered lists logic
  const filteredLists = (allLists || []).filter((list) => {
    const listName = list.name || list.general?.name || "";
    const displayName = list.display_name || list.general?.display_name || "";
    const matchesSearch =
      listName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // DataTable columns
  const listColumns = [
    {
      accessorKey: "name",
      header: "List Name",
      cell: (row) => row.general?.name ?? "-",
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: (row) => row.general?.display_name ?? "-",
    },
    {
      accessorKey: "from_email",
      header: "From Email",
      cell: (row) => row.defaults?.from_email ?? "-",
    },
    {
      accessorKey: "company_name",
      header: "Company Name",
      cell: (row) => row.company?.name ?? "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (row) => row.general?.description ?? "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-blue-400 hover:text-blue-600"
          onClick={() => handleListSelect(row.general?.list_uid ?? "")}
        >
          Manage Subscribers
        </Button>
      ),
    },
  ];

  const renderListsTable = () => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <ListIcon className="h-5 w-5 mr-2" />
          MailWizz Lists ({filteredLists.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={listColumns}
          data={filteredLists}
          loading={loading}
          title="MailWizz Lists"
        />
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
