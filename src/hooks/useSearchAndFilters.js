import { useCallback } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  useSearchTerm,
  useSearchType,
  useFilters,
  useFilteredData,
  useRawData,
} from "../store/hooks";
import {
  setSearchTerm,
  setSearchType,
  setFilters,
  clearFilters,
  setFilteredData,
} from "../store/slices/filesSlice";
import { searchData, filterData } from "../utils/dataAnalysis";

export const useSearchAndFilters = () => {
  const dispatch = useAppDispatch();
  const searchTerm = useSearchTerm();
  const searchType = useSearchType();
  const filters = useFilters();
  const filteredData = useFilteredData();
  const rawData = useRawData();

  const updateSearch = useCallback(
    (term, type = "recipient") => {
      dispatch(setSearchTerm(term));
      dispatch(setSearchType(type));

      // Apply search and filters immediately
      let result = rawData;
      if (term && term.trim()) {
        result = searchData(result, term, type);
      }
      result = filterData(result, filters);
      dispatch(setFilteredData(result));
    },
    [dispatch, rawData, filters]
  );

  const updateFilters = useCallback(
    (newFilters) => {
      const updatedFilters = { ...filters, ...newFilters };
      dispatch(setFilters(newFilters));

      // Apply search and filters immediately
      let result = rawData;
      if (searchTerm && searchTerm.trim()) {
        result = searchData(result, searchTerm, searchType);
      }
      result = filterData(result, updatedFilters);
      dispatch(setFilteredData(result));
    },
    [dispatch, rawData, searchTerm, searchType, filters]
  );

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(setFilteredData(rawData));
  }, [dispatch, rawData]);

  return {
    searchTerm,
    searchType,
    filters,
    filteredData,
    updateSearch,
    updateFilters,
    clearFilters: clearAllFilters,
  };
};
