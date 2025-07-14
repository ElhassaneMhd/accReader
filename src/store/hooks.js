import { useSelector, useDispatch } from "react-redux";
import { useMemo } from "react";
import { analyzeEmailData } from "../utils/dataAnalysis";

// Redux hooks
export const useAppSelector = useSelector;
export const useAppDispatch = () => useDispatch();

// Selector hooks
export const useFilesState = () => useSelector((state) => state.files);
export const useUIState = () => useSelector((state) => state.ui);

// Specific file selectors
export const useRawData = () => useSelector((state) => state.files.rawData);
export const useFilteredData = () =>
  useSelector((state) => state.files.filteredData);
export const useAvailableFiles = () =>
  useSelector((state) => state.files.availableFiles);
export const useSelectedFile = () =>
  useSelector((state) => state.files.selectedFile);
export const useSearchTerm = () =>
  useSelector((state) => state.files.searchTerm);
export const useSearchType = () =>
  useSelector((state) => state.files.searchType);
export const useFilters = () => useSelector((state) => state.files.filters);
export const useAutoImportEnabled = () =>
  useSelector((state) => state.files.autoImportEnabled);
export const useAutoRefreshEnabled = () =>
  useSelector((state) => state.files.autoRefreshEnabled);

// Loading states
export const useLoading = () => useSelector((state) => state.files.loading);
export const useImporting = () => useSelector((state) => state.files.importing);
export const useError = () => useSelector((state) => state.files.error);

// UI selectors
export const useImportOpen = () =>
  useSelector((state) => state.ui.isImportOpen);
export const useViewOpen = () => useSelector((state) => state.ui.isViewOpen);

// Computed selectors with memoization
export const useAnalysisData = () => {
  const filteredData = useFilteredData();

  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return null;
    }
    return analyzeEmailData(filteredData);
  }, [filteredData]);
};

export const useFilterOptions = () => {
  const rawData = useRawData();

  return useMemo(() => {
    if (!rawData || rawData.length === 0) {
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
};

// File operation selectors
export const useImportedFiles = () => {
  const availableFiles = useAvailableFiles();

  return useMemo(() => {
    return availableFiles.filter((file) => file.imported);
  }, [availableFiles]);
};

export const useNotImportedFiles = () => {
  const availableFiles = useAvailableFiles();

  return useMemo(() => {
    return availableFiles.filter((file) => !file.imported);
  }, [availableFiles]);
};

export const useFileStats = () => {
  const availableFiles = useAvailableFiles();
  const importedFiles = useImportedFiles();
  const notImportedFiles = useNotImportedFiles();

  return useMemo(() => {
    const totalRecords = importedFiles.reduce(
      (total, file) => total + (file.recordCount || 0),
      0
    );

    return {
      totalFiles: availableFiles.length,
      importedCount: importedFiles.length,
      notImportedCount: notImportedFiles.length,
      totalRecords,
    };
  }, [availableFiles, importedFiles, notImportedFiles]);
};
