import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Pagination } from '../components/shared/Pagination';

describe('shared interactive components', () => {
  it('closes an open modal with Escape and its accessible close button', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Edit ticket"><p>Form content</p></Modal>);
    expect(screen.getByRole('heading', { name: 'Edit ticket' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('prevents confirmation and cancellation while a destructive action is pending', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete ticket"
        message="This action cannot be undone."
        isDestructive
        isLoading
      />
    );
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Processing...' })).toHaveClass('btn-danger');
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables pagination controls at boundaries and emits the selected page', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        pagination={{
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false,
        }}
        onPageChange={onPageChange}
      />
    );
    expect(container.textContent).toContain('Showing 1–10 of 25 results');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
