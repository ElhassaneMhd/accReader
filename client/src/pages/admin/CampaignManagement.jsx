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
import { DataTable } from "@/components/ui/data-table";
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
} from "lucide-react";
import {
  fetchAllCampaigns,
  fetchAllCampaignsWithStats,
  assignCampaignToUser,
  // unassignCampaignFromUser, // Reserved for future use
  // fetchCampaignDetails, // Reserved for future use
  // updateUserPermissions, // Reserved for future use
  selectAllCampaigns,
  selectMailwizzLoading,
  selectMailwizzError,
} from "@/store/slices/mailwizzSlice";

const CampaignManagement = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectAllCampaigns);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentData, setAssignmentData] = useState({
    userId: "",
    permissions: {
      view: true,
      export: false,
      analytics: false,
    },
    notes: "",
  });

  useEffect(() => {
    dispatch(fetchAllCampaignsWithStats());
  }, [dispatch]);

  const filteredCampaigns = (campaigns || []).filter((campaign) => {
    const matchesSearch =
      campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const campaignColumns = [
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <span className="text-sm text-gray-500">{row.original.subject}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "list_name",
      header: "List",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("list_name") || "N/A"}</span>
      ),
    },
    {
      accessorKey: "stats",
      header: "Performance",
      cell: ({ row }) => {
        const stats = row.original.stats || {};
        return (
          <div className="text-sm">
            <div>Sent: {stats.processed_count || 0}</div>
            <div>Opens: {stats.unique_opens_count || 0}</div>
            <div>Clicks: {stats.unique_clicks_count || 0}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "assigned_users_count",
      header: "Assigned Users",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue("assigned_users_count") || 0} users
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
          >
            <UserCheck className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
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
          <h1 className="text-2xl font-bold text-white">
            Campaign Management
          </h1>
          <p className="text-gray-400">
            Manage MailWizz campaigns and user assignments
          </p>
        </div>
        <Button onClick={() => setShowAssignModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-600">All Statuses</SelectItem>
                <SelectItem value="draft" className="text-white hover:bg-gray-600">Draft</SelectItem>
                <SelectItem value="sending" className="text-white hover:bg-gray-600">Sending</SelectItem>
                <SelectItem value="sent" className="text-white hover:bg-gray-600">Sent</SelectItem>
                <SelectItem value="paused" className="text-white hover:bg-gray-600">Paused</SelectItem>
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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Mail className="h-5 w-5 mr-2" />
            MailWizz Campaigns ({filteredCampaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={campaignColumns}
            data={filteredCampaigns}
            loading={loading}
            searchable={false} // We have custom search
            filterable={false} // We have custom filters
          />
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Campaign to User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign">Selected Campaign</Label>
                <Input
                  id="campaign"
                  value={selectedCampaign?.name || "No campaign selected"}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="userId">User ID</Label>
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
                />
              </div>

              <div>
                <Label>Permissions</Label>
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
                    />
                    <span>View Campaign</span>
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
                    />
                    <span>Export Data</span>
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
                    />
                    <span>Advanced Analytics</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
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
    </div>
  );
};

export default CampaignManagement;
