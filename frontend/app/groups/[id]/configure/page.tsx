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

import { ThemeToggle } from "../../../components/ThemeToggle";
import { groupsApi, uploadApi } from "@/lib/api";
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group data
  const [groupData, setGroupData] = useState<any>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });

  // Settings states
  const [manualApproval, setManualApproval] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState<
    "none" | "low" | "medium" | "high"
  >("none");
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

  // Members states
  const [membersTab, setMembersTab] = useState<"members" | "requests">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("All");
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null);

  // Roles states
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleRank, setRoleRank] = useState(0);
  const [permissionSectionsCollapsed, setPermissionSectionsCollapsed] = useState({
    posts: false,
    members: false,
    moderation: false,
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
      "Audit Log",
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
      { name: "Shout", hasNew: false },
      { name: "Wall", hasNew: false },
      { name: "Advertise Group", hasNew: false },
      { name: "Analytics", hasNew: false },
      { name: "Audit Log", hasNew: false },
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
          setGroupName(group.name || "");
          setGroupDescription(group.description || "");
          setIconUrl(group.icon_url || "");
          setCoverPhotoUrl(group.cover_photo_url || "");
          setJoinSetting(group.join_setting || "open");
          setEmblemPreview(group.icon_url || null);
          setCoverPreview(group.cover_photo_url || null);
        }

        // Fetch group settings
        const settingsResponse = await groupsApi.getGroupSettings(groupId);
        if (settingsResponse.success && settingsResponse.data) {
          const settings = settingsResponse.data.settings as any;
          setManualApproval(settings.manual_approval || false);
          setVerificationLevel(settings.verification_level || "none");
          setAccountAge(settings.account_age_requirement || "none");
        }

        // Fetch social links
        const socialResponse = await groupsApi.getGroupSocialLinks(groupId);
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
        }

        // Fetch members
        const membersResponse = await groupsApi.getGroupMembers(groupId);
        if (membersResponse.success && membersResponse.data) {
          setMembers((membersResponse.data.members as any[]) || []);
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  // Fetch roles when Roles section is active
  useEffect(() => {
    const fetchRoles = async () => {
      if (!groupId || activeSection !== "Roles") return;
      setLoadingRoles(true);
      try {
        const response = await groupsApi.getGroupRoles(groupId);
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

    fetchRoles();
  }, [groupId, activeSection]);

  // Check if user is owner
  const isOwner = groupData?.role === "Owner";

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
    if (!groupId) return;

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
      const response = await groupsApi.updateGroup(groupId, {
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

  const handleSaveSettings = async () => {
    if (!groupId) return;

    setSaving(true);
    try {
      const response = await groupsApi.updateGroupSettings(groupId, {
        manualApproval,
        verificationLevel,
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
    if (!groupId) return;

    setSaving(true);
    try {
      const response = await groupsApi.updateGroupSocialLinks(groupId, {
        discord,
        twitter,
        youtube,
        twitch,
        facebook,
        instagram,
        tiktok,
        website,
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
    if (!groupId || !roleName.trim()) return;

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
        response = await groupsApi.updateGroupRole(groupId, selectedRole.id, roleData);
      } else {
        // Creating new role
        response = await groupsApi.createGroupRole(groupId, roleData);
      }

      if (response?.success) {
        setSuccessMessage({
          title: "Success",
          message: selectedRole ? "Role updated successfully!" : "Role created successfully!",
        });
        setShowSuccessModal(true);
        // Refresh roles list
        const rolesResponse = await groupsApi.getGroupRoles(groupId);
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
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <Link href="/home" className="flex items-center">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">◈</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/games"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm"
            >
              Games
            </Link>
            <Link
              href="/catalog"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm"
            >
              Catalog
            </Link>
            <Link
              href="/create"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm"
            >
              Create
            </Link>
            <Link
              href="/adventurebux"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm"
            >
              AdventureBux
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 w-64">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:outline-none w-full"
              />
            </div>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <ThemeToggle />

            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="w-5 h-5 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-white dark:text-gray-900 text-xs font-bold">
                  ◈
                </span>
              </div>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                0
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/profile"
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1"
            >
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm hidden md:block">
                reahan00R
              </span>
            </Link>
          </div>
        </div>
      </header>

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
                By Modern_Chris · Group Funds: ◈ 0
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
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${
                      activeSection === section.name
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
                ) : !isOwner ? (
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
                  activeSection === "Information" && (
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

                      {/* Emblem */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Emblem
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
                                  group emblem.jpg
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

                      {/* Cover Photo */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Cover Photo
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Cover photo must be one of the available dimensions:
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
                                  group cover.jpg
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
                          onChange={(e) => setJoinSetting(e.target.value)}
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
                  )
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
                          onChange={setManualApproval}
                        />
                      </div>
                    </div>

                    {/* Verification Level */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-5">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Verification Level
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="verification"
                            checked={verificationLevel === "none"}
                            onChange={() => setVerificationLevel("none")}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              None
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Users do not require account verification before
                              joining
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="verification"
                            checked={verificationLevel === "low"}
                            onChange={() => setVerificationLevel("low")}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              Low
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Users must be phone, email, or ID verified before
                              joining
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="verification"
                            checked={verificationLevel === "medium"}
                            onChange={() => setVerificationLevel("medium")}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              Medium
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Users must be ID verified, or phone and email
                              verified before joining
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="verification"
                            checked={verificationLevel === "high"}
                            onChange={() => setVerificationLevel("high")}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              High
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Users must be ID verified before joining
                            </div>
                          </div>
                        </label>
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
                      <input
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="https://discord.gg/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://twitter.com/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        YouTube
                      </label>
                      <input
                        type="text"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Twitch
                      </label>
                      <input
                        type="text"
                        value={twitch}
                        onChange={(e) => setTwitch(e.target.value)}
                        placeholder="https://twitch.tv/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        TikTok
                      </label>
                      <input
                        type="text"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="https://tiktok.com/@..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Website
                      </label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
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
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
                          membersTab === "members"
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
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
                          membersTab === "requests"
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
                            <option value="All">All</option>
                            <option value="Owner">Owner</option>
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
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
                                const matchesRole =
                                  memberRoleFilter === "All" ||
                                  member.role === memberRoleFilter;
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
                                                      groupId,
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

                                  {/* Role Dropdown */}
                                  <select
                                    value={member.role_id || ""}
                                    onChange={async (e) => {
                                      const newRoleId = e.target.value || null;
                                      const response = await groupsApi.updateMemberRole(
                                        groupId,
                                        member.user_id,
                                        newRoleId
                                      );
                                      if (response.success) {
                                        setMembers(
                                          members.map((m) =>
                                            m.user_id === member.user_id
                                              ? { ...m, role_id: newRoleId }
                                              : m
                                          )
                                        );
                                        setSuccessMessage({
                                          title: "Success",
                                          message: "Member role updated successfully",
                                        });
                                        setShowSuccessModal(true);
                                      } else {
                                        setSuccessMessage({
                                          title: "Error",
                                          message:
                                            response.error || "Failed to update role",
                                        });
                                        setShowSuccessModal(true);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                  </select>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requests Tab */}
                    {membersTab === "requests" && (
                      <div className="space-y-4">
                        <div className="text-center py-12">
                          <p className="text-gray-600 dark:text-gray-400">
                            No pending requests
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Join requests will appear here when manual approval is enabled
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "Roles" && (
                  <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">ℹ</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                          We have improved permissions and membership management
                          within Creator Hub and recommend you head there if you
                          want to manage collaborators.
                        </p>
                        <button className="mt-2 px-4 py-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-sm rounded border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          Go to Creator Hub
                        </button>
                      </div>
                    </div>

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
                              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                selectedRole?.id === role.id
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

                        {/* Save Button at Bottom */}
                        <button 
                          onClick={handleSaveRole}
                          disabled={!roleName.trim() || saving}
                          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                          {saving ? "Saving..." : (selectedRole ? "Save Changes" : "Create Role")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "Alliances" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Alliances Management
                    </h2>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter group name to send alliance request..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        Send Request
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Current Allies
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                          >
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Allied Group {i}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                100 members
                              </p>
                            </div>
                            <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "Shout" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Shout
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Post a shout to share updates with all group members.
                      Shouts appear on the group page.
                    </p>

                    {/* Shout Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter your shout
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={shoutTitle}
                          onChange={(e) => setShoutTitle(e.target.value)}
                          placeholder="Enter your shout"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Description Section - Optional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Add additional context or details (optional)
                      </p>
                      <div className="relative">
                        <textarea
                          value={shoutContent}
                          onChange={(e) => setShoutContent(e.target.value)}
                          placeholder="Add description (optional)..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                        Group Shout
                      </button>
                      <button
                        onClick={() => {
                          setShoutTitle("");
                          setShoutContent("");
                        }}
                        className="px-8 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
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

                {activeSection === "Audit Log" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Audit Log
                    </h2>

                    <div className="flex gap-3">
                      <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option>All Actions</option>
                        <option>Member Changes</option>
                        <option>Role Changes</option>
                        <option>Settings Changes</option>
                      </select>
                    </div>

                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              No audit log entries
                            </td>
                          </tr>
                        </tbody>
                      </table>
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
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
                          adTab === "create"
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
                        className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
                          adTab === "manage"
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
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                adFormat === "banner"
                                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                              }`}
                            >
                              728 x 90 Banner
                            </button>
                            <button
                              onClick={() => setAdFormat("skyscraper")}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                adFormat === "skyscraper"
                                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                              }`}
                            >
                              160 x 600 Skyscraper
                            </button>
                            <button
                              onClick={() => setAdFormat("rectangle")}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                adFormat === "rectangle"
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
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          ad.status === "Running"
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
    </div>
  );
};

export default ConfigureGroupPage;
