import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../store/hooks";
import {
  useRawData,
  useFilteredData,
  useAvailableFiles,
  useSelectedFile,
  useSearchTerm,
  useSearchType,
  useFilters,
  useAutoImportEnabled,
  useAutoRefreshEnabled,
  useLoading,
  useImporting,
  useError,
  useAnalysisData,
  useFilterOptions,
} from "../store/hooks";
import {
  setRawData,
  setFilteredData,
  setSearchTerm,
  setSearchType,
  setFilters,
  clearFilters,
  setAutoImportEnabled,
  setAutoRefreshEnabled,
  setLastAutoUpdate,
  setLoading,
  setError,
  selectFile,
  clearError,
} from "../store/slices/filesSlice";
import { parseCSVFile } from "../utils/csvParser";
import { searchData, filterData } from "../utils/dataAnalysis";

export const useEmailDataRedux = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const rawData = useRawData();
  const filteredData = useFilteredData();
  const availableFiles = useAvailableFiles();
  const selectedFile = useSelectedFile();
  const searchTerm = useSearchTerm();
  const searchType = useSearchType();
  const filters = useFilters();
  const autoImportEnabled = useAutoImportEnabled();
  const autoRefreshEnabled = useAutoRefreshEnabled();
  const loading = useLoading();
  const importing = useImporting();
  const error = useError();
  const analysis = useAnalysisData();
  const filterOptions = useFilterOptions();
  const lastAutoUpdate = useSelector((state) => state.files.lastAutoUpdate);

  // Load CSV file (manual upload)
  const loadCSVFile = useCallback(
    async (file) => {
      dispatch(setLoading(true));
      dispatch(clearError());

      try {
        const parsedData = await parseCSVFile(file);
        dispatch(setRawData(parsedData));
        dispatch(setFilteredData(parsedData));
        dispatch(setAutoImportEnabled(false)); // Disable auto-import when manual file is loaded
      } catch (err) {
        dispatch(setError(err.message || "Failed to load CSV file"));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // Force refresh data (manual refresh)
  const forceRefresh = useCallback(async () => {
    if (!autoImportEnabled) return;

    try {
      // Import Manager handles file fetching now
      console.log("✅ Manual refresh completed");
    } catch (err) {
      console.error("❌ Manual refresh failed:", err);
    }
  }, [autoImportEnabled]);

  // Switch between files
  const switchToFile = useCallback(
    async (filename) => {
      if (!autoImportEnabled) return;

      try {
        await dispatch(selectFile(filename)).unwrap();
        console.log(`✅ Switched to: ${filename}`);
      } catch (err) {
        console.error(`❌ Failed to switch to ${filename}:`, err);
      }
    },
    [dispatch, autoImportEnabled]
  );

  // Enable auto-import mode
  const enableAutoImport = useCallback(() => {
    dispatch(setAutoImportEnabled(true));
    dispatch(clearError());
  }, [dispatch]);

  // Disable auto-import mode
  const disableAutoImport = useCallback(() => {
    dispatch(setAutoImportEnabled(false));
  }, [dispatch]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    dispatch(setAutoRefreshEnabled(!autoRefreshEnabled));
  }, [dispatch, autoRefreshEnabled]);

  // Update search
  const updateSearch = useCallback(
    (term, type = "recipient") => {
      dispatch(setSearchTerm(term));
      dispatch(setSearchType(type));
    },
    [dispatch]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  // Clear all filters and search
  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Apply search and filters to raw data
  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      dispatch(setFilteredData([]));
      return;
    }

    let result = rawData;

    // Apply search
    if (searchTerm && searchTerm.trim()) {
      result = searchData(result, searchTerm, searchType);
    }

    // Apply filters
    result = filterData(result, filters);

    dispatch(setFilteredData(result));
  }, [dispatch, rawData, searchTerm, searchType, filters]);

  // Auto-refresh effect - removed since Import Manager handles file fetching
  useEffect(() => {
    if (!autoImportEnabled || !autoRefreshEnabled) return;

    // Set up periodic status update
    const interval = setInterval(() => {
      dispatch(setLastAutoUpdate(new Date().toISOString()));
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [dispatch, autoImportEnabled, autoRefreshEnabled]);

  // Get available files for FileSelector - now handled by Import Manager
  const getAvailableFiles = useCallback(async () => {
    if (!autoImportEnabled) return;

    try {
      // Import Manager handles this now
      console.log("✅ Available files handled by Import Manager");
    } catch (err) {
      console.error("❌ Error getting files:", err);
    }
  }, [autoImportEnabled]);

  return {
    // Data
    rawData,
    filteredData,
    analysis,

    // State
    loading,
    error,
    searchTerm,
    searchType,
    filters,
    filterOptions,
    autoImportEnabled,
    autoRefreshEnabled,
    selectedFile,
    availableFiles,
    importing,
    lastAutoUpdate,

    // Actions
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters: clearAllFilters,
    enableAutoImport,
    disableAutoImport,
    toggleAutoRefresh,
    forceRefresh,
    switchToFile,
    getAvailableFiles,
  };
};
