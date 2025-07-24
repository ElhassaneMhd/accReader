import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";

const DataTable = ({ columns, data, title = "Records", loading, footer }) => {
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
              {data.map((row, rowIndex) => (
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
                        ? col.cell({ row: { original: row } })
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
        {/* Render custom footer if provided */}
        {footer && footer}
      </CardContent>
    </Card>
  );
};

export default DataTable;
