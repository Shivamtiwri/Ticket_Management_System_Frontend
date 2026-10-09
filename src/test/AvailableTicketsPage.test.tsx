import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  getAvailableTickets: vi.fn(),
  assignTicket: vi.fn(),
}));

vi.mock('../services/ticket.service', () => ({
  ticketService: {
    getAvailableTickets: mocks.getAvailableTickets,
    assignTicket: mocks.assignTicket,
  },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'agent-1', role: 'AGENT' } }),
}));

import { AvailableTicketsPage } from '../pages/tickets/AvailableTicketsPage';

describe('AvailableTicketsPage', () => {
  beforeEach(() => {
    mocks.getAvailableTickets.mockReset().mockResolvedValue({
      data: [{
        _id: 'ticket-123',
        ticketId: 'TKT-123',
        subject: 'Cannot access account',
        category: { name: 'Accounts' },
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      pagination: null,
    });
    mocks.assignTicket.mockReset();
  });

  it('navigates to the selected ticket detail page on narrow-screen layouts', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tickets/available']}>
          <Routes>
            <Route path="/tickets/available" element={<AvailableTicketsPage />} />
            <Route path="/tickets/:id" element={<h1>Ticket details</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const ticketLink = await screen.findByRole('link', { name: /cannot access account/i });
    expect(ticketLink).toHaveAttribute('href', '/tickets/ticket-123');
    fireEvent.click(ticketLink);
    expect(await screen.findByRole('heading', { name: 'Ticket details' })).toBeInTheDocument();
    client.clear();
  });

  it('assigns a ticket to the signed-in agent when Accept is selected', async () => {
    mocks.assignTicket.mockResolvedValueOnce({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AvailableTicketsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(mocks.assignTicket).toHaveBeenCalledWith('ticket-123', 'agent-1'));
    client.clear();
  });
});
