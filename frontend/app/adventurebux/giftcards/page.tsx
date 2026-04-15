"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

const GiftCardsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const giftCards = [
    { id: 1, value: 400, price: "$4.99", color: "from-blue-500 to-blue-600" },
    { id: 2, value: 800, price: "$9.99", color: "from-purple-500 to-purple-600" },
    { id: 3, value: 1700, price: "$19.99", color: "from-green-500 to-green-600" },
    { id: 4, value: 3500, price: "$39.99", color: "from-orange-500 to-orange-600" },
    { id: 5, value: 4500, price: "$49.99", color: "from-red-500 to-red-600" },
    { id: 6, value: 10000, price: "$99.99", color: "from-yellow-500 to-yellow-600" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">AdventureBux Gift Cards</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Purchase a gift card for yourself or someone special</p>

        {/* Gift Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {giftCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Visual */}
              <div className={`bg-gradient-to-br ${card.color} p-8 text-center`}>
                <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">◈</span>
                </div>
                <p className="text-white text-3xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-white/80 text-sm mt-1">AdventureBux</p>
              </div>

              {/* Card Details */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.price}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">USD</span>
                </div>
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">How Gift Cards Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-xl">🛒</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">1. Purchase</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Choose a gift card amount and complete the purchase</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-xl">📧</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">2. Receive Code</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Get a unique redemption code instantly</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-xl">🎉</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">3. Redeem</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Redeem the code on the{" "}
                <Link href="/adventurebux/redeem" className="text-blue-600 dark:text-blue-400 hover:underline">
                  redeem page
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GiftCardsPage;
