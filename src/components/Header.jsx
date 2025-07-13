import React, { useRef } from "react";
import {
  Upload,
  FileText,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Header = ({ onFileUpload, loading, error, dataInfo }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      onFileUpload(file);
    } else {
      alert("Please select a valid CSV file");
    }
    // Reset input to allow selecting the same file again
    event.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 shadow-sm">
      <div className="px-4 py-3 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-3 flex-wrap">
            <BarChart3 size={28} className="text-gray-100" />
            <h1 className="text-xl md:text-2xl font-semibold text-gray-100">
              Email Campaign Analytics
            </h1>

            {dataInfo && (
              <Badge
                variant="outline"
                className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                <FileText size={14} className="mr-1" />
                {dataInfo.totalRecords.toLocaleString()} records
              </Badge>
            )}
          </div>

          {/* Right side - Error, loading, and upload */}
          <div className="flex items-center gap-3 flex-wrap">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-700/50 rounded-md">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 text-gray-300">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <Button
                onClick={handleUploadClick}
                className="bg-green-600 hover:bg-green-700 border border-green-500 text-white"
              >
                <Upload size={16} className="mr-2" />
                Upload CSV
              </Button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
