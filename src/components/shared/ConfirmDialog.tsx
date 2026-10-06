// Removed: only Register, Login and Dashboard functionality is kept in this file.
import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', isDestructive = false, isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={isDestructive ? 'btn-danger' : 'btn-primary'}
      >
        {isLoading ? 'Processing...' : confirmLabel}
      </button>
    </div>
  </Modal>
);
