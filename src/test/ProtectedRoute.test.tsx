import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

const authState = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  user: null as null | { role: UserRole },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

import { ProtectedRoute } from '../components/layout/ProtectedRoute';

const LocationDisplay = () => {
  const location = useLocation();
  return <output>{location.pathname}</output>;
};

describe('ProtectedRoute', () => {
  const renderRoute = (allowedRoles?: UserRole[]) => render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/private" element={<h1>Private content</h1>} />
        </Route>
        <Route path="/login" element={<><h1>Login page</h1><LocationDisplay /></>} />
        <Route path="/dashboard" element={<><h1>Dashboard</h1><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );

  it('redirects unauthenticated visitors to login', () => {
    authState.isLoading = false;
    authState.isAuthenticated = false;
    authState.user = null;
    renderRoute();
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(screen.getByText('/login')).toBeInTheDocument();
  });

  it('shows a loading state while authentication is being restored', () => {
    authState.isLoading = true;
    authState.isAuthenticated = false;
    authState.user = null;
    renderRoute();
    expect(screen.queryByRole('heading', { name: 'Private content' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login page' })).not.toBeInTheDocument();
  });

  it('redirects users with a disallowed role and renders authorized content', () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    authState.user = { role: UserRole.CUSTOMER };
    const denied = renderRoute([UserRole.ADMIN]);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    denied.unmount();

    authState.user = { role: UserRole.ADMIN };
    renderRoute([UserRole.ADMIN]);
    expect(screen.getByRole('heading', { name: 'Private content' })).toBeInTheDocument();
  });
});
