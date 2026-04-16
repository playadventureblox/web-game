"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  User,
  MessageSquare,
  Users,
  Package,
  TrendingUp,
  Gift,
  Star,
} from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import { usersApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isVerified?: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  isVerified = true,
}: SidebarProps) {
  const [user, setUser] = useState<{
    username?: string;
    display_name?: string;
    is_verified?: boolean;
  } | null>(null);

  useEffect(() => {
    // Only fetch user data if authenticated
    if (!isAuthenticated()) {
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await usersApi.getCurrentUser();
        if (response.success && response.data) {
          setUser(
            response.data.user as {
              username?: string;
              display_name?: string;
              is_verified?: boolean;
            },
          );
        }
      } catch {
        // Silently fail if not authenticated
      }
    };

    fetchUserData();
  }, []);

  if (!isOpen) return null;

  // Show loading or fallback if user data not loaded yet
  const isLoggedIn = isAuthenticated();
  const displayUsername =
    user?.username ?? (isLoggedIn ? "Loading..." : "Guest");
  const displayName =
    user?.display_name ??
    user?.username ??
    (isLoggedIn ? "Loading..." : "Guest");
  const userIsVerified = user?.is_verified ?? isVerified;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}></div>

      {/* Sidebar Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-[70] shadow-xl overflow-y-auto scrollbar-hide">
        {!isLoggedIn ? (
          // Guest View - Show Login Prompt
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to AdventureBlox!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Sign up or log in to access your profile, friends, messages, and
              more.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/signup"
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        ) : (
          // Logged In View - Show Full Sidebar
          <>
            {/* User Info Section */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden relative">
                  <Image
                    src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter"
                    alt={displayUsername}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    {displayName}
                    {userIsVerified && <VerifiedBadge size="sm" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="py-1">
              <Link
                href="/home"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <Home className="w-4 h-4" />
                <span className="font-medium text-sm">Home</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">Profile</span>
              </Link>

              <Link
                href="/messages"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium text-sm">Messages</span>
              </Link>

              <Link
                href="/connect"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm">Friends</span>
              </Link>

              <Link
                href="/best-friends"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-sm">Best Friends</span>
              </Link>

              <Link
                href="/avatar"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">Avatar</span>
              </Link>

              <Link
                href="/inventory"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={onClose}
              >
                <Package className="w-4 h-4" />
                <span className="font-medium text-sm">Inventory</span>
              </Link>

              <button
                onClick={async () => {
                  try {
                    // Dynamically import to avoid circular dependencies
                    const { groupsApi } = await import('@/lib/api');
                    const { useRouter } = await import('next/navigation');
                    
                    const response = await groupsApi.getUserGroups();
                    if (response.success && response.data) {
                      const groups = response.data.groups as any[];
                      if (groups.length > 0) {
                        // Navigate to first group
                        window.location.href = `/groups/${groups[0].id}`;
                      } else {
                        // No groups, go to discovery
                        window.location.href = '/groups';
                      }
                    } else {
                      window.location.href = '/groups';
                    }
                  } catch (error) {
                    console.error('Error navigating to groups:', error);
                    window.location.href = '/groups';
                  }
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-left"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm">Groups</span>
              </button>
            </nav>

            {/* Create Community Button */}
            <div className="px-4 py-3">
              <Link
                href="/groups/create"
                onClick={onClose}
                className="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2.5 text-sm rounded-lg transition-colors text-center"
              >
                Create Group
              </Link>
            </div>

            {/* Get Membership Button */}
            <div className="px-4 py-3">
              <Link
                href="/membership"
                onClick={onClose}
                className="block w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-2 text-sm rounded-lg transition-colors text-center"
              >
                Get Membership
              </Link>
            </div>

          </>
        )}
      </div>
    </>
  );
}
