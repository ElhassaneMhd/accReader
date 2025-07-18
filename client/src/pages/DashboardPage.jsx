import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import OverviewStats from "../components/OverviewStats";
import Charts from "../components/Charts";
import VmtaPerformance from "../components/VmtaPerformance";
import SearchAndFilters from "../components/SearchAndFilters";
import DataTable from "../components/DataTable";
import ImportStatus from "../components/ImportStatus";
import FileSelector from "../components/FileSelector";
import { useEmailDataContext } from "../hooks/useEmailDataContext";
import { useConnectionContext } from "../hooks/useConnectionContext";

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
    switchToFile,
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

  // Auto-refresh when data changes to ensure UI updates
  useEffect(() => {
    // Force a re-render when rawData changes
    if (rawData.length > 0) {
      console.log(`Dashboard updated: ${rawData.length} records loaded`);
    }
  }, [rawData, lastAutoUpdate]);

  return (
    <div className="min-h-screen bg-gray-950 w-[100%] m-0 p-0">
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
              onFileSelect={switchToFile}
              onRefreshFiles={getAvailableFiles}
              isAutoImportEnabled={autoImportEnabled}
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
            <DataTable data={filteredData} />
          </>
        ) : (
          <div className="text-center w-full py-16">
            <div className="max-w-xl mx-auto bg-gray-900 border border-gray-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                � No Data Available
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
