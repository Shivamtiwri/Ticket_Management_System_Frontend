import React from 'react';
import { TicketStatus, TicketPriority } from '../../types';
import { getStatusColor, getPriorityColor, formatStatus } from '../../lib/utils';

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <span className={`badge ${getStatusColor(status)}`}>{formatStatus(status)}</span>
);

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <span className={`badge ${getPriorityColor(priority)}`}>{priority}</span>
);
