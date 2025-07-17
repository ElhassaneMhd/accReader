import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Mail,
  Plus,
  Settings,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  fetchAllCampaigns,
  assignCampaignToUser,
  unassignCampaignFromUser,
} from "@/store/slices/mailwizzSlice";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/components/ui/use-toast";

const CampaignCard = ({ campaign, isAssigned, onAssign, onUnassign }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "sending":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        isAssigned ? "border-green-200 bg-green-50" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
              {campaign.name}
            </h4>
            <Badge className={`${getStatusColor(campaign.status)} text-xs`}>
              {campaign.status}
            </Badge>
          </div>
          <div className="flex space-x-1 ml-2">
            {isAssigned ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnassign(campaign.uid)}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAssign(campaign.uid)}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {campaign.stats && (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Sent: {campaign.stats.sent?.toLocaleString() || 0}</div>
            <div>Opened: {campaign.stats.opened?.toLocaleString() || 0}</div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Created: {new Date(campaign.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

const UserSelector = ({ users, selectedUser, onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Select Client</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedUser?.id === user.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="font-medium text-sm">{user.username}</div>
              <div className="text-xs text-gray-600">{user.email}</div>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="text-xs mt-1"
              >
                {user.role}
              </Badge>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-gray-500 py-4">No users found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CampaignGrid = ({ campaigns, assignments, onAssign, onUnassign }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const assignedCampaignUids = new Set(assignments.map((a) => a.campaign_uid));

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCampaigns = filteredCampaigns.filter(
    (c) => !assignedCampaignUids.has(c.uid)
  );
  const assignedCampaigns = filteredCampaigns.filter((c) =>
    assignedCampaignUids.has(c.uid)
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="sending">Sending</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Campaigns */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Available Campaigns ({availableCampaigns.length})</span>
          </h3>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {availableCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.uid}
                campaign={campaign}
                isAssigned={false}
                onAssign={onAssign}
              />
            ))}
            {availableCampaigns.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No available campaigns
              </div>
            )}
          </div>
        </div>

        {/* Assigned Campaigns */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Assigned Campaigns ({assignedCampaigns.length})</span>
          </h3>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {assignedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.uid}
                campaign={campaign}
                isAssigned={true}
                onUnassign={onUnassign}
              />
            ))}
            {assignedCampaigns.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No assigned campaigns
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignAssignment = () => {
  const dispatch = useDispatch();
  const { allCampaigns, loading } = useSelector((state) => state.mailwizz);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    dispatch(fetchAllCampaigns());
    fetchUsers();
  }, [dispatch]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAssignments(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // This would be an API call to get all users
      // const response = await mailwizzApi.getAllUsers();
      // setUsers(response.data);

      // Mock data for now
      setUsers([
        {
          id: 1,
          username: "client1",
          email: "client1@example.com",
          role: "client",
        },
        {
          id: 2,
          username: "client2",
          email: "client2@example.com",
          role: "client",
        },
        { id: 3, username: "admin", email: "admin@example.com", role: "admin" },
      ]);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserAssignments = async (userId) => {
    try {
      // This would be an API call to get user assignments
      // const response = await mailwizzApi.getCampaignAssignments(userId);
      // setAssignments(response.data);

      // Mock data for now - using userId in comment to avoid lint error
      console.log(`Fetching assignments for user ${userId}`);
      setAssignments([]);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    }
  };

  const handleAssignCampaign = async (campaignUid) => {
    if (!selectedUser) return;

    try {
      await dispatch(
        assignCampaignToUser({
          userId: selectedUser.id,
          campaignUid,
        })
      ).unwrap();

      setAssignments((prev) => [
        ...prev,
        {
          user_id: selectedUser.id,
          campaign_uid: campaignUid,
        },
      ]);

      toast({
        title: "Success",
        description: "Campaign assigned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error || "Failed to assign campaign",
        variant: "destructive",
      });
    }
  };

  const handleUnassignCampaign = async (campaignUid) => {
    if (!selectedUser) return;

    try {
      await dispatch(
        unassignCampaignFromUser({
          userId: selectedUser.id,
          campaignUid,
        })
      ).unwrap();

      setAssignments((prev) =>
        prev.filter(
          (a) =>
            !(a.user_id === selectedUser.id && a.campaign_uid === campaignUid)
        )
      );

      toast({
        title: "Success",
        description: "Campaign unassigned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error || "Failed to unassign campaign",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Campaign Assignment
          </h1>
          <p className="text-gray-600 mt-1">
            Assign campaigns to client users for their dashboard access
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Selector */}
        <div className="lg:col-span-1">
          <UserSelector
            users={users.filter((u) => u.role === "client")}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
          />
        </div>

        {/* Campaign Management */}
        <div className="lg:col-span-3">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Managing campaigns for {selectedUser.username}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignGrid
                  campaigns={allCampaigns}
                  assignments={assignments}
                  onAssign={handleAssignCampaign}
                  onUnassign={handleUnassignCampaign}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a client to manage their campaign assignments</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignAssignment;
