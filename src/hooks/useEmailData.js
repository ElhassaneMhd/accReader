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
  const [filters, setFilters] = useState({
    status: "all",
    vmta: "all",
    bounceCategory: "all",
    dateRange: null,
  });

  // Load CSV file
  const loadCSVFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);

    try {
      const parsedData = await parseCSVFile(file);
      setRawData(parsedData);
      setFilteredData(parsedData);
      console.log("Data loaded successfully:", parsedData.length, "records");
    } catch (err) {
      console.error("Error loading CSV file:", err);
      setError(err.message || "Failed to load CSV file");
    } finally {
      setLoading(false);
    }
  }, []);

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

    // Actions
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters,
  };
};
