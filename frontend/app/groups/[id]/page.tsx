"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, Loader2 } from "lucide-react";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import GamesSection from "../../components/groups/GamesSection";
import MembersSection from "../../components/groups/MembersSection";
import SocialLinksSection from "../../components/groups/SocialLinksSection";
import DescriptionSection from "../../components/groups/DescriptionSection";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ReportModal from "@/components/modals/ReportModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { groupsApi } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  cover_photo_url?: string;
  owner_id: string;
  member_count: number;
  is_verified: boolean;
  role?: string;
  owner_username?: string;
  owner_display_name?: string;
  shout_text?: string;
  shout_image_url?: string;
  shout_posted_at?: string;
  shout_posted_by?: string;
  shout_posted_by_username?: string;
  shout_posted_by_avatar?: string;
  join_setting?: string;
  created_at?: string;
}

const GroupDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [shoutText, setShoutText] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentGroupDetails, setCurrentGroupDetails] = useState<Group | null>(
    null,
  );
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [wallPosts, setWallPosts] = useState<
    Array<{
      id: string;
      content: string;
      likes: number;
      reply_count: number;
      created_at: string;
      author_id: string;
      author_username: string;
      author_display_name?: string;
      author_is_verified: boolean;
    }>
  >([]);
  const [loadingWallPosts, setLoadingWallPosts] = useState(true);
  const [postingWall, setPostingWall] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({});

  // Modal states
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [alliances, setAlliances] = useState<
    Array<{
      id: string;
      allied_group_id: string;
      allied_group_name: string;
      allied_group_icon?: string;
      allied_group_member_count: number;
      allied_group_verified: boolean;
    }>
  >([]);
  const [loadingAlliances, setLoadingAlliances] = useState(true);

  // Fetch user's groups for sidebar
  useEffect(() => {
    const fetchUserGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await groupsApi.getUserGroups();
        if (response.success && response.data) {
          setUserGroups((response.data.groups as Group[]) || []);
        }
      } catch (error) {
        console.error("Failed to fetch user groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchUserGroups();
  }, [groupId]);

  // Fetch full details of the current group
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;

      try {
        const response = await groupsApi.getGroupById(groupId);
        if (response.success && response.data) {
          setCurrentGroupDetails(response.data.group as Group);
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  // Fetch alliances
  useEffect(() => {
    const fetchAlliances = async () => {
      if (!groupId) return;

      setLoadingAlliances(true);
      try {
        const response = await groupsApi.getGroupAlliances(groupId);
        if (response.success && response.data) {
          setAlliances((response.data.alliances as typeof alliances) || []);
        }
      } catch (error) {
        console.error("Error fetching alliances:", error);
      } finally {
        setLoadingAlliances(false);
      }
    };

    fetchAlliances();
  }, [groupId]);

  // Get current group - prefer detailed data, fallback to sidebar data
  const currentGroup =
    currentGroupDetails || userGroups.find((g) => g.id === groupId);

  // Fetch wall posts
  useEffect(() => {
    const fetchWallPosts = async () => {
      if (!groupId) return;

      setLoadingWallPosts(true);
      try {
        const response = await groupsApi.getGroupWallPosts(groupId, 1, 20);
        if (response.success && response.data) {
          setWallPosts((response.data.posts as typeof wallPosts) || []);
        }
      } catch (error) {
        console.error("Error fetching wall posts:", error);
      } finally {
        setLoadingWallPosts(false);
      }
    };

    fetchWallPosts();
  }, [groupId]);

  // Handle wall post submission
  const handlePostSubmit = async () => {
    if (!groupId || !newPost.trim()) return;

    setPostingWall(true);
    try {
      const response = await groupsApi.createGroupWallPost(
        groupId,
        newPost.trim(),
      );
      if (response.success && response.data) {
        // Add new post to the beginning of the list
        setWallPosts([
          response.data.post as (typeof wallPosts)[0],
          ...wallPosts,
        ]);
        setNewPost("");
      }
    } catch (error) {
      console.error("Error posting to wall:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setPostingWall(false);
    }
  };

  // Handle join group
  const handleJoinGroup = async () => {
    if (!groupId) return;

    setJoining(true);
    try {
      const response = await groupsApi.joinGroup(groupId);
      if (response.success) {
        const requiresApproval = (response as any).requiresApproval;
        
        if (requiresApproval) {
          // Join request submitted - show pending message
          setSuccessMessage({
            title: "Join Request Submitted",
            message: response.message || "Your join request has been submitted. Please wait for approval from group administrators.",
          });
          setShowSuccessModal(true);
        } else {
          // Immediately joined - refresh group details
          const detailsResponse = await groupsApi.getGroupById(groupId);
          if (detailsResponse.success && detailsResponse.data) {
            setCurrentGroupDetails(detailsResponse.data.group as Group);
          }
          // Refresh user groups list
          const userGroupsResponse = await groupsApi.getUserGroups();
          if (userGroupsResponse.success && userGroupsResponse.data) {
            setUserGroups((userGroupsResponse.data.groups as Group[]) || []);
          }
          setSuccessMessage({
            title: "Success",
            message: "Successfully joined the group!",
          });
          setShowSuccessModal(true);
        }
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to join group",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while joining the group",
      });
      setShowSuccessModal(true);
    } finally {
      setJoining(false);
    }
  };

  // Handle shout submission
  const handleShoutSubmit = async () => {
    if (!shoutText.trim() || !groupId) return;

    try {
      const response = await groupsApi.updateGroupShout(
        groupId,
        shoutText.trim(),
      );
      if (response.success) {
        // Refresh group details to show new shout
        const groupResponse = await groupsApi.getGroupById(groupId);
        if (groupResponse.success && groupResponse.data) {
          setCurrentGroupDetails(groupResponse.data.group as Group);
        }
        setShoutText("");
        setSuccessMessage({
          title: "Success",
          message: "Shout posted successfully!",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to post shout",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error posting shout:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to post shout",
      });
      setShowSuccessModal(true);
    }
  };

  // Toggle replies visibility
  const handleToggleReplies = async (postId: string) => {
    const isCurrentlyShown = showReplies[postId];
    
    if (!isCurrentlyShown && !replies[postId]) {
      // Fetch replies if not already loaded
      setLoadingReplies({ ...loadingReplies, [postId]: true });
      try {
        const response = await groupsApi.getWallPostReplies(groupId, postId);
        if (response.success && response.data) {
          setReplies({ ...replies, [postId]: response.data.replies || [] });
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
      } finally {
        setLoadingReplies({ ...loadingReplies, [postId]: false });
      }
    }
    
    setShowReplies({ ...showReplies, [postId]: !isCurrentlyShown });
  };

  // Handle reply submission
  const handleReplySubmit = async (postId: string) => {
    const content = replyText[postId];
    if (!content?.trim() || !groupId) return;

    setPostingReply({ ...postingReply, [postId]: true });
    try {
      const response = await groupsApi.createWallPostReply(
        groupId,
        postId,
        content.trim(),
      );
      if (response.success && response.data) {
        // Add new reply to the list
        const currentReplies = replies[postId] || [];
        setReplies({
          ...replies,
          [postId]: [...currentReplies, response.data.reply],
        });
        // Update reply count
        setWallPosts(
          wallPosts.map((post) =>
            post.id === postId
              ? { ...post, reply_count: (post.reply_count || 0) + 1 }
              : post
          )
        );
        // Clear reply text
        setReplyText({ ...replyText, [postId]: "" });
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setPostingReply({ ...postingReply, [postId]: false });
    }
  };

  // Handle delete reply
  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      const response = await groupsApi.deleteWallPostReply(
        groupId,
        postId,
        replyId,
      );
      if (response.success) {
        // Remove reply from list
        const currentReplies = replies[postId] || [];
        setReplies({
          ...replies,
          [postId]: currentReplies.filter((r: any) => r.id !== replyId),
        });
        // Update reply count
        setWallPosts(
          wallPosts.map((post) =>
            post.id === postId
              ? { ...post, reply_count: Math.max(0, (post.reply_count || 0) - 1) }
              : post
          )
        );
        setSuccessMessage({
          title: "Success",
          message: "Reply deleted successfully!",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to delete reply",
      });
      setShowSuccessModal(true);
    }
  };

  // Mock store items
  const storeItems = [
    {
      id: 1,
      name: "Cartoony White Scarf",
      image: "https://robohash.org/scarf1?set=set3",
      price: 50,
    },
    {
      id: 2,
      name: "Cartoony Purple Scarf",
      image: "https://robohash.org/scarf2?set=set3",
      price: 50,
    },
    {
      id: 3,
      name: "Cartoony Blue Scarf",
      image: "https://robohash.org/scarf3?set=set3",
      price: 50,
    },
    {
      id: 4,
      name: "Cartoony Green Scarf",
      image: "https://robohash.org/scarf4?set=set3",
      price: 50,
    },
    {
      id: 5,
      name: "Cartoony Red Scarf",
      image: "https://robohash.org/scarf5?set=set3",
      price: 50,
    },
    {
      id: 6,
      name: "Cartoony Rainbow Scarf",
      image: "https://robohash.org/scarf6?set=set3",
      price: 50,
    },
    {
      id: 7,
      name: "Grey Scarf",
      image: "https://robohash.org/greyscarf?set=set3",
      price: 50,
    },
    {
      id: 8,
      name: "Green Scarf",
      image: "https://robohash.org/greenscarf?set=set3",
      price: 50,
    },
    {
      id: 9,
      name: "Forest Green Scarf",
      image: "https://robohash.org/forestscarf?set=set3",
      price: 50,
    },
    {
      id: 10,
      name: "Pink Scarf",
      image: "https://robohash.org/pinkscarf?set=set3",
      price: 50,
    },
    {
      id: 11,
      name: "Blue Scarf",
      image: "https://robohash.org/bluescarf?set=set3",
      price: 50,
    },
    {
      id: 12,
      name: "Red Scarf",
      image: "https://robohash.org/redscarf?set=set3",
      price: 50,
    },
  ];

  const tabs = ["About", "Store", "Alliances"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex w-full">
        {/* Left Sidebar - Fixed, No Scroll */}
        <div className="w-1/4 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 px-6 py-6 fixed h-[calc(100vh-64px)] left-0 top-[64px]">
          {/* Groups Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Groups
            </h2>
            <Link
              href="/groups?discover=true"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              See All
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search My Groups"
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Groups List */}
          <div className="space-y-1 mb-4">
            {loadingGroups ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
            ) : userGroups.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  No groups yet
                </p>
              </div>
            ) : (
              userGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className={`flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    groupId === group.id ? "bg-gray-100 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 relative">
                    {group.icon_url ? (
                      <Image
                        src={group.icon_url}
                        alt={group.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <span className="text-lg flex items-center justify-center w-full h-full">
                        🎮
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {group.member_count} members
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Create Community Button */}
          <div className="mt-4">
            <Link
              href="/groups/create"
              className="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2.5 text-sm rounded-lg transition-colors text-center"
            >
              Create Group
            </Link>
          </div>
        </div>

        {/* Main Content - 75% width, Only Scrollable Section */}
        <div className="w-3/4 ml-[25%]">
          <div className="bg-white dark:bg-gray-900">
          {/* Cover Photo - Full width if exists */}
          {currentGroup?.cover_photo_url && (
            <div className="w-full h-[200px] relative overflow-hidden">
              <Image
                src={currentGroup.cover_photo_url}
                alt={`${currentGroup.name} cover`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          )}

          {/* Group Header */}
          <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
            {currentGroup ? (
              <>
                <div className="w-[120px] h-[120px] border border-gray-100 dark:border-gray-800 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700 relative">
                  {currentGroup.icon_url ? (
                    <Image
                      src={currentGroup.icon_url}
                      alt={currentGroup.name}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🎮
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {currentGroup.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    By{" "}
                    <a
                      href={`/profile/${currentGroup.owner_username}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {currentGroup.owner_display_name || currentGroup.owner_username}
                    </a>
                  </p>

                  <div className="flex gap-8 mt-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        Members
                      </p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {currentGroup.member_count}
                      </p>
                    </div>
                    {currentGroup.role && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                          Rank
                        </p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {currentGroup.role}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Join Button + Three Dot Menu */}
                <div className="flex items-center gap-2">
                  {/* Join Button - Show only if user is not a member */}
                  {!currentGroup.role && (
                    <button
                      onClick={handleJoinGroup}
                      disabled={joining}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? "Joining..." : "Join Group"}
                    </button>
                  )}

                  {/* Three Dot Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setGroupMenuOpen(!groupMenuOpen)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {groupMenuOpen && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setGroupMenuOpen(false)}
                        />

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-20 py-1">
                          {/* If user is a member/owner - show full menu */}
                          {currentGroup.role ? (
                            <>
                              {/* Admin Options - Only show if user is Owner */}
                              {currentGroup.role === "Owner" && (
                                <>
                                  <Link href={`/groups/${groupId}/configure`}>
                                    <button
                                      onClick={() => setGroupMenuOpen(false)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Configure Group
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() => {
                                      alert("Group Admin Panel");
                                      setGroupMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Group Admin
                                  </button>
                                  <Link
                                    href={`/groups/${groupId}/configure?section=Advertise Group`}
                                  >
                                    <button
                                      onClick={() => setGroupMenuOpen(false)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Advertise Group
                                    </button>
                                  </Link>
                                </>
                              )}

                              {/* Regular Member Options */}
                              <button
                                onClick={async () => {
                                  setGroupMenuOpen(false);
                                  if (groupId) {
                                    setActionLoading(true);
                                    const response =
                                      await groupsApi.makePrimaryGroup(groupId);
                                    setActionLoading(false);
                                    if (response.success) {
                                      setSuccessMessage({
                                        title: "Success",
                                        message: "Group set as primary!",
                                      });
                                      setShowSuccessModal(true);
                                    } else {
                                      setSuccessMessage({
                                        title: "Error",
                                        message:
                                          response.error || "Failed to set primary group",
                                      });
                                      setShowSuccessModal(true);
                                    }
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Make Primary
                              </button>
                              <button
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  setShowLeaveConfirm(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Leave Group
                              </button>

                              {/* Owner Only Option */}
                              {currentGroup.role === "Owner" && (
                                <button
                                  onClick={() => {
                                    alert("Change Owner");
                                    setGroupMenuOpen(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Change Owner
                                </button>
                              )}

                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            </>
                          ) : (
                            /* If user is NOT a member - show limited menu */
                            <>
                              <button
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  if (groupId) {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/groups/${groupId}`
                                    );
                                    setSuccessMessage({
                                      title: "Success",
                                      message: "Group link copied to clipboard!",
                                    });
                                    setShowSuccessModal(true);
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Copy Link
                              </button>
                            </>
                          )}

                          {/* Report Abuse - Always visible */}
                          <button
                            onClick={() => {
                              setGroupMenuOpen(false);
                              setShowReportModal(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Report Abuse
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Group not found</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          {/* Tab Navigation */}
          <div className="flex px-6 border-b border-gray-100 dark:border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                  activeTab === tab
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "About" && (
            <>
              {/* Description Section */}
              <div className="p-6">
                <DescriptionSection description={currentGroup?.description} />
              </div>

              {/* Shout Section */}
              <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Shout
                </h3>

                {/* Current Shout Display */}
                {currentGroup?.shout_text ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 mb-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                        {currentGroup.shout_posted_by_avatar ? (
                          <img 
                            src={currentGroup.shout_posted_by_avatar} 
                            alt={currentGroup.shout_posted_by_username || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                            {currentGroup.shout_posted_by_username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Username */}
                        {currentGroup.shout_posted_by_username && (
                          <a 
                            href={`/users/${currentGroup.shout_posted_by_username}`}
                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:underline"
                          >
                            {currentGroup.shout_posted_by_username}
                          </a>
                        )}
                        
                        {/* Shout Message */}
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 break-words">
                          {currentGroup.shout_text}
                        </p>
                        
                        {/* Timestamp */}
                        {currentGroup.shout_posted_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(currentGroup.shout_posted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })} | {new Date(currentGroup.shout_posted_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Nothing has been said yet.
                  </p>
                )}

                {/* Shout Input - Only for Admin/Owner */}
                {currentGroup && currentGroup.role === "Owner" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shoutText}
                        onChange={(e) => setShoutText(e.target.value)}
                        placeholder="Enter your shout"
                        maxLength={255}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleShoutSubmit}
                        disabled={!shoutText.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Group Shout
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {shoutText.length}/255 characters
                    </p>
                  </div>
                )}
              </div>

              {/* Games Section */}
              <GamesSection groupId={currentGroup?.id} />

              {/* Members Section */}
              <MembersSection groupId={currentGroup?.id} />

              {/* Social Links */}
              <SocialLinksSection groupId={currentGroup?.id} />

              {/* Wall Section */}
              <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Wall
                </h2>

                <div className="flex gap-2 mb-4">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Say something..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={handlePostSubmit}
                    disabled={!newPost.trim() || postingWall}
                    className="px-4 py-2 h-fit bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postingWall ? "Posting..." : "Post"}
                  </button>
                </div>

                {wallPosts.length > 0 ? (
                  <div className="space-y-6">
                    {wallPosts.map((post) => (
                      <div key={post.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        {/* Post Header */}
                        <div className="flex gap-3 mb-3">
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
                            <div className="flex items-center gap-2">
                              <a
                                href={`/profile/${post.author_username}`}
                                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {post.author_display_name || post.author_username}
                              </a>
                              {post.author_is_verified && (
                                <span className="text-blue-500 text-xs">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })} | {new Date(post.created_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>

                          {/* Three-dot menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenPostMenu(
                                  openPostMenu === post.id ? null : post.id,
                                )
                              }
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>

                            {openPostMenu === post.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenPostMenu(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-20 py-1">
                                  <button
                                    onClick={() => {
                                      setShowReportModal(true);
                                      setOpenPostMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Report Abuse
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          {(post.reply_count || 0) > 0 ? (
                            <button
                              onClick={() => handleToggleReplies(post.id)}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                            >
                              {showReplies[post.id] ? "Hide" : "View"} Replies ({post.reply_count})
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">No replies yet</span>
                          )}
                          <button
                            onClick={() => {
                              if (!showReplies[post.id]) {
                                handleToggleReplies(post.id);
                              }
                              // Focus on reply input after a short delay
                              setTimeout(() => {
                                const input = document.querySelector(`input[data-post-id="${post.id}"]`) as HTMLInputElement;
                                input?.focus();
                              }, 100);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Replies Section */}
                        {showReplies[post.id] && (
                          <div className="mt-4 space-y-3">
                            {loadingReplies[post.id] ? (
                              <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                              </div>
                            ) : (
                              <>
                                {/* Reply Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    data-post-id={post.id}
                                    value={replyText[post.id] || ""}
                                    onChange={(e) =>
                                      setReplyText({ ...replyText, [post.id]: e.target.value })
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReplySubmit(post.id);
                                      }
                                    }}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => handleReplySubmit(post.id)}
                                    disabled={!replyText[post.id]?.trim() || postingReply[post.id]}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {postingReply[post.id] ? "..." : "Reply"}
                                  </button>
                                </div>

                                {/* Replies List */}
                                {replies[post.id]?.length > 0 && (
                                  <div className="space-y-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                    {replies[post.id].map((reply: any) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 relative">
                                          <Image
                                            src={`https://robohash.org/${reply.author_username}?set=set3`}
                                            alt={reply.author_username}
                                            fill
                                            className="object-cover"
                                            sizes="32px"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/profile/${reply.author_username}`}
                                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                              {reply.author_display_name || reply.author_username}
                                            </a>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {new Date(reply.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-900 dark:text-gray-100 mt-0.5 break-words">
                                            {reply.content}
                                          </p>
                                        </div>
                                        {reply.author_id === currentGroupDetails?.owner_id && (
                                          <button
                                            onClick={() => handleDeleteReply(post.id, reply.id)}
                                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No wall posts yet. Be the first to post!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "Store" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Store
                </h2>
                <Link
                  href="/groups/store"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  See All →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {storeItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-4 h-4 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white dark:text-gray-900 text-[10px] font-bold">
                            ◈
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 mt-6 text-sm text-gray-600 dark:text-gray-400">
                <button className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  &lt;
                </button>
                <span className="font-medium">Page 1</span>
                <button className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  &gt;
                </button>
              </div>
            </div>
          )}

          {activeTab === "Alliances" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Allies ({alliances.length})
                </h2>
              </div>

              {loadingAlliances ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading alliances...
                  </span>
                </div>
              ) : alliances.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {alliances.map((alliance) => (
                    <Link
                      key={alliance.id}
                      href={`/groups/${alliance.allied_group_id}`}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                        {alliance.allied_group_icon ? (
                          <Image
                            src={alliance.allied_group_icon}
                            alt={alliance.allied_group_name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🎮
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1">
                          <h3
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                            title={alliance.allied_group_name}
                          >
                            {alliance.allied_group_name}
                          </h3>
                          {alliance.allied_group_verified && (
                            <span className="text-blue-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {alliance.allied_group_member_count?.toLocaleString() || 0} Members
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    No alliances yet
                  </p>
                  {currentGroup?.role === "Owner" && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Send alliance requests to other groups from the Configure page
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8">
            <Footer />
          </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={async () => {
          if (groupId) {
            setActionLoading(true);
            const response = await groupsApi.leaveGroup(groupId);
            setActionLoading(false);
            setShowLeaveConfirm(false);
            if (response.success) {
              const isGroupDeleted = response.message?.includes("deleted");
              setSuccessMessage({
                title: "Success",
                message: isGroupDeleted
                  ? "Group deleted successfully! You were the last member."
                  : "Left group successfully!",
              });
              setShowSuccessModal(true);
              // Refresh user groups list
              const userGroupsResponse = await groupsApi.getUserGroups();
              if (userGroupsResponse.success && userGroupsResponse.data) {
                setUserGroups((userGroupsResponse.data.groups as Group[]) || []);
              }
              setTimeout(() => {
                router.push("/groups");
              }, 2000);
            } else {
              setSuccessMessage({
                title: "Error",
                message: response.error || "Failed to leave group",
              });
              setShowSuccessModal(true);
            }
          }
        }}
        title={
          currentGroupDetails?.role === "Owner"
            ? "Leave Group / Delete Group"
            : "Leave Group"
        }
        message={
          currentGroupDetails?.role === "Owner"
            ? (currentGroupDetails?.member_count ?? 0) > 1
              ? "As the owner, you cannot leave while there are other members. Remove all members first, then you can leave to delete the group."
              : "You are the last member and the owner. Leaving will permanently delete this group. This action cannot be undone."
            : "Are you sure you want to leave this group? This action cannot be undone."
        }
        confirmText={
          currentGroupDetails?.role === "Owner" &&
          currentGroupDetails?.member_count === 1
            ? "Delete Group"
            : "Leave Group"
        }
        cancelText={
          currentGroupDetails?.role === "Owner" &&
          currentGroupDetails?.member_count > 1
            ? "Close"
            : "Cancel"
        }
        variant="danger"
        loading={actionLoading}
        disabled={
          currentGroupDetails?.role === "Owner" &&
          (currentGroupDetails?.member_count ?? 0) > 1
        }
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={async (category, description) => {
          if (groupId) {
            setActionLoading(true);
            const response = await groupsApi.reportGroup(
              groupId,
              category,
              description || undefined,
            );
            setActionLoading(false);
            setShowReportModal(false);
            if (response.success) {
              setSuccessMessage({
                title: "Success",
                message:
                  "Report submitted successfully! Our moderation team will review it.",
              });
              setShowSuccessModal(true);
            } else {
              setSuccessMessage({
                title: "Error",
                message: response.error || "Failed to submit report",
              });
              setShowSuccessModal(true);
            }
          }
        }}
        loading={actionLoading}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
};

export default GroupDetailPage;
