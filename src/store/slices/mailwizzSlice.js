import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mailwizzApi } from "../../services/mailwizz/mailwizzApi";

// Async thunks for MailWizz operations
export const fetchUserCampaigns = createAsyncThunk(
  "mailwizz/fetchUserCampaigns",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getUserCampaigns();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch campaigns"
      );
    }
  }
);

export const fetchCampaignDetails = createAsyncThunk(
  "mailwizz/fetchCampaignDetails",
  async (campaignUid, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getCampaignDetails(campaignUid);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch campaign details"
      );
    }
  }
);

export const fetchAllCampaigns = createAsyncThunk(
  "mailwizz/fetchAllCampaigns",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getAllCampaigns();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch all campaigns"
      );
    }
  }
);

export const assignCampaignToUser = createAsyncThunk(
  "mailwizz/assignCampaignToUser",
  async ({ userId, campaignUid }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.assignCampaignToUser(
        userId,
        campaignUid
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign campaign"
      );
    }
  }
);

export const unassignCampaignFromUser = createAsyncThunk(
  "mailwizz/unassignCampaignFromUser",
  async ({ userId, campaignUid }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.unassignCampaignFromUser(
        userId,
        campaignUid
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to unassign campaign"
      );
    }
  }
);

const mailwizzSlice = createSlice({
  name: "mailwizz",
  initialState: {
    // Client data
    userCampaigns: [],
    selectedCampaign: null,
    campaignDetails: {},

    // Admin data
    allCampaigns: [],
    campaignAssignments: [],

    // UI state
    loading: false,
    error: null,
    filters: {
      status: "",
      dateRange: { start: null, end: null },
      searchTerm: "",
    },

    // Statistics
    aggregatedStats: {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalUnsubscribed: 0,
    },
  },
  reducers: {
    setSelectedCampaign: (state, action) => {
      state.selectedCampaign = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAggregatedStats: (state) => {
      state.aggregatedStats = state.userCampaigns.reduce(
        (acc, campaign) => {
          const stats = campaign.stats || {};
          acc.totalSent += stats.sent || 0;
          acc.totalDelivered += stats.delivered || 0;
          acc.totalOpened += stats.opened || 0;
          acc.totalClicked += stats.clicked || 0;
          acc.totalBounced += stats.bounced || 0;
          acc.totalUnsubscribed += stats.unsubscribed || 0;
          return acc;
        },
        {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalBounced: 0,
          totalUnsubscribed: 0,
        }
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user campaigns
      .addCase(fetchUserCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.userCampaigns = action.payload;
        mailwizzSlice.caseReducers.updateAggregatedStats(state);
      })
      .addCase(fetchUserCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch campaign details
      .addCase(fetchCampaignDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.campaignDetails[action.payload.uid] = action.payload;
      })
      .addCase(fetchCampaignDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all campaigns (admin)
      .addCase(fetchAllCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.allCampaigns = action.payload;
      })
      .addCase(fetchAllCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Assign campaign
      .addCase(assignCampaignToUser.fulfilled, (state, action) => {
        // Update assignments or refresh data as needed
        state.campaignAssignments.push(action.payload);
      })

      // Unassign campaign
      .addCase(unassignCampaignFromUser.fulfilled, (state, action) => {
        state.campaignAssignments = state.campaignAssignments.filter(
          (assignment) =>
            !(
              assignment.userId === action.payload.userId &&
              assignment.campaignUid === action.payload.campaignUid
            )
        );
      });
  },
});

export const {
  setSelectedCampaign,
  setFilters,
  clearError,
  updateAggregatedStats,
} = mailwizzSlice.actions;

// Selectors
export const selectUserCampaigns = (state) => state.mailwizz.userCampaigns;
export const selectAllCampaigns = (state) => state.mailwizz.allCampaigns;
export const selectFilteredCampaigns = (state) => {
  const { userCampaigns, filters } = state.mailwizz;
  let filtered = userCampaigns;

  if (filters.status) {
    filtered = filtered.filter(
      (campaign) => campaign.status === filters.status
    );
  }

  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.subject?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    filtered = filtered.filter((campaign) => {
      const campaignDate = new Date(campaign.created_at);
      return (
        campaignDate >= filters.dateRange.start &&
        campaignDate <= filters.dateRange.end
      );
    });
  }

  return filtered;
};

export const selectAggregatedStats = (state) => state.mailwizz.aggregatedStats;
export const selectMailwizzLoading = (state) => state.mailwizz.loading;
export const selectMailwizzError = (state) => state.mailwizz.error;

export default mailwizzSlice.reducer;
