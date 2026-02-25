"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import { friendsApi } from '@/lib/api';
import { openChatWithUser } from './ChatWidget';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleAcceptRequest = async (notificationId: string, requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId);
      await markAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectRequest = async (notificationId: string, requestId: string) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      await markAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[600px] flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {notification.related_avatar_url && (
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    <Image
                      src={notification.related_avatar_url}
                      alt={notification.related_username || 'User'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-semibold">
                        {notification.related_display_name || notification.related_username}
                      </span>
                      {notification.type === 'friend_request' && ' sent you a friend request'}
                      {notification.type === 'friend_request_accepted' && ' accepted your friend request'}
                      {(notification.type === 'message' || notification.type === 'new_message') && ' sent you a message'}
                    </p>
                    {(notification.type === 'message' || notification.type === 'new_message') && notification.content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate italic">
                        &ldquo;{notification.content}&rdquo;
                      </p>
                    )}
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatTime(notification.created_at)}
                  </p>

                  {/* Actions for friend requests */}
                  {notification.type === 'friend_request' && !notification.is_read && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRequest(notification.id, notification.related_item_id!);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectRequest(notification.id, notification.related_item_id!);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-xs font-medium rounded transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Chat button for accepted requests */}
                  {notification.type === 'friend_request_accepted' && (
                    <Link
                      href={`/profile/${notification.related_username}`}
                      className="inline-block mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chat
                    </Link>
                  )}

                  {/* Reply button for new messages */}
                  {(notification.type === 'message' || notification.type === 'new_message') && notification.related_user_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                        openChatWithUser(
                          notification.related_user_id!,
                          notification.related_username || '',
                          notification.related_display_name || undefined,
                          notification.related_avatar_url || undefined,
                        );
                        onClose();
                      }}
                      className="inline-block mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings Link */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/settings"
          className="block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          onClick={onClose}
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
