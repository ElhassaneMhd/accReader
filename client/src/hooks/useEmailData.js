import { useState, useCallback, useMemo, useEffect } from "react";
import { parseCSVFile } from "../utils/csvParser";
import {
  analyzeEmailData,
  searchData,
  filterData,
} from "../utils/dataAnalysis";

export const useEmailData = () => {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("recipient");
  const [autoImportEnabled, setAutoImportEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastAutoUpdate, setLastAutoUpdate] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    vmta: "all",
    bounceCategory: "all",
    dateRange: null,
  });
  const [selectedFile, setSelectedFile] = useState("all");
  const [availableFiles, setAvailableFiles] = useState([]);

  // Load CSV file (manual upload)
  const loadCSVFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);

    try {
      const parsedData = await parseCSVFile(file);
      setRawData(parsedData);
      setFilteredData(parsedData);
      setAutoImportEnabled(false); // Disable auto-import when manual file is loaded
    } catch (err) {
      setError(err.message || "Failed to load CSV file");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data from auto-import service
  const loadAutoImportData = useCallback(async () => {
    if (!autoImportEnabled) return;

    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/latest-data"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch auto-import data");
      }

      const { data, totalRecords, source, selectedFile, importedFiles } =
        await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        // Data is already parsed JSON from direct server read
        setRawData(data);
        setFilteredData(data); // Immediately update filtered data to trigger UI refresh
        setLastAutoUpdate(new Date().toISOString());

        // Update file information
        if (selectedFile !== undefined) setSelectedFile(selectedFile);
        if (importedFiles) setAvailableFiles(importedFiles); // Renamed but same functionality

        console.log(
          `Auto-import data loaded: ${totalRecords} records via ${source}`
        );
      }
    } catch (err) {
      console.error("Error loading auto-import data:", err);
      // Don't set error state for auto-import failures to avoid disrupting UI
    }
  }, [autoImportEnabled]);

  // Force refresh data (manual refresh)
  const forceRefresh = useCallback(async () => {
    if (!autoImportEnabled) return;

    setLoading(true);
    try {
      await loadAutoImportData();
      console.log("Manual refresh completed");
    } finally {
      setLoading(false);
    }
  }, [autoImportEnabled, loadAutoImportData]);

  // Enable auto-import mode
  const enableAutoImport = useCallback(() => {
    setAutoImportEnabled(true);
    setError(null);
    loadAutoImportData();
  }, [loadAutoImportData]);

  // Disable auto-import mode
  const disableAutoImport = useCallback(() => {
    setAutoImportEnabled(false);
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Enable auto-refresh
  const enableAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(true);
  }, []);

  // Disable auto-refresh
  const disableAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(false);
  }, []);

  // Switch between files
  const switchToFile = useCallback(
    async (filename) => {
      if (!autoImportEnabled) return;

      try {
        setSelectedFile(filename); // Update UI immediately

        const response = await fetch(
          "http://localhost:4000/api/pmta/files/select",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ filename }),
          }
        );

        if (response.ok) {
          const result = await response.json();

          // Reload data with new selection
          await loadAutoImportData();

          console.log(
            `Switched to: ${result.selectedFile} (${
              result.recordCount || "combined"
            } records)`
          );
        }
      } catch (err) {
        console.error("Error switching file:", err);
        setError("Failed to switch file");
      }
    },
    [autoImportEnabled, loadAutoImportData]
  );

  // Get list of available files
  const getAvailableFiles = useCallback(async () => {
    if (!autoImportEnabled) return;

    try {
      const response = await fetch("http://localhost:4000/api/pmta/files");
      if (response.ok) {
        const result = await response.json();
        setAvailableFiles(result.files);
        setSelectedFile(result.selectedFile);
        return result;
      }
    } catch (err) {
      console.error("Error getting files:", err);
    }
  }, [autoImportEnabled]);

  // Apply search and filters
  const applyFilters = useCallback(() => {
    let result = rawData;

    // Apply search
    if (searchTerm) {
      result = searchData(result, searchTerm, searchType);
    }

    // Apply filters
    result = filterData(result, filters);

    setFilteredData(result);
  }, [rawData, searchTerm, searchType, filters]);

  // Update search
  const updateSearch = useCallback((term, type = "recipient") => {
    setSearchTerm(term);
    setSearchType(type);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters and search
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSearchType("recipient");
    setFilters({
      status: "all",
      vmta: "all",
      bounceCategory: "all",
      dateRange: null,
    });
  }, []);

  // Memoized analysis
  const analysis = useMemo(() => {
    return analyzeEmailData(filteredData);
  }, [filteredData]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (rawData.length === 0) {
      return {
        vmtas: [],
        bounceCategories: [],
        statuses: [],
      };
    }

    const vmtas = [
      ...new Set(rawData.map((row) => row.vmta).filter(Boolean)),
    ].sort();
    const bounceCategories = [
      ...new Set(rawData.map((row) => row.bounceCat).filter(Boolean)),
    ].sort();
    const statuses = [
      ...new Set(rawData.map((row) => row.dsnAction).filter(Boolean)),
    ].sort();

    return {
      vmtas,
      bounceCategories,
      statuses,
    };
  }, [rawData]);

  // Auto-import effect - check for new data more frequently with router support and auto-refresh control
  useEffect(() => {
    if (!autoImportEnabled || !autoRefreshEnabled) return;

    // Initial load
    loadAutoImportData();

    // Set up periodic checking every 10 seconds for more responsive updates
    const interval = setInterval(() => {
      if (autoRefreshEnabled) {
        loadAutoImportData();
        // Force component re-render by updating a timestamp
        setLastAutoUpdate(new Date().toISOString());
      }
    }, 10000); // 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [autoImportEnabled, autoRefreshEnabled, loadAutoImportData]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    lastAutoUpdate,
    selectedFile,
    availableFiles,

    // Actions
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters,
    enableAutoImport,
    disableAutoImport,
    toggleAutoRefresh,
    enableAutoRefresh,
    disableAutoRefresh,
    loadAutoImportData,
    forceRefresh,
    switchToFile,
    getAvailableFiles,
  };
};
