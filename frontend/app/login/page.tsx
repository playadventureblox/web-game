"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Footer from "../components/Footer";
import PublicRoute from "../components/PublicRoute";
import { authApi, storage, accountsApi } from "@/lib/api";

const LoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailCodeModal, setShowEmailCodeModal] = useState(false);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Check if we're adding an account on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const addingAccount = localStorage.getItem("addingAccount");
      if (addingAccount === "true") {
        setIsAddingAccount(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });

      if (response.success && response.data) {
        // Check if we're adding an account
        if (isAddingAccount) {
          console.log("🔵 Adding account flow detected");
          console.log(
            "🔵 Primary user token exists:",
            !!storage.getAccessToken(),
          );
          console.log("🔵 New account user ID:", response.data.user.id);

          // Add the account via API
          const addAccountResponse = await accountsApi.addAccount(
            response.data.user.id,
            response.data.accessToken,
            response.data.refreshToken,
          );

          console.log("🔵 Add account response:", addAccountResponse);

          // Clear the flag
          localStorage.removeItem("addingAccount");

          if (addAccountResponse.success) {
            console.log("✅ Account added successfully, switching tokens");
            // Switch to the new account
            storage.setTokens(
              response.data.accessToken,
              response.data.refreshToken,
            );

            // Redirect to home
            router.push("/home");
          } else {
            console.error(
              "❌ Failed to add account:",
              addAccountResponse.error,
            );
            setErrors([addAccountResponse.error || "Failed to add account"]);
          }
        } else {
          // Normal login flow
          storage.setTokens(
            response.data.accessToken,
            response.data.refreshToken,
          );

          // Redirect to home
          router.push("/home");
        }
      } else {
        // Handle validation errors from backend
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setErrors(
            response.errors.map(
              (err: { msg?: string; message?: string }) =>
                err.msg || err.message || String(err),
            ),
          );
        } else if (response.message) {
          setErrors([response.message]);
        } else {
          setErrors(["Login failed. Please try again."]);
        }
      }
    } catch {
      setErrors(["An error occurred. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Send code to:", email);
    setShowEmailCodeModal(false);
  };

  return (
    <PublicRoute>
      <div
        className="min-h-screen bg-gray-900 bg-cover bg-center bg-no-repeat relative dark"
        style={{ backgroundImage: `url(/gaming-bg.jpg)` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header with dark semi-transparent background */}
          <header className="bg-gray-900/70 backdrop-blur-sm flex items-center justify-between gap-4 px-6 py-2.5">
            {/* Left Section - Logo and Navigation */}
            <div className="flex items-center gap-4 flex-1">
              {/* Logo */}
              <Link href="/signup" className="flex-shrink-0">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-gray-700 hover:bg-white/20 transition-colors">
                  <span className="text-white font-bold text-lg">◈</span>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                <a
                  href="/games"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Games
                </a>
                <a
                  href="/catalog"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Catalog
                </a>
                <a
                  href="/create"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Create
                </a>
                <a
                  href="/adventurebux"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  AdventureBux
                </a>
              </nav>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 border border-gray-600 rounded-lg px-3 py-1.5 bg-gray-800/50 w-64">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-transparent text-white placeholder:text-gray-400 text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Right Section - Signup */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/signup">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition-colors text-sm">
                  Sign Up
                </button>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-center text-white mb-8">
                Login to AdventureBlox
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username/Email/Phone Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Username/Email/Phone"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
                    {errors.length === 1 ? (
                      <div className="font-medium">{errors[0]}</div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((err, index) => (
                          <li key={index}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 h-12 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </form>

              {/* Forgot Password */}
              <div className="text-center mt-6">
                <Link
                  href="/login/forgot-password-or-username"
                  className="text-white hover:underline text-sm font-medium"
                >
                  Forgot Password or Username?
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <span className="text-gray-400 text-sm">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="/signup"
                  className="text-white hover:underline text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Email One-Time Code Modal */}
        {showEmailCodeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowEmailCodeModal(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-center text-white mb-4">
                Get One-Time Code
              </h2>

              <p className="text-sm text-gray-400 mb-6">
                Enter the email verified on your account to receive a one-time
                code.
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />

                <button
                  type="submit"
                  className="w-full bg-gray-700/70 border border-gray-600 text-white hover:bg-gray-700 h-12 rounded font-medium"
                >
                  Send Code
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={() => setShowEmailCodeModal(false)}
                  className="text-white hover:underline text-sm font-medium"
                >
                  Use Another Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicRoute>
  );
};

export default LoginPage;
