"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { catalogApi } from "@/lib/api";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  category: string;
  subcategory: string;
  itemType: string;
  thumbnailUrl: string;
  robloxAssetId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  tags: string[];
  favoriteCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CatalogItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [equipped, setEquipped] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await catalogApi.getItemById(params.id as string);
        if (response.success && response.data) {
          setItem(response.data.item);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Item Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This item doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Catalog
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left - Item Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <span className="text-6xl">🎨</span>
              </div>
            )}
          </div>

          {/* Right - Item Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {item.category}{item.subcategory ? ` › ${item.subcategory}` : ""}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {item.name}
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              By {item.creatorName}
            </p>

            {item.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Free badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                Free
              </span>
              {item.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-full">
                  Featured
                </span>
              )}
              {!item.isAvailable && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-full">
                  Unavailable
                </span>
              )}
            </div>

            {/* Get Item Button */}
            <button
              onClick={() => setEquipped(!equipped)}
              disabled={!item.isAvailable}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors mb-3 ${
                equipped
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : item.isAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              {equipped ? "✓ Equipped" : item.isAvailable ? "Get Item" : "Unavailable"}
            </button>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.favoriteCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.salesCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
              </div>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
