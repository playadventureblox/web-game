"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  X,
  Menu,
  Search,
  Bell,
  Settings,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";
import Footer from "../../../components/Footer";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

import { ThemeToggle } from "../../../components/ThemeToggle";
import { groupsApi, uploadApi, storage } from "@/lib/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Loader2 } from "lucide-react";

// Toggle Switch Component
const ToggleSwitch = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
};

const ConfigureGroupPage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Decode current user ID from JWT token
  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId || null);
    } catch {
      // not logged in
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group data
  const [groupData, setGroupData] = useState<any>(null);
  const [groupUuid, setGroupUuid] = useState<string | null>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });

  // Settings states
  const [manualApproval, setManualApproval] = useState(false);
  const [accountAge, setAccountAge] = useState<
    "none" | "1day" | "3days" | "7days" | "30days" | "90days"
  >("none");

  // Social Links states
  const [discord, setDiscord] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  // Social Links title states
  const [discordTitle, setDiscordTitle] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [twitchTitle, setTwitchTitle] = useState("");
  const [facebookTitle, setFacebookTitle] = useState("");
  const [instagramTitle, setInstagramTitle] = useState("");
  const [tiktokTitle, setTiktokTitle] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  // Members states
  const [membersTab, setMembersTab] = useState<"members" | "requests">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("All");
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Role assignment confirmation modal states
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    memberId: string;
    memberName: string;
    newRoleId: string;
    newRoleName: string;
  } | null>(null);
  const [assigningRole, setAssigningRole] = useState(false);

  // Alliance states
  const [allianceSearch, setAllianceSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [alliances, setAlliances] = useState<any[]>([]);
  const [allianceRequests, setAllianceRequests] = useState<any[]>([]);
  const [loadingAlliances, setLoadingAlliances] = useState(false);
  const [alliancesTab, setAlliancesTab] = useState<"allies" | "requests">("allies");

  // Roles states
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleRank, setRoleRank] = useState(0);
  const [permissionSectionsCollapsed, setPermissionSectionsCollapsed] = useState({
    posts: true,
    members: true,
    moderation: true,
  });
  const [rolePermissions, setRolePermissions] = useState({
    postWall: true,
    deleteWallPosts: false,
    postShout: false,
    manageMembers: false,
    deleteMembers: false,
    banMembers: false,
    viewAuditLog: false,
    spendGroupFunds: false,
    advertiseGroup: false,
    manageAds: false,
    manageAlliances: false,
    manageRoles: false,
    manageStore: false,
    manageGames: false,
  });

  // Initialize activeSection from URL params if available
  const getInitialSection = () => {
    const section = searchParams.get("section");
    const sections = [
      "Information",
      "Settings",
      "Social Links",
      "Revenue",
      "Payouts",
      "Members",
      "Roles",
      "Alliances",
      "Shout",
      "Wall",
      "Advertise Group",
      "Analytics",
      "Verification",
    ];
    return section && sections.includes(section) ? section : "Information";
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [joinSetting, setJoinSetting] = useState("open");
  const [emblemPreview, setEmblemPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [shoutTitle, setShoutTitle] = useState("");
  const [shoutContent, setShoutContent] = useState("");

  // Advertise Group states
  const [adTab, setAdTab] = useState<"create" | "manage">("create");
  const [adFormat, setAdFormat] = useState<
    "banner" | "skyscraper" | "rectangle"
  >("banner");
  const [adName, setAdName] = useState("");
  const [adImage, setAdImage] = useState<string | null>(null);
  const [maxBid, setMaxBid] = useState("0.10");
  const [adSetName, setAdSetName] = useState("");

  const sections = useMemo(
    () => [
      { name: "Information", hasNew: false },
      { name: "Settings", hasNew: false },
      { name: "Social Links", hasNew: false },
      { name: "Revenue", hasNew: false },
      { name: "Payouts", hasNew: false },
      { name: "Members", hasNew: false },
      { name: "Roles", hasNew: false },
      { name: "Alliances", hasNew: false },
      { name: "Wall", hasNew: false },
      { name: "Advertise Group", hasNew: false },
      { name: "Analytics", hasNew: false },
      { name: "Verification", hasNew: false },
    ],
    [],
  );

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      setLoading(true);
      try {
        const response = await groupsApi.getGroupById(groupId);
        if (response.success && response.data) {
          const group = response.data.group as any;
          setGroupData(group);
          setGroupUuid(group.id);
          setGroupName(group.name || "");
          setGroupDescription(group.description || "");
          setIconUrl(group.icon_url || "");
          setCoverPhotoUrl(group.cover_photo_url || "");
          setJoinSetting(group.join_setting || "open");
          setEmblemPreview(group.icon_url || null);
          setCoverPreview(group.cover_photo_url || null);

          const uuid = group.id;

          // Fetch group settings
          const settingsResponse = await groupsApi.getGroupSettings(uuid);
          if (settingsResponse.success && settingsResponse.data) {
            const settings = settingsResponse.data.settings as any;
            const manualApprovalValue = settings.manual_approval || false;
            setManualApproval(manualApprovalValue);
            setAccountAge(settings.account_age_requirement || "none");

            // Sync joinSetting with manual approval
            if (manualApprovalValue && group.join_setting === "open") {
              setJoinSetting("approval");
            }
          }

          // Fetch social links
          const socialResponse = await groupsApi.getGroupSocialLinks(uuid);
          if (socialResponse.success && socialResponse.data) {
            const links = socialResponse.data.socialLinks as any;
            setDiscord(links.discord || "");
            setTwitter(links.twitter || "");
            setYoutube(links.youtube || "");
            setTwitch(links.twitch || "");
            setFacebook(links.facebook || "");
            setInstagram(links.instagram || "");
            setTiktok(links.tiktok || "");
            setWebsite(links.website || "");
            setDiscordTitle(links.discord_title || "");
            setTwitterTitle(links.twitter_title || "");
            setYoutubeTitle(links.youtube_title || "");
            setTwitchTitle(links.twitch_title || "");
            setFacebookTitle(links.facebook_title || "");
            setInstagramTitle(links.instagram_title || "");
            setTiktokTitle(links.tiktok_title || "");
            setWebsiteTitle(links.website_title || "");
          }

          // Fetch members
          const membersResponse = await groupsApi.getGroupMembers(uuid);
          if (membersResponse.success && membersResponse.data) {
            setMembers((membersResponse.data.members as any[]) || []);
          }

          // Fetch join requests
          const joinRequestsResponse = await groupsApi.getJoinRequests(uuid);
          if (joinRequestsResponse.success && joinRequestsResponse.data) {
            setJoinRequests((joinRequestsResponse.data.requests as any[]) || []);
          }

          // Fetch roles for members section
          const rolesResponse = await groupsApi.getGroupRoles(uuid);
          if (rolesResponse.success && rolesResponse.data) {
            setRoles((rolesResponse.data.roles as any[]) || []);
          }

          // Fetch alliances
          const alliancesResponse = await groupsApi.getGroupAlliances(uuid);
          if (alliancesResponse.success && alliancesResponse.data) {
            setAlliances((alliancesResponse.data.alliances as any[]) || []);
          }

          // Fetch alliance requests
          const allianceRequestsResponse = await groupsApi.getAllianceRequests(uuid);
          if (allianceRequestsResponse.success && allianceRequestsResponse.data) {
            setAllianceRequests((allianceRequestsResponse.data.requests as any[]) || []);
          }
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  const fetchMembers = async () => {
    if (!groupUuid) return;

    setLoadingMembers(true);
    try {
      const response = await groupsApi.getGroupMembers(groupUuid);
      if (response.success && response.data) {
        setMembers((response.data.members as any[]) || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchJoinRequests = async () => {
    if (!groupUuid) return;

    setLoadingRequests(true);
    try {
      const response = await groupsApi.getJoinRequests(groupUuid);
      if (response.success && response.data) {
        setJoinRequests((response.data.requests as any[]) || []);
      }
    } catch (error) {
      console.error("Failed to fetch join requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch roles when Roles section is active (refresh roles list)
  useEffect(() => {
    const fetchRoles = async () => {
      if (!groupUuid || activeSection !== "Roles") return;
      setLoadingRoles(true);
      try {
        const response = await groupsApi.getGroupRoles(groupUuid);
        if (response.success && response.data) {
          setRoles((response.data.roles as any[]) || []);
          // Don't auto-select any role - show empty form for creating new role
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    if (activeSection === "Members") {
      fetchMembers();
      fetchJoinRequests();
    } else if (activeSection === "Roles") {
      fetchRoles();
    }
  }, [groupUuid, activeSection]);

  // Helper function to get role name by ID
  const getRoleName = (roleId: string | null) => {
    if (!roleId) return "Unknown";
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  // Handle alliance search
  const handleAllianceSearch = async () => {
    if (!allianceSearch.trim() || allianceSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await groupsApi.searchGroups(allianceSearch.trim());
      if (response.success && response.data) {
        const groups = (response.data.groups as any[]) || [];
        // Filter out current group and already allied groups
        const filtered = groups.filter(
          (g) => g.id !== groupUuid && !alliances.some((a) => a.allied_group_id === g.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Error searching groups:", error);
    } finally {
      setSearching(false);
    }
  };

  // Handle send alliance request
  const handleSendAllianceRequest = async (targetGroupId: string) => {
    if (!groupUuid) return;

    try {
      const response = await groupsApi.sendAllianceRequest(groupUuid, targetGroupId);
      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Alliance request sent successfully!",
        });
        setShowSuccessModal(true);
        setAllianceSearch("");
        setSearchResults([]);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to send alliance request",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error sending alliance request:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while sending alliance request",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle accept alliance request
  const handleAcceptAllianceRequest = async (allianceId: string) => {
    if (!groupUuid) return;

    try {
      const response = await groupsApi.respondToAllianceRequest(groupUuid, allianceId, "accept");
      if (response.success) {
        // Refresh alliances and requests
        const alliancesResponse = await groupsApi.getGroupAlliances(groupUuid);
        if (alliancesResponse.success && alliancesResponse.data) {
          setAlliances((alliancesResponse.data.alliances as any[]) || []);
        }
        const requestsResponse = await groupsApi.getAllianceRequests(groupUuid);
        if (requestsResponse.success && requestsResponse.data) {
          setAllianceRequests((requestsResponse.data.requests as any[]) || []);
        }
        setSuccessMessage({
          title: "Success",
          message: "Alliance request accepted!",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to accept alliance request",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error accepting alliance request:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while accepting alliance request",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle decline alliance request
  const handleDeclineAllianceRequest = async (allianceId: string) => {
    if (!groupUuid) return;

    try {
      const response = await groupsApi.respondToAllianceRequest(groupUuid, allianceId, "decline");
      if (response.success) {
        // Refresh requests
        const requestsResponse = await groupsApi.getAllianceRequests(groupUuid);
        if (requestsResponse.success && requestsResponse.data) {
          setAllianceRequests((requestsResponse.data.requests as any[]) || []);
        }
        setSuccessMessage({
          title: "Success",
          message: "Alliance request declined",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to decline alliance request",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error declining alliance request:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while declining alliance request",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle remove alliance
  const handleRemoveAlliance = async (allianceId: string) => {
    if (!groupUuid) return;

    try {
      const response = await groupsApi.removeAlliance(groupUuid, allianceId);
      if (response.success) {
        // Refresh alliances
        const alliancesResponse = await groupsApi.getGroupAlliances(groupUuid);
        if (alliancesResponse.success && alliancesResponse.data) {
          setAlliances((alliancesResponse.data.alliances as any[]) || []);
        }
        setSuccessMessage({
          title: "Success",
          message: "Alliance removed successfully",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to remove alliance",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error removing alliance:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while removing alliance",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle accept join request
  const handleAcceptRequest = async (requestId: string) => {
    if (!groupUuid) return;

    try {
      const response = await groupsApi.acceptJoinRequest(groupUuid, requestId);
      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Join request accepted successfully!",
        });
        setShowSuccessModal(true);
        // Refresh both lists
        fetchJoinRequests();
        fetchMembers();
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to accept join request",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error accepting join request:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to accept join request",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle reject join request
  const handleRejectRequest = async (requestId: string) => {
    if (!groupUuid) return;

    if (!confirm("Are you sure you want to reject this join request?")) return;

    try {
      const response = await groupsApi.rejectJoinRequest(groupUuid, requestId);
      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Join request rejected successfully!",
        });
        setShowSuccessModal(true);
        fetchJoinRequests();
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to reject join request",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error rejecting join request:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to reject join request",
      });
      setShowSuccessModal(true);
    }
  };

  // Handle role assignment confirmation
  const handleRoleChangeRequest = (memberId: string, memberName: string, newRoleId: string) => {
    const newRoleName = getRoleName(newRoleId);
    setPendingRoleChange({ memberId, memberName, newRoleId, newRoleName });
    setShowRoleConfirmModal(true);
  };

  // Confirm and apply role change
  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    setAssigningRole(true);
    try {
      const response = await groupsApi.updateMemberRole(
        groupUuid || groupId,
        pendingRoleChange.memberId,
        pendingRoleChange.newRoleId
      );

      if (response.success) {
        // Update local members state
        setMembers(
          members.map((m) =>
            m.user_id === pendingRoleChange.memberId
              ? { ...m, role_id: pendingRoleChange.newRoleId }
              : m
          )
        );
        setShowRoleConfirmModal(false);
        setPendingRoleChange(null);
        setSuccessMessage({
          title: "Success",
          message: `Role updated to ${pendingRoleChange.newRoleName} successfully!`,
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to update role",
        });
        setShowSuccessModal(true);
        setShowRoleConfirmModal(false);
        setPendingRoleChange(null);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while updating role",
      });
      setShowSuccessModal(true);
      setShowRoleConfirmModal(false);
      setPendingRoleChange(null);
    } finally {
      setAssigningRole(false);
    }
  };

  // Cancel role change
  const handleCancelRoleChange = () => {
    setShowRoleConfirmModal(false);
    setPendingRoleChange(null);
  };

  // Check if user is owner by comparing user ID to group owner_id (rank-independent)
  const isOwner = !!currentUserId && groupData?.owner_id === currentUserId;

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setEmblemPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingIcon(true);
    try {
      const response = await uploadApi.uploadImage(file, "group-images");
      if (response.success && response.data) {
        setIconUrl(response.data.url as string);
        setSuccessMessage({
          title: "Success",
          message: "Icon uploaded successfully! Don't forget to save changes.",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to upload icon",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error uploading icon:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while uploading icon",
      });
      setShowSuccessModal(true);
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingCover(true);
    try {
      const response = await uploadApi.uploadImage(file, "group-images");
      if (response.success && response.data) {
        setCoverPhotoUrl(response.data.url as string);
        setSuccessMessage({
          title: "Success",
          message:
            "Cover photo uploaded successfully! Don't forget to save changes.",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to upload cover photo",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while uploading cover photo",
      });
      setShowSuccessModal(true);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveInformation = async () => {
    if (!groupUuid) return;

    if (!groupName.trim()) {
      setSuccessMessage({
        title: "Error",
        message: "Group name is required",
      });
      setShowSuccessModal(true);
      return;
    }

    if (!iconUrl) {
      setSuccessMessage({
        title: "Error",
        message: "Group icon is required",
      });
      setShowSuccessModal(true);
      return;
    }

    setSaving(true);
    try {
      const response = await groupsApi.updateGroup(groupUuid || groupId, {
        name: groupName,
        description: groupDescription,
        iconUrl: iconUrl,
        coverPhotoUrl: coverPhotoUrl || undefined,
        joinSetting: joinSetting,
      });

      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Group information updated successfully!",
        });
        setShowSuccessModal(true);
        // Refresh group data
        const groupResponse = await groupsApi.getGroupById(groupId);
        if (groupResponse.success && groupResponse.data) {
          const group = groupResponse.data.group as any;
          setGroupData(group);
        }
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to update group information",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while updating group information",
      });
      setShowSuccessModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Handle manual approval toggle change
  const handleManualApprovalChange = (value: boolean) => {
    setManualApproval(value);
    // Sync with joinSetting dropdown
    if (value && joinSetting === "open") {
      setJoinSetting("approval");
    } else if (!value && joinSetting === "approval") {
      setJoinSetting("open");
    }
  };

  // Handle joinSetting dropdown change
  const handleJoinSettingChange = (value: string) => {
    setJoinSetting(value);
    // Sync with manual approval toggle
    if (value === "approval") {
      setManualApproval(true);
    } else if (value === "open") {
      setManualApproval(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!groupUuid) return;

    setSaving(true);
    try {
      const response = await groupsApi.updateGroupSettings(groupUuid, {
        manualApproval,
        accountAgeRequirement: accountAge,
      });

      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Group settings updated successfully!",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to update group settings",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while updating settings",
      });
      setShowSuccessModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!groupUuid) return;

    setSaving(true);
    try {
      const response = await groupsApi.updateGroupSocialLinks(groupUuid, {
        discord,
        twitter,
        youtube,
        twitch,
        facebook,
        instagram,
        tiktok,
        website,
        discord_title: discordTitle,
        twitter_title: twitterTitle,
        youtube_title: youtubeTitle,
        twitch_title: twitchTitle,
        facebook_title: facebookTitle,
        instagram_title: instagramTitle,
        tiktok_title: tiktokTitle,
        website_title: websiteTitle,
      });

      if (response.success) {
        setSuccessMessage({
          title: "Success",
          message: "Social links updated successfully!",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to update social links",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error updating social links:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while updating social links",
      });
      setShowSuccessModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Handle clearing form to create new role
  const handleClearForm = () => {
    setSelectedRole(null);
    setRoleName("");
    setRoleDescription("");
    setRoleRank(0);
    setRolePermissions({
      postWall: true,
      deleteWallPosts: false,
      postShout: false,
      manageMembers: false,
      deleteMembers: false,
      banMembers: false,
      viewAuditLog: false,
      spendGroupFunds: false,
      advertiseGroup: false,
      manageAds: false,
      manageAlliances: false,
      manageRoles: false,
      manageStore: false,
      manageGames: false,
    });
  };

  // Handle selecting an existing role
  const handleSelectRole = (role: any) => {
    setSelectedRole(role);
    setIsCreatingRole(false);
    setRoleName(role.name || "");
    setRoleDescription(role.description || "");
    setRoleRank(role.rank || 0);
    setRolePermissions({
      postWall: role.can_post_on_wall !== false,
      deleteWallPosts: role.can_delete_wall_posts || false,
      postShout: role.can_post_shout || false,
      manageMembers: role.can_manage_members || false,
      deleteMembers: role.can_delete_members || false,
      banMembers: role.can_ban_members || false,
      viewAuditLog: role.can_view_audit_logs || false,
      spendGroupFunds: role.can_spend_group_funds || false,
      advertiseGroup: role.can_advertise_group || false,
      manageAds: role.can_manage_ads || false,
      manageAlliances: role.can_manage_alliances || false,
      manageRoles: role.can_manage_roles || false,
      manageStore: role.can_manage_store || false,
      manageGames: role.can_manage_games || false,
    });
  };

  // Handle saving role (create or update)
  const handleSaveRole = async () => {
    if (!groupUuid || !roleName.trim()) return;

    setSaving(true);
    try {
      const roleData = {
        name: roleName,
        description: roleDescription,
        rank: roleRank,
        canPostOnWall: rolePermissions.postWall,
        canDeleteWallPosts: rolePermissions.deleteWallPosts,
        canPostShout: rolePermissions.postShout,
        canManageMembers: rolePermissions.manageMembers,
        canDeleteMembers: rolePermissions.deleteMembers,
        canBanMembers: rolePermissions.banMembers,
        canViewAuditLogs: rolePermissions.viewAuditLog,
        canSpendGroupFunds: rolePermissions.spendGroupFunds,
        canAdvertiseGroup: rolePermissions.advertiseGroup,
        canManageAds: rolePermissions.manageAds,
        canManageAlliances: rolePermissions.manageAlliances,
        canManageRoles: rolePermissions.manageRoles,
        canManageStore: rolePermissions.manageStore,
        canManageGames: rolePermissions.manageGames,
      };

      let response;
      if (selectedRole) {
        // Updating existing role
        response = await groupsApi.updateGroupRole(groupUuid, selectedRole.id, roleData);
      } else {
        // Creating new role
        response = await groupsApi.createGroupRole(groupUuid, roleData);
      }

      if (response?.success) {
        setSuccessMessage({
          title: "Success",
          message: selectedRole ? "Role updated successfully!" : "Role created successfully!",
        });
        setShowSuccessModal(true);
        // Refresh roles list
        const rolesResponse = await groupsApi.getGroupRoles(groupUuid);
        if (rolesResponse.success && rolesResponse.data) {
          setRoles((rolesResponse.data.roles as any[]) || []);
        }
        // Clear form after creating new role
        if (!selectedRole) {
          handleClearForm();
        }
      } else {
        setSuccessMessage({
          title: "Error",
          message: response?.error || "Failed to save role",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error saving role:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while saving role",
      });
      setShowSuccessModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAdDimensions = () => {
    switch (adFormat) {
      case "banner":
        return "728 x 90";
      case "skyscraper":
        return "160 x 600";
      case "rectangle":
        return "300 x 250";
      default:
        return "728 x 90";
    }
  };

  // Mock existing ads data
  const existingAds = [
    {
      id: 1,
      name: "Summer Sale Banner",
      format: "728 x 90",
      status: "Running",
      impressions: 15234,
      clicks: 432,
      spent: 45.5,
      bid: 0.12,
    },
    {
      id: 2,
      name: "New Collection Skyscraper",
      format: "160 x 600",
      status: "Paused",
      impressions: 8921,
      clicks: 156,
      spent: 22.3,
      bid: 0.1,
    },
    {
      id: 3,
      name: "Group Promo Rectangle",
      format: "300 x 250",
      status: "Running",
      impressions: 12456,
      clicks: 289,
      spent: 35.2,
      bid: 0.15,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Configure {groupName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                By{" "}
                <a
                  href={`/profile/${groupData?.owner_username}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {groupData?.owner_display_name || groupData?.owner_username || "Loading..."}
                </a>
                {" · Group Funds: ◈ 0"}
              </p>
            </div>
            <Link href={`/groups/${groupId}`}>
              <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Back to Group →
              </button>
            </Link>
          </div>

          {/* Two Column Layout */}
          <div className="flex gap-6">
            {/* Left Sidebar - Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {sections.map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setActiveSection(section.name)}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${activeSection === section.name
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border-l-4 border-blue-600"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent"
                      }`}
                  >
                    <span>{section.name}</span>
                    {section.hasNew && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">
                        New
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : !isOwner && currentUserId !== null ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Access Denied
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Only the group owner can configure group settings.
                    </p>
                    <Link href={`/groups/${groupId}`}>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        Back to Group
                      </button>
                    </Link>
                  </div>
                ) : (
                  <>
                  {activeSection === "Information" && (
                    <div className="space-y-8">
                      {/* Group Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) =>
                            setGroupName(e.target.value.slice(0, 50))
                          }
                          maxLength={50}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Name your group"
                        />
                        <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {groupName.length} / 50
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Description
                        </label>
                        <textarea
                          value={groupDescription}
                          onChange={(e) =>
                            setGroupDescription(e.target.value.slice(0, 1000))
                          }
                          rows={6}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Describe your group"
                        />
                        <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {groupDescription.length} / 1000
                        </div>
                      </div>

                      {/* Group Icon */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Group Icon
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
                          <div className="flex items-start gap-6">
                            {/* Preview */}
                            <div className="flex-shrink-0">
                              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                {uploadingIcon ? (
                                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                ) : emblemPreview ? (
                                  <Image
                                    src={emblemPreview}
                                    alt="Preview"
                                    width={192}
                                    height={192}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-blue-400 to-blue-600 rounded-lg"></div>
                                )}
                              </div>
                              {emblemPreview && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                                  group icon.jpg
                                </p>
                              )}
                            </div>

                            {/* Upload area */}
                            <div className="flex-1 text-center">
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                Drag a file here
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                - Or -
                              </p>
                              <label className="inline-block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleEmblemUpload}
                                  className="hidden"
                                  disabled={uploadingIcon}
                                />
                                <span className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg cursor-pointer inline-block text-sm font-medium">
                                  Select an image from your computer
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Group Background */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Group Background
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Group background must be one of the available dimensions:
                          720x228, 1440x456
                        </p>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
                          <div className="flex items-start gap-6">
                            {/* Preview */}
                            <div className="flex-shrink-0">
                              <div className="w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 relative">
                                {uploadingCover ? (
                                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                ) : coverPreview ? (
                                  <Image
                                    src={coverPreview}
                                    alt="Cover photo preview"
                                    width={192}
                                    height={128}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    Preview
                                  </span>
                                )}
                              </div>
                              {emblemPreview && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                                  group background.jpg
                                </p>
                              )}
                            </div>

                            {/* Upload area */}
                            <div className="flex-1 text-center">
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                Drag a file here
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                - Or -
                              </p>
                              <label className="inline-block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverUpload}
                                  className="hidden"
                                  disabled={uploadingCover}
                                />
                                <span className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg cursor-pointer inline-block text-sm font-medium">
                                  Select an image from your computer
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Join Settings */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Who can join this group?
                        </label>
                        <select
                          value={joinSetting}
                          onChange={(e) => handleJoinSettingChange(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Anyone can join</option>
                          <option value="approval">Manual Approval</option>
                          <option value="closed">No one can join</option>
                        </select>
                      </div>

                      {/* Save Button */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveInformation}
                          disabled={saving || uploadingIcon || uploadingCover}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {saving && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <Link href={`/groups/${groupId}`}>
                          <button className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {activeSection === "Settings" && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Join Requirements
                    </h2>

                    {/* Manual Approval */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Manual Approval
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            User requests must be accepted to join community
                          </p>
                        </div>
                        <ToggleSwitch
                          enabled={manualApproval}
                          onChange={handleManualApprovalChange}
                        />
                      </div>
                    </div>

                    {/* Account Age */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-5">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Account Age
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Only accounts created more than the selected number of
                        days ago can join.
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "none"}
                            onChange={() => setAccountAge("none")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            No Restriction
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "1day"}
                            onChange={() => setAccountAge("1day")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            1 Day
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "3days"}
                            onChange={() => setAccountAge("3days")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            3 Days
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "7days"}
                            onChange={() => setAccountAge("7days")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            7 Days
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "30days"}
                            onChange={() => setAccountAge("30days")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            30 Days
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="accountAge"
                            checked={accountAge === "90days"}
                            onChange={() => setAccountAge("90days")}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            90 Days
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                )}

                  {activeSection === "Social Links" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Social Links
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Discord
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          placeholder="https://discord.gg/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={discordTitle}
                          onChange={(e) => setDiscordTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Twitter
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="https://twitter.com/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={twitterTitle}
                          onChange={(e) => setTwitterTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        YouTube
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="https://youtube.com/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={youtubeTitle}
                          onChange={(e) => setYoutubeTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Twitch
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={twitch}
                          onChange={(e) => setTwitch(e.target.value)}
                          placeholder="https://twitch.tv/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={twitchTitle}
                          onChange={(e) => setTwitchTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Facebook
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={facebookTitle}
                          onChange={(e) => setFacebookTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Instagram
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="https://instagram.com/..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={instagramTitle}
                          onChange={(e) => setInstagramTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        TikTok
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="https://tiktok.com/@..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={tiktokTitle}
                          onChange={(e) => setTiktokTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Website
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={websiteTitle}
                          onChange={(e) => setWebsiteTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSocialLinks}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? "Saving..." : "Save Social Links"}
                    </button>
                  </div>
                )}

                  {activeSection === "Revenue" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Group Revenue
                    </h2>

                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        ◈ 0
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Group Funds
                      </p>
                    </div>

                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Source
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              No revenue transactions
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                  {activeSection === "Payouts" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Group Payouts
                    </h2>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        Configure recurring or one-time payouts to group
                        members.
                      </p>
                    </div>

                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                      Create Payout
                    </button>

                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No payouts configured
                      </p>
                    </div>
                  </div>
                )}

                  {activeSection === "Members" && (
                  <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-300 dark:border-gray-600">
                      <button
                        onClick={() => setMembersTab("members")}
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${membersTab === "members"
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                      >
                        Members
                        {membersTab === "members" && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setMembersTab("requests")}
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${membersTab === "requests"
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                      >
                        Requests
                        {membersTab === "requests" && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                      </button>
                    </div>

                    {/* Members Tab */}
                    {membersTab === "members" && (
                      <div className="space-y-4">
                        {/* Search and Filter */}
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              placeholder="Search Members"
                              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <select
                            value={memberRoleFilter}
                            onChange={(e) => setMemberRoleFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="All">All Roles</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Members Grid */}
                        {loadingMembers ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          </div>
                        ) : members.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400">No members found</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members
                              .filter((member) => {
                                const matchesSearch = member.username
                                  ?.toLowerCase()
                                  .includes(memberSearch.toLowerCase());

                                const matchesRole = memberRoleFilter === "All" || member.role_id === memberRoleFilter;

                                return matchesSearch && matchesRole;
                              })
                              .map((member) => (
                                <div
                                  key={member.user_id}
                                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                >
                                  {/* Member Header */}
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden relative">
                                      <Image
                                        src={`https://robohash.org/${member.username}?set=set3`}
                                        alt={member.username}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {member.username}
                                      </h3>
                                    </div>
                                    {/* Three-dot menu */}
                                    <div className="relative">
                                      <button
                                        onClick={() =>
                                          setOpenMemberMenu(
                                            openMemberMenu === member.user_id
                                              ? null
                                              : member.user_id
                                          )
                                        }
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                      >
                                        <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                      </button>

                                      {openMemberMenu === member.user_id && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setOpenMemberMenu(null)}
                                          />
                                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-20 py-1">
                                            <button
                                              onClick={async () => {
                                                setOpenMemberMenu(null);
                                                if (
                                                  confirm(
                                                    `Kick ${member.username} from the group?`
                                                  )
                                                ) {
                                                  const response =
                                                    await groupsApi.removeMember(
                                                      groupUuid || groupId,
                                                      member.user_id
                                                    );
                                                  if (response.success) {
                                                    setMembers(
                                                      members.filter(
                                                        (m) =>
                                                          m.user_id !== member.user_id
                                                      )
                                                    );
                                                    setSuccessMessage({
                                                      title: "Success",
                                                      message: "Member removed successfully",
                                                    });
                                                    setShowSuccessModal(true);
                                                  } else {
                                                    setSuccessMessage({
                                                      title: "Error",
                                                      message:
                                                        response.error ||
                                                        "Failed to remove member",
                                                    });
                                                    setShowSuccessModal(true);
                                                  }
                                                }
                                              }}
                                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                              Kick
                                            </button>
                                            <button
                                              onClick={() => {
                                                setOpenMemberMenu(null);
                                                alert("Ban functionality coming soon");
                                              }}
                                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                              Ban
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Role Display and Dropdown */}
                                  <div className="space-y-2">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Current Role: <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {getRoleName(member.role_id)}
                                      </span>
                                    </div>
                                    {member.user_id === groupData?.owner_id ? (
                                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm flex items-center justify-between">
                                        <span>{getRoleName(member.role_id)}</span>
                                        <span className="text-xs italic">Protected</span>
                                      </div>
                                    ) : (
                                      <select
                                        value={member.role_id || ""}
                                        onChange={(e) => {
                                          const newRoleId = e.target.value;
                                          if (newRoleId && newRoleId !== member.role_id) {
                                            handleRoleChangeRequest(
                                              member.user_id,
                                              member.username,
                                              newRoleId
                                            );
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {roles.map((role) => (
                                          <option key={role.id} value={role.id}>
                                            {role.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requests Tab */}
                    {membersTab === "requests" && (
                      <div className="space-y-4">
                        {loadingRequests ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400">
                              Loading requests...
                            </span>
                          </div>
                        ) : joinRequests.length > 0 ? (
                          <div className="space-y-3">
                            {joinRequests.map((request) => (
                              <div
                                key={request.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 relative">
                                    <Image
                                      src={request.avatar_url || `https://robohash.org/${request.username}?set=set3`}
                                      alt={request.display_name || request.username}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`/profile/${request.username}`}
                                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {request.display_name || request.username}
                                      </a>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      Requested {new Date(request.requested_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Account age: {Math.floor((Date.now() - new Date(request.user_created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAcceptRequest(request.id)}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(request.id)}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400">
                              No pending requests
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              Join requests will appear here when manual approval is enabled
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                  {activeSection === "Roles" && (
                  <div className="space-y-6">


                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Roles
                    </h2>

                    <div className="flex gap-6">
                      {/* Left: Role List */}
                      <div className="w-64 flex-shrink-0 space-y-2">
                        {loadingRoles ? (
                          <div className="py-8 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
                          </div>
                        ) : roles.length === 0 ? (
                          <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No custom roles yet. Fill the form to create one.
                          </div>
                        ) : (
                          roles.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => handleSelectRole(role)}
                              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedRole?.id === role.id
                                  ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }`}
                            >
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {role.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Rank: {role.rank}
                              </div>
                            </button>
                          ))
                        )}

                        {/* Create Role Button */}
                        <button
                          onClick={() => {
                            handleClearForm();
                            setIsCreatingRole(true);
                          }}
                          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors mt-2"
                        >
                          + Create Role
                        </button>
                      </div>

                      {/* Right: Role Details */}
                      <div className="flex-1 space-y-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            maxLength={100}
                            placeholder="Enter role name"
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {roleName.length}/100
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            maxLength={1000}
                            placeholder="Enter role description"
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {roleDescription.length}/1000
                          </div>
                        </div>

                        {/* Rank */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Rank (0-255)
                          </label>
                          <input
                            type="number"
                            value={roleRank}
                            onChange={(e) => setRoleRank(parseInt(e.target.value) || 0)}
                            min="0"
                            max="255"
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Posts Section */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setPermissionSectionsCollapsed(prev => ({ ...prev, posts: !prev.posts }))}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              Posts
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {permissionSectionsCollapsed.posts ? "Expand" : "Collapse"}
                            </span>
                          </button>
                          {!permissionSectionsCollapsed.posts && (
                            <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Post on community wall
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.postWall}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      postWall: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Delete community wall posts
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.deleteWallPosts}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      deleteWallPosts: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Post group shout
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.postShout}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      postShout: val,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Members Section */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setPermissionSectionsCollapsed(prev => ({ ...prev, members: !prev.members }))}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              Members
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {permissionSectionsCollapsed.members ? "Expand" : "Collapse"}
                            </span>
                          </button>
                          {!permissionSectionsCollapsed.members && (
                            <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage members
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageMembers}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageMembers: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Delete members
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.deleteMembers}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      deleteMembers: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Ban members
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.banMembers}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      banMembers: val,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Administration Section */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setPermissionSectionsCollapsed(prev => ({ ...prev, moderation: !prev.moderation }))}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              Administration
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {permissionSectionsCollapsed.moderation ? "Expand" : "Collapse"}
                            </span>
                          </button>
                          {!permissionSectionsCollapsed.moderation && (
                            <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  View audit log
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.viewAuditLog}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      viewAuditLog: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Spend group funds
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.spendGroupFunds}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      spendGroupFunds: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Advertise group
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.advertiseGroup}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      advertiseGroup: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage ads
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageAds}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageAds: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage alliances
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageAlliances}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageAlliances: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage roles
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageRoles}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageRoles: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage store
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageStore}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageStore: val,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-100">
                                  Manage games
                                </span>
                                <ToggleSwitch
                                  enabled={rolePermissions.manageGames}
                                  onChange={(val) =>
                                    setRolePermissions({
                                      ...rolePermissions,
                                      manageGames: val,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button at Bottom */}
                        {selectedRole ? (
                          <button
                            onClick={handleSaveRole}
                            disabled={!roleName.trim() || saving}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        ) : isCreatingRole ? (
                          <button
                            onClick={handleSaveRole}
                            disabled={!roleName.trim() || saving}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                          >
                            {saving ? "Creating..." : "Create Role"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                  {activeSection === "Alliances" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Alliances Management
                    </h2>

                    {/* Search for groups to ally with */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={allianceSearch}
                          onChange={(e) => setAllianceSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAllianceSearch()}
                          placeholder="Search groups to send alliance request..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          onClick={handleAllianceSearch}
                          disabled={searching || allianceSearch.trim().length < 2}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {searching ? "Searching..." : "Search"}
                        </button>
                      </div>

                      {/* Search results */}
                      {searchResults.length > 0 && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                          {searchResults.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <img
                                src={group.icon_url || '/default-group.png'}
                                alt={group.name}
                                className="w-10 h-10 rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {group.name}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {group.member_count} members
                                </p>
                              </div>
                              <button
                                onClick={() => handleSendAllianceRequest(group.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Send Request
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tabs for Allies and Requests */}
                    <div className="border-b border-gray-300 dark:border-gray-600">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setAlliancesTab("allies")}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${alliancesTab === "allies"
                              ? "border-blue-600 text-blue-600 dark:text-blue-400"
                              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                        >
                          Allies ({alliances.length})
                        </button>
                        <button
                          onClick={() => setAlliancesTab("requests")}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${alliancesTab === "requests"
                              ? "border-blue-600 text-blue-600 dark:text-blue-400"
                              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                        >
                          Requests ({allianceRequests.length})
                        </button>
                      </div>
                    </div>

                    {/* Allies Tab */}
                    {alliancesTab === "allies" && (
                      <div>
                        {alliances.length === 0 ? (
                          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                            No alliances yet. Search for groups above to send alliance requests.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {alliances.map((alliance) => (
                              <div
                                key={alliance.id}
                                className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                              >
                                <img
                                  src={alliance.allied_group_icon || '/default-group.png'}
                                  alt={alliance.allied_group_name}
                                  className="w-12 h-12 rounded"
                                />
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {alliance.allied_group_name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {alliance.allied_group_member_count} members
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveAlliance(alliance.id)}
                                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requests Tab */}
                    {alliancesTab === "requests" && (
                      <div>
                        {allianceRequests.length === 0 ? (
                          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                            No pending alliance requests.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {allianceRequests.map((request) => (
                              <div
                                key={request.id}
                                className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                              >
                                <img
                                  src={request.requesting_group_icon || '/default-group.png'}
                                  alt={request.requesting_group_name}
                                  className="w-12 h-12 rounded"
                                />
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {request.requesting_group_name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {request.requesting_group_member_count} members
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Requested {new Date(request.requested_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptAllianceRequest(request.id)}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineAllianceRequest(request.id)}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                  {activeSection === "Wall" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Wall Settings
                    </h2>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enableWall"
                        className="w-4 h-4"
                        defaultChecked
                      />
                      <label
                        htmlFor="enableWall"
                        className="text-sm text-gray-900 dark:text-gray-100"
                      >
                        Enable group wall
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Who can post on the wall?
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option>All members</option>
                        <option>Moderators and above</option>
                        <option>Admins and above</option>
                        <option>Owner only</option>
                      </select>
                    </div>

                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                      Save Wall Settings
                    </button>
                  </div>
                )}

                  {activeSection === "Analytics" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Group Analytics
                    </h2>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          142
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Members
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          +12
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          New This Week
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          45
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Active Today
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Member Growth
                      </h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-gray-500 dark:text-gray-400">
                          Chart placeholder
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                  {activeSection === "Verification" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Group Verification
                    </h2>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        Verified groups get a special badge and increased
                        visibility.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Requirements:
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>✓ At least 100 members</li>
                        <li>✓ Active for at least 6 months</li>
                        <li>✗ No policy violations in the past year</li>
                        <li>✓ Complete group information</li>
                      </ul>
                    </div>

                    <button
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded cursor-not-allowed text-sm"
                      disabled
                    >
                      Request Verification (Requirements not met)
                    </button>
                  </div>
                )}

                  {activeSection === "Advertise Group" && (
                  <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setAdTab("create")}
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${adTab === "create"
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                      >
                        Create Ad
                        {adTab === "create" && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />
                        )}
                      </button>
                      <button
                        onClick={() => setAdTab("manage")}
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${adTab === "manage"
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                      >
                        Manage Ads
                        {adTab === "manage" && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />
                        )}
                      </button>
                    </div>

                    {adTab === "create" ? (
                      <div className="space-y-6">
                        {/* Ad Format Selection */}
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Select Ad Format
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Download, edit and upload one of the following
                            templates:
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setAdFormat("banner")}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${adFormat === "banner"
                                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                                }`}
                            >
                              728 x 90 Banner
                            </button>
                            <button
                              onClick={() => setAdFormat("skyscraper")}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${adFormat === "skyscraper"
                                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                                }`}
                            >
                              160 x 600 Skyscraper
                            </button>
                            <button
                              onClick={() => setAdFormat("rectangle")}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${adFormat === "rectangle"
                                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                                }`}
                            >
                              300 x 250 Rectangle
                            </button>
                          </div>
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              For tips and tricks, read the tutorial:{" "}
                            </span>
                            <a
                              href="#"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              How to Design an Effective Ad
                            </a>
                          </div>
                        </div>

                        {/* Ad Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Name your Ad
                          </label>
                          <input
                            type="text"
                            value={adName}
                            onChange={(e) => setAdName(e.target.value)}
                            placeholder="Enter ad name"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Upload Ad */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Upload an Ad
                          </label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-800">
                            {adImage ? (
                              <div className="relative inline-block w-full max-w-md h-64">
                                <Image
                                  src={adImage}
                                  alt="Ad preview"
                                  fill
                                  className="object-contain rounded border border-gray-300 dark:border-gray-600"
                                  style={{
                                    maxWidth:
                                      adFormat === "banner"
                                        ? "728px"
                                        : adFormat === "skyscraper"
                                          ? "160px"
                                          : "300px",
                                    maxHeight:
                                      adFormat === "banner"
                                        ? "90px"
                                        : adFormat === "skyscraper"
                                          ? "600px"
                                          : "250px",
                                  }}
                                />
                                <button
                                  onClick={() => setAdImage(null)}
                                  className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-700 dark:text-gray-300 mb-2">
                                  Drag an image here
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                  - Or -
                                </p>
                                <label className="inline-block">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAdImageUpload}
                                    className="hidden"
                                  />
                                  <span className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium rounded-lg cursor-pointer inline-block transition-colors text-sm">
                                    Select an image from your computer
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            The ad needs to be approved by a Moderator before it
                            can be launched from your Ad Page
                          </p>
                        </div>

                        {/* Bidding */}
                        <div>
                          <div className="flex items-start gap-2 mb-3">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              Bidding
                            </h3>
                            <div className="group relative">
                              <button className="w-5 h-5 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                i
                              </button>
                              <div className="hidden group-hover:block absolute left-0 top-full mt-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 z-10">
                                The minimum bid price depends on your selected
                                target audience and Ad Format.
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            The minimum bid price depends on your selected
                            target audience and Ad Format.
                          </p>
                          <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-gray-300 dark:text-gray-400 block mb-1">
                                  Max Bid
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.10"
                                  value={maxBid}
                                  onChange={(e) => setMaxBid(e.target.value)}
                                  className="bg-transparent text-white text-xl font-bold focus:outline-none w-24"
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-400">
                                  Cost Per Play (Ad Credit)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Minimum Bid:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                0.10
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Ad Format:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {getAdDimensions()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ad Set Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Ad Set Name
                          </label>
                          <input
                            type="text"
                            value={adSetName}
                            onChange={(e) => setAdSetName(e.target.value)}
                            placeholder="Ad Set Name"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
                            Upload
                          </button>
                          <button className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Total Spent
                              </span>
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              ◈ 103.00
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              All time
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Impressions
                              </span>
                              <BarChart3 className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              36,611
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Total views
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Clicks
                              </span>
                              <BarChart3 className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              877
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Total clicks
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                CTR
                              </span>
                              <BarChart3 className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              2.4%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Click-through rate
                            </p>
                          </div>
                        </div>

                        {/* Ads Table */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Ad Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Format
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Impressions
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Clicks
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Spent
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Bid
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {existingAds.map((ad) => (
                                  <tr
                                    key={ad.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                      {ad.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                      {ad.format}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ad.status === "Running"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
                                          }`}
                                      >
                                        {ad.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {ad.impressions.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {ad.clicks}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      ◈ {ad.spent.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {ad.bid.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-3">
                                        Edit
                                      </button>
                                      <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                                        {ad.status === "Running"
                                          ? "Pause"
                                          : "Resume"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Sidebar Overlay */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Modals */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* Role Assignment Confirmation Modal */}
      <ConfirmModal
        isOpen={showRoleConfirmModal}
        onClose={handleCancelRoleChange}
        onConfirm={handleConfirmRoleChange}
        title="Confirm Role Change"
        message={`Are you sure you want to change ${pendingRoleChange?.memberName}'s role to ${pendingRoleChange?.newRoleName}?`}
        confirmText="Assign Role"
        cancelText="Cancel"
        loading={assigningRole}
        disabled={assigningRole}
      />
    </div>
  );
};

export default ConfigureGroupPage;
