import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../../services/category.service';
import { TicketStatus, TicketPriority, type TicketFilters } from '../../types';
import { formatStatus } from '../../lib/utils';

interface Props {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
}

export const TicketFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: categoryService.getActiveCategories,
  });

  const update = (key: keyof TicketFilters, value: string) =>
    onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Search tickets..."
        value={filters.search ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="input max-w-xs"
      />
      <select value={filters.status ?? ''} onChange={(e) => update('status', e.target.value)} className="input w-auto">
        <option value="">All Statuses</option>
        {Object.values(TicketStatus).map((s) => (
          <option key={s} value={s}>{formatStatus(s)}</option>
        ))}
      </select>
      <select value={filters.priority ?? ''} onChange={(e) => update('priority', e.target.value)} className="input w-auto">
        <option value="">All Priorities</option>
        {Object.values(TicketPriority).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select value={filters.category ?? ''} onChange={(e) => update('category', e.target.value)} className="input w-auto">
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      <select value={filters.sortBy ?? ''} onChange={(e) => update('sortBy', e.target.value)} className="input w-auto">
        <option value="">Sort: Newest</option>
        <option value="oldest">Oldest</option>
        <option value="updated">Recently Updated</option>
        <option value="priority">Priority</option>
      </select>
    </div>
  );
};

