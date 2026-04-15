"use client";

import { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

const RedeemPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");

  const handleRedeem = () => {
    if (!redeemCode.trim()) return;
    alert("Redeem functionality coming soon!");
    setRedeemCode("");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Redeem Code</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Enter a code to redeem AdventureBux or items</p>

        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎁</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Have a code?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your gift card or promo code below to redeem it
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="Enter code here"
              maxLength={20}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-lg font-mono tracking-widest placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleRedeem}
              disabled={!redeemCode.trim()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Redeem
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Codes are case-insensitive. Gift cards and promo codes are redeemed instantly.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RedeemPage;
