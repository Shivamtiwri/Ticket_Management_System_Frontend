import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { CustomerDashboard } from './CustomerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { AgentDashboard } from './AgentDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
 if (user?.role === UserRole.ADMIN) return <AdminDashboard />;
  if (user?.role === UserRole.AGENT) return <AgentDashboard />;
  return <CustomerDashboard />;
};
