import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  changePassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: { getMe: mocks.getMe, changePassword: mocks.changePassword },
}));
vi.mock('../services/user.service', () => ({
  userService: { updateProfile: mocks.updateProfile },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'QA User', email: 'qa@example.test', role: UserRole.CUSTOMER },
  }),
}));

import { ProfilePage } from '../pages/profile/ProfilePage';

describe('ProfilePage', () => {
  beforeEach(() => {
    mocks.getMe.mockReset().mockResolvedValue({
      name: 'QA User',
      phone: '',
      department: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    mocks.changePassword.mockReset();
    mocks.updateProfile.mockReset();
  });

  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return {
      client,
      ...render(
        <QueryClientProvider client={client}>
          <MemoryRouter><ProfilePage /></MemoryRouter>
        </QueryClientProvider>
      ),
    };
  };

  it('loads profile information and saves valid profile edits', async () => {
    mocks.updateProfile.mockResolvedValueOnce({});
    const { client } = renderPage();
    const user = userEvent.setup();
    const nameField = await screen.findByPlaceholderText('Your full name');
    expect(nameField).toHaveValue('QA User');
    await user.clear(nameField);
    await user.type(nameField, 'Updated QA User');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        name: 'Updated QA User',
        phone: '',
        department: '',
      });
    });
    client.clear();
  });

  it('validates password confirmation before calling the password API', async () => {
    const { client } = renderPage();
    const user = userEvent.setup();
    await screen.findByPlaceholderText('Your full name');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    await user.type(passwordFields[0], 'CurrentPass123');
    await user.type(passwordFields[1], 'NewPassword123');
    await user.type(passwordFields[2], 'DifferentPass123');
    const changeButtons = screen.getAllByRole('button', { name: 'Change Password' });
    await user.click(changeButtons[changeButtons.length - 1]);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
    client.clear();
  });
});
