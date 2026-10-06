export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  // AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: string | User;
  uploadedAt: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  description: string;
  category: Category;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: User;
  assignedAgent?: User;
  attachments: Attachment[];
  tags?: string[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  ticket: string;
  author: User;
  content: string;
  isInternal: boolean;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  ticket?: { ticketId: string; subject: string };
  actor: User;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: Pagination;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  category?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'updated' | 'priority' | '';
}

export interface CustomerDashboardStats {
  stats: { total: number; open: number; inProgress: number; resolved: number; closed: number };
  recentTickets: Ticket[];
}

export interface AgentDashboardStats {
  stats: { assigned: number; open: number; inProgress: number; waitingForUser: number; resolved: number };
  recentTickets: Ticket[];
}

export interface AdminDashboardStats {
  stats: { total: number; open: number; inProgress: number; resolved: number; closed: number,total_category: number };
  byPriority: Array<{ _id: string; count: number }>;
  byCategory: Array<{ _id: string; count: number }>;
  byAgent: Array<{ _id: string; count: number }>;
  userStats: Array<{ _id: string; count: number }>;
}
