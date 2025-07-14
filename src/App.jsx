import React from "react";
import Header from "./components/Header";
import OverviewStats from "./components/OverviewStats";
import Charts from "./components/Charts";
import VmtaPerformance from "./components/VmtaPerformance";
import SearchAndFilters from "./components/SearchAndFilters";
import DataTable from "./components/DataTable";
import ImportStatus from "./components/ImportStatus";
import FileSelector from "./components/FileSelector";
import LoginForm from "./components/LoginForm";
import { useEmailData } from "./hooks/useEmailData";
import { useConnection } from "./hooks/useConnection";

function App() {
  const { isConnected, isConnecting, connectionError, connect, disconnect } =
    useConnection();

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
    lastAutoUpdate,
    selectedFile,
    availableFiles,
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters,
    enableAutoImport,
    disableAutoImport,
    switchToFile,
    getAvailableFiles,
  } = useEmailData();

  const dataInfo =
    rawData.length > 0
      ? {
          totalRecords: rawData.length,
          filteredRecords: filteredData.length,
        }
      : null;

  // Handle connection callbacks
  const handleConnect = async (connectionData) => {
    const result = await connect(connectionData);
    if (result.success) {
      console.log("Successfully connected to PMTA server");
    }
    return result;
  };

  const handleDisconnect = async () => {
    const result = await disconnect();
    if (result.success) {
      console.log("Successfully disconnected from PMTA server");
    }
    return result;
  };

  // Show login form if not connected
  if (!isConnected) {
    return (
      <LoginForm
        onConnect={handleConnect}
        isConnecting={isConnecting}
        error={connectionError}
      />
    );
  }

  // Show main dashboard if connected
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
            lastAutoUpdate={lastAutoUpdate}
            onEnableAutoImport={enableAutoImport}
            onDisableAutoImport={disableAutoImport}
            onDisconnect={handleDisconnect}
            isConnected={isConnected}
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
            <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-700 rounded-lg p-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                📧 Email Campaign Analytics
              </h1>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Upload your PowerMTA CSV files to analyze email delivery
                performance, bounce rates, VMTA statistics, and diagnostic
                information.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Supports CSV files with PowerMTA log format including columns
                like type, timeLogged, timeQueued, orig, rcpt, dsnAction,
                dsnStatus, vmta, and more.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
