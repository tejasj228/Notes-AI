'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, Trash2 } from 'lucide-react';

const TYPE_STYLES = {
  success: { bg: '#8FE388', Icon: CheckCircle },
  error: { bg: '#FF7A7A', Icon: AlertCircle },
  info: { bg: '#7CA0FF', Icon: Info },
  delete: { bg: '#FF9F45', Icon: Trash2 },
  default: { bg: '#EFE9DA', Icon: Info },
};

const NotificationSystem = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] space-y-3 max-w-xs sm:max-w-sm">
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
  const [isLeaving, setIsLeaving] = useState(false);
  const { bg, Icon } = TYPE_STYLES[notification.type] || TYPE_STYLES.default;

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => handleRemove(), notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(), 250);
  };

  return (
    <div
      className={`border-3 border-ink shadow-brutal p-3 ${isLeaving ? '' : 'animate-slide-in'}`}
      style={{ background: bg, opacity: isLeaving ? 0 : 1, transition: 'opacity 0.25s' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 text-ink">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display font-extrabold text-ink leading-tight">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-xs text-ink/75 mt-0.5">{notification.message}</p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-ink hover:bg-ink-fixed hover:text-white transition-colors p-0.5"
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default NotificationSystem;
