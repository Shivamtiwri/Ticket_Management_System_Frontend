import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../components/shared/Badges';
import { TicketStatus, TicketPriority } from '../types';

describe('StatusBadge', () => {
  it('renders OPEN status', () => {
    render(<StatusBadge status={TicketStatus.OPEN} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders IN_PROGRESS as "In Progress"', () => {
    render(<StatusBadge status={TicketStatus.IN_PROGRESS} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders RESOLVED status', () => {
    render(<StatusBadge status={TicketStatus.RESOLVED} />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('applies correct color class for OPEN', () => {
    const { container } = render(<StatusBadge status={TicketStatus.OPEN} />);
    expect(container.firstChild).toHaveClass('bg-blue-100');
  });

  it('applies correct color class for RESOLVED', () => {
    const { container } = render(<StatusBadge status={TicketStatus.RESOLVED} />);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });
});

describe('PriorityBadge', () => {
  it('renders CRITICAL priority', () => {
    render(<PriorityBadge priority={TicketPriority.CRITICAL} />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders LOW priority', () => {
    render(<PriorityBadge priority={TicketPriority.LOW} />);
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('applies red color for CRITICAL', () => {
    const { container } = render(<PriorityBadge priority={TicketPriority.CRITICAL} />);
    expect(container.firstChild).toHaveClass('bg-red-100');
  });
});
