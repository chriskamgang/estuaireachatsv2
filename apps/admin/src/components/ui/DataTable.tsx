'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  name: string;
  key: string;
  render?: (item: T) => React.ReactNode;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T = any>({
  columns,
  data,
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  const start = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 1;
  const end = pagination ? Math.min(pagination.page * pagination.perPage, pagination.total) : data.length;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 font-semibold text-gray-2 text-xs uppercase tracking-wider"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-3">
                  Aucune donnee
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-5 hover:bg-gray-6/50 transition ${
                    idx % 2 === 1 ? 'bg-gray-6/30' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-gray-2">
          <span>
            Affichage {start}-{end} sur {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-6 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
