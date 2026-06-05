const ROBLOX_GAMES_API = "https://games.roblox.com/v1/games";
const ROBLOX_THUMBNAILS_API = "https://thumbnails.roblox.com/v1/games/multiget/thumbnails";

export interface RobloxGameData {
  universeId: number;
  name: string;
  description: string;
  visits: number;
  playing: number;
  favoritedCount: number;
  thumbnailUrl: string | null;
}

export const fetchRobloxGameData = async (universeId: number): Promise<RobloxGameData | null> => {
  try {
    const gameRes = await fetch(`${ROBLOX_GAMES_API}?universeIds=${universeId}`);
    if (!gameRes.ok) return null;

    const gameData = await gameRes.json() as { data: any[] };
    if (!gameData.data || gameData.data.length === 0) return null;

    const game = gameData.data[0];

    const thumbRes = await fetch(
      `${ROBLOX_THUMBNAILS_API}?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`
    );

    let thumbnailUrl = null;
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json() as { data: any[] };
      if (thumbData.data && thumbData.data.length > 0) {
        const thumbEntry = thumbData.data[0];
        if (thumbEntry.thumbnails && thumbEntry.thumbnails.length > 0) {
          thumbnailUrl = thumbEntry.thumbnails[0].imageUrl || null;
        }
      }
    }

    return {
      universeId: game.id,
      name: game.name,
      description: game.description,
      visits: game.visits || 0,
      playing: game.playing || 0,
      favoritedCount: game.favoritedCount || 0,
      thumbnailUrl,
    };
  } catch (error) {
    console.error("Error fetching Roblox game data:", error);
    return null;
  }
};

export const fetchMultipleRobloxGames = async (universeIds: number[]): Promise<Map<number, RobloxGameData>> => {
  const result = new Map<number, RobloxGameData>();
  if (universeIds.length === 0) return result;

  try {
    const ids = universeIds.join(",");
    const gameRes = await fetch(`${ROBLOX_GAMES_API}?universeIds=${ids}`);
    if (!gameRes.ok) return result;

    const gameData = await gameRes.json() as { data: any[] };
    if (!gameData.data) return result;

    const thumbRes = await fetch(
      `${ROBLOX_THUMBNAILS_API}?universeIds=${ids}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`
    );

    const thumbMap = new Map<number, string>();
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json() as { data: any[] };
      if (thumbData.data) {
        for (const entry of thumbData.data) {
          if (entry.thumbnails && entry.thumbnails.length > 0) {
            thumbMap.set(entry.universeId, entry.thumbnails[0].imageUrl || "");
          }
        }
      }
    }

    for (const game of gameData.data) {
      result.set(game.id, {
        universeId: game.id,
        name: game.name,
        description: game.description,
        visits: game.visits || 0,
        playing: game.playing || 0,
        favoritedCount: game.favoritedCount || 0,
        thumbnailUrl: thumbMap.get(game.id) || null,
      });
    }
  } catch (error) {
    console.error("Error fetching multiple Roblox games:", error);
  }

  return result;
};