"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const AvatarPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Recent");
  const [activeSubTab, setActiveSubTab] = useState("Recently Added");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
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
    Characters: ["Purchased", "Creations"],
    Clothing: ["Outerwear", "Classic"],
    Accessories: [
      "Head",
      "Face",
      "Neck",
      "Shoulders",
      "Front",
      "Back",
      "Waist",
      "Gear",
    ],
    "Head & Body": [
      "Heads",
      "Skin Tone",
      "Hair",
      "Classic Heads",
      "Classic Faces",
      "Torso",
      "Left Arms",
      "Right Arms",
      "Left Legs",
      "Right Legs",
      "Scale",
    ],
    Animations: [
      "Emotes",
      "Walk",
      "Run",
      "Fall",
      "Jump",
      "Swim",
      "Climb",
      "Idle",
    ],
    Pets: [
      "All Pets",
      "Dogs",
      "Cats",
      "Birds",
      "Reptiles",
      "Fantasy",
      "Mythical",
      "Dragons",
      "Companions",
    ],
  };

  // Mock avatar items - adjust based on active tab
  const getPetItems = () => [
    {
      id: 1,
      name: "Golden Retriever Puppy",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    { id: 2, name: "Black Cat", type: "Pet", selected: false, isPet: true },
    { id: 3, name: "Blue Parrot", type: "Pet", selected: false, isPet: true },
    { id: 4, name: "Mini Dragon", type: "Pet", selected: true, isPet: true },
    {
      id: 5,
      name: "Phoenix Companion",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    { id: 6, name: "White Wolf", type: "Pet", selected: false, isPet: true },
    {
      id: 7,
      name: "Axolotl Friend",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    { id: 8, name: "Unicorn", type: "Pet", selected: false, isPet: true },
    { id: 9, name: "Baby Panda", type: "Pet", selected: false, isPet: true },
    { id: 10, name: "Otter Buddy", type: "Pet", selected: false, isPet: true },
    { id: 11, name: "Space Dog", type: "Pet", selected: false, isPet: true },
    { id: 12, name: "Crystal Fox", type: "Pet", selected: false, isPet: true },
    {
      id: 13,
      name: "Rainbow Butterfly",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    {
      id: 14,
      name: "Shadow Panther",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    {
      id: 15,
      name: "Fire Salamander",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    { id: 16, name: "Ice Phoenix", type: "Pet", selected: false, isPet: true },
    {
      id: 17,
      name: "Thunder Eagle",
      type: "Pet",
      selected: false,
      isPet: true,
    },
    { id: 18, name: "Mystical Owl", type: "Pet", selected: false, isPet: true },
    { id: 19, name: "Ninja Cat", type: "Pet", selected: false, isPet: true },
    {
      id: 20,
      name: "Guardian Lion",
      type: "Pet",
      selected: false,
      isPet: true,
    },
  ];

  const getRegularItems = () =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `Avatar Item ${i + 1}`,
      type:
        i % 5 === 0
          ? "Head"
          : i % 5 === 1
            ? "Face"
            : i % 5 === 2
              ? "Hair"
              : i % 5 === 3
                ? "Clothing"
                : "Accessory",
      selected: [0, 6, 9, 15].includes(i),
      isPet: false,
    }));

  // Mock avatar items
  const avatarItems = activeTab === "Pets" ? getPetItems() : getRegularItems();

  // Handle scroll for sticky tabs
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
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Header Section */}
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

          {/* Main Layout */}
          <div className="flex gap-6">
            {/* Left - Avatar Preview */}
            <div className="w-[300px] flex-shrink-0 sticky top-24 self-start">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg aspect-[3/4] flex items-end justify-center p-6 relative">
                {/* Placeholder Avatar */}
                <div className="w-48 h-64 bg-gray-400 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  Avatar Preview
                </div>

                {/* 3D Badge */}
                <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded font-semibold text-sm text-gray-900 dark:text-gray-100">
                  3D
                </div>
              </div>

              {/* Body Type Slider */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Body Type
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    0%
                  </span>
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
                <Link
                  href="/avatar"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2"
                >
                  Redraw
                </Link>
              </div>
            </div>

            {/* Right - Items Grid */}
            <div className="flex-1">
              {/* Main Tabs */}
              <div
                ref={tabsRef}
                className={`${isTabsSticky ? "fixed top-[70px] left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4" : ""}`}
              >
                <div
                  className={`${isTabsSticky ? "max-w-[1400px] mx-auto" : ""} flex gap-6 border-b border-gray-200 dark:border-gray-800`}
                >
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
                      <ChevronDown
                        className={`w-4 h-4 inline ml-1 ${activeTab === tab ? "" : "opacity-50"}`}
                      />
                      {/* Active state - Black underline */}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />
                      )}
                      {/* Hover state - Grey underline */}
                      {activeTab !== tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-400 dark:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Sub Tabs */}
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

              {/* Add spacing when tabs are sticky */}
              {isTabsSticky && <div className="h-24"></div>}

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {avatarItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                  >
                    {/* Selected checkmark */}
                    {item.selected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-gray-700 rounded flex items-center justify-center z-10 border border-gray-300 dark:border-gray-600">
                        <svg
                          className="w-4 h-4 text-gray-900 dark:text-gray-100"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Pet Badge for pet items */}
                    {item.isPet && (
                      <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        PET
                      </div>
                    )}

                    {/* Item Image Placeholder */}
                    <div
                      className={`aspect-square ${item.isPet ? "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900" : "bg-gray-100 dark:bg-gray-800"} rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700`}
                    >
                      <div
                        className={`w-20 h-20 ${item.isPet ? "bg-purple-300 dark:bg-purple-600" : "bg-gray-300 dark:bg-gray-600"} rounded`}
                      ></div>
                    </div>

                    {/* Item Name - No background */}
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      {item.isPet && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                          Companion
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvatarPage;
