import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  ChevronDown,
  Check,
  Download,
  Zap,
  Clock,
  Database,
  RefreshCw,
  Eye,
  FolderOpen,
  Import,
  Trash2,
} from "lucide-react";

import { useAppDispatch } from "@/store/hooks";
import {
  useAvailableFiles,
  useSelectedFile,
  useImporting,
  useLoading,
  useError,
  useImportOpen,
  useViewOpen,
  useFileStats,
} from "@/store/hooks";
import {
  fetchAvailableFiles,
  importFile,
  importAllFiles,
  importLatestOnly,
  selectFile,
  deleteFile,
  clearError,
} from "@/store/slices/filesSlice";
import {
  toggleImportOpen,
  toggleViewOpen,
  setViewOpen,
} from "@/store/slices/uiSlice";

const FileSelector = ({
  onFileSelect,
  onRefreshFiles,
  isAutoImportEnabled,
  switchToFile,
}) => {
  const dispatch = useAppDispatch();

  // Local state for imported files from server
  const [serverImportedFiles, setServerImportedFiles] = useState([]);

  // Redux state
  const availableFiles = useAvailableFiles();
  const selectedFile = useSelectedFile();
  const importing = useImporting();
  const loading = useLoading();
  const error = useError();
  const isImportOpen = useImportOpen();
  const isViewOpen = useViewOpen();
  const { totalFiles, importedCount, notImportedCount, totalRecords } =
    useFileStats();

  // Initialize component
  useEffect(() => {
    // Always fetch available files on mount, regardless of auto-import setting
    dispatch(fetchAvailableFiles());
    fetchImportedFiles();
  }, [dispatch]);

  // Auto-fetch files when auto-import is enabled
  useEffect(() => {
    if (isAutoImportEnabled) {
      const interval = setInterval(() => {
        dispatch(fetchAvailableFiles());
      }, 30000); // Refresh every 30 seconds when auto-import is enabled

      return () => clearInterval(interval);
    }
  }, [dispatch, isAutoImportEnabled]);

  // Debug logging
  useEffect(() => {
    fetchImportedFiles();
  }, []);

  const [debugInfo, setDebugInfo] = useState({
    availableFiles: [],
    importedFiles: [],
    selectedFile: null,
    isConnected: false,
  });

  useEffect(() => {
    setDebugInfo({
      availableFiles: availableFiles?.length || 0,
      importedFiles: serverImportedFiles?.length || 0,
      selectedFile,
      isConnected: true,
    });
  }, [availableFiles, serverImportedFiles, selectedFile]);

  const fetchImportedFiles = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/pmta/files");

      if (response.ok) {
        const data = await response.json();

        // Handle different response formats
        let files = [];
        if (data.files && Array.isArray(data.files)) {
          files = data.files;
        } else if (Array.isArray(data)) {
          files = data;
        } else if (data && typeof data === "object") {
          // Try to extract files from various possible structures
          files = data.importedFiles || data.files || [];
        }

        setServerImportedFiles(files);
      } else {
        setServerImportedFiles([]);
      }
    } catch (error) {
      setServerImportedFiles([]);
    }
  };

  const handleFetchFiles = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetch("http://localhost:4000/api/pmta/fetch-files"),
        fetchImportedFiles(),
      ]);
    } catch (error) {
      onError?.("Failed to fetch files from server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = async (filename) => {
    try {
      console.log(`🔄 Starting import for ${filename}`);

      // Import the file
      const importResult = await dispatch(importFile(filename)).unwrap();
      console.log(`✅ Successfully imported ${filename}:`, importResult);

      // Refresh the file lists
      await handleFetchFiles();

      // Small delay to ensure server state consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Auto-select the imported file after successful import
      console.log(`🎯 Auto-selecting ${filename} after successful import`);
      await dispatch(selectFile(filename)).unwrap();
      if (onFileSelect) {
        onFileSelect(filename);
      }
    } catch (err) {
      console.error(`❌ Failed to import ${filename}:`, err);
      // Show error to user with more details
      const errorMessage = err.message || err.toString();
      alert(
        `Failed to import ${filename}:\n\n${errorMessage}\n\nPlease check the server logs for more details.`
      );
    }
  };

  const handleImportAll = async () => {
    try {
      await dispatch(importAllFiles()).unwrap();
      await handleFetchFiles();
      await handleSwitchToAllFiles();
      console.log("✅ Successfully imported all files");
    } catch (err) {
      console.error("❌ Failed to import all files:", err);
    }
  };

  const handleImportLatest = async () => {
    try {
      await dispatch(importLatestOnly()).unwrap();
      await handleFetchFiles();
      await handleSwitchToAllFiles();
      console.log("⚡ Successfully imported latest file");
    } catch (err) {
      console.error("❌ Failed to import latest file:", err);
    }
  };

  const handleSwitchToAllFiles = async () => {
    try {
      console.log("🔄 Switching to all files...");
      if (switchToFile) {
        console.log("📞 Using context switchToFile function");
        await switchToFile("all");
      } else {
        console.log("📞 Using Redux selectFile action");
        await dispatch(selectFile("all")).unwrap();
      }
      if (onFileSelect) {
        onFileSelect("all");
      }
      dispatch(setViewOpen(false));
      console.log("✅ Successfully switched to all files");
    } catch (err) {
      console.error("❌ Failed to switch to all files:", err);
    }
  };

  const handleSwitchToSpecificFile = async (filename) => {
    try {
      console.log(`🔄 Switching to file: ${filename}`);
      if (switchToFile) {
        console.log("📞 Using context switchToFile function");
        await switchToFile(filename);
      } else {
        console.log("📞 Using Redux selectFile action");
        await dispatch(selectFile(filename)).unwrap();
      }
      if (onFileSelect) {
        onFileSelect(filename);
      }
      dispatch(setViewOpen(false));
      console.log(`✅ Successfully switched to ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to switch to ${filename}:`, err);
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleDeleteFile = async (filename) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${filename}? This will remove the file from imports and delete the local copy.`
      )
    ) {
      return;
    }

    try {
      await dispatch(deleteFile(filename)).unwrap();
      await handleFetchFiles();
      console.log(`🗑️ Successfully deleted ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to delete ${filename}:`, err);
    }
  };

  // Utility functions
  const formatFileName = (filename) => {
    if (filename === "all") return "All Files (Combined)";
    return filename.replace(/\.(csv|log)$/i, "");
  };

  const getFileIcon = (filename) => {
    if (filename === "all") {
      return <BarChart3 size={16} className="text-blue-400" />;
    }
    return <FileText size={16} className="text-gray-400" />;
  };

  const getTotalRecordsForFile = (filename) => {
    if (filename === "all") {
      return totalRecords || 0;
    }
    const file = serverImportedFiles.find((f) => f && f.filename === filename);
    if (!file) {
      console.warn(`File not found: ${filename}`);
      return 0;
    }
    // Handle different possible field names for record count
    const recordCount =
      file.recordCount || file.records || file.totalRecords || file.count || 0;
    console.log(`📊 Records for ${filename}:`, recordCount);
    return recordCount;
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">❌ {error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4 w-full flex flex-col md:flex-row gap-4">
        {/* Import Manager - For importing available files */}
        <Card className="bg-gray-900 w-full border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Import size={20} className="text-orange-400" />
                <CardTitle className="text-lg text-gray-100">
                  Import Manager
                </CardTitle>
                <Button
                  onClick={handleFetchFiles}
                  disabled={loading}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="    bg-blue-900/20 border border-blue-700/50 text-blue-400"
                >
                  {totalFiles} Total
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-green-900/20 text-green-400 border-green-700"
                >
                  {importedCount} Imported
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-orange-900/20 text-orange-400 border-orange-700"
                >
                  {notImportedCount} Available
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Performance Mode Info */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  Performance Mode
                </span>
              </div>
              <p className="text-xs text-blue-300">
                Latest file imported automatically. Import older files manually
                as needed.
              </p>
            </div>

            {/* Quick Import Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleImportLatest}
                disabled={importing || loading}
                variant="outline"
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {importing ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Zap size={16} className="mr-2" />
                )}
                Latest Only
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={importing || loading || notImportedCount === 0}
                variant="outline"
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {importing ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Database size={16} className="mr-2" />
                )}
                Import All
              </Button>
            </div>

            {/* Available Files Dropdown */}
            <div className="relative">
              <Button
                onClick={() => dispatch(toggleImportOpen())}
                variant="outline"
                className="w-full justify-between bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={16} />
                  Manage File Imports
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isImportOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {isImportOpen && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {/* Available Files with Import Status */}
                  {availableFiles.map((file, index) => (
                    <div
                      key={`available-${file.filename}-${index}`}
                      className="p-3 border-b border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText size={14} className="text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-200">
                              {formatFileName(file.filename)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {file.imported
                                ? `${(
                                    file.recordCount ||
                                    file.records ||
                                    0
                                  ).toLocaleString()} records`
                                : "Not imported"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.imported ||
                          serverImportedFiles.some(
                            (importedFile) =>
                              importedFile &&
                              importedFile.filename === file.filename
                          ) ? (
                            <Badge
                              variant="outline"
                              className="bg-green-900/20 text-green-400 border-green-700 text-xs"
                            >
                              <Check size={12} className="mr-1" />
                              Imported
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handleImportFile(file.filename)}
                              disabled={
                                importing ||
                                loading ||
                                file.imported ||
                                serverImportedFiles.some(
                                  (importedFile) =>
                                    importedFile &&
                                    importedFile.filename === file.filename
                                )
                              }
                              size="sm"
                              variant="outline"
                              className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/30 text-xs disabled:opacity-50"
                              title={
                                file.imported ||
                                serverImportedFiles.some(
                                  (importedFile) =>
                                    importedFile &&
                                    importedFile.filename === file.filename
                                )
                                  ? "File already imported"
                                  : "Import this file"
                              }
                            >
                              {importing ? (
                                <Clock
                                  size={12}
                                  className="mr-1 animate-spin"
                                />
                              ) : (
                                <Download size={12} className="mr-1" />
                              )}
                              Import
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {availableFiles.length === 0 && (
                    <div className="p-3 text-center text-gray-400 text-sm">
                      {loading ? "Loading files..." : "No files available"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Selector - Only show when auto-import is enabled */}
        {isAutoImportEnabled && (
          <Card className="bg-gray-900 w-full h-full border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-green-400" />
                  <CardTitle className="text-lg text-gray-100">
                    View Selector
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-900/20 text-green-400 border-green-700"
                >
                  {serverImportedFiles.length} Imported
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Current Selection */}
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(selectedFile)}
                    <div>
                      <div className="text-sm font-medium text-gray-200">
                        {formatFileName(selectedFile)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getTotalRecordsForFile(selectedFile).toLocaleString()}{" "}
                        records
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-900/20 text-blue-400 border-blue-700/50"
                  >
                    Active View
                  </Badge>
                </div>
              </div>

              {/* View Switcher Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => dispatch(toggleViewOpen())}
                  variant="outline"
                  className="w-full justify-between bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <Eye size={16} />
                    Switch View
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isViewOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isViewOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {/* Combined View Option */}
                    <button
                      onClick={handleSwitchToAllFiles}
                      className={`w-full p-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        selectedFile === "all" ? "bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-200">
                            All Files (Combined)
                          </div>
                          <div className="text-xs text-gray-400">
                            {totalRecords.toLocaleString()} total records
                          </div>
                        </div>
                      </div>
                      {selectedFile === "all" && (
                        <Check size={16} className="text-blue-400" />
                      )}
                    </button>

                    {/* Individual Imported Files */}
                    {serverImportedFiles
                      .filter((file) => file && file.filename) // Filter out invalid files
                      .map((file, index) => (
                        <div
                          key={`imported-${file.filename}-${index}`}
                          className={`w-full p-3 flex items-center justify-between ${
                            selectedFile === file.filename
                              ? "bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <button
                            onClick={() =>
                              handleSwitchToSpecificFile(file.filename)
                            }
                            className="flex items-center gap-2 flex-1 text-left hover:bg-gray-700/50 rounded px-2 py-1 transition-colors"
                          >
                            <FileText size={16} className="text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-200">
                                {formatFileName(file.filename)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {(
                                  file.recordCount ||
                                  file.records ||
                                  0
                                ).toLocaleString()}{" "}
                                records
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            {selectedFile === file.filename && (
                              <Check size={16} className="text-blue-400" />
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.filename)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                              title={`Delete ${file.filename}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                    {serverImportedFiles.length === 0 && (
                      <div className="p-3 text-center text-gray-400 text-sm">
                        No imported files available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FileSelector;
