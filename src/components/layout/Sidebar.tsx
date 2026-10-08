import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const TicketIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const DashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const InboxIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4l-2 2h-4l-2-2H4" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);


const ActivityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);


const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);


const roleLabels: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Customer',
  [UserRole.AGENT]: 'Agent',
  [UserRole.ADMIN]: 'Administrator',
};

const navByRole: Record<UserRole, NavItem[]> = {
  [UserRole.CUSTOMER]: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashIcon /> },
    { to: '/tickets', label: 'My Tickets', icon: <TicketIcon /> },
    { to: '/tickets/new', label: 'Create Ticket', icon: <PlusIcon /> },
    { to: '/profile', label: 'Profile', icon: <ProfileIcon /> },
  ],
  [UserRole.AGENT]: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashIcon /> },
    { to: '/tickets', label: 'My Tickets', icon: <TicketIcon /> },
    { to: '/tickets/available', label: 'Available Tickets', icon: <InboxIcon /> },
    { to: '/profile', label: 'Profile', icon: <ProfileIcon /> },
  ],
  [UserRole.ADMIN]: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashIcon /> },
    { to: '/tickets', label: 'All Tickets', icon: <TicketIcon /> },
    { to: '/categories', label: 'Categories', icon: <CategoryIcon /> },
    { to: '/activity', label: 'Activity Logs', icon: <ActivityIcon /> },
    { to: '/users', label: 'Users', icon: <UsersIcon /> },
    { to: '/agents', label: 'Agents', icon: <UserGroupIcon /> },
    { to: '/profile', label: 'Profile', icon: <ProfileIcon /> },
  ],
};

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = user ? navByRole[user.role] : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  const roleChipStyles = {
    [UserRole.CUSTOMER]: 'border-blue-500 text-blue-500',
    [UserRole.AGENT]: 'border-yellow-500 text-yellow-500',
    [UserRole.ADMIN]: 'border-red-500 text-red-500',
  };
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 shrink-0 bg-gray-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-700 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">T.M.S</h1>
            <span
              className={`inline-flex items-center rounded-full border bg-transparent px-2 text-xs font-medium capitalize ${roleChipStyles[user?.role ?? UserRole.CUSTOMER]
                }`}
            >
              {roleLabels[user?.role ?? UserRole.CUSTOMER]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
          {items?.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className=" border-gray-800 bg-gray-900/50 p-4">
          <div className="rounded-xl border border-gray-800 bg-gray-800/60 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 ring-2 ring-gray-700">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-800 bg-emerald-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {user?.email || "No email available"}
                </p>
              </div>

             
            </div>

        
            <div className="my-3 h-px bg-gray-700/70" />

            
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700/70 transition-colors group-hover:bg-red-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 12H9m9 0l-3-3m3 3l-3 3"
                  />
                </svg>
              </div>

              <span>Sign out</span>
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
