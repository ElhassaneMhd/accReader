import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import OverviewStats from "@/components/OverviewStats";
import Charts from "@/components/Analytics/Charts";
import VmtaPerformance from "@/components/Analytics/VmtaPerformance";
import SearchAndFilters from "@/components/Analytics/SearchAndFilters";
import DataTable from "@/components/DataTable";
import ImportStatus from "@/components/Analytics/ImportStatus";
import FileSelector from "@/components/Analytics/FileSelector";
import { useEmailDataContext } from "@/hooks/useEmailDataContext";
import { useConnectionContext } from "@/hooks/useConnectionContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { disconnect } = useConnectionContext();

  const {
    rawData,
    filteredData,
    analysis,
    loading,
    error,
    searchTerm,
    searchType,
    filters,
    filterOptions,
    autoImportEnabled,
    autoRefreshEnabled,
    lastAutoUpdate,
    selectedFile,
    availableFiles,
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters,
    enableAutoImport,
    disableAutoImport,
    toggleAutoRefresh,
    forceRefresh,
    switchToFile: contextSwitchToFile,
    getAvailableFiles,
  } = useEmailDataContext();

  const dataInfo =
    rawData.length > 0
      ? {
          totalRecords: rawData.length,
          filteredRecords: filteredData.length,
        }
      : null;

  const handleDisconnect = async () => {
    const result = await disconnect();
    if (result.success) {
      navigate("/login");
    }
    return result;
  };

  // // Auto-refresh when data changes to ensure UI updates
  // useEffect(() => {
  //   // Force a re-render when rawData changes
  //   if (rawData.length > 0) {
  //     console.log(`Dashboard updated: ${rawData.length} records loaded`);
  //   }
  // }, [rawData, lastAutoUpdate]);

  // Define columns for the DataTable (PMTA/email log fields)
  // Helper to derive user-friendly status
  function getFinalStatus(row) {
    const action = row.original?.dsnAction || row.dsnAction || "";
    const status = row.original?.dsnStatus || row.dsnStatus || "";
    const diag = row.original?.dsnDiag || row.dsnDiag || "";
    if (
      /relayed/i.test(action) &&
      /2\.0\.0|2\.6\.0|2\.1\.5|success/i.test(status)
    )
      return "Delivered";
    if (/failed|failure|bounced|rejected|denied|deferred|error/i.test(action))
      return "Failed";
    if (/queued/i.test(diag)) return "Queued";
    if (/delayed/i.test(action)) return "Delayed";
    if (/expanded/i.test(action)) return "Expanded";
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  const columns = [
    {
      header: "Time",
      accessorKey: "timeLogged",
      cell: ({ row }) => {
        const raw = row.original?.timeLogged || row.timeLogged;
        let formatted = raw;
        if (raw) {
          const date = new Date(raw);
          if (!isNaN(date.getTime())) {
            formatted = date.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          }
        }
        return <span className="whitespace-nowrap block">{formatted}</span>;
      },
    },
    {
      header: "Status",
      accessorKey: "finalStatus",
      cell: ({ row }) => {
        const finalStatus = getFinalStatus(row);
        let color = "text-gray-300";
        if (finalStatus === "Delivered") color = "text-green-400 font-semibold";
        else if (finalStatus === "Failed") color = "text-red-400 font-semibold";
        else if (finalStatus === "Queued")
          color = "text-yellow-400 font-semibold";
        else if (finalStatus === "Delayed")
          color = "text-orange-400 font-semibold";
        else if (finalStatus === "Expanded")
          color = "text-purple-400 font-semibold";
        return <span className={color}>{finalStatus}</span>;
      },
    },
    { header: "Recipient", accessorKey: "rcpt" },
    { header: "Sender", accessorKey: "orig" },
    {
      header: "VMTA",
      accessorKey: "vmta",
      cell: ({ row }) => {
        // Show the IP address instead of pmta-vmta0
        // Try dlvSourceIp, fallback to vmta if not present
        const ip =
          row.original?.dlvSourceIp ||
          row.dlvSourceIp ||
          row.original?.vmta ||
          row.vmta ||
          "-";
        return <span className="font-mono text-blue-300">{ip}</span>;
      },
    },
    { header: "DSN Code", accessorKey: "dsnStatus" },
    {
      header: "Diagnostic",
      accessorKey: "dsnDiag",
      cell: ({ row }) => {
        const diag = row.original?.dsnDiag || row.dsnDiag || "";
        // Extract SMTP code
        const codeMatch = diag.match(/(\d{3,5})/);
        const code = codeMatch ? codeMatch[1] : null;

        // Extract human-friendly reason
        let reason = "";
        if (/Invalid Recipient/i.test(diag)) reason = "Invalid Recipient";
        else if (/mail accepted for delivery/i.test(diag))
          reason = "Accepted for Delivery";
        else if (/no mail hosts for domain/i.test(diag))
          reason = "No Mail Hosts for Domain";
        else if (/OK/i.test(diag)) reason = "OK";
        else if (/queued mail for delivery/i.test(diag))
          reason = "Queued for Delivery";
        else if (/success/i.test(diag)) reason = "Success";
        else if (/fail|error|rejected|denied|deferred/i.test(diag))
          reason = "Delivery Failed";
        else if (diag.length > 60) reason = diag.slice(0, 60) + "...";
        else reason = diag;

        return (
          <span>
            {code && (
              <span className="font-semibold text-blue-300">{code}</span>
            )}
            <span className="ml-2">{reason}</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 w-[100%] m-0 p-0">
      {/* Admin Overview Section */}
      <Header
        onFileUpload={loadCSVFile}
        loading={loading}
        error={error}
        dataInfo={dataInfo}
      />
      <div className="py-6 px-4 md:px-6 w-full">
        {/* Import Status - Always visible */}
        <div className="mb-6">
          <ImportStatus
            autoImportEnabled={autoImportEnabled}
            autoRefreshEnabled={autoRefreshEnabled}
            lastAutoUpdate={lastAutoUpdate}
            onEnableAutoImport={enableAutoImport}
            onDisableAutoImport={disableAutoImport}
            onToggleAutoRefresh={toggleAutoRefresh}
            onForceRefresh={forceRefresh}
            onDisconnect={handleDisconnect}
            isConnected={true}
          />
        </div>
        {/* File Selector - Only visible for auto-import mode */}
        {autoImportEnabled && (
          <div className="mb-6">
            <FileSelector
              selectedFile={selectedFile}
              availableFiles={availableFiles}
              onFileSelect={contextSwitchToFile}
              onRefreshFiles={getAvailableFiles}
              isAutoImportEnabled={autoImportEnabled}
              switchToFile={contextSwitchToFile}
            />
          </div>
        )}
        {rawData.length > 0 ? (
          <>
            {/* Overview Statistics */}
            <OverviewStats overview={analysis.overview} />
            {/* Charts */}
            <Charts analysis={analysis} />
            {/* VMTA Performance */}
            <VmtaPerformance data={rawData} />
            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={searchTerm}
              searchType={searchType}
              filters={filters}
              filterOptions={filterOptions}
              onSearchChange={updateSearch}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              resultsCount={filteredData.length}
              filteredData={filteredData}
              analysis={analysis}
            />
            {/* Data Table */}
            <div className="w-full overflow-x-auto">
              <DataTable columns={columns} data={filteredData} />
            </div>
          </>
        ) : (
          <div className="text-center w-full py-16">
            <div className="max-w-xl mx-auto bg-gray-900 border border-gray-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                No Data Available
              </h2>
              <p className="text-gray-300 mb-4">
                {autoImportEnabled
                  ? "Waiting for PMTA data to be imported automatically..."
                  : "Upload a CSV file to start analyzing your email campaign data."}
              </p>
              {!autoImportEnabled && (
                <p className="text-sm text-gray-400">
                  You can also enable auto-import to automatically fetch data
                  from your PMTA server.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
