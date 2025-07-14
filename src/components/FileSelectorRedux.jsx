import React, { useEffect } from "react";
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
} from "lucide-react";

import { useAppDispatch } from "../store/hooks";
import {
  useAvailableFiles,
  useSelectedFile,
  useImporting,
  useLoading,
  useError,
  useImportOpen,
  useViewOpen,
  useImportedFiles,
  useFileStats,
} from "../store/hooks";
import {
  fetchAvailableFiles,
  importFile,
  importAllFiles,
  importLatestOnly,
  selectFile,
  clearError,
} from "../store/slices/filesSlice";
import {
  toggleImportOpen,
  toggleViewOpen,
  setViewOpen,
} from "../store/slices/uiSlice";

const FileSelector = ({
  onFileSelect,
  onRefreshFiles,
  isAutoImportEnabled,
}) => {
  const dispatch = useAppDispatch();

  // Redux state
  const availableFiles = useAvailableFiles();
  const selectedFile = useSelectedFile();
  const importing = useImporting();
  const loading = useLoading();
  const error = useError();
  const isImportOpen = useImportOpen();
  const isViewOpen = useViewOpen();
  const importedFiles = useImportedFiles();
  const { totalFiles, importedCount, notImportedCount, totalRecords } =
    useFileStats();

  // Initialize component
  useEffect(() => {
    // Always fetch available files on mount, regardless of auto-import setting
    dispatch(fetchAvailableFiles());
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

  // Handlers
  const handleFetchFiles = async () => {
    await dispatch(fetchAvailableFiles()).unwrap();
    if (onRefreshFiles) {
      onRefreshFiles();
    }
  };

  const handleImportFile = async (filename) => {
    try {
      await dispatch(importFile(filename)).unwrap();
      await handleFetchFiles();
      console.log(`✅ Successfully imported ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to import ${filename}:`, err);
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
      await dispatch(selectFile("all")).unwrap();
      if (onFileSelect) {
        onFileSelect("all");
      }
      dispatch(setViewOpen(false));
    } catch (err) {
      console.error("❌ Failed to switch to all files:", err);
    }
  };

  const handleSwitchToSpecificFile = async (filename) => {
    try {
      await dispatch(selectFile(filename)).unwrap();
      if (onFileSelect) {
        onFileSelect(filename);
      }
      dispatch(setViewOpen(false));
      if (onRefreshFiles) {
        onRefreshFiles();
      }
    } catch (err) {
      console.error(`❌ Failed to switch to ${filename}:`, err);
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
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
      return totalRecords;
    }
    const file = importedFiles.find((f) => f.filename === filename);
    return file ? file.recordCount || 0 : 0;
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

      {/* View Selector - Only show when auto-import is enabled */}
      {isAutoImportEnabled && (
        <Card className="bg-gray-900 border-gray-700">
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
                {importedCount} imported
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
                  {importedFiles.map((file, index) => (
                    <button
                      key={`imported-${file.filename}-${index}`}
                      onClick={() => handleSwitchToSpecificFile(file.filename)}
                      className={`w-full p-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        selectedFile === file.filename ? "bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-200">
                            {formatFileName(file.filename)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(file.recordCount || 0).toLocaleString()} records
                          </div>
                        </div>
                      </div>
                      {selectedFile === file.filename && (
                        <Check size={16} className="text-blue-400" />
                      )}
                    </button>
                  ))}

                  {importedFiles.length === 0 && (
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

      {/* Import Manager - For importing available files */}
      <Card className="bg-gray-900 border-gray-700">
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
                className="bg-green-900/20 text-green-400 border-green-700"
              >
                {importedCount} imported
              </Badge>
              <Badge
                variant="outline"
                className="bg-orange-900/20 text-orange-400 border-orange-700"
              >
                {notImportedCount} available
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
              Latest file imported automatically. Import older files manually as
              needed.
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
                                  file.recordCount || 0
                                ).toLocaleString()} records`
                              : "Not imported"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.imported ? (
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
                            disabled={importing || loading}
                            size="sm"
                            variant="outline"
                            className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/30 text-xs"
                          >
                            {importing ? (
                              <Clock size={12} className="mr-1 animate-spin" />
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

          {/* Import Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Total Files</div>
              <div className="text-lg font-semibold text-gray-200">
                {totalFiles}
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Imported</div>
              <div className="text-lg font-semibold text-green-400">
                {importedCount}
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Available</div>
              <div className="text-lg font-semibold text-orange-400">
                {notImportedCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileSelector;
