// src/features/dashboard/components/widgets/TableWidget.tsx
import React from 'react';
import { Card } from '../../../../shared/components/ui/cards/Card';
import { cn } from '../../../../shared/utils';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableWidgetProps {
  title: string;
  columns: TableColumn[];
  data: any[];
  className?: string;
  emptyMessage?: string;
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  title,
  columns,
  data,
  className,
  emptyMessage = "No hay datos disponibles"
}) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};