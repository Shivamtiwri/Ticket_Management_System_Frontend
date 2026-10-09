import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  navigate: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'agent-1', name: 'QA Agent', email: 'agent@example.test', role: 'AGENT' },
    logout: mocks.logout,
  }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

describe('Sidebar', () => {
  it('shows role-specific navigation and closes after choosing a route', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen onClose={mocks.onClose} />
      </MemoryRouter>
    );
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Available Tickets' })).toHaveAttribute('href', '/tickets/available');
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'My Tickets' }));
    expect(mocks.onClose).toHaveBeenCalledTimes(1);
  });

  it('logs out and navigates to login', async () => {
    mocks.logout.mockResolvedValueOnce(undefined);
    render(<MemoryRouter><Sidebar isOpen onClose={mocks.onClose} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).toHaveBeenCalledWith('/login');
  });
});
