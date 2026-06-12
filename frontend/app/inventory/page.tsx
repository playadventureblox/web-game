"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProtectedRoute from "../components/ProtectedRoute";
import { catalogApi } from "@/lib/api";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  itemType: string;
  thumbnailUrl: string;
  robloxAssetId: string;
  acquired_at: string;
}

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const categories = [
    "All",
    "Accessories",
    "Clothing",
    "Body Parts",
    "Gear",
    "Emotes",
    "Faces",
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(inventorySearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [inventorySearch]);

  const fetchInventory = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await (catalogApi as any).getUserInventory({
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        search: searchDebounce || undefined,
        page,
        limit: 30,
      });

      if (response.success && response.data) {
        setItems((response.data as any).items || []);
        setTotalPages((response.data as any).pagination?.totalPages || 1);
        setTotalItems((response.data as any).pagination?.totalItems || 0);
        setCurrentPage(page);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchDebounce]);

  useEffect(() => {
    fetchInventory(1);
  }, [fetchInventory]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 w-full">
          {/* Top Bar */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Inventory
                </h1>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="w-full max-w-md relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      categoryFilter === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="px-4 py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading inventory...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="text-5xl mb-4">🎒</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Your inventory is empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Items you acquire will appear here
                </p>
                <Link
                  href="/catalog"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Showing {items.length} of {totalItems} items
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {items.map((item) => (
                    <Link key={item.id} href={`/catalog/${item.id}`} className="block group">
                      <div className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-4xl">🎭</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                    <button
                      onClick={() => fetchInventory(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchInventory(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default InventoryPage;
