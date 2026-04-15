"use client";

import { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

const TransactionsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Transactions" },
    { id: "purchases", label: "Purchases" },
    { id: "sales", label: "Sales" },
    { id: "gifts", label: "Gifts" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">View your AdventureBux transaction history</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">◈ 0</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">◈ 0</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">◈ 0</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No transactions yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TransactionsPage;
