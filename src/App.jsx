import React from "react";
import Header from "./components/Header";
import OverviewStats from "./components/OverviewStats";
import Charts from "./components/Charts";
import VmtaPerformance from "./components/VmtaPerformance";
import SearchAndFilters from "./components/SearchAndFilters";
import DataTable from "./components/DataTable";
import { useEmailData } from "./hooks/useEmailData";

function App() {
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
    loadCSVFile,
    updateSearch,
    updateFilters,
    clearFilters,
  } = useEmailData();

  const dataInfo =
    rawData.length > 0
      ? {
          totalRecords: rawData.length,
          filteredRecords: filteredData.length,
        }
      : null;

  return (
    <div className="min-h-screen bg-gray-950 w-[100%] m-0 p-0">
      <Header
        onFileUpload={loadCSVFile}
        loading={loading}
        error={error}
        dataInfo={dataInfo}
      />

      <div className="py-6 px-4 md:px-6 w-full">
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
