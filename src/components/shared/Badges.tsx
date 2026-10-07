import React from 'react';
import { TicketStatus, TicketPriority } from '../../types';
import { formatStatus } from '../../lib/utils';

/* ── StatusBadge ───────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<TicketStatus, { icon: string; classes: string }> = {
  OPEN:             { icon: '◉', classes: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
  ASSIGNED:         { icon: '◎', classes: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200' },
  IN_PROGRESS:      { icon: '▶', classes: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  WAITING_FOR_USER: { icon: '⏸', classes: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
  RESOLVED:         { icon: '✓', classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  CLOSED:           { icon: '✕', classes: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' },
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
      <span className="text-[10px] leading-none">{cfg.icon}</span>
      {formatStatus(status)}
    </span>
  );
};

/* ── PriorityBadge ─────────────────────────────────────────────────────────── */
const PRIORITY_CONFIG: Record<TicketPriority, { icon: string; classes: string }> = {
  LOW:      { icon: '▽', classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  MEDIUM:   { icon: '◈', classes: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' },
  HIGH:     { icon: '△', classes: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
  CRITICAL: { icon: '⚠', classes: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
      <span className="text-[10px] leading-none">{cfg.icon}</span>
      {label}
    </span>
  );
};
