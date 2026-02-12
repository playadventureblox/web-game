"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Plus, Share2 } from "lucide-react";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import VerifiedBadge from "../components/VerifiedBadge";
import { usersApi, friendsApi } from "@/lib/api";
import { useRealtime } from "@/contexts/RealtimeContext";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [showRightAd, setShowRightAd] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const { presenceMap } = useRealtime();

  // Fetch user data and friends
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, friendsResponse] = await Promise.all([
          usersApi.getCurrentUser(),
          friendsApi.getFriends()
        ]);
        
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);
        }
        
        if (friendsResponse.success && friendsResponse.data) {
          const realFriends = (friendsResponse.data.friends || []).map((friend: any) => ({
            id: friend.id,
            name: friend.display_name || friend.username,
            username: friend.username,
            avatar: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
          }));
          setFriends(realFriends);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Placeholder game data
  const games = [
    { id: 1, title: "Adventure Quest", rating: "86% Rating" },
    { id: 2, title: "Battle Arena", rating: "91% Rating" },
    { id: 3, title: "City Builder", rating: "85% Rating" },
    { id: 4, title: "Racing Legends", rating: "59% Rating" },
    { id: 5, title: "Space Explorer", rating: "91% Rating" },
    { id: 6, title: "Fantasy World", rating: "83% Rating" },
    { id: 7, title: "Zombie Survival", rating: "55% Rating" },
    { id: 8, title: "Parkour Master", rating: "56% Rating" },
  ];


  // Mock feed data
  const feedPosts = [
    {
      id: 1,
      type: "url",
      url: "youtube.com/isotoxic",
      group: "isoToxic Fan Group",
      groupIcon: "https://robohash.org/isotoxic?set=set3",
      content: "*qotd* should i quit yt or",
      author: "SubToiSoToxic",
      timestamp: "Jan 21, 2018 | 3:25 PM",
    },
    {
      id: 2,
      type: "post",
      group: "ProjectSupreme",
      groupIcon: "https://robohash.org/supreme?set=set3",
      content: "New update coming soon!",
      author: "DevTeam",
      timestamp: "Jan 20, 2018 | 2:15 PM",
    },
  ];


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content with Ads */}
        <div className="flex justify-center gap-4 px-4 py-8">
          {/* Left Skyscraper Ad */}
          {showLeftAd && (
            <div className="hidden xl:block flex-shrink-0">
              <div className="relative w-[160px]">
                <button
                  onClick={() => setShowLeftAd(false)}
                  className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10"
                  aria-label="Close ad"
                >
                  ×
                </button>
                <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                  <span className="text-center px-2">Advertisement</span>
                  <span className="text-center px-2 mt-2 text-xs">
                    (160 x 600)
                  </span>
                </div>
                <div className="mt-1 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Advertisement
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Center Content */}
          <main className="max-w-7xl w-full">
            {/* User Greeting Section */}
            <section className="mb-8">
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 relative flex-shrink-0">
                  <Image
                    src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter"
                    alt={user?.username || "User"}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Greeting */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Hello, {user?.display_name || user?.username || "User"}!
                    {user?.is_verified && <VerifiedBadge size="md" />}
                  </h1>
                </div>
              </div>
            </section>

            {/* Friends Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Friends ({friends.length})
                </h2>
                <Link
                  href="/connect"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                {/* Add Friend Button */}
                <Link
                  href="/connect"
                  className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                    <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Add Friend
                  </p>
                </Link>

                {/* Friends */}
                {friends.map((friend) => {
                  const presence = presenceMap.get(friend.id);
                  const status = presence?.presenceStatus || 'offline';
                  const isOnline = status === 'online' || status === 'in-game';
                  
                  return (
                    <Link
                      key={friend.id}
                      href={`/profile/${friend.username}`}
                      className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 relative">
                          <Image
                            src={friend.avatar}
                            alt={friend.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        {/* Status Dot - Online indicator */}
                        {isOnline && (
                          <div
                            className="absolute w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                            style={{ bottom: "-2.5px", right: "-2.5px" }}
                            title={status === 'in-game' ? 'Playing' : 'Online'}
                          />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {friend.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Recommended For You Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Recommended For You
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {/* Game Thumbnail Placeholder */}
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Game Thumbnail
                      </div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded">
                          PLAY
                        </button>
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-500">
                          👍
                        </span>
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Continue Playing Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Continue
                </h2>
                <Link
                  href="/continue"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.slice(0, 4).map((game) => (
                  <div
                    key={`continue-${game.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Game Thumbnail
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded">
                          PLAY
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="text-green-600">👍</span>
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sponsored Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Sponsored
                </h2>
                <Link
                  href="/sponsored"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {games.slice(0, 5).map((game) => (
                  <div
                    key={`sponsored-${game.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Game Thumbnail
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded">
                          PLAY
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-500">
                          👍
                        </span>
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended For You Section (2nd) */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Recommended For You
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.map((game) => (
                  <div
                    key={`recommended2-${game.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Game Thumbnail
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded">
                          PLAY
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-500">
                          👍
                        </span>
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Favorites Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Favorites
                </h2>
                <Link
                  href="/favorites"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.slice(0, 4).map((game) => (
                  <div
                    key={`favorites-${game.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Game Thumbnail
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded">
                          PLAY
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-500">
                          👍
                        </span>
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* My Feed Section */}
            <section className="mb-12">
              <div>
                {/* My Feed */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    My Feed
                  </h2>

                  {/* URL Share Input */}
                  <div className="mb-6 flex gap-2">
                    <input
                      type="text"
                      placeholder="youtube.com/isotoxic"
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                      Share
                    </button>
                  </div>

                  {/* Feed Posts */}
                  <div className="space-y-4">
                    {feedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        {/* Group Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                            <Image
                              src={post.groupIcon}
                              alt={post.group}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {post.group}
                          </span>
                        </div>

                        {/* Post Content */}
                        {post.type === "url" && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Share2 className="w-4 h-4" />
                              <span className="font-mono">{post.url}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                          {post.content}
                        </p>

                        {/* Post Footer */}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          (posted by{" "}
                          <span className="text-blue-600 dark:text-blue-400">
                            {post.author}
                          </span>
                          ) {post.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Right Skyscraper Ad */}
          {showRightAd && (
            <div className="hidden xl:block flex-shrink-0">
              <div className="relative w-[160px]">
                <button
                  onClick={() => setShowRightAd(false)}
                  className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10"
                  aria-label="Close ad"
                >
                  ×
                </button>
                <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                  <span className="text-center px-2">Advertisement</span>
                  <span className="text-center px-2 mt-2 text-xs">
                    (160 x 600)
                  </span>
                </div>
                <div className="mt-1 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Advertisement
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />

        {/* Sidebar Overlay */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
