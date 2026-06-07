"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { catalogApi } from "@/lib/api";

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  itemType: string;
  thumbnailUrl: string;
  robloxAssetId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  favoriteCount: number;
}

const TAB_TO_CATEGORY: Record<string, { category?: string; subcategory?: string }> = {
  "Recently Added": { category: undefined, subcategory: undefined },
  "Recently Worn": { category: undefined, subcategory: undefined },
  "Accessories": { category: "Accessories", subcategory: undefined },
  "Clothing": { category: "Clothing", subcategory: undefined },
  "Body Parts": { category: "Body", subcategory: undefined },
  "Animations": { category: undefined, subcategory: undefined },
  "Characters": { category: "Body", subcategory: "Full Bodies" },
  "Pets": { category: undefined, subcategory: undefined },
  "Outerwear": { category: "Clothing", subcategory: undefined },
  "Classic": { category: "Clothing", subcategory: undefined },
  "Neck": { category: "Accessories", subcategory: "Neck" },
  "Hair": { category: "Body", subcategory: "Hair" },
  "Classic Heads": { category: "Body", subcategory: "Classic Heads" },
  "Classic Faces": { category: "Body", subcategory: "Classic Faces" },
  "Full Bodies": { category: "Body", subcategory: "Full Bodies" },
};

const AvatarPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Recent");
  const [activeSubTab, setActiveSubTab] = useState("Recently Added");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsOffsetRef = useRef<number>(0);

  const mainTabs = [
    "Recent",
    "Characters",
    "Clothing",
    "Accessories",
    "Head & Body",
    "Animations",
    "Pets",
  ];

  const subTabs: { [key: string]: string[] } = {
    Recent: [
      "Recently Added",
      "Recently Worn",
      "Accessories",
      "Clothing",
      "Body Parts",
      "Animations",
      "Characters",
      "Pets",
    ],
    Characters: ["Full Bodies"],
    Clothing: ["Outerwear", "Classic"],
    Accessories: ["Neck"],
    "Head & Body": [
      "Hair",
      "Classic Heads",
      "Classic Faces",
    ],
    Animations: ["Emotes"],
    Pets: ["All Pets"],
  };

  const fetchItems = useCallback(async (subTab: string, page: number = 1) => {
    setLoading(true);
    try {
      const mapping = TAB_TO_CATEGORY[subTab];
      if (!mapping || (!mapping.category && subTab !== "Recently Added")) {
        setItems([]);
        setLoading(false);
        return;
      }

      const response = await catalogApi.getItems({
        category: mapping.category,
        subcategory: mapping.subcategory,
        sort: subTab === "Recently Added" ? "recent" : "relevance",
        page,
        limit: 24,
        available: "true",
      });

      if (response.success && response.data) {
        setItems(response.data.items as CatalogItem[]);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(activeSubTab, 1);
  }, [activeSubTab, fetchItems]);

  const toggleEquip = (itemId: string) => {
    setEquippedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (tabsRef.current) {
      tabsOffsetRef.current = tabsRef.current.offsetTop;
    }

    const handleScroll = () => {
      if (tabsOffsetRef.current > 0) {
        setIsTabsSticky(window.scrollY > tabsOffsetRef.current - 70);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Avatar Editor
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Explore the catalog to find more clothes!
              </span>
              <Link href="/catalog">
                <button className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded transition-colors">
                  Get More
                </button>
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Left - Avatar Preview */}
            <div className="w-[300px] flex-shrink-0 sticky top-24 self-start">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg aspect-[3/4] flex items-end justify-center p-6 relative">
                <div className="w-48 h-64 bg-gray-400 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm">
                  Avatar Preview
                </div>
                <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded font-semibold text-sm text-gray-900 dark:text-gray-100">
                  3D
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Body Type
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">0%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="0"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="mt-4 text-center">
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                  Avatar isn&apos;t loading correctly?
                </button>
                <Link href="/avatar" className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2">
                  Redraw
                </Link>
              </div>

              {/* Equipped items count */}
              {equippedItems.size > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    {equippedItems.size} item{equippedItems.size > 1 ? "s" : ""} equipped
                  </p>
                </div>
              )}
            </div>

            {/* Right - Items Grid */}
            <div className="flex-1">
              {/* Main Tabs */}
              <div
                ref={tabsRef}
                className={`${isTabsSticky ? "fixed top-[70px] left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4" : ""}`}
              >
                <div className={`${isTabsSticky ? "max-w-[1400px] mx-auto" : ""} flex gap-6 border-b border-gray-200 dark:border-gray-800`}>
                  {mainTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        if (subTabs[tab]) {
                          setActiveSubTab(subTabs[tab][0]);
                        }
                      }}
                      className={`pb-3 text-sm font-semibold transition-colors relative group ${
                        activeTab === tab
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {tab}
                      <ChevronDown className={`w-4 h-4 inline ml-1 ${activeTab === tab ? "" : "opacity-50"}`} />
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />
                      )}
                      {activeTab !== tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-400 dark:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>

                {subTabs[activeTab] && (
                  <div className="flex gap-4 mt-4">
                    {subTabs[activeTab].map((subTab) => (
                      <button
                        key={subTab}
                        onClick={() => setActiveSubTab(subTab)}
                        className={`text-sm transition-colors ${
                          activeSubTab === subTab
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                      >
                        {subTab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isTabsSticky && <div className="h-24"></div>}

              {/* Items Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No items available for this category.</p>
                  <Link href="/catalog" className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleEquip(item.id)}
                        className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                      >
                        {equippedItems.has(item.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-gray-700 rounded flex items-center justify-center z-10 border border-gray-300 dark:border-gray-600">
                            <svg className="w-4 h-4 text-gray-900 dark:text-gray-100" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        <div className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          equippedItems.has(item.id)
                            ? "border-blue-500"
                            : "border-gray-200 dark:border-gray-700"
                        } bg-gray-100 dark:bg-gray-800`}>
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-3xl">🎨</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {item.subcategory || item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => fetchItems(activeSubTab, currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => fetchItems(activeSubTab, currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AvatarPage;
