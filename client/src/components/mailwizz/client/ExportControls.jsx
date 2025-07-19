import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { mailwizzApi } from "@/services/mailwizz/mailwizzApi";
import { toast } from "@/components/ui/use-toast";

const ExportControls = ({
  campaigns,
  selectedCampaigns = null,
  className = "",
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  // Determine which campaigns to export
  const campaignsToExport = selectedCampaigns || campaigns;
  const exportCount = campaignsToExport?.length || 0;

  const handleExport = async (format) => {
    if (!campaignsToExport || campaignsToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No campaigns available to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    try {
      const campaignUids = campaignsToExport.map(
        (c) => c.uid || c.campaign_uid
      );

      // Call the export API
      const response = await mailwizzApi.exportCampaignData(
        campaignUids,
        format
      );

      // Create download link
      const blob = new Blob([response.data], {
        type: getContentType(format),
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFileName(format, campaignsToExport.length);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Successfully exported ${
          campaignsToExport.length
        } campaigns as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description:
          error.response?.data?.message || "Failed to export campaign data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const getContentType = (format) => {
    switch (format) {
      case "csv":
        return "text/csv";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "json":
        return "application/json";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  };

  const generateFileName = (format, count) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const campaignText = count === 1 ? "campaign" : "campaigns";
    return `mailwizz-${count}-${campaignText}-${timestamp}.${format}`;
  };

  const exportOptions = [
    {
      format: "csv",
      label: "CSV Export",
      description: "Spreadsheet compatible format",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      disabled: false,
    },
    {
      format: "xlsx",
      label: "Excel Export",
      description: "Microsoft Excel format",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      disabled: false,
    },
    {
      format: "json",
      label: "JSON Export",
      description: "Machine-readable format",
      icon: <FileJson className="h-4 w-4" />,
      disabled: false,
    },
    {
      format: "pdf",
      label: "PDF Report",
      description: "Summary report with charts",
      icon: <FileText className="h-4 w-4" />,
      disabled: true, // Will implement in future
    },
  ];

  if (exportCount === 0) {
    return (
      <Button disabled className={className}>
        <Download className="h-4 w-4 mr-2" />
        Export (0)
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting {exportFormat?.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export ({exportCount})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm text-gray-400">
          Export {exportCount} campaign{exportCount !== 1 ? "s" : ""}
        </div>
        <DropdownMenuSeparator />

        {exportOptions.map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => !option.disabled && handleExport(option.format)}
            disabled={option.disabled || isExporting}
            className="flex items-start space-x-3 py-3"
          >
            <div className="flex-shrink-0 mt-0.5">{option.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {option.label}
                {option.disabled && (
                  <span className="ml-2 text-xs text-gray-400">
                    (Coming Soon)
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </div>
            </div>
            {exportFormat === option.format && isExporting && (
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 mt-1" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <div className="px-3 py-2 text-xs text-gray-500">
          Data includes campaign stats, performance metrics, and timestamps
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Quick export buttons for specific formats
export const QuickExportButton = ({
  campaigns,
  format = "csv",
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async () => {
    if (!campaigns || campaigns.length === 0) return;

    setIsExporting(true);
    try {
      const campaignUids = campaigns.map((c) => c.uid || c.campaign_uid);
      const response = await mailwizzApi.exportCampaignData(
        campaignUids,
        format
      );

      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaigns-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${
          campaigns.length
        } campaigns as ${format.toUpperCase()}`,
      });
    } catch (err) {
      console.error("Quick export failed:", err);
      toast({
        title: "Export Failed",
        description: "Failed to export campaign data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleQuickExport}
      disabled={isExporting || !campaigns || campaigns.length === 0}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {format.toUpperCase()}
    </Button>
  );
};

export default ExportControls;
