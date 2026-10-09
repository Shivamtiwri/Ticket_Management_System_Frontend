import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  getActiveCategories: vi.fn(),
  createTicket: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../services/category.service', () => ({
  categoryService: { getActiveCategories: mocks.getActiveCategories },
}));
vi.mock('../services/ticket.service', () => ({
  ticketService: { createTicket: mocks.createTicket },
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import { CreateTicketPage } from '../pages/tickets/CreateTicketPage';

describe('CreateTicketPage', () => {
  beforeEach(() => {
    mocks.getActiveCategories.mockReset().mockResolvedValue([{ _id: 'category-1', name: 'Accounts' }]);
    mocks.createTicket.mockReset();
    mocks.navigate.mockReset();
  });

  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return {
      client,
      ...render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<CreateTicketPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      ),
    };
  };

  it('validates required fields before making an API request', async () => {
    const { client } = renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Create Ticket' }));
    expect(await screen.findByText(/subject must be at least 5 characters/i)).toBeInTheDocument();
    expect(mocks.createTicket).not.toHaveBeenCalled();
    client.clear();
  });

  it('rejects unsupported uploads and prevents submission', async () => {
    const { client } = renderPage();
    const file = new File(['unsupported'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(await screen.findByLabelText(/attachments/i), {
      target: { files: [file] },
    });
    expect(await screen.findByText(/unsupported type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Ticket' })).toBeDisabled();
    expect(mocks.createTicket).not.toHaveBeenCalled();
    client.clear();
  });

  it('submits valid data and navigates to the created ticket', async () => {
    mocks.createTicket.mockResolvedValueOnce({ _id: 'ticket-new' });
    const { client } = renderPage();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/subject/i), 'Unable to access account');
    await user.type(screen.getByLabelText(/description/i), 'The account page returns an error when I sign in.');
    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'category-1');
    await user.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(mocks.createTicket).toHaveBeenCalledTimes(1);
      expect(mocks.navigate).toHaveBeenCalledWith('/tickets/ticket-new');
    });
    const submitted = mocks.createTicket.mock.calls[0][0] as FormData;
    expect(submitted.get('subject')).toBe('Unable to access account');
    expect(submitted.get('category')).toBe('category-1');
    expect(submitted.get('priority')).toBe('MEDIUM');
    client.clear();
  });
});
