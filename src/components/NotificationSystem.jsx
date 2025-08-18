import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, Trash2 } from 'lucide-react';

const NotificationSystem = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-remove after duration
    if (notification.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(), 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'info':
        return <Info size={20} className="text-blue-400" />;
      case 'delete':
        return <Trash2 size={20} className="text-orange-400" />;
      default:
        return <Info size={20} className="text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
      case 'delete':
        return 'rgba(251, 146, 60, 0.1)';
      default:
        return 'rgba(75, 85, 99, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.3)';
      case 'error':
        return 'rgba(239, 68, 68, 0.3)';
      case 'info':
        return 'rgba(59, 130, 246, 0.3)';
      case 'delete':
        return 'rgba(251, 146, 60, 0.3)';
      default:
        return 'rgba(75, 85, 99, 0.3)';
    }
  };

  return (
    <div
      className={`
        border rounded-xl p-4 backdrop-blur-sm transition-all duration-300 shadow-lg
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{
        background: getBackgroundColor(),
        borderColor: getBorderColor(),
        minWidth: '300px'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-200 mb-1">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-xs text-gray-400">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors duration-200 p-1 rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationSystem;
