"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Plus, Loader2, ImagePlus, X } from "lucide-react";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import VerifiedBadge from "../components/VerifiedBadge";
import { usersApi, friendsApi, feedApi, uploadApi } from "@/lib/api";
import { useRealtime } from "@/contexts/RealtimeContext";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [showRightAd, setShowRightAd] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedPostText, setFeedPostText] = useState("");
  const [feedPostImage, setFeedPostImage] = useState<File | null>(null);
  const [feedPostImagePreview, setFeedPostImagePreview] = useState<string | null>(null);
  const [postingFeed, setPostingFeed] = useState(false);
  const { presenceMap } = useRealtime();

  // Fetch user data, friends, and feed
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, friendsResponse, feedResponse] = await Promise.all([
          usersApi.getCurrentUser(),
          friendsApi.getFriends(),
          feedApi.getPosts(20, 0),
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

        if (feedResponse.success && feedResponse.data) {
          setFeedPosts((feedResponse.data as any).posts || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingFeed(false);
      }
    };
    fetchData();
  }, []);

  // Feed image handling
  const handleFeedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    setFeedPostImage(file);
    setFeedPostImagePreview(URL.createObjectURL(file));
  };
  const handleRemoveFeedImage = () => {
    setFeedPostImage(null);
    if (feedPostImagePreview) URL.revokeObjectURL(feedPostImagePreview);
    setFeedPostImagePreview(null);
  };

  // Post to homepage feed
  const handleFeedPost = async () => {
    if (!feedPostText.trim() && !feedPostImage) return;
    setPostingFeed(true);
    try {
      let imageUrl: string | undefined;
      if (feedPostImage) {
        const uploadResponse = await uploadApi.uploadImage(feedPostImage, 'feed-post');
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = (uploadResponse.data as { url: string }).url;
        } else {
          alert("Failed to upload image."); setPostingFeed(false); return;
        }
      }
      const response = await feedApi.createPost({ content: feedPostText.trim() || undefined, imageUrl });
      if (response.success && response.data) {
        setFeedPosts([(response.data as any).post, ...feedPosts]);
        setFeedPostText("");
        handleRemoveFeedImage();
      }
    } catch (error) {
      console.error("Error posting to feed:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setPostingFeed(false);
    }
  };

  // Game data removed - will come from real API


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

            {/* Recently Played Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Recently Played
                </h2>
                <Link
                  href="/continue"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  See All
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No recently played games yet.</p>
            </section>

            {/* My Favorites Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  My Favorites
                </h2>
                <Link
                  href="/favorites"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  See All
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No favorite games yet.</p>
            </section>

            {/* My Feed Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                My Feed
              </h2>

              {/* Post Composer */}
              <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">What&apos;s happening today?</p>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">FEED</h3>
                <div className="flex gap-2">
                  <textarea
                    value={feedPostText}
                    onChange={(e) => setFeedPostText(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={3}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex flex-col gap-1 justify-end">
                    <label className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors" title="Attach image">
                      <ImagePlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input type="file" accept="image/*" onChange={handleFeedImageSelect} className="hidden" />
                    </label>
                    <button
                      onClick={handleFeedPost}
                      disabled={(!feedPostText.trim() && !feedPostImage) || postingFeed}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {postingFeed ? "..." : "Post"}
                    </button>
                  </div>
                </div>
                {feedPostImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={feedPostImagePreview} alt="Preview" className="max-h-24 rounded-lg border border-gray-300 dark:border-gray-600" />
                    <button onClick={handleRemoveFeedImage} className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Feed Posts */}
              {loadingFeed ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : feedPosts.length > 0 ? (
                <div className="space-y-4">
                  {feedPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      {/* Author */}
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 relative">
                          <Image
                            src={`https://robohash.org/${post.author_username}?set=set3`}
                            alt={post.author_display_name || post.author_username}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/profile/${post.author_username}`}
                              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                            >
                              {post.author_display_name || post.author_username}
                            </Link>
                            {post.author_is_verified && <VerifiedBadge size="sm" />}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                const diff = Date.now() - new Date(post.created_at).getTime();
                                const mins = Math.floor(diff / 60000);
                                if (mins < 1) return "just now";
                                if (mins < 60) return `${mins} minutes ago`;
                                const hrs = Math.floor(mins / 60);
                                if (hrs < 24) return `${hrs} hours ago`;
                                const days = Math.floor(hrs / 24);
                                return `${days} days ago`;
                              })()}
                            </span>
                          </div>
                          {post.content && (
                            <p className="text-sm text-gray-900 dark:text-gray-100 mt-1.5 whitespace-pre-wrap break-words">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Post Image */}
                      {post.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={post.image_url} alt="Post image" className="max-w-full max-h-96 object-contain" />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={async () => {
                            const res = await feedApi.toggleLike(post.id);
                            if (res.success) {
                              setFeedPosts(feedPosts.map((p: any) =>
                                p.id === post.id
                                  ? { ...p, likes: (res.data as any)?.liked ? p.likes + 1 : Math.max(0, p.likes - 1), liked_by_me: (res.data as any)?.liked }
                                  : p
                              ));
                            }
                          }}
                          className={`flex items-center gap-1 text-xs font-medium transition-colors ${post.liked_by_me ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                        >
                          ♥ {post.likes || 0}
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          💬 {post.comment_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No posts yet. Be the first to share something!</p>
                </div>
              )}
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
