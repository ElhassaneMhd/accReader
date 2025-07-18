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
      // Extract the campaigns array from the nested response structure
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch all campaigns"
      );
    }
  }
);

export const fetchAllCampaignsWithStats = createAsyncThunk(
  "mailwizz/fetchAllCampaignsWithStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getAllCampaignsWithStats();
      // Extract the campaigns array from the nested response structure
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch campaigns with stats"
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

// ===============================
// LIST MANAGEMENT ACTIONS
// ===============================

export const fetchAllLists = createAsyncThunk(
  "mailwizz/fetchAllLists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getAllLists();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lists"
      );
    }
  }
);

export const fetchListDetails = createAsyncThunk(
  "mailwizz/fetchListDetails",
  async (listUid, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getList(listUid);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch list details"
      );
    }
  }
);

export const fetchListSubscribers = createAsyncThunk(
  "mailwizz/fetchListSubscribers",
  async ({ listUid, page = 1, perPage = 50 }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.getListSubscribers(listUid, page, perPage);
      console.log('fetchListSubscribers response:', response.data);
      return {
        listUid,
        data: response.data.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch list subscribers"
      );
    }
  }
);

export const addSubscriber = createAsyncThunk(
  "mailwizz/addSubscriber",
  async ({ listUid, subscriberData }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.addSubscriber(listUid, subscriberData);
      return {
        listUid,
        subscriber: response.data.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add subscriber"
      );
    }
  }
);

export const updateSubscriber = createAsyncThunk(
  "mailwizz/updateSubscriber",
  async ({ listUid, subscriberUid, subscriberData }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.updateSubscriber(listUid, subscriberUid, subscriberData);
      return {
        listUid,
        subscriberUid,
        subscriber: response.data.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update subscriber"
      );
    }
  }
);

export const deleteSubscriber = createAsyncThunk(
  "mailwizz/deleteSubscriber",
  async ({ listUid, subscriberUid }, { rejectWithValue }) => {
    try {
      await mailwizzApi.deleteSubscriber(listUid, subscriberUid);
      return {
        listUid,
        subscriberUid
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete subscriber"
      );
    }
  }
);

export const importSubscribersCSV = createAsyncThunk(
  "mailwizz/importSubscribersCSV",
  async ({ listUid, file }, { rejectWithValue }) => {
    try {
      const response = await mailwizzApi.importSubscribersCSV(listUid, file);
      return {
        listUid,
        result: response.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to import CSV"
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

    // List management
    allLists: [],
    selectedList: null,
    listSubscribers: {},
    importStatus: null,

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
        // Extract the campaigns array from the response data
        state.allCampaigns = action.payload?.records || action.payload || [];
      })
      .addCase(fetchAllCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all campaigns with stats (admin)
      .addCase(fetchAllCampaignsWithStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCampaignsWithStats.fulfilled, (state, action) => {
        state.loading = false;
        // Extract the campaigns array from the response data
        state.allCampaigns = action.payload?.records || action.payload || [];
      })
      .addCase(fetchAllCampaignsWithStats.rejected, (state, action) => {
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
      })

      // ===============================
      // LIST MANAGEMENT REDUCERS
      // ===============================

      // Fetch all lists
      .addCase(fetchAllLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLists.fulfilled, (state, action) => {
        state.loading = false;
        // Handle nested response structure: payload.data.records
        const records = action.payload?.data?.records || action.payload?.records || action.payload || [];
        // Transform the nested structure to flatten the general info
        state.allLists = records.map(record => ({
          list_uid: record.general?.list_uid,
          name: record.general?.name,
          display_name: record.general?.display_name,
          description: record.general?.description,
          from_email: record.defaults?.from_email,
          from_name: record.defaults?.from_name,
          company_name: record.company?.name,
          ...record.general // Include all general fields
        }));
      })
      .addCase(fetchAllLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch list details
      .addCase(fetchListDetails.fulfilled, (state, action) => {
        state.selectedList = action.payload;
      })

      // Fetch list subscribers
      .addCase(fetchListSubscribers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListSubscribers.fulfilled, (state, action) => {
        state.loading = false;
        const { listUid, data } = action.payload;
        console.log('Reducer - listUid:', listUid, 'data:', data);
        state.listSubscribers[listUid] = data?.records || [];
        console.log('Reducer - stored subscribers:', state.listSubscribers[listUid]);
      })
      .addCase(fetchListSubscribers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add subscriber
      .addCase(addSubscriber.fulfilled, (state, action) => {
        const { listUid, subscriber } = action.payload;
        if (state.listSubscribers[listUid]) {
          state.listSubscribers[listUid].push(subscriber);
        }
      })

      // Update subscriber
      .addCase(updateSubscriber.fulfilled, (state, action) => {
        const { listUid, subscriberUid, subscriber } = action.payload;
        if (state.listSubscribers[listUid]) {
          const index = state.listSubscribers[listUid].findIndex(
            (s) => s.subscriber_uid === subscriberUid
          );
          if (index !== -1) {
            state.listSubscribers[listUid][index] = subscriber;
          }
        }
      })

      // Delete subscriber
      .addCase(deleteSubscriber.fulfilled, (state, action) => {
        const { listUid, subscriberUid } = action.payload;
        if (state.listSubscribers[listUid]) {
          state.listSubscribers[listUid] = state.listSubscribers[listUid].filter(
            (s) => s.subscriber_uid !== subscriberUid
          );
        }
      })

      // Import CSV
      .addCase(importSubscribersCSV.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.importStatus = 'uploading';
      })
      .addCase(importSubscribersCSV.fulfilled, (state, action) => {
        state.loading = false;
        state.importStatus = 'success';
        // Refresh subscribers for the list
        const { listUid } = action.payload;
        // Note: You might want to refetch subscribers after import
      })
      .addCase(importSubscribersCSV.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.importStatus = 'error';
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

// List selectors
export const selectAllLists = (state) => state.mailwizz.allLists;
export const selectSelectedList = (state) => state.mailwizz.selectedList;
export const selectListSubscribers = (state) => state.mailwizz.listSubscribers;
export const selectListSubscribersByListId = (listId) => (state) => 
  state.mailwizz.listSubscribers[listId] || [];
export const selectImportStatus = (state) => state.mailwizz.importStatus;

export default mailwizzSlice.reducer;
