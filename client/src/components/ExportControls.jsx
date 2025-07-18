import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  BarChart3,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  exportSummary,
  generateExportFilename,
} from "../utils/exportUtils";

const ExportControls = ({
  data,
  analysis,
  filters,
  searchTerm,
  resultsCount,
}) => {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleExport = async (exportType) => {
    if (!data || data.length === 0) {
      setLastExport({ success: false, error: "No data to export" });
      return;
    }

    setIsDropdownOpen(false); // Close dropdown after selection
    setExporting(true);
    const filename = generateExportFilename(filters, searchTerm);

    try {
      let result;

      switch (exportType) {
        case "csv":
          result = exportToCSV(data, filename);
          break;
        case "json":
          result = exportToJSON(data, filename);
          break;
        case "excel":
          result = exportToExcel(data, filename);
          break;
        case "summary":
          result = exportSummary(data, analysis, `${filename}_summary`);
          break;
        default:
          throw new Error("Unknown export type");
      }

      setLastExport(result);

      // Clear success message after 3 seconds
      if (result.success) {
        setTimeout(() => setLastExport(null), 3000);
      }
    } catch (error) {
      setLastExport({ success: false, error: error.message });
    } finally {
      setExporting(false);
    }
  };

  const getExportLabel = () => {
    const count = resultsCount || 0;
    if (count === 0) return "No data";
    if (count === 1) return "Export 1 record";
    return `Export ${count.toLocaleString()} records`;
  };

  const isDisabled = !data || data.length === 0 || exporting;

  return (
    <div className="flex items-center gap-3">
      {/* Export Status */}
      {lastExport && (
        <div className="flex items-center gap-2">
          {lastExport.success ? (
            <>
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-green-400">
                Exported {lastExport.count || "summary"} records
              </span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-red-400" />
              <span className="text-sm text-red-400">
                Export failed: {lastExport.error}
              </span>
            </>
          )}
        </div>
      )}

      {/* Custom Export Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          disabled={isDisabled}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Download size={16} className="mr-2" />
          {exporting ? "Exporting..." : getExportLabel()}
          <ChevronDown size={16} className="ml-2" />
        </Button>

        {/* Dropdown Content */}
        {isDropdownOpen && (
          <Card className="absolute top-full left-0 mt-1 z-50 min-w-[300px] bg-gray-800 border-gray-600">
            <CardContent className="p-2">
              {/* CSV Export */}
              <button
                onClick={() => handleExport("csv")}
                className="w-full flex items-center gap-3 p-3 text-left text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
              >
                <FileText size={16} className="text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Export as CSV</span>
                  <span className="text-xs text-gray-400">
                    Comma-separated values for spreadsheets
                  </span>
                </div>
              </button>

              {/* Excel Export */}
              <button
                onClick={() => handleExport("excel")}
                className="w-full flex items-center gap-3 p-3 text-left text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Export for Excel</span>
                  <span className="text-xs text-gray-400">
                    Excel-compatible format with UTF-8 encoding
                  </span>
                </div>
              </button>

              {/* JSON Export */}
              <button
                onClick={() => handleExport("json")}
                className="w-full flex items-center gap-3 p-3 text-left text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
              >
                <FileJson size={16} className="text-purple-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Export as JSON</span>
                  <span className="text-xs text-gray-400">
                    Structured data for developers
                  </span>
                </div>
              </button>

              {/* Separator */}
              <div className="my-2 border-t border-gray-600"></div>

              {/* Summary Export */}
              <button
                onClick={() => handleExport("summary")}
                className="w-full flex items-center gap-3 p-3 text-left text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
              >
                <BarChart3 size={16} className="text-orange-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Export Summary</span>
                  <span className="text-xs text-gray-400">
                    Statistics and analysis results
                  </span>
                </div>
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Badge */}
      <Badge
        variant="outline"
        className="bg-gray-800 text-gray-300 border-gray-600"
      >
        {(resultsCount || 0).toLocaleString()} result
        {(resultsCount || 0) !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
};

export default ExportControls;
