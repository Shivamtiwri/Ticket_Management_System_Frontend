import React from 'react';
import type { Pagination as PaginationData } from '../../types';

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasPrevPage, hasNextPage, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span>{' '}
        of <span className="font-medium">{total}</span> results
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="btn-secondary text-sm px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="btn-secondary text-sm px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};
