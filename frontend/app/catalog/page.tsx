"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Loader2, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
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

interface CategoryEntry {
  category: string;
  itemCount: string;
}

interface SubcategoryEntry {
  subcategory: string;
  itemCount: string;
}

const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [tagScrollPosition, setTagScrollPosition] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  // Category/subcategory data from API
  const [apiCategories, setApiCategories] = useState<CategoryEntry[]>([]);
  const [apiSubcategories, setApiSubcategories] = useState<SubcategoryEntry[]>([]);
  const [modalSelectedCategory, setModalSelectedCategory] = useState("All");
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [sortBy, setSortBy] = useState("Relevance");
  const [unavailableItemsFilter, setUnavailableItemsFilter] = useState(
    "Hide Unavailable Items",
  );

  // Data states
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
const [activeTab, setActiveTab] = useState<"platform" | "roblox">("platform");
const [robloxItems, setRobloxItems] = useState<any[]>([]);
const [robloxLoading, setRobloxLoading] = useState(false);
const [robloxNextCursor, setRobloxNextCursor] = useState<string | null>(null);
const [robloxPrevCursor, setRobloxPrevCursor] = useState<string | null>(null);
const [robloxSearch, setRobloxSearch] = useState("");
const [robloxSearchDebounce, setRobloxSearchDebounce] = useState("");

  // Fetch categories from API on mount
  useEffect(() => {
    catalogApi.getCategories().then((res) => {
      if (res.success && res.data) {
        setApiCategories(res.data.categories);
      }
    });
  }, []);

  // Fetch subcategories when modal category selection changes
  useEffect(() => {
    if (modalSelectedCategory && modalSelectedCategory !== "All") {
      setLoadingSubcategories(true);
      catalogApi.getSubcategories(modalSelectedCategory).then((res) => {
        if (res.success && res.data) {
          setApiSubcategories(res.data.subcategories);
        } else {
          setApiSubcategories([]);
        }
        setLoadingSubcategories(false);
      });
    } else {
      setApiSubcategories([]);
    }
  }, [modalSelectedCategory]);

// Debounce Roblox search
useEffect(() => {
  const timer = setTimeout(() => {
    setRobloxSearchDebounce(robloxSearch);
  }, 400);
  return () => clearTimeout(timer);
}, [robloxSearch]);

// Fetch Roblox catalog
const fetchRobloxItems = useCallback(async (cursor?: string) => {
  setRobloxLoading(true);
  try {
    const response = await (catalogApi as any).searchRobloxCatalog({
      keyword: robloxSearchDebounce || undefined,
      limit: 30,
      cursor: cursor || undefined,
    });
    if (response.success && response.data) {
      setRobloxItems((response.data as any).items || []);
      setRobloxNextCursor((response.data as any).nextPageCursor || null);
      setRobloxPrevCursor((response.data as any).previousPageCursor || null);
    }
  } catch (error) {
    console.error("Failed to fetch Roblox catalog:", error);
  } finally {
    setRobloxLoading(false);
  }
}, [robloxSearchDebounce]);

