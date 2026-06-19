import React from 'react';
import { useStore } from '../store/useStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer = () => {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 p-4 rounded-lg border glass-panel shadow-lg animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
          <div className="flex-1 text-sm font-medium text-foreground">{notif.message}</div>
          <button
            onClick={() => removeNotification(notif.id)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
