import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({
  getTickets: vi.fn(),
  getActiveCategories: vi.fn(),
  user: { role: 'CUSTOMER' as UserRole },
}));

vi.mock('../services/ticket.service', () => ({
  ticketService: { getTickets: mocks.getTickets },
}));
vi.mock('../services/category.service', () => ({
  categoryService: { getActiveCategories: mocks.getActiveCategories },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

import { TicketListPage } from '../pages/tickets/TicketListPage';

describe('TicketListPage', () => {
  beforeEach(() => {
    mocks.getTickets.mockReset();
    mocks.getActiveCategories.mockReset().mockResolvedValue([]);
    mocks.user = { role: UserRole.CUSTOMER };
  });

  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tickets']}>
          <Routes>
            <Route path="/tickets" element={<TicketListPage />} />
            <Route path="/tickets/:id" element={<h1>Ticket details</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    return { ...view, client };
  };

  it('renders the empty state and create-ticket action', async () => {
    mocks.getTickets.mockResolvedValueOnce({ data: [], pagination: null });
    renderPage();
    expect(await screen.findByText('No tickets found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Ticket' })).toHaveAttribute('href', '/tickets/new');
  });

  it('navigates to details and applies status filters to the request', async () => {
    const ticket = {
      _id: 'ticket-1',
      ticketId: 'TKT-1',
      subject: 'Cannot open my account',
      category: { name: 'Accounts' },
      priority: 'HIGH',
      status: 'OPEN',
      createdBy: { name: 'QA Customer' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mocks.getTickets.mockResolvedValue({ data: [ticket], pagination: null });
    const { client } = renderPage();

    const subject = await screen.findByText('Cannot open my account');
    fireEvent.click(subject);
    expect(await screen.findByRole('heading', { name: 'Ticket details' })).toBeInTheDocument();
    client.clear();
  });

  it('shows an error state and retries a failed ticket request', async () => {
    mocks.getTickets.mockRejectedValueOnce(new Error('Service unavailable'));
    const { client } = renderPage();
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
    mocks.getTickets.mockResolvedValueOnce({ data: [], pagination: null });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mocks.getTickets).toHaveBeenCalledTimes(2));
    client.clear();
  });
});