useEffect(() => {
  if (activeTab === "roblox") {
    fetchRobloxItems();
  }
}, [activeTab, fetchRobloxItems]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(catalogSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  // Fetch catalog items from API
  const fetchItems = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      let availableParam: string | undefined;
      if (unavailableItemsFilter === "Hide Unavailable Items") {
        availableParam = "true";
      } else if (unavailableItemsFilter === "Show Only Unavailable Items") {
        availableParam = "false";
      }

      const response = await catalogApi.getItems({
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        subcategory: subcategoryFilter || undefined,
        search: searchDebounce || undefined,
        sort: sortBy,
        page,
        limit: 30,
        available: availableParam,
      });

      if (response.success && response.data) {
        setCatalogItems(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
        setCurrentPage(response.data.pagination.page);
      } else {
        setCatalogItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
      setCatalogItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, subcategoryFilter, searchDebounce, sortBy, unavailableItemsFilter]);

  // Refetch when filters change
  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  // Open category modal — pre-select current state
  const openCategoryModal = () => {
    setModalSelectedCategory(categoryFilter);
    setShowCategoryModal(true);
  };

  // Apply category modal selection
  const applyCategoryModal = (cat: string, sub: string) => {
    setCategoryFilter(cat);
    setSubcategoryFilter(sub);
    setShowCategoryModal(false);
  };

  // Tag scrolling functions
  const scrollTags = (direction: "left" | "right") => {
    const container = document.getElementById("tags-container");
    if (container) {
      const scrollAmount = 200;
      const newPosition =
        direction === "left"
          ? Math.max(0, tagScrollPosition - scrollAmount)
          : tagScrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setTagScrollPosition(newPosition);
    }
  };

  // Tag selection handlers
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([tag, ...selectedTags]);
      // Also search for the tag
      setCatalogSearch(tag);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
    if (catalogSearch === tag) {
      setCatalogSearch("");
    }
  };

  // Get tags to display (selected tags first, then unselected)
  const getDisplayTags = () => {
    const tags: Array<{
      tag: string;
      isSelected: boolean;
      subTags?: string[];
    }> = [];

    // Add selected tags first with their sub-tags
    selectedTags.forEach((tag) => {
      tags.push({ tag, isSelected: true });
      if (tagData[tag]) {
        tagData[tag].forEach((subTag) => {
          tags.push({ tag: subTag, isSelected: false });
        });
      }
    });

    // Add unselected tags
    popularTags.forEach((tag) => {
      if (!selectedTags.includes(tag)) {
        tags.push({ tag, isSelected: false });
      }
    });

    return tags;
  };

  // Popular tags with sub-tags
  const tagData: { [key: string]: string[] } = {
    beard: ["white", "stubble", "brown", "black", "santa", "long", "grey", "blonde", "chin", "face", "wizard"],
    dreads: ["white", "black", "brown", "blonde", "long", "short", "rainbow"],
    emotes: ["dance", "wave", "laugh", "cry", "point", "sit"],
    face: ["happy", "sad", "angry", "smile", "frown", "eyes"],
    fedora: ["black", "brown", "white", "red", "blue"],
    scarf: ["red", "blue", "winter", "striped", "long"],
    beanie: ["black", "red", "blue", "winter", "warm"],
    sunglasses: ["black", "aviator", "round", "cool"],
    aura: ["blue", "red", "purple", "golden", "rainbow"],
    monster: ["scary", "green", "horns", "teeth"],
    afro: ["black", "brown", "rainbow", "big"],
    halo: ["gold", "angel", "holy"],
    necklace: ["gold", "silver", "chain"],
    mustache: ["black", "brown", "curly", "handlebar"],
    pet: ["dog", "cat", "bird", "dragon", "companion", "animal", "cute"],
    dragon: ["mini", "fire", "ice", "mythical", "wings", "scales"],
    hair: ["black", "brown", "blonde", "red", "messy", "curly", "long", "short"],
    body: ["athletic", "slim", "muscular", "tall"],
    shirt: ["classic", "graphic", "polo", "casual"],
    pants: ["jeans", "cargo", "shorts", "classic"],
  };

  const popularTags = Object.keys(tagData);

  // Sort options
  const sortOptions = [
    "Relevance",
    "Most Favorited",
    "Recently Published",
    "Most Recent",
  ];

  // Unavailable items options
  const unavailableOptions = [
    "Show All Items",
    "Hide Unavailable Items",
    "Show Only Unavailable Items",
  ];

  const CatalogItemCard = ({ item }: { item: CatalogItem }) => (
    <Link href={`/catalog/${item.id}`} className="block group">
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
              <span className="text-4xl">🎮</span>
            </div>
          )}
        </div>
        <div className="pt-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {item.name}
          </h3>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Top Bar - Marketplace Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            {/* Title + Search + Dropdown + Buy Button Row */}
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Left Side: Title */}
              <div className="flex items-center gap-4">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
    Catalog
  </h1>
  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
    <button
      onClick={() => setActiveTab("platform")}
      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
        activeTab === "platform"
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      AdventureBlox
    </button>
    <button
      onClick={() => setActiveTab("roblox")}
      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
        activeTab === "roblox"
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      Roblox Catalog
    </button>
  </div>
