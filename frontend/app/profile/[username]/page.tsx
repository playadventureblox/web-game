"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Users,
  ExternalLink,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import VerifiedBadge from "../../components/VerifiedBadge";
import { usersApi, friendsApi, groupsApi } from "@/lib/api";
import { openChatWithUser } from "@/app/components/ChatWidget";
import { useParams } from "next/navigation";
import { useUserPresence } from "@/hooks/useUserPresence";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id?: string;
  username: string;
  display_name?: string;
  bio?: string;
  status_message?: string;
  is_verified?: boolean;
}

const ProfilePage = () => {
  const params = useParams();
  const profileUsername = params?.username as string;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [currentWearingIndex, setCurrentWearingIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarViewMode, setAvatarViewMode] = useState<"2D" | "3D">("3D");
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const menuRef = useRef<HTMLDivElement>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [editedStatusMessage, setEditedStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [showAdvertisement, setShowAdvertisement] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [showRightAd, setShowRightAd] = useState(true);
  
  const [relationship, setRelationship] = useState<{
    isFriend: boolean;
    friendRequestStatus: 'sent' | 'received' | null;
    isFollowing: boolean;
    isBestFriend: boolean;
    isBlocked: boolean;
  } | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  const realtimePresence = useUserPresence(profileUser?.id);
useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, currentUserResponse] = await Promise.all([
          usersApi.getUserByUsername(profileUsername),
          usersApi.getCurrentUser(),
        ]);

        let viewedUser: any = null;
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data as any;
          viewedUser = profileData.user;
        }

        let currentUserData: any = null;
        if (currentUserResponse.success && currentUserResponse.data) {
          currentUserData = currentUserResponse.data.user as any;
          setCurrentUser(currentUserData);
        }

        const isOwn = !!(currentUserData && currentUserData.username === profileUsername);
        setIsOwnProfile(isOwn);

        if (isOwn && currentUserData) {
          setProfileUser(currentUserData);
          setDisplayName(currentUserData.display_name || currentUserData.username);
          setUsername(currentUserData.username);
          setEditedDisplayName(currentUserData.display_name || currentUserData.username);
          setEditedUsername(currentUserData.username);
          setBio(currentUserData.bio || "");
          setEditedBio(currentUserData.bio || "");
          if (currentUserData.status_message) {
            setStatusMessage(currentUserData.status_message);
            setEditedStatusMessage(currentUserData.status_message);
          }
          setRelationship(null);
        } else if (viewedUser) {
          setProfileUser(viewedUser);
          setDisplayName(viewedUser.display_name || viewedUser.username);
          setUsername(viewedUser.username);
          setBio(viewedUser.bio || "");
          if (viewedUser.status_message) {
            setStatusMessage(viewedUser.status_message);
          }

          if (currentUserData && viewedUser.id) {
            try {
              const relResponse = await usersApi.getRelationship(viewedUser.id);
              if (relResponse.success && relResponse.data) {
                setRelationship(relResponse.data as any);
              } else {
                setRelationship({ isFriend: false, friendRequestStatus: null, isFollowing: false, isBestFriend: false, isBlocked: false });
              }
            } catch { /* ignore */ }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (profileUsername) {
      fetchData();
    }
  }, [profileUsername]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = ["About", "Creations"];
  const currentlyWearing: any[] = [];
  const favorites: any[] = [];

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profileUser?.id) return;
      try {
        const friendsResponse = isOwnProfile 
          ? await friendsApi.getFriends()
          : await friendsApi.getUserFriends(profileUser.id);
        if (friendsResponse.success && friendsResponse.data) {
          const realFriends = (friendsResponse.data.friends || []).map((friend: any) => ({
            id: friend.id,
            name: friend.display_name || friend.username,
            username: `@${friend.username}`,
            avatar: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
            status: "offline",
          }));
          setFriends(realFriends);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();

    if (!profileUser?.id || isOwnProfile) return;

    const channel = supabase
      .channel('profile-friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `userId=eq.${profileUser.id}` }, () => { fetchFriends(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id, isOwnProfile]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!profileUser?.id) return;
      setLoadingGroups(true);
      try {
        const response = isOwnProfile
          ? await groupsApi.getUserGroups()
          : await groupsApi.getGroupsForUser(profileUser.id);
        if (response.success && response.data) {
          const rawGroups = response.data.groups || [];
          const userGroups = await Promise.all(rawGroups.map(async (group: any) => {
            try {
              const detailRes = await groupsApi.getGroupById(group.id);
              const realCount = detailRes.success ? (detailRes.data?.group as any)?.member_count : group.member_count;
              return {
                id: group.id,
                name: group.name,
                description: group.description || '',
                image: group.icon_url || `https://robohash.org/${group.name}?set=set3`,
                members: (realCount ?? group.member_count)?.toLocaleString() || '0',
                rank: group.role || 'Member',
                verified: group.is_verified || false,
                isPrimary: group.id === profileUser?.primary_group_id,
              };
            } catch {
              return {
                id: group.id,
                name: group.name,
                description: group.description || '',
                image: group.icon_url || `https://robohash.org/${group.name}?set=set3`,
                members: group.member_count?.toLocaleString() || '0',
                rank: group.role || 'Member',
                verified: group.is_verified || false,
                isPrimary: false,
              };
            }
          }));
          userGroups.sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
          setGroups(userGroups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();

    const refetchRelationship = async () => {
      if (!profileUser?.id || isOwnProfile) return;
      try {
        const relationshipResponse = await usersApi.getRelationship(profileUser.id);
        if (relationshipResponse.success && relationshipResponse.data) {
          setRelationship(relationshipResponse.data as any);
        }
      } catch (error) {
        console.error('Error refetching relationship:', error);
      }
    };

    if (!profileUser?.id) return;

    const groupsChannel = supabase
      .channel('profile-groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `userId=eq.${profileUser.id}` }, () => { fetchGroups(); })
      .subscribe();

    const friendshipsChannel = supabase
      .channel('profile-relationship-friendships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => { refetchRelationship(); })
      .subscribe();

    const requestsChannel = supabase
      .channel('profile-relationship-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => { refetchRelationship(); })
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(friendshipsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [profileUser?.id, isOwnProfile]);

  useEffect(() => {
    if (!profileUser?.id) return;
    const channel = supabase
      .channel('profile-bio-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${profileUser.id}` },
        (payload: any) => {
          if (payload.new && 'bio' in payload.new) {
            setBio(payload.new.bio || '');
            if (!isEditingBio) setEditedBio(payload.new.bio || '');
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id, isEditingBio]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      if (!profileUser?.id) return;
      try {
        const response = await usersApi.getUserSocialLinks(profileUser.id);
        if (response.success && response.data) {
          setSocialLinks(response.data.socialLinks || []);
        }
      } catch (error) {
        console.error('Error fetching social links:', error);
      }
    };

    fetchSocialLinks();

    if (!profileUser?.id) return;

    const channel = supabase
      .channel('profile-social-links-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_social_links', filter: `userId=eq.${profileUser.id}` }, () => { fetchSocialLinks(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id]);

  const [groupsViewMode, setGroupsViewMode] = useState<"carousel" | "grid">("carousel");
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const groupsPerPage = 3;
  const maxGroupIndex = Math.max(0, groups.length - groupsPerPage);
  const visibleGroups = groups.slice(currentGroupIndex, currentGroupIndex + groupsPerPage);
  const showPrevGroup = currentGroupIndex > 0;
  const showNextGroup = currentGroupIndex < maxGroupIndex;

  const handlePrevGroup = () => { setCurrentGroupIndex((prev) => Math.max(0, prev - groupsPerPage)); };
  const handleNextGroup = () => { setCurrentGroupIndex((prev) => Math.min(maxGroupIndex, prev + groupsPerPage)); };

  const robloxBadges: any[] = [];
  const badges: any[] = [];

  const experiences = [
    {
      id: "1",
      title: `${displayName || "User"}'s Place`,
      description: "This is your very first AdventureBlox creation. Check it out, then make it your own with AdventureBlox Studio!",
      imageUrl: "",
      active: 0,
      visits: 0,
    },
  ];

  const itemsPerPage = 8;
  const visibleWearingItems = currentlyWearing.slice(currentWearingIndex, currentWearingIndex + itemsPerPage);

  const handleEditBio = () => { setEditedBio(bio); setIsEditingBio(true); };
  const handleCancelBio = () => { setEditedBio(bio); setIsEditingBio(false); };

  const handleSaveBio = async () => {
    try {
      const response = await usersApi.updateProfile({ bio: editedBio });
      if (response.success) { setBio(editedBio); setIsEditingBio(false); }
      else { alert("Failed to save bio. Please try again."); }
    } catch (error) { alert("An error occurred while saving bio."); }
  };

  const handleFollowToggle = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      if (relationship?.isFollowing) {
        const response = await usersApi.unfollowUser(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isFollowing: false } : null);
      } else {
        const response = await usersApi.followUser(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isFollowing: true } : null);
      }
    } catch (error) { console.error('Follow toggle error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleSendFriendRequest = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.sendFriendRequest(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, friendRequestStatus: 'sent' } : null);
    } catch (error) { console.error('Send friend request error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleUnfriend = async () => {
    if (!profileUser?.id || !window.confirm('Are you sure you want to unfriend this user?')) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.removeFriend(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, isFriend: false, isBestFriend: false } : null);
    } catch (error) { console.error('Unfriend error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleBestFriendToggle = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      if (relationship?.isBestFriend) {
        const response = await friendsApi.removeBestFriend(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isBestFriend: false } : null);
      } else {
        const response = await friendsApi.addBestFriend(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isBestFriend: true } : null);
      }
    } catch (error) { console.error('Best friend toggle error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleBlockUser = async () => {
    if (!profileUser?.id || !window.confirm('Are you sure you want to block this user?')) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.blockUser(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, isBlocked: true, isFriend: false } : null);
    } catch (error) { console.error('Block user error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleReportAbuse = () => { alert('Report abuse functionality coming soon'); setShowProfileMenu(false); };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLastOnline = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const getPresenceStatus = (): { color: string; hasIcon: boolean; label: string } | null => {
    const status = realtimePresence?.presenceStatus || profileUser?.presence_status || 'offline';
    const currentGame = realtimePresence?.currentGame || profileUser?.current_game;
    if (status === 'online') return { color: 'bg-blue-500', hasIcon: false, label: 'Online' };
    if (status === 'in-game') return { color: 'bg-green-500', hasIcon: true, label: currentGame ? `Playing ${currentGame}` : 'In Game' };
    return null;
  };

  const handleSaveProfile = async () => {
    setSaveError("");
    setIsSavingProfile(true);
    try {
      const displayNameChanged = editedDisplayName !== displayName;
      const usernameChanged = editedUsername !== username;
      const statusMessageChanged = editedStatusMessage !== statusMessage;

      if (!displayNameChanged && !usernameChanged && !statusMessageChanged) {
        setShowEditProfileModal(false); setIsSavingProfile(false); return;
      }

      if (displayNameChanged) {
        if (!editedDisplayName.trim()) { setSaveError("Display name cannot be empty"); setIsSavingProfile(false); return; }
        if (editedDisplayName.length < 3 || editedDisplayName.length > 50) { setSaveError("Display name must be between 3 and 50 characters"); setIsSavingProfile(false); return; }
      }

      if (usernameChanged) {
        if (!editedUsername.trim()) { setSaveError("Username cannot be empty"); setIsSavingProfile(false); return; }
        if (editedUsername.length < 3 || editedUsername.length > 20) { setSaveError("Username must be between 3 and 20 characters"); setIsSavingProfile(false); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(editedUsername)) { setSaveError("Username can only contain letters, numbers, and underscores"); setIsSavingProfile(false); return; }
      }

      const updateData: any = {};
      if (displayNameChanged) updateData.displayName = editedDisplayName;
      if (usernameChanged) updateData.username = editedUsername;
      if (statusMessageChanged) updateData.statusMessage = editedStatusMessage;

      const response = await usersApi.updateProfile(updateData);

      if (response.success) {
        if (displayNameChanged) setDisplayName(editedDisplayName);
        if (usernameChanged) setUsername(editedUsername);
        if (statusMessageChanged) setStatusMessage(editedStatusMessage);
        setShowEditProfileModal(false);

        const userResponse = await usersApi.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          const refreshedUser = userResponse.data.user as UserProfile;
          setProfileUser(refreshedUser);
          setDisplayName(refreshedUser.display_name || refreshedUser.username);
          setUsername(refreshedUser.username);
          setStatusMessage(refreshedUser.status_message || "");
        }
      } else {
        setSaveError(response.message || "Failed to update profile");
      }
    } catch (error) {
      setSaveError("An error occurred. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <div className="flex justify-center gap-4 px-4">
        {/* Left Skyscraper Ad */}
        {showLeftAd && (
          <div className="hidden xl:block flex-shrink-0 pt-[130px]">
            <div className="relative w-[160px]">
              <button onClick={() => setShowLeftAd(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
              <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                <span className="text-center px-2">Advertisement</span>
                <span className="text-center px-2 mt-2 text-xs">(160 x 600)</span>
              </div>
              <div className="mt-1 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-[900px]">
          {showAdvertisement && (
            <div className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="w-full relative">
                <button onClick={() => setShowAdvertisement(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
                <div className="w-full h-[90px] bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                  Advertisement Banner (728 x 90)
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span>
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline">Report</button>
                </div>
              </div>
            </div>
          )}

          <div className="px-4">
            <div className="flex items-start gap-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                  <Image src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter" alt={username || "User Avatar"} fill className="object-cover" />
                </div>
                {getPresenceStatus() && (
                  <div className={`absolute w-7 h-7 ${getPresenceStatus()?.color} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900`} style={{ bottom: "-3.5px", right: "-3.5px" }} title={getPresenceStatus()?.label}>
                    {getPresenceStatus()?.hasIcon && <FontAwesomeIcon icon={faGamepad} className="text-white text-xs" />}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {displayName || "User"}
                      {profileUser?.is_verified && <VerifiedBadge size="md" />}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{username || "user"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      ID: {profileUser?.id ? profileUser.id.replace(/-/g, '').substring(0, 9).toUpperCase() : ''}
                    </p>
                    {statusMessage && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{statusMessage}"</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {profileUser && (
                      <>
                        {isOwnProfile ? (
                          <>
                            <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Edit Profile</button>
                            <Link href="/avatar"><button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Edit Avatar</button></Link>
                          </>
                        ) : (
                          <>
                            {relationship?.isFriend ? (
                              <>
                                <button onClick={() => openChatWithUser(profileUser.id, profileUser.username, profileUser.display_name, profileUser.avatar_url)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Message</button>
                                <button onClick={handleUnfriend} disabled={isLoadingAction} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors disabled:opacity-50">Unfriend</button>
                              </>
                            ) : relationship?.friendRequestStatus === 'sent' ? (
                              <button disabled className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg text-sm cursor-not-allowed">Request Sent</button>
                            ) : relationship?.friendRequestStatus === 'received' ? (
                              <button onClick={handleSendFriendRequest} disabled={isLoadingAction} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors">Accept Friend Request</button>
                            ) : (
                              <button onClick={handleSendFriendRequest} disabled={isLoadingAction} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">Add Friend</button>
                            )}
                          </>
                        )}
                      </>
                    )}

                    <div className="relative" ref={menuRef}>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                          {isOwnProfile ? (
                            <>
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowProfileMenu(false)}>Inventory</button>
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowProfileMenu(false)}>Favorites</button>
                            </>
                          ) : (
                            <>
                              {relationship?.isFriend && (
                                <>
                                  <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleBestFriendToggle(); setShowProfileMenu(false); }}>
                                    {relationship?.isBestFriend ? 'Remove Best Friend' : 'Make Best Friend'}
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                </>
                              )}
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleFollowToggle(); setShowProfileMenu(false); }}>
                                {relationship?.isFollowing ? 'Unfollow' : 'Follow'}
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleBlockUser(); setShowProfileMenu(false); }}>Block User</button>
                              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleReportAbuse}>Report Abuse</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3">
                  <Link href="/connect" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{friends.length}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Friends</span>
                  </Link>
                  <Link href="/connect?tab=Followers" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{profileUser?.follower_count || 0}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Follower{profileUser?.follower_count !== 1 ? 's' : ''}</span>
                  </Link>
                  <Link href="/connect?tab=Following" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{profileUser?.following_count || 0}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Following</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
{activeTab === "About" ? (
              <div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">About</h2>
                      {isOwnProfile && !isEditingBio && (
                        <button onClick={handleEditBio} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                    {socialLinks.length > 0 && (
                      <div className="flex items-center gap-3">
                        {socialLinks.map((link) => (
                          <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title={link.platform}>
                            {link.platform === 'youtube' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>}
                            {link.platform === 'twitter' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>}
                            {link.platform === 'twitch' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#9146FF"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" /></svg>}
                            {link.platform === 'discord' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>}
                            {link.platform === 'github' && <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>}
                            {!['youtube', 'twitter', 'twitch', 'discord', 'github'].includes(link.platform) && <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h4v2h-4v4h-2v-4H7v-2h4V7h2v4z" /></svg>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEditingBio ? (
                    <div>
                      <textarea value={editedBio} onChange={(e) => setEditedBio(e.target.value.slice(0, 1000))} placeholder="Tell the AdventureBlox community about what you like to make, build, and explore..." className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600" />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Keep yourself safe, do not share personal details online.</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{editedBio.length}/1000</p>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={handleCancelBio} className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
                        <button onClick={handleSaveBio} className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">Save</button>
                      </div>
                    </div>
                  ) : bio ? (
                    <p className="text-sm text-gray-900 dark:text-gray-100">{bio}</p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No bio yet</p>
                  )}
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Currently Wearing</h2>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 w-80">
                        <div className="absolute top-3 right-3">
                          <button onClick={() => setAvatarViewMode(avatarViewMode === "3D" ? "2D" : "3D")} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-medium transition-colors border border-gray-300 dark:border-gray-600">{avatarViewMode}</button>
                        </div>
                        <div className="flex justify-center items-end h-48 mt-6">
                          <svg width="100" height="150" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="35" y="0" width="50" height="50" rx="8" fill="#F5D0C5" />
                            <ellipse cx="60" cy="15" rx="30" ry="20" fill="#B85C38" />
                            <ellipse cx="60" cy="5" rx="20" ry="12" fill="#B85C38" />
                            <circle cx="75" cy="8" r="12" fill="#B85C38" />
                            <circle cx="48" cy="30" r="3" fill="#393939" />
                            <circle cx="72" cy="30" r="3" fill="#393939" />
                            <path d="M52 40 Q60 48 68 40" stroke="#393939" strokeWidth="2" fill="none" />
                            <rect x="30" y="55" width="60" height="50" rx="4" fill="#4A90A4" />
                            <rect x="30" y="65" width="60" height="6" fill="#6BA8BC" />
                            <rect x="30" y="77" width="60" height="6" fill="#6BA8BC" />
                            <rect x="30" y="89" width="60" height="6" fill="#6BA8BC" />
                            <rect x="10" y="55" width="18" height="45" rx="4" fill="#F5D0C5" />
                            <rect x="92" y="55" width="18" height="45" rx="4" fill="#F5D0C5" />
                            <rect x="32" y="108" width="25" height="70" rx="4" fill="#8B4513" />
                            <rect x="63" y="108" width="25" height="70" rx="4" fill="#8B4513" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-4 gap-2">
                        {visibleWearingItems.map((item) => (
                          <div key={item.id} className="cursor-pointer group">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Friends ({friends.length})</h2>
                    <Link href="/connect" className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></Link>
                  </div>
                  <div className="flex gap-6">
                    {friends.map((connection) => (
                      <Link key={connection.id} href={`/profile/${connection.username}`} className="flex flex-col items-center cursor-pointer group">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                            <Image src={connection.avatar} alt={connection.name} fill className="object-cover" />
                          </div>
                          {connection.status && connection.status !== "offline" && (
                            <div className={`absolute w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${connection.status === "online-game" ? "bg-green-500" : connection.status === "online" ? "bg-blue-500" : connection.status === "studio" ? "bg-orange-500" : "bg-gray-400"}`} style={{ bottom: "-2px", right: "-2px" }} />
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-900 dark:text-gray-100">{connection.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {!loadingGroups && groups.length > 0 && (
                  <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Groups</h2>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setGroupsViewMode("carousel")} className={`p-2 rounded transition-colors ${groupsViewMode === "carousel" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                        <button onClick={() => setGroupsViewMode("grid")} className={`p-2 rounded transition-colors ${groupsViewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                      </div>
                    </div>

                    {groupsViewMode === "carousel" && groups.length > 0 && (
                      <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                        <div className="flex h-[260px]">
                          {currentGroupIndex > 0 && (
                            <button onClick={(e) => { e.preventDefault(); setCurrentGroupIndex(Math.max(0, currentGroupIndex - 1)); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors shadow">
                              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          )}
                          <Link href={`/groups/${groups[currentGroupIndex]?.id}`} className="w-[260px] h-full flex-shrink-0 bg-blue-500 dark:bg-gray-700 relative block">
                            <Image src={groups[currentGroupIndex]?.image || `https://robohash.org/${groups[currentGroupIndex]?.name}?set=set3`} alt={groups[currentGroupIndex]?.name || ""} fill className="object-cover" sizes="180px" />
                          </Link>
                          <Link href={`/groups/${groups[currentGroupIndex]?.id}`} className="flex-1 p-6 flex flex-col justify-between block">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{groups[currentGroupIndex]?.name}</h3>
                              <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-3" />
                            </div>
                            <div className="flex gap-10">
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Members</p>
                                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{groups[currentGroupIndex]?.members?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Rank</p>
                                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{groups[currentGroupIndex]?.rank || "Member"}</p>
                              </div>
                            </div>
                          </Link>
                          {currentGroupIndex < groups.length - 1 && (
                            <button onClick={(e) => { e.preventDefault(); setCurrentGroupIndex(Math.min(groups.length - 1, currentGroupIndex + 1)); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors shadow">
                              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {groupsViewMode === "grid" && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {groups.map((group) => (
                          <Link key={group.id} href={`/groups/${group.id}`} className="block group/card">
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg relative">
                              <Image src={group.image} alt={group.name} fill className="object-cover group-hover/card:opacity-90 transition-opacity" sizes="(max-width: 640px) 33vw, 25vw" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 truncate">{group.name}</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{group.members} Members · {group.rank || "Member"}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Favorites</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">Favorites<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  {favorites.length > 0 ? (
                    <div className="flex gap-4">{favorites.map((game: any) => (<div key={game.id} className="w-[200px] cursor-pointer group"><div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700" /><h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{game.name}</h3></div>))}</div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No favorite games yet.</p>
                  )}
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">AdventureBlox Badges</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  {robloxBadges.length > 0 ? (
                    <div className="flex gap-4">{robloxBadges.map((badge: any) => (<div key={badge.id} className="cursor-pointer group"><div className="w-[120px] aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700" /><p className="mt-2 text-sm text-gray-900 dark:text-gray-100 text-center">{badge.name}</p></div>))}</div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No badges earned yet.</p>
                  )}
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Badges</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  {badges.length > 0 ? (
                    <div className="flex gap-4">{badges.map((badge: any) => (<div key={badge.id} className="cursor-pointer group"><div className="w-[120px] aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 relative">{badge.image && <Image src={badge.image} alt={badge.name} fill className="object-cover" />}</div><p className="mt-2 text-xs text-gray-900 dark:text-gray-100 text-center truncate">{badge.name}</p></div>))}</div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No player badges yet.</p>
                  )}
                </div>

                <div className="py-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Statistics</h2>
                  <div className="flex justify-between items-start">
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Join Date</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDate(profileUser?.created_at)}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Online</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {(realtimePresence?.presenceStatus === 'online' || realtimePresence?.presenceStatus === 'in-game') || (profileUser?.presence_status === 'online' || profileUser?.presence_status === 'in-game') ? 'Now' : formatLastOnline(realtimePresence?.lastOnline || profileUser?.last_online)}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Place Visits</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{currentUser?.visit_count || profileUser?.visit_count || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
) : (
              <div className="py-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Experiences</h2>
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Monitor className="w-4 h-4 text-gray-900 dark:text-gray-100" /></button>
                    <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><LayoutGrid className="w-4 h-4 text-gray-900 dark:text-gray-100" /></button>
                  </div>
                </div>

                {viewMode === "list" ? (
                  <div className="space-y-6">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="flex gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
                        <div className="w-[280px] h-[180px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">ADVENTUREBLOX</span>
                          </div>
                        </div>
                        <div className="flex-1 py-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{exp.title}</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{exp.description}</p>
                          <div className="flex gap-12 mt-8">
                            <div><p className="text-sm text-gray-600 dark:text-gray-400">Active</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{exp.active}</p></div>
                            <div><p className="text-sm text-gray-600 dark:text-gray-400">Visits</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{exp.visits}</p></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="cursor-pointer group">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                          <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">ADVENTUREBLOX</span>
                          </div>
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">{exp.title}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Skyscraper Ad */}
        {showRightAd && (
          <div className="hidden xl:block flex-shrink-0 pt-[130px]">
            <div className="relative w-[160px]">
              <button onClick={() => setShowRightAd(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
              <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                <span className="text-center px-2">Advertisement</span>
                <span className="text-center px-2 mt-2 text-xs">(160 x 600)</span>
              </div>
              <div className="mt-1 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => { setShowEditProfileModal(false); setEditedDisplayName(displayName); setEditedUsername(username.replace("@", "")); setEditedStatusMessage(statusMessage); }} className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
              <input type="text" value={editedDisplayName} onChange={(e) => setEditedDisplayName(e.target.value)} maxLength={20} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedDisplayName.length}/20</div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-500 dark:text-gray-400 font-medium select-none pointer-events-none">@</span>
                <input type="text" value={editedUsername} onChange={(e) => setEditedUsername(e.target.value)} maxLength={20} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 pl-8 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="username" />
              </div>
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedUsername.length}/20</div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status Message</label>
              <input type="text" value={editedStatusMessage} onChange={(e) => setEditedStatusMessage(e.target.value)} maxLength={50} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="What's on your mind?" />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedStatusMessage.length}/50</div>
            </div>

            {saveError && <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">{saveError}</div>}

            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowEditProfileModal(false); setEditedDisplayName(displayName); setEditedUsername(username.replace("@", "")); setEditedStatusMessage(statusMessage); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded transition-colors">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingProfile ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
