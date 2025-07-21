import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password, userType = "admin" }, { rejectWithValue }) => {
    try {
      const endpoint =
        userType === "client" ? "/auth/client-login" : "/auth/login";
      const response = await fetch(`http://localhost:4000/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      return {
        user: data.data.user,
        token: data.token,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch("http://localhost:4000/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "auth/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const data = await response.json();
      return data.users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  "auth/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      return userId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPermissions = createAsyncThunk(
  "auth/updateUserPermissions",
  async ({ userId, permissions }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${userId}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ permissions }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update permissions");
      }

      const data = await response.json();
      return { userId, permissions: data.permissions };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to determine permissions based on role
const getPermissionsByRole = (role) => {
  switch (role) {
    case "admin":
      return {
        canAccessPMTA: true,
        canAccessMailWizz: true,
        canAccessAdmin: true,
        canManageUsers: true,
        canAssignCampaigns: true,
        canExportData: true,
      };
    case "client":
      return {
        canAccessPMTA: false,
        canAccessMailWizz: true,
        canAccessAdmin: false,
        canManageUsers: false,
        canAssignCampaigns: false,
        canExportData: true,
      };
    case "pmta_user":
      return {
        canAccessPMTA: true,
        canAccessMailWizz: false,
        canAccessAdmin: false,
        canManageUsers: false,
        canAssignCampaigns: false,
        canExportData: true,
      };
    default:
      return {
        canAccessPMTA: false,
        canAccessMailWizz: false,
        canAccessAdmin: false,
        canManageUsers: false,
        canAssignCampaigns: false,
        canExportData: false,
      };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
    users: [], // For admin user management

    // User permissions based on role
    permissions: {
      canAccessPMTA: false,
      canAccessMailWizz: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canAssignCampaigns: false,
      canExportData: false,
    },

    // UI state
    loginType: "admin", // 'admin' or 'client'
    rememberMe: false,
  },
  reducers: {
    setLoginType: (state, action) => {
      state.loginType = action.payload;
    },
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.users = [];
      state.permissions = {
        canAccessPMTA: false,
        canAccessMailWizz: false,
        canAccessAdmin: false,
        canManageUsers: false,
        canAssignCampaigns: false,
        canExportData: false,
      };
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePermissions: (state, action) => {
      state.permissions = { ...state.permissions, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.permissions = getPermissionsByRole(action.payload.user.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register user
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.permissions = getPermissionsByRole(action.payload.role);
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.permissions = {
          canAccessPMTA: false,
          canAccessMailWizz: false,
          canAccessAdmin: false,
          canManageUsers: false,
          canAssignCampaigns: false,
          canExportData: false,
        };
      })

      // Logout user
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.users = [];
        state.permissions = {
          canAccessPMTA: false,
          canAccessMailWizz: false,
          canAccessAdmin: false,
          canManageUsers: false,
          canAssignCampaigns: false,
          canExportData: false,
        };
      })

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user permissions
      .addCase(updateUserPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, permissions } = action.payload;
        const userIndex = state.users.findIndex((user) => user.id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].permissions = permissions;
        }
      })
      .addCase(updateUserPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoginType,
  setRememberMe,
  logout,
  clearError,
  updatePermissions,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectPermissions = (state) => state.auth.permissions;
export const selectUserRole = (state) => state.auth.user?.role;

// Permission selectors
export const selectCanAccessPMTA = (state) =>
  state.auth.permissions.canAccessPMTA;
export const selectCanAccessMailWizz = (state) =>
  state.auth.permissions.canAccessMailWizz;
export const selectCanAccessAdmin = (state) =>
  state.auth.permissions.canAccessAdmin;
export const selectCanManageUsers = (state) =>
  state.auth.permissions.canManageUsers;
export const selectCanAssignCampaigns = (state) =>
  state.auth.permissions.canAssignCampaigns;
export const selectCanExportData = (state) =>
  state.auth.permissions.canExportData;

export default authSlice.reducer;
