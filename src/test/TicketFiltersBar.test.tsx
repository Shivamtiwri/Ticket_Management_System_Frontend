import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { TicketFiltersBar } from '../components/tickets/TicketFiltersBar';
import { TicketStatus } from '../types';

vi.mock('../services/category.service', () => ({
  categoryService: {
    getActiveCategories: vi.fn().mockResolvedValue([
      { _id: 'category-1', name: 'Accounts' },
    ]),
  },
}));

afterEach(() => {
  vi.useRealTimers();
});

describe('TicketFiltersBar', () => {
  it('updates status and priority filters and resets the page number', async () => {
    const onChange = vi.fn();
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TicketFiltersBar filters={{ page: 3, limit: 10 }} onChange={onChange} />
      </QueryClientProvider>
    );

    const selects = await screen.findAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: TicketStatus.IN_PROGRESS } });
    expect(onChange).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      status: TicketStatus.IN_PROGRESS,
    });
    fireEvent.change(selects[1], { target: { value: 'HIGH' } });
    expect(onChange).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      priority: 'HIGH',
    });
    client.clear();
  });

  it('debounces search and clears all selected filters', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TicketFiltersBar
          filters={{ page: 2, limit: 10, status: TicketStatus.OPEN, search: 'old' }}
          onChange={onChange}
        />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tickets' }), {
      target: { value: 'account access' },
    });
    await vi.advanceTimersByTimeAsync(400);
    expect(onChange).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: TicketStatus.OPEN,
      search: 'account access',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onChange).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
    client.clear();
    vi.useRealTimers();
  });
});
