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
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

const DataTable = ({ columns, data, title = "Records", loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Loading...
          </h3>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8 text-center">
          <FileText size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            No data to display
          </h3>
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
                {columns.map((col) => (
                  <TableHead
                    key={col.accessorKey || col.id}
                    className="text-gray-300 font-semibold"
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={row.id || row.campaign_uid || rowIndex}
                  className="border-gray-700 hover:bg-gray-800/50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.accessorKey || col.id}
                      className="text-gray-300 text-sm"
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? row[col.accessorKey]
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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
                  setPage(0);
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
