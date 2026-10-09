import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    login: authMocks.login,
    register: authMocks.register,
    logout: authMocks.logout,
  },
}));

import { AuthProvider, useAuth } from '../context/AuthContext';

const SessionControls = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? user?.email : 'Signed out'}</p>
      <button onClick={() => void login({ email: 'qa@example.test', password: 'Password123' })}>Log in</button>
      <button onClick={() => void logout()}>Log out</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    authMocks.login.mockReset();
    authMocks.register.mockReset();
    authMocks.logout.mockReset();
  });

  it('restores a saved user and token from local storage', async () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify({ email: 'saved@example.test', role: 'CUSTOMER' }));
    render(<AuthProvider><SessionControls /></AuthProvider>);
    expect(await screen.findByText('saved@example.test')).toBeInTheDocument();
  });

  it('stores a valid login session and clears it on logout', async () => {
    authMocks.login.mockResolvedValueOnce({
      token: 'issued-token',
      user: { email: 'qa@example.test', role: 'CUSTOMER' },
    });
    authMocks.logout.mockResolvedValueOnce(undefined);
    render(<AuthProvider><SessionControls /></AuthProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('qa@example.test')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('issued-token');

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(authMocks.logout).toHaveBeenCalledTimes(1);
  });

  it('clears corrupt persisted user state instead of restoring it', async () => {
    localStorage.setItem('token', 'stale-token');
    localStorage.setItem('user', '{invalid json');
    render(<AuthProvider><SessionControls /></AuthProvider>);
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
