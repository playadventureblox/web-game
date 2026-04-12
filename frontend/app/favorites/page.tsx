'use client';

import { useState } from "react";
import { Heart } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const FavoritesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Favorites</h1>

        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No Favorites Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Games you favorite will appear here. Start exploring and add some!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
