import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="text-emerald-600" size={20} />,
    error: <XCircle className="text-red-600" size={20} />,
    info: <Info className="text-blue-600" size={20} />,
    warning: <AlertTriangle className="text-amber-600" size={20} />,
  };

  const styles = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-800",
    error: "bg-red-50 border-red-100 text-red-800",
    info: "bg-blue-50 border-blue-100 text-blue-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
  };

  const iconBgs = {
    success: "bg-emerald-100",
    error: "bg-red-100",
    info: "bg-blue-100",
    warning: "bg-amber-100",
  };

  return (
    <div className={clsx(
      "fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 min-w-[300px]",
      styles[type]
    )}>
      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBgs[type])}>
        {icons[type]}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 text-zinc-400 hover:text-zinc-600 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};
