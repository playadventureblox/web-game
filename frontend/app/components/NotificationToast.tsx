"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationToast() {
  const { toasts, dismissToast } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

  useEffect(() => {
    // Animate in new toasts
    toasts.forEach(toast => {
      if (!visibleToasts.includes(toast.id)) {
        setTimeout(() => {
          setVisibleToasts(prev => [...prev, toast.id]);
        }, 50);
      }
    });

    // Clean up removed toasts
    setVisibleToasts(prev => prev.filter(id => toasts.some(t => t.id === id)));
  }, [toasts]);

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast, index) => {
        const isVisible = visibleToasts.includes(toast.id);
        
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 w-80 transition-all duration-300 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {toast.notification.related_avatar_url && (
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  <Image
                    src={toast.notification.related_avatar_url}
                    alt={toast.notification.related_username || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                  {toast.notification.type === 'friend_request' && '🤝 New Friend Request'}
                  {toast.notification.type === 'friend_request_accepted' && '✅ Friend Request Accepted'}
                  {(toast.notification.type === 'message' || toast.notification.type === 'new_message') && '💬 New Message'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {toast.notification.related_display_name || toast.notification.related_username}
                  {toast.notification.type === 'friend_request' && ' wants to be your friend'}
                  {toast.notification.type === 'friend_request_accepted' && ' accepted your friend request'}
                  {(toast.notification.type === 'message' || toast.notification.type === 'new_message') && `: ${toast.notification.content}`}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
