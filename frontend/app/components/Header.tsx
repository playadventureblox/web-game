"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, Bell, Settings as SettingsIcon, UserPlus, Check } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import VerifiedBadge from "./VerifiedBadge";
import { logout, isAuthenticated } from "@/lib/auth";
import { usersApi, searchApi, friendsApi } from "@/lib/api";
import SwitchAccountsModal from "./SwitchAccountsModal";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "@/contexts/NotificationContext";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;
  isVerified?: boolean;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  is_verified?: boolean;
  friendship_status?: 'friend' | 'request_sent' | 'request_received' | 'none';
}

export default function Header({
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  isVerified = true,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    username?: string;
    display_name?: string;
    is_verified?: boolean;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSwitchAccountsModal, setShowSwitchAccountsModal] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { unreadCount } = useNotifications();

useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        // Fetch user data from API (database) only if authenticated
        try {
          const response = await usersApi.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data.user as typeof user);
          } else {
            // If token is invalid, clear auth state
            setIsLoggedIn(false);
          }
        } catch {
          setIsLoggedIn(false);
        }
      }
    };

    checkAuth();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      if (searchQuery.trim().length < 2) {
        return; // Don't search until at least 2 characters
      }

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debouncing
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await searchApi.searchUsers(searchQuery, 8);
          if (response.success && response.data) {
            setSearchResults((response.data.users as SearchResult[]) || []);
            setShowSearchDropdown(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    };

    performSearch();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setSettingsOpen(false);
    logout();
  };

  const handleSwitchAccountsClick = () => {
    setSettingsOpen(false);
    setShowSwitchAccountsModal(true);
  };

  const handleSwitchSuccess = () => {
    setShowSwitchAccountsModal(false);
    setSwitchSuccess(true);
    setTimeout(() => setSwitchSuccess(false), 3000);

    // Refresh user data and page
    window.location.href = "/home";
  };

  const handleAddFriend = async (userId: string) => {
    try {
      const response = await friendsApi.sendFriendRequest(userId);
      if (response.success) {
        // Update search results to show request sent
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, friendship_status: "request_sent" } : u
          )
        );
      } else {
        alert(response.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Add friend error:", error);
      alert("Failed to send friend request");
    }
  };

  // Display user data immediately without loading states
  const displayUsername = user?.username ?? "";
  const displayName = user?.display_name ?? user?.username ?? "";
  const userIsVerified = user?.is_verified ?? isVerified;

  return (
    <>
      {/* Success Notification */}
      {switchSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[102] animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="font-semibold">
              You switched to {user?.username || "another account"}
            </p>
          </div>
        </div>
      )}

      {/* Switch Accounts Modal */}
      <SwitchAccountsModal
        isOpen={showSwitchAccountsModal}
        onClose={() => setShowSwitchAccountsModal(false)}
        onSwitchSuccess={handleSwitchSuccess}
      />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          {/* Left Section - Takes more space */}
          <div className="flex items-center gap-4 flex-1">
            {/* Menu Button - Only show when logged in */}
            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Logo */}
            <Link
              href={isLoggedIn ? "/home" : "/signup"}
              className="flex-shrink-0"
            >
              <div className="w-9 h-9 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">◈</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
              <Link
                href="/games"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Games
              </Link>
              <Link
                href="/catalog"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Catalog
              </Link>
              <Link
                href="/create"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Create
              </Link>
              <Link
                href="/adventurebux"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                AdventureBux
              </Link>
            </nav>

            {/* Search Bar with Dropdown */}
            <div className="hidden md:flex items-center gap-2 relative" ref={searchDropdownRef}>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 w-64">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:outline-none w-full"
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchDropdown && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3"
                        >
                          <Link
                            href={`/profile?user=${result.username}`}
                            className="flex items-center gap-3 flex-1 min-w-0"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {result.display_name}
                                </span>
                                {result.is_verified && <VerifiedBadge size="sm" />}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{result.username}
                              </p>
                            </div>
                          </Link>
                          
                          {/* Friend Action Button */}
                          {isLoggedIn && result.id !== user?.id && (
                            <div className="flex-shrink-0">
                              {result.friendship_status === "friend" ? (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Friends
                                </span>
                              ) : result.friendship_status === "request_sent" ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Requested
                                </span>
                              ) : result.friendship_status === "request_received" ? (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  Accept
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAddFriend(result.id)}
                                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                  title="Add Friend"
                                >
                                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {searchResults.length === 0 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No users found
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Dynamic based on auth state */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle />

            {!isLoggedIn ? (
              // NOT LOGGED IN - Show Sign Up / Log In buttons
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded transition-colors"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              // LOGGED IN - Show user profile, notifications, currency, settings
              <>
                {/* User Profile */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
                >
                  {displayName && (
                    <span className="text-gray-900 dark:text-gray-100 font-medium text-sm hidden lg:flex items-center gap-1">
                      {displayName}
                      {userIsVerified && <VerifiedBadge size="sm" />}
                    </span>
                  )}
                  <div className="w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 overflow-hidden relative">
                    <Image
                      src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter"
                      alt={displayUsername}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative transition-colors"
                  >
                    <Bell className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={notificationOpen} 
                    onClose={() => setNotificationOpen(false)} 
                  />
                </div>

                {/* Currency Display with Hover Dropdown */}
                <div className="relative group">
                  <div className="flex items-center gap-1.5 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-9 h-9 relative flex-shrink-0">
                      <Image
                        src="/icons/currency_black.png"
                        alt="Currency"
                        width={36}
                        height={36}
                        className="block dark:hidden"
                      />
                      <Image
                        src="/icons/currency_white.png"
                        alt="Currency"
                        width={36}
                        height={36}
                        className="hidden dark:block"
                      />
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                      0
                    </span>
                  </div>

                  {/* Hover Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <Link
                      href="/adventurebux"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Buy AdventureBux
                    </Link>
                    <Link
                      href="/adventurebux/transactions"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      My Transactions
                    </Link>
                    <Link
                      href="/adventurebux/redeem"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Redeem Codes
                    </Link>
                  </div>
                </div>

                {/* Settings Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <SettingsIcon className="w-9 h-9 text-gray-700 dark:text-gray-300" />
                  </button>

                  {settingsOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setSettingsOpen(false)}
                      ></div>

                      {/* Dropdown Menu */}
                      <div className="fixed top-16 right-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Quick Sign In
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Help & Safety
                        </Link>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleSwitchAccountsClick}
                        >
                          Switch Accounts
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
