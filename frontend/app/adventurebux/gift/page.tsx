"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

const GiftAdventureBuxPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const presetAmounts = [10, 25, 50, 100, 250, 500, 1000];

  const handleSendGift = () => {
    if (!recipientUsername.trim() || !amount || parseInt(amount) <= 0) return;
    alert(`Gift of ◈${amount} to ${recipientUsername} - Coming soon!`);
    setRecipientUsername("");
    setAmount("");
    setMessage("");
    setStep("form");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gift AdventureBux</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Send AdventureBux from your balance to any user on the platform</p>

        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {/* Balance */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Your Balance</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">◈ 0</span>
          </div>

          {step === "form" ? (
            <div className="space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(String(preset))}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                        amount === String(preset)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      ◈ {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message.length}/200</p>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  if (recipientUsername.trim() && amount && parseInt(amount) > 0) {
                    setStep("confirm");
                  }
                }}
                disabled={!recipientUsername.trim() || !amount || parseInt(amount) <= 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confirmation */}
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎁</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Confirm Gift</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You are about to send AdventureBux
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">To</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">@{recipientUsername}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">◈ {amount}</span>
                </div>
                {message && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Message</span>
                    <span className="text-gray-900 dark:text-gray-100 text-right max-w-[200px] truncate">{message}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400">Remaining Balance</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">◈ {Math.max(0, 0 - parseInt(amount || "0"))}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSendGift}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Send Gift
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GiftAdventureBuxPage;
