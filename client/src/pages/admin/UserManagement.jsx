import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import DataTable from "@/components/DataTable";
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === "" || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "active") {
      return matchesSearch && user.isActive === true;
    } else if (statusFilter === "inactive") {
      return matchesSearch && user.isActive === false;
    }
    return matchesSearch;
  });  const handleCreateUser = async () => {
    // Validation
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Password validation
    if (newUser.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };

      await dispatch(createUser(userData)).unwrap();
      
      // Reset form on success
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
      
      // Show success message
      toast({
        title: "Success",
        description: "User created successfully!",
        variant: "default",
      });
      
      // Refresh users list
      dispatch(fetchUsers());
    } catch (error) {
      console.error("Failed to create user:", error);
      
      // Show specific error message
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while creating the user",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "User permissions updated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user permissions",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast({
          title: "Success",
          description: "User deleted successfully!",
          variant: "default",
        });
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
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

    const safeRole = role || "client";
    const config = roleConfig[safeRole] || roleConfig.client;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{safeRole.replace("_", " ").toUpperCase()}</span>
      </Badge>
    );
  };

  const userColumns = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{row?.original?.name || "No Name"}</span>
          <span className="text-sm text-gray-400">
            {row?.original?.email || "No Email"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => getRoleBadge(row?.original?.role),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row?.original?.isActive;
        return (
          <Badge className={isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {isActive !== false ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row?.original?.createdAt;
        return createdAt ? new Date(createdAt).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "updatedAt", 
      header: "Last Updated",
      cell: ({ row }) => {
        const updatedAt = row?.original?.updatedAt;
        return updatedAt ? new Date(updatedAt).toLocaleDateString() : "N/A";
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
              setSelectedUser({
                ...row.original,
                permissions: {
                  campaigns: { view: true, create: false, edit: false, delete: false },
                  analytics: { view: true, export: false, advanced: false },
                  users: { view: false, create: false, edit: false, delete: false },
                  system: { view: false, configure: false, logs: false },
                }
              });
              setShowEditModal(true);
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(row.original.id)}
            className="text-red-400 hover:text-red-300"
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
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
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
                <SelectItem
                  value="all"
                  className="text-white hover:bg-gray-600"
                >
                  All Roles
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-white hover:bg-gray-600"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="client"
                  className="text-white hover:bg-gray-600"
                >
                  Client
                </SelectItem>
                <SelectItem
                  value="pmta_user"
                  className="text-white hover:bg-gray-600"
                >
                  PMTA User
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-gray-600"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  value="active"
                  className="text-white hover:bg-gray-600"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="inactive"
                  className="text-white hover:bg-gray-600"
                >
                  Inactive
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
            title="Users"
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 shadow-2xl">
            <CardHeader className="bg-gray-800 rounded-t-lg p-6 flex flex-col items-start border-b border-gray-700">
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <UserPlus className="h-6 w-6 mr-2" />
                Create New User
              </CardTitle>
              <p className="text-gray-300 mt-2 text-sm">
                Fill in the details to add a new admin or client user. All
                fields are required.
              </p>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info */}
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="username"
                      className="text-gray-300 font-semibold"
                    >
                      Name
                    </Label>
                    <Input
                      id="username"
                      value={newUser?.username || ""}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Enter name"
                      className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-gray-300 font-semibold"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser?.email || ""}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter email"
                      className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-gray-300 font-semibold"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser?.password || ""}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Enter password"
                      className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="role"
                      className="text-gray-300 font-semibold"
                    >
                      Role
                    </Label>
                    <Select
                      value={newUser?.role || "client"}
                      onValueChange={(value) =>
                        setNewUser((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border border-gray-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border border-gray-700">
                        <SelectItem
                          value="client"
                          className="text-white hover:bg-gray-700"
                        >
                          <Users className="h-4 w-4 inline mr-1 text-blue-400" />{" "}
                          Client
                        </SelectItem>
                        <SelectItem
                          value="admin"
                          className="text-white hover:bg-gray-700"
                        >
                          <Shield className="h-4 w-4 inline mr-1 text-red-400" />{" "}
                          Admin
                        </SelectItem>
                        <SelectItem
                          value="pmta_user"
                          className="text-white hover:bg-gray-700"
                        >
                          <Mail className="h-4 w-4 inline mr-1 text-green-400" />{" "}
                          PMTA User
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Permissions & Summary */}
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <Label className="text-base font-semibold mb-2 block">
                      Permissions
                    </Label>
                    <div className="mt-2 space-y-4">
                      {/* Campaigns */}
                      <div className="border rounded-lg p-3 bg-gray-900 border-gray-700">
                        <h4 className="font-medium mb-2 flex items-center text-blue-300">
                          <Mail className="h-4 w-4 mr-2" /> Campaigns
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <PermissionCheckbox
                            section="campaigns"
                            permission="view"
                            checked={
                              newUser?.permissions?.campaigns?.view || false
                            }
                            onChange={updatePermission}
                            label="View"
                          />
                          <PermissionCheckbox
                            section="campaigns"
                            permission="create"
                            checked={
                              newUser?.permissions?.campaigns?.create || false
                            }
                            onChange={updatePermission}
                            label="Create"
                          />
                          <PermissionCheckbox
                            section="campaigns"
                            permission="edit"
                            checked={
                              newUser?.permissions?.campaigns?.edit || false
                            }
                            onChange={updatePermission}
                            label="Edit"
                          />
                          <PermissionCheckbox
                            section="campaigns"
                            permission="delete"
                            checked={
                              newUser?.permissions?.campaigns?.delete || false
                            }
                            onChange={updatePermission}
                            label="Delete"
                          />
                        </div>
                      </div>
                      {/* Analytics */}
                      <div className="border rounded-lg p-3 bg-gray-900 border-gray-700">
                        <h4 className="font-medium mb-2 text-green-300">
                          Analytics
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <PermissionCheckbox
                            section="analytics"
                            permission="view"
                            checked={
                              newUser?.permissions?.analytics?.view || false
                            }
                            onChange={updatePermission}
                            label="View"
                          />
                          <PermissionCheckbox
                            section="analytics"
                            permission="export"
                            checked={
                              newUser?.permissions?.analytics?.export || false
                            }
                            onChange={updatePermission}
                            label="Export"
                          />
                          <PermissionCheckbox
                            section="analytics"
                            permission="advanced"
                            checked={
                              newUser?.permissions?.analytics?.advanced || false
                            }
                            onChange={updatePermission}
                            label="Advanced"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Copy Credentials Button */}
              <CopyCredentialsButton newUser={newUser} />
              {/* Error/Validation */}
              {(!newUser?.username?.trim() ||
                !newUser?.email?.trim() ||
                !newUser?.password?.trim()) && (
                <div className="text-red-400 text-sm font-medium text-center">
                  All fields are required.
                </div>
              )}
              {/* Actions */}
              <div className="flex space-x-2 justify-end pt-4 border-t border-gray-700">
                <Button
                  onClick={handleCreateUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg py-2"
                  disabled={
                    !newUser?.username?.trim() ||
                    !newUser?.email?.trim() ||
                    !newUser?.password?.trim()
                  }
                >
                  <UserPlus className="h-5 w-5 mr-2" /> Create User
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
              <CardTitle className="text-white">
                Edit User: {selectedUser.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-gray-300">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {getRoleBadge(selectedUser.role)}
                    <Badge className={selectedUser.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {selectedUser.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
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

// Add CopyCredentialsButton component
function CopyCredentialsButton({ newUser }) {
  const [copied, setCopied] = useState(false);
  const credentialsText = `Name: ${newUser?.username || ""}\nEmail: ${
    newUser?.email || ""
  }\nPassword: ${newUser?.password || ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-2">
      <Button
        type="button"
        onClick={handleCopy}
        className="bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 px-4 py-2 rounded"
        disabled={!newUser?.username || !newUser?.email || !newUser?.password}
      >
        Copy Credentials
      </Button>
      {copied && <span className="text-green-400 text-sm">Copied!</span>}
    </div>
  );
}
