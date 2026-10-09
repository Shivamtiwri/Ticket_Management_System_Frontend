import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mocks.register }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import { RegisterPage } from '../pages/auth/RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    mocks.register.mockReset();
    mocks.navigate.mockReset();
  });

  const renderPage = () => render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>
  );

  it('labels registration inputs and shows validation errors without calling the API', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Register account' }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('submits valid credentials once and navigates to the dashboard', async () => {
    mocks.register.mockResolvedValueOnce(undefined);
    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), { target: { value: 'QA Customer' } });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), { target: { value: 'qa@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register account' }));

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledTimes(1);
      expect(mocks.register).toHaveBeenCalledWith({
        name: 'QA Customer',
        email: 'qa@example.test',
        password: 'StrongPass123',
        phone: '',
      });
      expect(mocks.navigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('does not navigate if registration fails', async () => {
    mocks.register.mockRejectedValueOnce(new Error('Email already exists'));
    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), { target: { value: 'QA Customer' } });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), { target: { value: 'qa@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register account' }));

    await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
