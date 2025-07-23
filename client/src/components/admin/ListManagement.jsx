import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllLists,
  selectAllLists,
  selectMailwizzLoading,
} from "@/store/slices/mailwizzSlice";
import SubscriberManagement from "./SubscriberManagement";
import CSVImport from "./CSVImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, List as ListIcon } from "lucide-react";
import DataTable from "@/components/DataTable";
import { useNavigate } from "react-router-dom";

const ListManagement = () => {
  const dispatch = useDispatch();
  const allLists = useSelector(selectAllLists);
  const loading = useSelector(selectMailwizzLoading);
  const navigate = useNavigate();

  const [activeTab] = useState("lists");
  const [selectedListId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAllLists());
  }, [dispatch]);

  // Filtered lists logic
  const filteredLists = (allLists || []).filter((list) => {
    const listName = list.name || list.general?.name || "";
    const displayName = list.display_name || list.general?.display_name || "";
    const matchesSearch =
      listName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalLists = filteredLists.length;
  const totalPages = Math.ceil(totalLists / perPage);
  const paginatedLists = filteredLists.slice(
    (page - 1) * perPage,
    page * perPage
  );

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
          onClick={() =>
            navigate(`/admin/lists/${row.general?.list_uid ?? ""}`)
          }
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
          MailWizz Lists ({totalLists})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={listColumns}
          data={paginatedLists}
          loading={loading}
          title="MailWizz Lists"
          footer={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg mt-4">
              <div className="text-gray-400 text-sm">
                Showing{" "}
                <span className="font-semibold text-gray-100">
                  {(page - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-100">
                  {Math.min(page * perPage, totalLists)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-100">
                  {totalLists}
                </span>{" "}
                lists
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
                  <span className="font-semibold text-gray-100">{page}</span> of{" "}
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
        {/* Pagination Controls */}
      </CardContent>
    </Card>
  );

  return (
    <>
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
    </>
  );
};

export default ListManagement;
