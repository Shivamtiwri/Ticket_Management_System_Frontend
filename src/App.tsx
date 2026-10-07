import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { UserRole } from './types';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { TicketListPage } from './pages/tickets/TicketListPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { AvailableTicketsPage } from './pages/tickets/AvailableTicketsPage';
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AgentsPage } from './pages/admin/AgentsPage';
import { ProfilePage } from './pages/profile/ProfilePage';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tickets" element={<TicketListPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]} />}>
              <Route path="/tickets/new" element={<CreateTicketPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[UserRole.AGENT, UserRole.ADMIN]} />}>
              <Route path="/tickets/available" element={<AvailableTicketsPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
             <Route path="/users" element={<UsersPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/activity" element={<ActivityLogsPage />} />
              <Route path="/agents" element={<AgentsPage />} />
            
            </Route>
          </Route>
        </Route>

        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
