import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  Mail,
  Key,
} from "lucide-react";
import {
  selectAuth,
  fetchUsers,
  createUser,
  deleteUser,
  updateUserPermissions,
} from "@/store/slices/authSlice";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(selectAuth);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "client",
    permissions: {
      campaigns: { view: true, create: false, edit: false, delete: false },
      analytics: { view: true, export: false, advanced: false },
      users: { view: false, create: false, edit: false, delete: false },
      system: { view: false, configure: false, logs: false },
    },
  });

  useEffect(() => {
    if (dispatch && fetchUsers) {
      dispatch(fetchUsers());
    }
  }, [dispatch]);

  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    try {
      await dispatch(createUser(newUser)).unwrap();
      setShowCreateModal(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "client",
        permissions: {
          campaigns: { view: true, create: false, edit: false, delete: false },
          analytics: { view: true, export: false, advanced: false },
          users: { view: false, create: false, edit: false, delete: false },
          system: { view: false, configure: false, logs: false },
        },
      });
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await dispatch(
        updateUserPermissions({
          userId: selectedUser.id,
          permissions: selectedUser.permissions,
        })
      ).unwrap();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: {
        variant: "default",
        color: "bg-red-100 text-red-800",
        icon: Shield,
      },
      client: {
        variant: "secondary",
        color: "bg-blue-100 text-blue-800",
        icon: Users,
      },
      pmta_user: {
        variant: "outline",
        color: "bg-green-100 text-green-800",
        icon: Mail,
      },
    };

    const config = roleConfig[role] || roleConfig.client;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{role.replace("_", " ").toUpperCase()}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800" },
      inactive: { color: "bg-gray-100 text-gray-800" },
      suspended: { color: "bg-red-100 text-red-800" },
      pending: { color: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const userColumns = [
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("username")}</span>
          <span className="text-sm text-gray-500">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => getRoleBadge(row.getValue("role")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status") || "pending"),
    },
    {
      accessorKey: "assigned_campaigns",
      header: "Campaigns",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.assigned_campaigns?.length || 0} campaigns
        </Badge>
      ),
    },
    {
      accessorKey: "last_login",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("last_login");
        return lastLogin ? new Date(lastLogin).toLocaleDateString() : "Never";
      },
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
              setSelectedUser(row.original);
              setShowEditModal(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(row.original.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const PermissionCheckbox = ({
    section,
    permission,
    checked,
    onChange,
    label,
  }) => (
    <label className="flex items-center space-x-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(section, permission, e.target.checked)}
        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-gray-300">{label}</span>
    </label>
  );

  const updatePermission = (section, permission, value) => {
    setNewUser((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [permission]: value,
        },
      },
    }));
  };

  const updateSelectedUserPermission = (section, permission, value) => {
    setSelectedUser((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [permission]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-600">All Roles</SelectItem>
                <SelectItem value="admin" className="text-white hover:bg-gray-600">Admin</SelectItem>
                <SelectItem value="client" className="text-white hover:bg-gray-600">Client</SelectItem>
                <SelectItem value="pmta_user" className="text-white hover:bg-gray-600">PMTA User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-600">All Status</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-gray-600">Active</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-gray-600">Inactive</SelectItem>
                <SelectItem value="suspended" className="text-white hover:bg-gray-600">Suspended</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-gray-600">Pending</SelectItem>
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

      {/* Users Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Users className="h-5 w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            loading={loading}
            searchable={false}
            filterable={false}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Enter username"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-gray-300">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="client" className="text-white hover:bg-gray-600">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pmta_user">PMTA User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label className="text-base font-medium">Permissions</Label>
                <div className="mt-4 space-y-4">
                  {/* Campaigns */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Campaigns
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionCheckbox
                        section="campaigns"
                        permission="view"
                        checked={newUser.permissions.campaigns.view}
                        onChange={updatePermission}
                        label="View"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="create"
                        checked={newUser.permissions.campaigns.create}
                        onChange={updatePermission}
                        label="Create"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="edit"
                        checked={newUser.permissions.campaigns.edit}
                        onChange={updatePermission}
                        label="Edit"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="delete"
                        checked={newUser.permissions.campaigns.delete}
                        onChange={updatePermission}
                        label="Delete"
                      />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Analytics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionCheckbox
                        section="analytics"
                        permission="view"
                        checked={newUser.permissions.analytics.view}
                        onChange={updatePermission}
                        label="View"
                      />
                      <PermissionCheckbox
                        section="analytics"
                        permission="export"
                        checked={newUser.permissions.analytics.export}
                        onChange={updatePermission}
                        label="Export"
                      />
                      <PermissionCheckbox
                        section="analytics"
                        permission="advanced"
                        checked={newUser.permissions.analytics.advanced}
                        onChange={updatePermission}
                        label="Advanced"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateUser} className="flex-1">
                  Create User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Edit User: {selectedUser.username}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{selectedUser.username}</p>
                    <p className="text-sm text-gray-300">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status || "pending")}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label className="text-base font-medium">Permissions</Label>
                <div className="mt-4 space-y-4">
                  {/* Campaigns */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Campaigns
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionCheckbox
                        section="campaigns"
                        permission="view"
                        checked={
                          selectedUser.permissions?.campaigns?.view || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="View"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="create"
                        checked={
                          selectedUser.permissions?.campaigns?.create || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="Create"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="edit"
                        checked={
                          selectedUser.permissions?.campaigns?.edit || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="Edit"
                      />
                      <PermissionCheckbox
                        section="campaigns"
                        permission="delete"
                        checked={
                          selectedUser.permissions?.campaigns?.delete || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="Delete"
                      />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Analytics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionCheckbox
                        section="analytics"
                        permission="view"
                        checked={
                          selectedUser.permissions?.analytics?.view || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="View"
                      />
                      <PermissionCheckbox
                        section="analytics"
                        permission="export"
                        checked={
                          selectedUser.permissions?.analytics?.export || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="Export"
                      />
                      <PermissionCheckbox
                        section="analytics"
                        permission="advanced"
                        checked={
                          selectedUser.permissions?.analytics?.advanced || false
                        }
                        onChange={updateSelectedUserPermission}
                        label="Advanced"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdateUser} className="flex-1">
                  Update User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
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

export default UserManagement;
