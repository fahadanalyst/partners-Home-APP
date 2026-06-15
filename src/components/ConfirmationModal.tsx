import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${
            variant === 'danger' ? 'bg-red-50 text-red-600' : 
            variant === 'warning' ? 'bg-amber-50 text-amber-600' : 
            'bg-blue-50 text-blue-600'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <p className="text-zinc-600 leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
