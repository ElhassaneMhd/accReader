import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, FileText, Copy } from "lucide-react";
import { formatDate } from "../utils/csvParser";

const DataTable = ({ data, title = "Email Records" }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "relayed":
        return "bg-green-900/20 text-green-400 border-green-700/50";
      case "failed":
      case "bounced":
        return "bg-red-900/20 text-red-400 border-red-700/50";
      case "delayed":
      case "deferred":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-700/50";
      default:
        return "bg-gray-800 text-gray-300 border-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "relayed":
        return "Delivered";
      case "failed":
        return "Failed";
      case "bounced":
        return "Bounced";
      case "delayed":
        return "Delayed";
      case "deferred":
        return "Deferred";
      default:
        return status || "Unknown";
    }
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8 text-center">
          <FileText size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            No data to display
          </h3>
          <p className="text-sm text-gray-400">
            Upload a CSV file to see email records
          </p>
        </CardContent>
      </Card>
    );
  }

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">{title}</CardTitle>
        <p className="text-sm text-gray-400">
          {data.length.toLocaleString()} total records
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800/50">
                <TableHead className="text-gray-300 font-semibold">
                  Time
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  Recipient
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  Sender
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  VMTA
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  DSN Code
                </TableHead>
                <TableHead className="text-gray-300 font-semibold">
                  Diagnostic
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => {
                const globalIndex = page * rowsPerPage + index;
                const isExpanded = expandedRows.has(globalIndex);

                return (
                  <React.Fragment key={globalIndex}>
                    <TableRow
                      className="border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => toggleRowExpansion(globalIndex)}
                    >
                      <TableCell className="text-gray-300 text-sm">
                        {formatDate(row.timeLoggedParsed || row.timeLogged)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(row.dsnAction)} text-xs`}
                        >
                          {getStatusLabel(row.dsnAction)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-gray-300 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{truncateText(row.rcpt)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(row.rcpt);
                            }}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-300 text-sm">
                        {truncateText(row.orig)}
                      </TableCell>

                      <TableCell className="text-gray-300 text-sm">
                        {row.vmta || "N/A"}
                      </TableCell>

                      <TableCell className="text-gray-300 text-sm">
                        {row.dsnStatus || "N/A"}
                      </TableCell>

                      <TableCell className="text-gray-300 text-sm">
                        {truncateText(row.dsnDiag)}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={7} className="bg-gray-800/30 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-semibold text-gray-200 mb-2">
                                Email Details
                              </h4>
                              <div className="space-y-1 text-gray-300">
                                <p>
                                  <span className="text-gray-400">
                                    Full Recipient:
                                  </span>{" "}
                                  {row.rcpt}
                                </p>
                                <p>
                                  <span className="text-gray-400">Sender:</span>{" "}
                                  {row.orig}
                                </p>
                                <p>
                                  <span className="text-gray-400">
                                    Time Queued:
                                  </span>{" "}
                                  {formatDate(
                                    row.timeQueuedParsed || row.timeQueued
                                  )}
                                </p>
                                <p>
                                  <span className="text-gray-400">
                                    Subject:
                                  </span>{" "}
                                  {row.subject || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-200 mb-2">
                                Technical Details
                              </h4>
                              <div className="space-y-1 text-gray-300">
                                <p>
                                  <span className="text-gray-400">VMTA:</span>{" "}
                                  {row.vmta || "N/A"}
                                </p>
                                <p>
                                  <span className="text-gray-400">
                                    DSN Status:
                                  </span>{" "}
                                  {row.dsnStatus || "N/A"}
                                </p>
                                <p>
                                  <span className="text-gray-400">
                                    Message ID:
                                  </span>{" "}
                                  {truncateText(row.mxid, 50) || "N/A"}
                                </p>
                                <p>
                                  <span className="text-gray-400">Job ID:</span>{" "}
                                  {row.jobId || "N/A"}
                                </p>
                              </div>
                            </div>
                            {row.dsnDiag && (
                              <div className="md:col-span-2">
                                <h4 className="font-semibold text-gray-200 mb-2">
                                  Diagnostic Message
                                </h4>
                                <p className="text-gray-300 bg-gray-800 p-3 rounded border border-gray-600">
                                  {row.dsnDiag}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Showing {page * rowsPerPage + 1} to{" "}
              {Math.min((page + 1) * rowsPerPage, data.length)} of {data.length}{" "}
              records
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0); // Reset to first page when changing rows per page
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="border-gray-600 text-gray-100 bg-gray-800 hover:bg-gray-700 hover:text-gray-300"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Page {page + 1} of {Math.ceil(data.length / rowsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage(
                  Math.min(Math.ceil(data.length / rowsPerPage) - 1, page + 1)
                )
              }
              disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
              className="border-gray-600 text-gray-100 bg-gray-800 hover:bg-gray-700 hover:text-gray-300"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;
