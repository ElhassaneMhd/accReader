import { useState, useCallback, useMemo, useEffect } from "react";
import { parseCSVFile } from "@/utils/csvParser";
import { analyzeEmailData, searchData, filterData } from "@/utils/dataAnalysis";

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

  // Load data from auto-import service with file selection support
  const loadAutoImportData = useCallback(
    async (fileToLoad = null) => {
      if (!autoImportEnabled) return;

      console.log(
        `🔄 Loading auto-import data. Requested file: ${fileToLoad}, Current file: ${selectedFile}`
      );

      try {
        // If a specific file is requested, select it first
        if (fileToLoad && fileToLoad !== selectedFile) {
          console.log(`📤 Selecting file on server: ${fileToLoad}`);
          const selectResponse = await fetch(
            "http://localhost:4000/api/pmta/files/select",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filename: fileToLoad }),
            }
          );

          if (!selectResponse.ok) {
            const errorText = await selectResponse.text();
            throw new Error(
              `Failed to select file: ${fileToLoad}. Server response: ${errorText}`
            );
          }

          const selectResult = await selectResponse.json();
          console.log(`✅ File selection result:`, selectResult);
          setSelectedFile(fileToLoad);
        }

        console.log(`📤 Fetching latest data from server...`);

        // Try to get data, and if no data is available, force reload
        let response = await fetch(
          "http://localhost:4000/api/pmta/latest-data"
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch auto-import data. Server response: ${errorText}`
          );
        }

        let responseData = await response.json();

        // If no data is available, try force reload
        if (!responseData.data || responseData.data.length === 0) {
          console.log(`⚠️ No data available, attempting force reload...`);
          response = await fetch(
            "http://localhost:4000/api/pmta/latest-data?forceReload=true"
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to force reload data. Server response: ${errorText}`
            );
          }

          responseData = await response.json();
        }

        const {
          data,
          totalRecords,
          source,
          selectedFile: serverSelectedFile,
          importedFiles,
        } = responseData;

        console.log(`📥 Server response:`, {
          totalRecords,
          source,
          serverSelectedFile,
          dataLength: data?.length,
        });

        if (data && Array.isArray(data) && data.length > 0) {
          // Data is already parsed JSON from direct server read
          setRawData(data);
          setFilteredData(data); // Immediately update filtered data to trigger UI refresh
          setLastAutoUpdate(new Date().toISOString());

          // Update file information
          if (serverSelectedFile !== undefined)
            setSelectedFile(serverSelectedFile);
          if (importedFiles) setAvailableFiles(importedFiles);

          console.log(
            `✅ Auto-import data loaded: ${totalRecords} records via ${source} (File: ${serverSelectedFile})`
          );
        } else {
          console.warn(`⚠️ No data received from server or empty data array`);
        }
      } catch (err) {
        console.error("Error loading auto-import data:", err);
        setError(err.message);
      }
    },
    [autoImportEnabled, selectedFile]
  );

  // Switch to a specific file
  const switchToFile = useCallback(
    async (filename) => {
      if (!autoImportEnabled) return;

      console.log(`🔄 Context: Switching to file: ${filename}`);
      setLoading(true);
      setError(null);

      try {
        await loadAutoImportData(filename);
        console.log(`✅ Context: Successfully switched to file: ${filename}`);
      } catch (err) {
        console.error(`❌ Context: Failed to switch to file ${filename}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [autoImportEnabled, loadAutoImportData]
  );

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

  // Update search term
  const updateSearch = useCallback((term, type = "recipient") => {
    setSearchTerm(term);
    setSearchType(type);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
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

  // Get available files
  const getAvailableFiles = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/pmta/files/available"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch available files");
      }
      const data = await response.json();
      setAvailableFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching available files:", err);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoImportEnabled || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadAutoImportData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoImportEnabled, autoRefreshEnabled, loadAutoImportData]);

  // Initial data load
  useEffect(() => {
    if (autoImportEnabled) {
      loadAutoImportData();
      getAvailableFiles();
    }
  }, [autoImportEnabled, loadAutoImportData, getAvailableFiles]);

  // Filter and search effect
  useEffect(() => {
    if (rawData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = rawData;

    // Apply search
    if (searchTerm.trim()) {
      filtered = searchData(filtered, searchTerm, searchType);
    }

    // Apply filters
    if (
      filters.status !== "all" ||
      filters.vmta !== "all" ||
      filters.bounceCategory !== "all" ||
      filters.dateRange
    ) {
      filtered = filterData(filtered, filters);
    }

    setFilteredData(filtered);
  }, [rawData, searchTerm, searchType, filters]);

  // Memoized analysis
  const analysis = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        overview: {
          totalRecords: 0,
          delivered: 0,
          failed: 0,
          bounced: 0,
          queued: 0,
          delayed: 0,
        },
        statusBreakdown: [],
        vmtaPerformance: [],
        timeSeries: [],
        topRecipients: [],
        topSenders: [],
        bounceAnalysis: [],
      };
    }

    return analyzeEmailData(filteredData);
  }, [filteredData]);

  // Memoized filter options
  const filterOptions = useMemo(() => {
    if (rawData.length === 0) {
      return {
        statuses: [],
        vmtas: [],
        bounceCategories: [],
        dateRange: null,
      };
    }

    const statuses = [
      ...new Set(
        rawData.map((row) => row.dsnAction || row.action || "unknown")
      ),
    ];
    const vmtas = [
      ...new Set(
        rawData.map((row) => row.vmta || row.dlvSourceIp || "unknown")
      ),
    ];
    const bounceCategories = [
      ...new Set(rawData.map((row) => row.bounceCategory || "unknown")),
    ];

    return {
      statuses: statuses.sort(),
      vmtas: vmtas.sort(),
      bounceCategories: bounceCategories.sort(),
      dateRange: null,
    };
  }, [rawData]);

  return {
    // Data
    rawData,
    filteredData,
    analysis,
    loading,
    error,

    // Search and filters
    searchTerm,
    searchType,
    filters,
    filterOptions,

    // Auto-import settings
    autoImportEnabled,
    autoRefreshEnabled,
    lastAutoUpdate,
    selectedFile,
    availableFiles,

    // Actions
    loadCSVFile,
    loadAutoImportData,
    switchToFile,
    forceRefresh,
    enableAutoImport,
    disableAutoImport,
    toggleAutoRefresh,
    updateSearch,
    updateFilters,
    clearFilters,
    getAvailableFiles,
  };
};
