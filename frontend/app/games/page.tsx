"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  creatorId: string;
  visits: number;
  favorites: number;
  currentPlayers: number;
  is_sponsored?: boolean;
  sponsor_bid?: number;
  createdAt: string;
}

const GamesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [sponsoredGames, setSponsoredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchGames = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.append("search", search);
      const res = await fetch(`${API_BASE_URL}/games?${params}`);
      const data = await res.json();
      if (data.success) {
        setGames(data.data.games);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(data.data.pagination.page);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsoredGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/games/sponsored`);
      const data = await res.json();
      if (data.success) {
        setSponsoredGames(data.data.games || []);
      }
    } catch (error) {
      console.error("Failed to fetch sponsored games:", error);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchSponsoredGames();
  }, []);

  const GameCard = ({ game, isSponsored = false }: { game: Game; isSponsored?: boolean }) => (
    <div className="group cursor-pointer">
      <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-video mb-2 relative">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
        {isSponsored && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            Sponsored
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
        {game.title}
      </h3>
      <p className="text-xs text-gray-500">
        {game.visits?.toLocaleString() || 0} visits
      </p>
      <a
        href={`roblox://experiences/start?placeId=${game.id}`}
        className="mt-2 block text-center bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded transition-colors"
      >
        Play
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="max-w-[1920px] mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Games
        </h1>

        {/* Sponsored Games Section */}
        {sponsoredGames.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-yellow-500">★</span> Sponsored Games
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sponsoredGames.map((game) => (
                <GameCard key={game.id} game={game} isSponsored={true} />
              ))}
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 mt-6" />
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Games Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Games will appear here once they are published on the platform. Check back soon!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">All Games</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {games.map((game) => (
                <GameCard key={game.id} game={game} isSponsored={game.is_sponsored} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchGames(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchGames(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GamesPage;
