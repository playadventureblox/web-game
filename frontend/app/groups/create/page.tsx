"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, Bell, Settings as SettingsIcon, X } from "lucide-react";
import Footer from "../../components/Footer";
import { ThemeToggle } from "../../components/ThemeToggle";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { groupsApi, uploadApi } from "@/lib/api";

const CreateGroupPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [emblemFile, setEmblemFile] = useState<File | null>(null);
  const [emblemPreview, setEmblemPreview] = useState<string | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(
    null,
  );
  const [joinSetting, setJoinSetting] = useState("open");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleEmblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEmblemFile(file);
      setEmblemPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhotoFile(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (!emblemFile) {
      setError("Group icon is required");
      return;
    }

    setCreating(true);
    setUploading(true);

    try {
      // Upload group icon first
      const emblemUploadResponse = await uploadApi.uploadImage(
        emblemFile,
        "icon",
      );

      if (!emblemUploadResponse.success || !emblemUploadResponse.data) {
        setError(
          emblemUploadResponse.message || "Failed to upload group icon image",
        );
        setCreating(false);
        setUploading(false);
        return;
      }

      const iconUrl = emblemUploadResponse.data.url;

      // Upload group background if provided
      let coverPhotoUrl: string | undefined = undefined;
      if (coverPhotoFile) {
        const coverUploadResponse = await uploadApi.uploadImage(
          coverPhotoFile,
          "cover",
        );

        if (!coverUploadResponse.success || !coverUploadResponse.data) {
          setError(
            coverUploadResponse.message || "Failed to upload group background",
          );
          setCreating(false);
          setUploading(false);
          return;
        }

        coverPhotoUrl = coverUploadResponse.data.url;
      }

      setUploading(false);

      // Create the group with uploaded image URLs
      const response = await groupsApi.createGroup({
        name: groupName,
        description: description || undefined,
        iconUrl: iconUrl,
        coverPhotoUrl: coverPhotoUrl,
        joinSetting: joinSetting,
      });

      if (response.success && response.data) {
        const groupId = (response.data.group as any).id;
        router.push(`/groups/${groupId}`);
      } else {
        setError(response.message || "Failed to create group");
      }
    } catch (err) {
      console.error("Create group error:", err);
      setError("An error occurred while creating the group");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

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
      <main className="flex-1 w-full px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Create Group
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mygroup"
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
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              rows={6}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="this is my group lets play togther"
            />
            <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description.length} / 1000
            </div>
          </div>

          {/* Group Icon */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Group Icon<span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    {emblemPreview ? (
                      <img
                        src={emblemPreview}
                        alt="Group icon preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Preview</span>
                    )}
                  </div>
                  {emblemFile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      {emblemFile.name}
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
              Group background must be one of the available dimensions: 720x228,
              1440x456
            </p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    {coverPhotoPreview ? (
                      <img
                        src={coverPhotoPreview}
                        alt="Group background preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Preview</span>
                    )}
                  </div>
                  {coverPhotoFile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      {coverPhotoFile.name}
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
                      onChange={handleCoverPhotoUpload}
                      className="hidden"
                    />
                    <span className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg cursor-pointer inline-block text-sm font-medium">
                      Select an image from your computer
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Settings
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="joinSetting"
                  value="open"
                  checked={joinSetting === "open"}
                  onChange={(e) => setJoinSetting(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Anyone Can Join
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="joinSetting"
                  value="approval"
                  checked={joinSetting === "approval"}
                  onChange={(e) => setJoinSetting(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Manual Approval
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/groups">
              <button
                type="button"
                disabled={creating}
                className="px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={creating || !groupName.trim() || !emblemFile}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Uploading images..."
                : creating
                  ? "Creating group..."
                  : "Create Free"}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CreateGroupPage;
