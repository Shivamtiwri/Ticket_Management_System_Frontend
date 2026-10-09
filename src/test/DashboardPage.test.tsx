import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({
  role: 'CUSTOMER' as UserRole,
  getCustomerDashboard: vi.fn(),
  getAgentDashboard: vi.fn(),
  getAdminDashboard: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: mocks.role } }),
}));
vi.mock('../services/dashboard.service', () => ({
  dashboardService: {
    getCustomerDashboard: mocks.getCustomerDashboard,
    getAgentDashboard: mocks.getAgentDashboard,
    getAdminDashboard: mocks.getAdminDashboard,
  },
}));

import { DashboardPage } from '../pages/dashboard/DashboardPage';

describe('DashboardPage role routing', () => {
  beforeEach(() => {
    mocks.getCustomerDashboard.mockReset().mockResolvedValue({
      stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
      recentTickets: [],
    });
    mocks.getAgentDashboard.mockReset().mockResolvedValue({
      stats: { assigned: 0, open: 0, inProgress: 0, waitingForUser: 0, resolved: 0 },
      recentTickets: [],
    });
    mocks.getAdminDashboard.mockReset().mockResolvedValue({
      stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, total_category: 0 },
      byPriority: [],
      byCategory: [],
      byAgent: [],
      userStats: [],
    });
  });

  const renderDashboard = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter><DashboardPage /></MemoryRouter>
      </QueryClientProvider>
    );
    return { ...view, client };
  };

  it.each([
    [UserRole.CUSTOMER, 'My dashboard', mocks.getCustomerDashboard],
    [UserRole.AGENT, 'Agent dashboard', mocks.getAgentDashboard],
    [UserRole.ADMIN, 'Admin dashboard', mocks.getAdminDashboard],
  ])('renders the %s dashboard for that role', async (role, heading, service) => {
    mocks.role = role;
    const { client } = renderDashboard();
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(service).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
