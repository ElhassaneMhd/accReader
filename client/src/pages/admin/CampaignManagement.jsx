import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DataTable from "@/components/DataTable";
import {
  Users,
  Mail,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  MousePointerClick,
  Send,
} from "lucide-react";
import {
  fetchAllCampaignsWithStats,
  assignCampaignToUser,
  // unassignCampaignFromUser, // Reserved for future use
  // fetchCampaignDetails, // Reserved for future use
  // updateUserPermissions, // Reserved for future use
  selectAllCampaigns,
  selectMailwizzLoading,
  selectMailwizzError,
  selectCampaignsPagination,
} from "@/store/slices/mailwizzSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { mailwizzApi } from "@/services/mailwizz/mailwizzApi";

const CampaignManagement = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectAllCampaigns) || [];
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const { count: totalCount = 0, total_pages: totalPages = 1 } =
    useSelector(selectCampaignsPagination) || {};
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [assignmentData, setAssignmentData] = useState({
    userId: "",
    permissions: {
      view: true,
      export: false,
      analytics: false,
    },
    notes: "",
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsCampaign, setDetailsCampaign] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    dispatch(
      fetchAllCampaignsWithStats({
        page,
        perPage,
        search: debouncedSearch,
        status: statusFilter === "all" ? "" : statusFilter,
      })
    );
  }, [dispatch, page, perPage, debouncedSearch, statusFilter]);

  // No need to filter on frontend, backend does it
  const filteredCampaigns = campaigns;

  const handleAssignCampaign = async () => {
    if (!selectedCampaign || !assignmentData.userId) return;

    try {
      await dispatch(
        assignCampaignToUser({
          campaignId: selectedCampaign.campaign_uid,
          userId: assignmentData.userId,
          permissions: assignmentData.permissions,
          notes: assignmentData.notes,
        })
      ).unwrap();

      // Reset form and close modal
      setAssignmentData({
        userId: "",
        permissions: { view: true, export: false, analytics: false },
        notes: "",
      });
      setShowAssignModal(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error("Failed to assign campaign:", error);
    }
  };

  const handleShowDetails = async (campaign) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setShowDetailsModal(true);
    try {
      const res = await mailwizzApi.getCampaignDetails(campaign.campaign_uid);
      setDetailsCampaign(res.data.data);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message || err.message || "Failed to fetch details"
      );
      setDetailsCampaign(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Function for removing campaign assignments - reserved for future use
  // const handleRemoveAssignment = async (campaignId, userId) => {
  //   try {
  //     await dispatch(
  //       removeCampaignFromUser({
  //         campaignId,
  //         userId,
  //       })
  //     ).unwrap();
  //   } catch (error) {
  //     console.error("Failed to remove assignment:", error);
  //   }
  // };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sending: { variant: "default", color: "bg-blue-100 text-blue-800" },
      sent: { variant: "secondary", color: "bg-green-100 text-green-800" },
      draft: { variant: "outline", color: "bg-gray-100 text-gray-800" },
      paused: {
        variant: "destructive",
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Helper to get nested field for robustness
  const getField = (rowData, keys, fallback = "N/A") => {
    // Extract the actual data from the row structure
    const row = rowData?.original || rowData;
    
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null && row[key] !== "")
        return row[key];
    }
    if (row.general) {
      for (const key of keys) {
        if (
          row.general[key] !== undefined &&
          row.general[key] !== null &&
          row.general[key] !== ""
        )
          return row.general[key];
      }
    }
    if (row.campaign) {
      for (const key of keys) {
        if (
          row.campaign[key] !== undefined &&
          row.campaign[key] !== null &&
          row.campaign[key] !== ""
        )
          return row.campaign[key];
      }
    }
    return fallback;
  };

  const campaignColumns = [
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-100">
            {getField(row, ["name"])}{" "}
          </span>
          <span className="text-sm text-gray-400">
            {getField(row, ["subject"])}{" "}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "from_name",
      header: "From Name",
      cell: ({ row }) => (
        <span className="text-sm text-gray-300">
          {getField(row, ["from_name"])}{" "}
        </span>
      ),
    },
    {
      accessorKey: "send_at",
      header: "Send At",
      cell: ({ row }) => {
        const val = getField(row, ["send_at"]);
        return (
          <span className="text-sm text-gray-300">
            {val && val !== "N/A" ? new Date(val).toLocaleString() : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(getField(row, ["status"])),
    },
    {
      accessorKey: "list_name",
      header: "List",
      cell: ({ row }) => (
        <span className="text-sm text-gray-300">
          {getField(row, ["list_name"])}{" "}
        </span>
      ),
    },
    {
      accessorKey: "stats",
      header: "Performance",
      cell: ({ row }) => {
        const stats = getField(row, ["stats"]) || {};
        return (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-blue-400">
              <Send size={16} className="inline-block" />
              <span className="font-semibold">{stats.processed_count ?? 0}</span> Sent
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <Eye size={16} className="inline-block" />
              <span className="font-semibold">{stats.unique_opens_count ?? 0}</span> Opens
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <MousePointerClick size={16} className="inline-block" />
              <span className="font-semibold">{stats.unique_clicks_count ?? 0}</span> Clicks
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "assigned_users_count",
      header: "Assigned Users",
      cell: ({ row }) => (
        <Badge className="text-white" variant="outline">
          {getField(row, ["assigned_users_count"]) ?? 0} users
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCampaign(row.original);
              setShowAssignModal(true);
            }}
            className="text-gray-300 "
          >
            <UserCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 "
            onClick={() => handleShowDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-300 ">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Management</h1>
          <p className="text-gray-400">
            Manage MailWizz campaigns and user assignments
          </p>
        </div>
        <Button
          onClick={() => setShowAssignModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-100">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem
                  value="all"
                  className="text-gray-100 hover:bg-gray-700"
                >
                  All Statuses
                </SelectItem>
                <SelectItem
                  value="draft"
                  className="text-gray-100 hover:bg-gray-700"
                >
                  Draft
                </SelectItem>
                <SelectItem
                  value="sending"
                  className="text-gray-100 hover:bg-gray-700"
                >
                  Sending
                </SelectItem>
                <SelectItem
                  value="sent"
                  className="text-gray-100 hover:bg-gray-700"
                >
                  Sent
                </SelectItem>
                <SelectItem
                  value="paused"
                  className="text-gray-100 hover:bg-gray-700"
                >
                  Paused
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-700">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Campaigns Table */}
      <Card className="bg-gray-800 border-gray-700 min-h-[50vh]  ">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-100">
            <Mail className="h-5 w-5 mr-2" />
            MailWizz Campaigns ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={campaignColumns}
            data={filteredCampaigns}
            loading={loading}
            title="MailWizz Campaigns"
            footer={
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
                <div className="text-gray-400 text-sm">
                  Showing{" "}
                  <span className="font-semibold text-gray-100">
                    {(page - 1) * perPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-100">
                    {Math.min(page * perPage, totalCount)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-100">
                    {totalCount}
                  </span>{" "}
                  records
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden md:inline">Previous</span>
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
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight size={16} />
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
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700 text-gray-100">
            <CardHeader>
              <CardTitle className="text-gray-100">
                Assign Campaign to User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign" className="text-gray-300">
                  Selected Campaign
                </Label>
                <Input
                  id="campaign"
                  value={selectedCampaign?.name || "No campaign selected"}
                  disabled
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="userId" className="text-gray-300">
                  User ID
                </Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={assignmentData.userId}
                  onChange={(e) =>
                    setAssignmentData((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label className="text-gray-300">Permissions</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={assignmentData.permissions.view}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            view: e.target.checked,
                          },
                        }))
                      }
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-gray-300">View Campaign</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={assignmentData.permissions.export}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            export: e.target.checked,
                          },
                        }))
                      }
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-gray-300">Export Data</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={assignmentData.permissions.analytics}
                      onChange={(e) =>
                        setAssignmentData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            analytics: e.target.checked,
                          },
                        }))
                      }
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-gray-300">Advanced Analytics</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-gray-300">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this assignment..."
                  value={assignmentData.notes}
                  onChange={(e) =>
                    setAssignmentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAssignCampaign}
                  disabled={!selectedCampaign || !assignmentData.userId}
                  className="flex-1"
                >
                  Assign Campaign
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedCampaign(null);
                    setAssignmentData({
                      userId: "",
                      permissions: {
                        view: true,
                        export: false,
                        analytics: false,
                      },
                      notes: "",
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-gray-100 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Campaign Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsCampaign(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : detailsError ? (
                <Alert variant="destructive">
                  <AlertDescription>{detailsError}</AlertDescription>
                </Alert>
              ) : detailsCampaign ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold">Name:</div>
                      <div>{detailsCampaign.name}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Subject:</div>
                      <div>{detailsCampaign.subject}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Status:</div>
                      <div>{detailsCampaign.status}</div>
                    </div>
                    <div>
                      <div className="font-semibold">From Name:</div>
                      <div>{detailsCampaign.from_name}</div>
                    </div>
                    <div>
                      <div className="font-semibold">From Email:</div>
                      <div>{detailsCampaign.from_email}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Reply To:</div>
                      <div>{detailsCampaign.reply_to}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Send At:</div>
                      <div>
                        {detailsCampaign.send_at
                          ? new Date(detailsCampaign.send_at).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Created At:</div>
                      <div>
                        {detailsCampaign.created_at
                          ? new Date(
                              detailsCampaign.created_at
                            ).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Updated At:</div>
                      <div>
                        {detailsCampaign.updated_at
                          ? new Date(
                              detailsCampaign.updated_at
                            ).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Type:</div>
                      <div>{detailsCampaign.type}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold mb-1">List Info:</div>
                    {detailsCampaign.list ? (
                      <div className="pl-2 text-sm">
                        <div>List Name: {detailsCampaign.list.name}</div>
                        <div>List UID: {detailsCampaign.list.list_uid}</div>
                        <div>
                          Subscribers: {detailsCampaign.list.subscribers_count}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">No list info</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold mb-1">Performance Stats:</div>
                    {detailsCampaign.stats ? (
                      <div className="pl-2 text-sm">
                        {Object.entries(detailsCampaign.stats).map(([k, v]) => (
                          <div key={k}>
                            {k}: {v}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">No stats available</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold mb-1">Raw Data:</div>
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(detailsCampaign, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
