import React from 'react';

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, description, onRetry }) => (
  <div className="text-center py-16 px-4">
    <svg
      className="mx-auto h-12 w-12 text-red-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14A9 9 0 1 1 4.93 4.93z"
      />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-1">Something went wrong</h3>
    <p className="text-sm text-red-600 mb-4">{message || 'Unable to load data'}</p>
    {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
        Try again
      </button>
    )}
  </div>
);
