import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AttachmentList } from '../components/shared/AttachmentList';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { PasswordInput } from '../components/shared/PasswordInput';
import { Spinner } from '../components/shared/Spinner';
import { StatCard } from '../components/shared/StatCard';

describe('shared display components', () => {
  it('shows empty and error states with working retry actions', () => {
    const retry = vi.fn();
    render(
      <>
        <EmptyState title="No records" description="Create a record to get started." />
        <ErrorState message="Request failed" onRetry={retry} />
      </>
    );
    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.getByText('Create a record to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('provides an accessible password visibility toggle and configurable spinner size', () => {
    const { container } = render(
      <>
        <PasswordInput aria-label="Account password" />
        <Spinner size="lg" />
      </>
    );
    const password = screen.getByLabelText('Account password');
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(container.querySelector('.h-12.w-12')).toBeInTheDocument();
  });

  it('opens and closes an image attachment preview and links files safely', () => {
    render(
      <AttachmentList
        attachments={[
          {
            filename: 'stored.png',
            originalName: 'screen shot.png',
            mimetype: 'image/png',
            size: 100,
            path: 'https://cdn.example.test/screen.png',
            uploadedBy: 'user-1',
            uploadedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            filename: 'report.pdf',
            originalName: 'report.pdf',
            mimetype: 'application/pdf',
            size: 100,
            path: 'https://res.cloudinary.com/demo/image/upload/report.pdf',
            uploadedBy: 'user-1',
            uploadedAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'View image: screen shot.png' }));
    expect(screen.getByRole('dialog', { name: 'Image preview: screen shot.png' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'report.pdf' })).toHaveAttribute(
      'href',
      'https://res.cloudinary.com/demo/image/upload/fl_attachment:report.pdf/report.pdf'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a linked statistic with a formatted value and carries route state', () => {
    render(
      <MemoryRouter>
        <StatCard
          label="Total tickets"
          value={1200}
          link="/tickets"
          state={{ filters: { status: 'OPEN' } }}
        />
      </MemoryRouter>
    );
    const card = screen.getByRole('link', { name: /total tickets 1,200/i });
    expect(card).toHaveAttribute('href', '/tickets');
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });
});
