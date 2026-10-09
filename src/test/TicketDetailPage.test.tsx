import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({
  getTicketById: vi.fn(),
  getComments: vi.fn(),
  getTicketActivity: vi.fn(),
  getAgents: vi.fn(),
  socketOn: vi.fn(),
  socketOff: vi.fn(),
  joinTicket: vi.fn(),
  leaveTicket: vi.fn(),
}));

vi.mock('../services/ticket.service', () => ({
  ticketService: {
    getTicketById: mocks.getTicketById,
    getComments: mocks.getComments,
    getTicketActivity: mocks.getTicketActivity,
  },
}));
vi.mock('../services/user.service', () => ({
  userService: { getAgents: mocks.getAgents },
}));
vi.mock('../services/socket.service', () => ({
  socketService: {
    on: mocks.socketOn,
    off: mocks.socketOff,
    joinTicket: mocks.joinTicket,
    leaveTicket: mocks.leaveTicket,
  },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'customer-1', role: 'CUSTOMER' } }),
}));

import { TicketDetailPage } from '../pages/tickets/TicketDetailPage';

describe('TicketDetailPage', () => {
  beforeEach(() => {
    mocks.getTicketById.mockReset().mockRejectedValue({ response: { status: 404 } });
    mocks.getComments.mockReset().mockResolvedValue([]);
    mocks.getTicketActivity.mockReset().mockResolvedValue([]);
    mocks.getAgents.mockReset().mockResolvedValue([]);
    mocks.socketOn.mockReset();
    mocks.socketOff.mockReset();
    mocks.joinTicket.mockReset();
    mocks.leaveTicket.mockReset();
  });

  it('explains when the requested ticket does not exist and supports retry', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tickets/ticket-404']}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Ticket not found')).toBeInTheDocument();
    expect(screen.getByText(/may have been deleted/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mocks.getTicketById).toHaveBeenCalledTimes(2));
    client.clear();
  });
});
