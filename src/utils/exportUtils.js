import { formatDate } from "./csvParser";

/**
 * Export utilities for email data
 */

// Format data for export
const formatDataForExport = (data) => {
  return data.map((row) => ({
    timestamp: formatDate(row.timeLogged) || row.timeLogged,
    type: row.type || "",
    original_recipient: row.orig || "",
    recipient: row.rcpt || "",
    status: row.dsnAction || "",
    dsn_status: row.dsnStatus || "",
    vmta: row.vmta || "",
    source_ip: row.dlvSourceIp || row.origIp || "",
    bounce_category: row.bounceCat || "",
    bounce_message: row.dsnDiag || "",
    queue_time: formatDate(row.timeQueued) || row.timeQueued,
    job_id: row.jobId || "",
    message_id: row.messageId || "",
    subject: row.subject || "",
    recipient_domain: row.rcpt ? row.rcpt.split("@")[1] : "",
    delivery_attempts: row.dlvAttempts || "",
    response_code: row.dsnStatus ? row.dsnStatus.split(".")[0] : "",
  }));
};

// Export to CSV
export const exportToCSV = (data, filename = "email_export") => {
  try {
    const formattedData = formatDataForExport(data);

    if (formattedData.length === 0) {
      throw new Error("No data to export");
    }

    // Get headers from the first row
    const headers = Object.keys(formattedData[0]);

    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(","),
      // Data rows
      ...formattedData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: formattedData.length };
  } catch (error) {
    console.error("Export to CSV failed:", error);
    return { success: false, error: error.message };
  }
};

// Export to JSON
export const exportToJSON = (data, filename = "email_export") => {
  try {
    const formattedData = formatDataForExport(data);

    if (formattedData.length === 0) {
      throw new Error("No data to export");
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      total_records: formattedData.length,
      data: formattedData,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: formattedData.length };
  } catch (error) {
    console.error("Export to JSON failed:", error);
    return { success: false, error: error.message };
  }
};

// Export to Excel-compatible CSV (with UTF-8 BOM)
export const exportToExcel = (data, filename = "email_export") => {
  try {
    const formattedData = formatDataForExport(data);

    if (formattedData.length === 0) {
      throw new Error("No data to export");
    }

    // Get headers from the first row
    const headers = Object.keys(formattedData[0]);

    // Create CSV content with proper Excel formatting
    const csvContent = [
      // Header row
      headers.join("\t"), // Use tabs for better Excel compatibility
      // Data rows
      ...formattedData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            // Format for Excel (escape tabs and newlines)
            return String(value).replace(/\t/g, " ").replace(/\n/g, " ");
          })
          .join("\t")
      ),
    ].join("\n");

    // Add UTF-8 BOM for proper Excel encoding
    const BOM = "\uFEFF";
    const blobContent = BOM + csvContent;

    // Create and download file
    const blob = new Blob([blobContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: formattedData.length };
  } catch (error) {
    console.error("Export to Excel failed:", error);
    return { success: false, error: error.message };
  }
};

// Export filtered summary
export const exportSummary = (data, analysis, filename = "email_summary") => {
  try {
    if (!analysis || !analysis.overview) {
      throw new Error("No analysis data available");
    }

    const summary = {
      export_info: {
        exported_at: new Date().toISOString(),
        total_filtered_records: data.length,
        export_type: "summary",
      },
      overview: analysis.overview,
      vmta_performance: analysis.vmtaStats || {},
      status_distribution: analysis.statusDistribution || {},
      bounce_analysis: analysis.bounceAnalysis || {},
      time_distribution: analysis.timeDistribution || {},
    };

    const jsonContent = JSON.stringify(summary, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, type: "summary" };
  } catch (error) {
    console.error("Export summary failed:", error);
    return { success: false, error: error.message };
  }
};

// Get export filename based on filters
export const generateExportFilename = (filters, searchTerm) => {
  let filename = "email_data";

  const parts = [];

  if (searchTerm) {
    parts.push(`search_${searchTerm.replace(/[^a-zA-Z0-9]/g, "_")}`);
  }

  if (filters.status !== "all") {
    parts.push(`status_${filters.status}`);
  }

  if (filters.vmta !== "all") {
    parts.push(`vmta_${filters.vmta.replace(/[^a-zA-Z0-9]/g, "_")}`);
  }

  if (filters.bounceCategory !== "all") {
    parts.push(
      `bounce_${filters.bounceCategory.replace(/[^a-zA-Z0-9]/g, "_")}`
    );
  }

  if (parts.length > 0) {
    filename += "_" + parts.join("_");
  }

  return filename.toLowerCase();
};
