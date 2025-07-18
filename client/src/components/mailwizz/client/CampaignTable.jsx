import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreHorizontal,
  Calendar,
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const CampaignTable = ({ campaigns, onCampaignSelect, selectable = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Filter and sort campaigns
  const processedCampaigns = useMemo(() => {
    let filtered = campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.subject &&
          campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !statusFilter || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested stats properties
      if (sortConfig.key.startsWith("stats.")) {
        const statKey = sortConfig.key.split(".")[1];
        aValue = a.stats?.[statKey] || 0;
        bValue = b.stats?.[statKey] || 0;
      }

      // Handle date sorting
      if (sortConfig.key === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [campaigns, searchTerm, statusFilter, sortConfig]);

  // Get unique statuses for filter
  const availableStatuses = [...new Set(campaigns.map((c) => c.status))].filter(
    Boolean
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sent":
        return "bg-green-100 text-green-800 border-green-200";
      case "sending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const calculateRate = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const getPerformanceIcon = (rate, benchmark = 20) => {
    if (rate > benchmark)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate < benchmark / 2)
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const handleRowSelect = (campaignUid) => {
    if (!selectable) return;

    const newSelected = new Set(selectedRows);
    if (newSelected.has(campaignUid)) {
      newSelected.delete(campaignUid);
    } else {
      newSelected.add(campaignUid);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === processedCampaigns.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedCampaigns.map((c) => c.uid)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">
              <Filter className="h-4 w-4 mr-2" />
              Status {statusFilter && `(${statusFilter})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("")}>
              All Statuses
            </DropdownMenuItem>
            {availableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {processedCampaigns.length} of {campaigns.length} campaigns
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === processedCampaigns.length &&
                      processedCampaigns.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
              )}

              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Campaign</span>
                  {getSortIcon("name")}
                </div>
              </TableHead>

              <TableHead>Status</TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("stats.sent")}
              >
                <div className="flex items-center space-x-1">
                  <span>Sent</span>
                  {getSortIcon("stats.sent")}
                </div>
              </TableHead>

              <TableHead>Delivery Rate</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead>Click Rate</TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {getSortIcon("created_at")}
                </div>
              </TableHead>

              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {processedCampaigns.map((campaign) => {
              const stats = campaign.stats || {};
              const deliveryRate = calculateRate(stats.delivered, stats.sent);
              const openRate = calculateRate(stats.opened, stats.delivered);
              const clickRate = calculateRate(stats.clicked, stats.opened);

              return (
                <TableRow
                  key={campaign.uid}
                  className={`hover:bg-gray-50 ${
                    selectable && selectedRows.has(campaign.uid)
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(campaign.uid)}
                        onChange={() => handleRowSelect(campaign.uid)}
                        className="rounded"
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm truncate">
                        {campaign.name}
                      </div>
                      {campaign.subject && (
                        <div className="text-xs text-gray-500 truncate">
                          {campaign.subject}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{formatNumber(stats.sent)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{deliveryRate}%</span>
                      {getPerformanceIcon(deliveryRate, 95)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{openRate}%</span>
                      {getPerformanceIcon(openRate, 20)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{clickRate}%</span>
                      {getPerformanceIcon(clickRate, 3)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onCampaignSelect && onCampaignSelect(campaign)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {processedCampaigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No campaigns found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignTable;
