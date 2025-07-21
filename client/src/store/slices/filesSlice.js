import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks for file operations
export const fetchAvailableFiles = createAsyncThunk(
  "files/fetchAvailableFiles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/files/available"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch available files");
      }
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const importFile = createAsyncThunk(
  "files/importFile",
  async (filename, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/files/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to import ${filename}`);
      }
      return { filename };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const importAllFiles = createAsyncThunk(
  "files/importAllFiles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/files/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importAll: true }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to import all files");
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const importLatestOnly = createAsyncThunk(
  "files/importLatestOnly",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/files/import-latest-only",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to import latest file");
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const selectFile = createAsyncThunk(
  "files/selectFile",
  async (filename, { rejectWithValue }) => {
    try {
      console.log(`🔄 Attempting to select file: ${filename}`);

      // First check if the file is imported
      const filesResponse = await fetch("http://localhost:4000/api/pmta/files");
      if (!filesResponse.ok) {
        throw new Error("Failed to get current files");
      }
      const filesData = await filesResponse.json();

      console.log(
        `📋 Available imported files: ${filesData.files
          .map((f) => f.filename)
          .join(", ")}`
      );

      if (
        filename !== "all" &&
        !filesData.files.some((f) => f.filename === filename)
      ) {
        throw new Error(
          `File ${filename} is not imported. Available files: ${filesData.files
            .map((f) => f.filename)
            .join(", ")}`
        );
      }

      const response = await fetch(
        "http://localhost:4000/api/pmta/files/select",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to select ${filename}`);
      }
      return filename;
    } catch (error) {
      console.error(`❌ File selection failed for ${filename}:`, error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFile = createAsyncThunk(
  "files/deleteFile",
  async (filename, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/pmta/files/${filename}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${filename}`);
      }
      const data = await response.json();
      return { filename, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Data
  rawData: [],
  filteredData: [],
  availableFiles: [],

  // File selection
  selectedFile: "all",

  // UI states
  loading: false,
  importing: false,
  error: null,

  // Import tracking
  lastAutoUpdate: null,
  autoImportEnabled: true,
  autoRefreshEnabled: true,

  // Search and filters
  searchTerm: "",
  searchType: "recipient",
  filters: {
    status: "all",
    vmta: "all",
    bounceCategory: "all",
    dateRange: null,
  },
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    setRawData: (state, action) => {
      state.rawData = action.payload;
    },
    setFilteredData: (state, action) => {
      state.filteredData = action.payload;
    },
    setAvailableFiles: (state, action) => {
      state.availableFiles = action.payload;
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSearchType: (state, action) => {
      state.searchType = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.searchTerm = "";
      state.searchType = "recipient";
      state.filters = {
        status: "all",
        vmta: "all",
        bounceCategory: "all",
        dateRange: null,
      };
    },
    setAutoImportEnabled: (state, action) => {
      state.autoImportEnabled = action.payload;
    },
    setAutoRefreshEnabled: (state, action) => {
      state.autoRefreshEnabled = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLastAutoUpdate: (state, action) => {
      state.lastAutoUpdate = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch available files
      .addCase(fetchAvailableFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.availableFiles = action.payload;
      })
      .addCase(fetchAvailableFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Import file
      .addCase(importFile.pending, (state) => {
        state.importing = true;
        state.error = null;
      })
      .addCase(importFile.fulfilled, (state, action) => {
        state.importing = false;
        // Update available files to mark as imported
        state.availableFiles = state.availableFiles.map((file) =>
          file.filename === action.payload.filename
            ? { ...file, imported: true }
            : file
        );
      })
      .addCase(importFile.rejected, (state, action) => {
        state.importing = false;
        state.error = action.payload;
      })

      // Import all files
      .addCase(importAllFiles.pending, (state) => {
        state.importing = true;
        state.error = null;
      })
      .addCase(importAllFiles.fulfilled, (state) => {
        state.importing = false;
        // Mark all files as imported
        state.availableFiles = state.availableFiles.map((file) => ({
          ...file,
          imported: true,
        }));
      })
      .addCase(importAllFiles.rejected, (state, action) => {
        state.importing = false;
        state.error = action.payload;
      })

      // Import latest only
      .addCase(importLatestOnly.pending, (state) => {
        state.importing = true;
        state.error = null;
      })
      .addCase(importLatestOnly.fulfilled, (state) => {
        state.importing = false;
      })
      .addCase(importLatestOnly.rejected, (state, action) => {
        state.importing = false;
        state.error = action.payload;
      })

      // Select file
      .addCase(selectFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectFile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedFile = action.payload;
      })
      .addCase(selectFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete file
      .addCase(deleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.loading = false;
        // Update available files to mark as not imported
        state.availableFiles = state.availableFiles.map((file) =>
          file.filename === action.payload.filename
            ? { ...file, imported: false, recordCount: 0 }
            : file
        );
        // If the deleted file was selected, switch to "all"
        if (state.selectedFile === action.payload.filename) {
          state.selectedFile = "all";
        }
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setRawData,
  setFilteredData,
  setAvailableFiles,
  setSelectedFile,
  setSearchTerm,
  setSearchType,
  setFilters,
  clearFilters,
  setAutoImportEnabled,
  setAutoRefreshEnabled,
  setError,
  clearError,
  setLastAutoUpdate,
  setLoading,
} = filesSlice.actions;

export default filesSlice.reducer;
