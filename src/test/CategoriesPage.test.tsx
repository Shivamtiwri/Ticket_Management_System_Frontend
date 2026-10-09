import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  toggleCategoryStatus: vi.fn(),
}));

vi.mock('../services/category.service', () => ({
  categoryService: {
    getCategories: mocks.getCategories,
    createCategory: mocks.createCategory,
    updateCategory: mocks.updateCategory,
    toggleCategoryStatus: mocks.toggleCategoryStatus,
  },
}));

import { CategoriesPage } from '../pages/admin/CategoriesPage';

describe('CategoriesPage', () => {
  beforeEach(() => {
    mocks.getCategories.mockReset().mockResolvedValue([]);
    mocks.createCategory.mockReset();
    mocks.updateCategory.mockReset();
    mocks.toggleCategoryStatus.mockReset();
  });

  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return {
      client,
      ...render(
        <QueryClientProvider client={client}>
          <MemoryRouter><CategoriesPage /></MemoryRouter>
        </QueryClientProvider>
      ),
    };
  };

  it('shows the empty category state and validates a new category form', async () => {
    const { client } = renderPage();
    expect(await screen.findByText('No categories yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Category' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(mocks.createCategory).not.toHaveBeenCalled();
    client.clear();
  });

  it('creates a category with the entered values', async () => {
    mocks.createCategory.mockResolvedValueOnce({ _id: 'category-1', name: 'Accounts' });
    const { client } = renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Category' }));
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Accounts' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Account support' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mocks.createCategory).toHaveBeenCalledWith({
        name: 'Accounts',
        description: 'Account support',
      });
    });
    client.clear();
  });

  it('renders category rows and toggles active status', async () => {
    mocks.getCategories.mockResolvedValueOnce([{
      _id: 'category-1',
      name: 'Accounts',
      description: 'Account support',
      isActive: true,
    }]);
    mocks.toggleCategoryStatus.mockResolvedValueOnce({});
    const { client } = renderPage();
    expect(await screen.findByText('Accounts')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(mocks.toggleCategoryStatus).toHaveBeenCalledWith('category-1'));
    client.clear();
  });
});
