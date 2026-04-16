"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPerson, faPersonDress } from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usersApi } from "@/lib/api";

interface UserData {
  username?: string;
  display_name?: string;
  is_verified?: boolean;
  birth_month?: string;
  birth_day?: number;
  birth_year?: number;
  gender?: string;
  email?: string;
}

const SettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("account-info");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [socialVisibility, setSocialVisibility] = useState("no-one");

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data.user as UserData;
          setUser(userData);
          setDisplayName(userData.display_name || userData.username || "");
          setSelectedGender(userData.gender || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Update display name if changed
      if (
        displayName !== user?.display_name &&
        displayName !== user?.username
      ) {
        const response = await usersApi.updateProfile({
          displayName: displayName,
        });

        if (!response.success) {
          setErrorMessage(response.message || "Failed to update display name");
          setSaving(false);
          return;
        }
      }

      // Update gender if changed
      if (selectedGender !== user?.gender) {
        // TODO: Add gender update endpoint when backend supports it
        console.log("Gender update:", selectedGender);
      }

      // Refresh user data
      const refreshResponse = await usersApi.getCurrentUser();
      if (refreshResponse.success && refreshResponse.data) {
        setUser(refreshResponse.data.user as UserData);
      }

      setSuccessMessage("Personal information updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialNetworks = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // TODO: Add social networks update endpoint when backend supports it
      console.log("Social networks:", {
        facebook,
        twitter,
        youtube,
        twitch,
        socialVisibility,
      });

      setSuccessMessage("Social networks updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating social networks:", error);
      setErrorMessage("Failed to update social networks");
    } finally {
      setSaving(false);
    }
  };

  const settingsSections = [
    { id: "account-info", label: "Account info" },
    { id: "security", label: "Security" },
    { id: "privacy", label: "Privacy & content restrictions" },
    { id: "notifications", label: "Notifications" },
    { id: "membership", label: "Membership" },
    { id: "parental", label: "Parental controls" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content - Centered and Tight */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Settings
        </h1>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-0.5">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors border-l-3 ${
                    activeSection === section.id
                      ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold"
                      : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 max-w-2xl">
            {activeSection === "account-info" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Account Info
                </h2>

                  <>
                    {/* Display Name */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Display Name:
                          </div>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Username:
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {user?.username || "Not set"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Username cannot be changed
                          </div>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 opacity-50 cursor-not-allowed">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Email:
                          </div>
                          <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {user?.email || "Not set"}
                            {user?.is_verified && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Personal Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Personal
                      </h3>

                      {/* Age Group */}
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Age Group:
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {user?.birth_year
                            ? new Date().getFullYear() - user.birth_year >= 18
                              ? "18+"
                              : "Under 18"
                            : "Not set"}
                        </div>
                      </div>

                      {/* Birthday */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Birthday:
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                              {user?.birth_month &&
                              user?.birth_day &&
                              user?.birth_year
                                ? `${user.birth_month} ${user.birth_day}, ${user.birth_year}`
                                : "Not set"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Birthday cannot be changed
                            </div>
                          </div>
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 opacity-50 cursor-not-allowed">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Gender (Optional)
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSelectedGender("female")}
                            className={`flex-1 border rounded py-3 flex items-center justify-center transition-colors ${
                              selectedGender === "female"
                                ? "border-pink-500 bg-pink-500/20 text-pink-500 dark:bg-pink-500/30"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faPersonDress}
                              className="w-5 h-5"
                            />
                          </button>
                          <button
                            onClick={() => setSelectedGender("male")}
                            className={`flex-1 border rounded py-3 flex items-center justify-center transition-colors ${
                              selectedGender === "male"
                                ? "border-blue-500 bg-blue-500/20 text-blue-500 dark:bg-blue-500/30"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faPerson}
                              className="w-5 h-5"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </div>
                        <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
                          <option>English (United States)</option>
                        </select>
                      </div>

                      {/* Account Location */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Account Location:
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          Pakistan
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Based on signup location
                        </div>
                      </div>

                      {/* Save Button for Personal Info */}
                      <button
                        onClick={handleSavePersonalInfo}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Personal Info"}
                      </button>
                    </div>

                    {/* Social Networks */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Social Networks
                      </h3>

                      <div className="space-y-3 mb-3">
                        <div>
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            Facebook
                          </label>
                          <input
                            type="text"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            placeholder="e.g. www.facebook.com/AdventureBlox"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            X (formerly Twitter)
                          </label>
                          <input
                            type="text"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            placeholder="e.g. @AdventureBlox"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            YouTube
                          </label>
                          <input
                            type="text"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            placeholder="e.g. www.youtube.com/user/adventureblox"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            Twitch
                          </label>
                          <input
                            type="text"
                            value={twitch}
                            onChange={(e) => setTwitch(e.target.value)}
                            placeholder="e.g. www.twitch.tv/adventureblox/profile"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveSocialNetworks}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Social Networks"}
                      </button>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Social networks visibility
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Who can see links to your social network profiles
                        </p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="everyone"
                              checked={socialVisibility === "everyone"}
                              onChange={(e) =>
                                setSocialVisibility(e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Everyone
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="friends-followers"
                              checked={socialVisibility === "friends-followers"}
                              onChange={(e) =>
                                setSocialVisibility(e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Friends, followers & people I follow
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="friends-following"
                              checked={socialVisibility === "friends-following"}
                              onChange={(e) =>
                                setSocialVisibility(e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Friends & people I follow
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="friends"
                              checked={socialVisibility === "friends"}
                              onChange={(e) =>
                                setSocialVisibility(e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Friends
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="no-one"
                              checked={socialVisibility === "no-one"}
                              onChange={(e) =>
                                setSocialVisibility(e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              No one
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
              </div>
            )}

            {/* Other sections placeholder */}
            {activeSection !== "account-info" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {settingsSections.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Settings content for this section will be added here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  );
};

export default SettingsPage;
