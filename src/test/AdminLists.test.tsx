import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  toggleUserStatus: vi.fn(),
  updateUserRole: vi.fn(),
  getActivityLogs: vi.fn(),
}));

vi.mock('../services/user.service', () => ({
  userService: {
    getUsers: mocks.getUsers,
    toggleUserStatus: mocks.toggleUserStatus,
    updateUserRole: mocks.updateUserRole,
  },
}));
vi.mock('../services/activity.service', () => ({
  activityService: { getActivityLogs: mocks.getActivityLogs },
}));

import { UsersPage } from '../pages/admin/UsersPage';
import { AgentsPage } from '../pages/admin/AgentsPage';
import { ActivityLogsPage } from '../pages/admin/ActivityLogsPage';

describe('admin list pages', () => {
  beforeEach(() => {
    mocks.getUsers.mockReset().mockResolvedValue({
      data: [{
        _id: 'user-1',
        name: 'QA Agent',
        email: 'agent@example.test',
        role: UserRole.AGENT,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
    mocks.toggleUserStatus.mockReset();
    mocks.updateUserRole.mockReset();
    mocks.getActivityLogs.mockReset().mockResolvedValue({
      data: [{
        _id: 'log-1',
        actor: { name: 'QA Admin', role: UserRole.ADMIN },
        action: 'TICKET_CREATED',
        description: 'Created test ticket',
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  });

  const renderWithQuery = (child: React.ReactNode) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return {
      client,
      ...render(
        <QueryClientProvider client={client}>
          <MemoryRouter>{child}</MemoryRouter>
        </QueryClientProvider>
      ),
    };
  };

  it('filters the user list by search text and opens a role-change dialog', async () => {
    const { client } = renderWithQuery(<UsersPage />);
    expect(await screen.findByText('QA Agent')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'agent@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(mocks.getUsers).toHaveBeenLastCalledWith(expect.objectContaining({
        search: 'agent@example.test',
        page: 1,
      }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change Role' }));
    expect(screen.getByRole('heading', { name: /update role/i })).toBeInTheDocument();
    client.clear();
  });

  it('submits an agent status change only after confirmation', async () => {
    mocks.toggleUserStatus.mockResolvedValueOnce({});
    const { client } = renderWithQuery(<AgentsPage />);
    expect(await screen.findByText('QA Agent')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(screen.getByRole('heading', { name: 'Deactivate Agent' })).toBeInTheDocument();
    const confirmationButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    fireEvent.click(confirmationButtons[confirmationButtons.length - 1]);
    await waitFor(() => expect(mocks.toggleUserStatus).toHaveBeenCalledWith('user-1'));
    client.clear();
  });

  it('filters activity logs by action and renders event details', async () => {
    const { client } = renderWithQuery(<ActivityLogsPage />);
    expect(await screen.findByText('Created test ticket')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TICKET_CREATED' } });
    await waitFor(() => {
      expect(mocks.getActivityLogs).toHaveBeenLastCalledWith(expect.objectContaining({
        action: 'TICKET_CREATED',
        page: 1,
      }));
    });
    client.clear();
  });
});
