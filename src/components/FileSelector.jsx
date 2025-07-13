import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Files, FileText, BarChart3, ChevronDown, Check } from "lucide-react";

const FileSelector = ({
  selectedFile,
  availableFiles,
  onFileSelect,
  onRefreshFiles,
  isAutoImportEnabled,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Refresh files list when component mounts
  useEffect(() => {
    if (isAutoImportEnabled && onRefreshFiles) {
      onRefreshFiles();
    }
  }, [isAutoImportEnabled, onRefreshFiles]);

  const handleFileSelect = (filename) => {
    onFileSelect(filename);
    setIsOpen(false);
  };

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
    return null; // Don't show file selector for manual uploads
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files size={20} className="text-blue-400" />
            <CardTitle className="text-lg text-gray-100">
              File Selector
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-gray-800 text-gray-300 border-gray-600"
          >
            {availableFiles.length} files
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
              Current
            </Badge>
          </div>
        </div>

        {/* File Dropdown */}
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="outline"
            className="w-full justify-between bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <span>Switch to different file</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {/* Combined View Option */}
              <button
                onClick={() => handleFileSelect("all")}
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
                      {getTotalRecords().toLocaleString()} total records
                    </div>
                  </div>
                </div>
                {selectedFile === "all" && (
                  <Check size={16} className="text-blue-400" />
                )}
              </button>

              {/* Individual Files */}
              {availableFiles.map((file) => (
                <button
                  key={file.filename}
                  onClick={() => handleFileSelect(file.filename)}
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
                  No files available
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Statistics */}
        {availableFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Total Files</div>
              <div className="text-lg font-semibold text-gray-200">
                {availableFiles.length}
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Total Records</div>
              <div className="text-lg font-semibold text-gray-200">
                {availableFiles
                  .reduce((total, file) => total + file.recordCount, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileSelector;
