import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

const SearchAndFilters = ({
  searchTerm,
  searchType,
  filters,
  filterOptions,
  onSearchChange,
  onFiltersChange,
  onClearFilters,
  resultsCount,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(localSearchTerm, searchType);
  };

  const handleFilterChange = (filterName, value) => {
    onFiltersChange({ [filterName]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.vmta !== "all") count++;
    if (filters.bounceCategory !== "all") count++;
    if (filters.dateRange) count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-8 bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-blue-400" />
            <CardTitle className="text-gray-100">Search & Filters</CardTitle>
          </div>
          {activeFiltersCount > 0 && (
            <Badge
              variant="outline"
              className="bg-blue-900/20 border-blue-700/50 text-blue-400"
            >
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Type
              </label>
              <select
                value={searchType}
                onChange={(e) =>
                  onSearchChange(localSearchTerm, e.target.value)
                }
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recipient">Recipient</option>
                <option value="sender">Sender</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="vmta">VMTA</option>
                <option value="all">All Fields</option>
              </select>
            </div>
            <div className="md:col-span-7">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Term
              </label>
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  type="text"
                  placeholder="Enter search term..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Search
              </Button>
            </div>
          </div>
        </form>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="relayed">Delivered (Relayed)</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
              <option value="delayed">Delayed</option>
              <option value="deferred">Deferred</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              VMTA
            </label>
            <select
              value={filters.vmta}
              onChange={(e) => handleFilterChange("vmta", e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All VMTAs</option>
              {filterOptions.vmtas.map((vmta) => (
                <option key={vmta} value={vmta}>
                  {vmta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bounce Category
            </label>
            <select
              value={filters.bounceCategory}
              onChange={(e) =>
                handleFilterChange("bounceCategory", e.target.value)
              }
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {filterOptions.bounceCategories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={activeFiltersCount === 0}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
            >
              <X size={18} className="mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        {resultsCount !== undefined && (
          <div className="flex items-center justify-between bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <span className="text-sm text-gray-300">
              Showing {resultsCount.toLocaleString()} records
            </span>
            {activeFiltersCount > 0 && (
              <span className="text-sm text-blue-400">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndFilters;
