import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Files,
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

const FileSelector = ({
  selectedFile,
  availableFiles,
  onFileSelect,
  onRefreshFiles,
  isAutoImportEnabled,
}) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [availableFilesData, setAvailableFilesData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [loadingFile, setLoadingFile] = useState(null);

  // Fetch available files from server
  const fetchAvailableFiles = async () => {
    try {
      const response = await fetch("http://localhost:3990/api/files/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableFilesData(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch available files:", error);
    }
  };

  // Switch to all files view (combined)
  const switchToAllFiles = async () => {
    try {
      const response = await fetch("http://localhost:3990/api/files/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "all" }),
      });

      if (response.ok && onFileSelect) {
        onFileSelect("all");
        setIsViewOpen(false); // Close view dropdown
      }
    } catch (error) {
      console.error("Failed to switch to all files:", error);
    }
  };

  // Switch to specific file view
  const switchToSpecificFile = async (filename) => {
    try {
      const response = await fetch("http://localhost:3990/api/files/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (response.ok && onFileSelect) {
        onFileSelect(filename);
        setIsViewOpen(false); // Close view dropdown
        if (onRefreshFiles) onRefreshFiles();
      }
    } catch (error) {
      console.error(`Failed to switch to ${filename}:`, error);
    }
  };

  // Import specific file
  const importFile = async (filename) => {
    setLoadingFile(filename);
    try {
      const response = await fetch("http://localhost:3990/api/files/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        await fetchAvailableFiles();

        // Automatically switch to combined view after import
        await switchToAllFiles();

        if (onRefreshFiles) onRefreshFiles();
        console.log(
          `✅ Successfully imported ${filename} and switched to combined view`
        );
      }
    } catch (error) {
      console.error(`Failed to import ${filename}:`, error);
    } finally {
      setLoadingFile(null);
    }
  };

  // Import all files
  const importAllFiles = async () => {
    setImporting(true);
    try {
      const response = await fetch("http://localhost:3990/api/files/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importAll: true }),
      });

      if (response.ok) {
        await fetchAvailableFiles();

        // Automatically switch to combined view after importing all files
        await switchToAllFiles();

        if (onRefreshFiles) onRefreshFiles();
        console.log(
          "✅ Successfully imported all files and switched to combined view"
        );
      }
    } catch (error) {
      console.error("Failed to import all files:", error);
    } finally {
      setImporting(false);
    }
  };

  // Refresh to latest only
  const refreshLatestOnly = async () => {
    setImporting(true);
    try {
      const response = await fetch(
        "http://localhost:3990/api/files/import-latest-only",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        await fetchAvailableFiles();

        // Switch to combined view (will show just the latest file if only one is imported)
        await switchToAllFiles();

        if (onRefreshFiles) onRefreshFiles();
        console.log(
          "⚡ Refreshed with latest file only and switched to combined view"
        );
      }
    } catch (error) {
      console.error("Failed to refresh latest:", error);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (isAutoImportEnabled) {
      fetchAvailableFiles();
    }
  }, [isAutoImportEnabled]);

  const getTotalRecords = () => {
    if (selectedFile === "all") {
      return availableFiles.reduce(
        (total, file) => total + file.recordCount,
        0
      );
    }
    const file = availableFiles.find((f) => f.filename === selectedFile);
    return file ? file.recordCount : 0;
  };

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

  if (!isAutoImportEnabled) {
    return null;
  }

  const importedCount = availableFilesData.filter((f) => f.imported).length;
  const notImportedCount = availableFilesData.filter((f) => !f.imported).length;

  return (
    <div className="space-y-4">
      {/* View Selector - For switching between imported files */}
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
              {availableFiles.length} imported
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
                    {getTotalRecords().toLocaleString()} records
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
              onClick={() => setIsViewOpen(!isViewOpen)}
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
                  onClick={() => switchToAllFiles()}
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
                        {availableFiles
                          .reduce((total, file) => total + file.recordCount, 0)
                          .toLocaleString()}{" "}
                        total records
                      </div>
                    </div>
                  </div>
                  {selectedFile === "all" && (
                    <Check size={16} className="text-blue-400" />
                  )}
                </button>

                {/* Individual Imported Files */}
                {availableFiles.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => switchToSpecificFile(file.filename)}
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
                          {file.recordCount.toLocaleString()} records
                        </div>
                      </div>
                    </div>
                    {selectedFile === file.filename && (
                      <Check size={16} className="text-blue-400" />
                    )}
                  </button>
                ))}

                {availableFiles.length === 0 && (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    No imported files available
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Manager - For importing available files */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Import size={20} className="text-orange-400" />
              <CardTitle className="text-lg text-gray-100">
                Import Manager
              </CardTitle>
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
              onClick={refreshLatestOnly}
              disabled={importing}
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
              onClick={importAllFiles}
              disabled={importing || notImportedCount === 0}
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
              onClick={() => setIsImportOpen(!isImportOpen)}
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
                {availableFilesData.map((file) => (
                  <div
                    key={file.filename}
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
                              ? `${
                                  file.recordCount?.toLocaleString() || 0
                                } records`
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
                            onClick={() => importFile(file.filename)}
                            disabled={loadingFile === file.filename}
                            size="sm"
                            variant="outline"
                            className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/30 text-xs"
                          >
                            {loadingFile === file.filename ? (
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

                {availableFilesData.length === 0 && (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    No files available
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
                {availableFilesData.length}
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