</div>

              {/* Right Side: Search + Dropdown + Buy Button + Cart */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {/* Search Bar */}
                <div className="w-full max-w-md relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Category Quick Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setSubcategoryFilter(""); }}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <option value="All">All</option>
                  {apiCategories.map((cat) => (
                    <option key={cat.category} value={cat.category}>{cat.category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Buttons Row */}
            {activeTab === "platform" && <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={openCategoryModal}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  categoryFilter !== "All" || subcategoryFilter
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {subcategoryFilter ? `${categoryFilter} › ${subcategoryFilter}` : categoryFilter}
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setShowSortModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                Sort by {sortBy}
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setShowUnavailableModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                {unavailableItemsFilter}
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>}
          </div>
        </div>
        {/* Popular Tags */}
        {activeTab === "platform" && <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={() => scrollTags("left")}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              aria-label="Scroll tags left"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-400 rotate-180"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Tags Container */}
            <div
              id="tags-container"
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
            >
              {getDisplayTags().map((item, index) =>
                item.isSelected ? (
                  // Selected tag with X button
                  <button
                    key={`${item.tag}-${index}`}
                    className="px-4 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold rounded-full whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    <span>{item.tag}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(item.tag);
                      }}
                      className="hover:bg-gray-700 dark:hover:bg-gray-300 rounded-full p-0.5 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                ) : (
                  // Unselected tag
                  <button
                    key={`${item.tag}-${index}`}
                    onClick={() => toggleTag(item.tag)}
                    className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {item.tag}
                  </button>
                ),
              )}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollTags("right")}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              aria-label="Scroll tags right"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
	}
        {/* Catalog Items Grid */}
<div className="px-4 py-6">
  {activeTab === "platform" ? (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading catalog...</p>
        </div>
      ) : catalogItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-5xl mb-4">🔍</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Showing {catalogItems.length} of {totalItems} items
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {catalogItems.map((item) => (
              <CatalogItemCard key={item.id} item={item} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
              <button
                onClick={() => fetchItems(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchItems(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  ) : (
    <>
      {/* Roblox Search Bar */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder="Search Roblox catalog..."
          value={robloxSearch}
          onChange={(e) => setRobloxSearch(e.target.value)}
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {robloxLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading Roblox catalog...</p>
        </div>
      ) : robloxItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-5xl mb-4">🔍</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Try a different search term</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  {robloxItems.map((item) => (
    <a key={item.id} href={`https://www.roblox.com/catalog/${item.robloxAssetId}`} target="_blank" rel="noopener noreferrer" className="block group">
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
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.priceStatus === "Free" ? "Free" : item.price ? `◈ ${item.price}` : "Free"}
          </p>
        </div>
      </div>
    </a>
))}
</div>
          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8 pb-8">
            <button
              onClick={() => fetchRobloxItems(robloxPrevCursor || undefined)}
              disabled={!robloxPrevCursor}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => fetchRobloxItems(robloxNextCursor || undefined)}
              disabled={!robloxNextCursor}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  )}
</div>
                </main>

      {/* Category Modal — two-level: category then subcategory */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex gap-4">
              {/* Left: Categories */}
              <div className="w-1/2 space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Category</p>
                {/* All option */}
                <button
                  onClick={() => { setModalSelectedCategory("All"); }}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${
                    modalSelectedCategory === "All"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  All
                </button>
                {apiCategories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setModalSelectedCategory(cat.category)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${
                      modalSelectedCategory === cat.category
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <span>{cat.category}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ))}
              </div>

              {/* Right: Subcategories */}
              <div className="w-1/2 space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Subcategory</p>
                {modalSelectedCategory === "All" ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 px-3 py-2">Select a category first</p>
                ) : loadingSubcategories ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => applyCategoryModal(modalSelectedCategory, "")}
                      className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      All {modalSelectedCategory}
                    </button>
                    {apiSubcategories.map((sub) => (
                      <button
                        key={sub.subcategory}
                        onClick={() => applyCategoryModal(modalSelectedCategory, sub.subcategory)}
                        className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        {sub.subcategory}
                        <span className="ml-1 text-xs text-gray-400">({sub.itemCount})</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => applyCategoryModal("All", "")}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => applyCategoryModal(modalSelectedCategory, "")}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort By Modal */}
      {showSortModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Sort By
              </h3>
              <button
                onClick={() => setShowSortModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === option}
                    onChange={() => setSortBy(option)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowSortModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Unavailable Items Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Unavailable Items
              </h3>
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {unavailableOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="radio"
                    name="unavailable"
                    checked={unavailableItemsFilter === option}
                    onChange={() => setUnavailableItemsFilter(option)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowUnavailableModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CatalogPage;
