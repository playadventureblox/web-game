import { Request, Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

/**
 * @route   GET /api/v1/search/users
 * @desc    Search users by username or display name (semantic search)
 * @access  Public (with optional auth for relationship status)
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, limit = "10" } = req.query;
    const userId = (req as AuthRequest).userId; // Optional auth

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchQuery = q.trim();
    if (searchQuery.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
        },
      });
    }

    const searchLimit = Math.min(parseInt(limit as string) || 10, 50);

    // Search users by username or display name
    // Use ILIKE for case-insensitive partial matching (semantic-like)
    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        u."lastLogin" as last_login,
        CASE 
          WHEN u.username ILIKE $1 THEN 1
          WHEN u.username ILIKE $2 THEN 2
          WHEN u."displayName" ILIKE $1 THEN 3
          WHEN u."displayName" ILIKE $2 THEN 4
          ELSE 5
        END as relevance
       FROM users u
       WHERE (u.username ILIKE $2 OR u."displayName" ILIKE $2)
         AND u."isBanned" = FALSE
       ORDER BY relevance ASC, u.username ASC
       LIMIT $3`,
      [`${searchQuery}`, `%${searchQuery}%`, searchLimit]
    );

    // If user is authenticated, get friendship status for each result
    let usersWithStatus = result.rows;

    if (userId) {
      // Get friendship and request status
      const userIds = result.rows.map((u: { id: string }) => u.id);

      if (userIds.length > 0) {
        const statusResult = await db.query(
          `SELECT 
            COALESCE(f."friendId", fr."receiverId", fr."senderId", bu."blockedUserId") as user_id,
            CASE 
              WHEN f."friendId" IS NOT NULL THEN 'friend'
              WHEN fr."senderId" = $1 THEN 'request_sent'
              WHEN fr."receiverId" = $1 THEN 'request_received'
              WHEN bu."blockedUserId" IS NOT NULL THEN 'blocked'
              ELSE 'none'
            END as status,
            bf.id IS NOT NULL as is_best_friend
           FROM (SELECT unnest($2::text[]) as user_id) u
           LEFT JOIN friendships f ON f."userId" = $1 AND f."friendId" = u.user_id
           LEFT JOIN friend_requests fr ON (
             (fr."senderId" = $1 AND fr."receiverId" = u.user_id AND fr.status = 'pending')
             OR (fr."receiverId" = $1 AND fr."senderId" = u.user_id AND fr.status = 'pending')
           )
           LEFT JOIN blocked_users bu ON bu."userId" = $1 AND bu."blockedUserId" = u.user_id
           LEFT JOIN best_friends bf ON bf."userId" = $1 AND bf."friendId" = u.user_id`,
          [userId, userIds]
        );

        const statusMap = new Map(
          statusResult.rows.map((r: { user_id: string; status: string; is_best_friend: boolean }) => [
            r.user_id,
            { status: r.status, is_best_friend: r.is_best_friend },
          ])
        );

        usersWithStatus = result.rows.map((user: { id: string }) => ({
          ...user,
          friendship_status: statusMap.get(user.id)?.status || "none",
          is_best_friend: statusMap.get(user.id)?.is_best_friend || false,
        }));
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        users: usersWithStatus,
        query: searchQuery,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/search/quick
 * @desc    Quick search for autocomplete (users only for now)
 * @access  Public
 */
/**
 * @route   GET /api/v1/search/groups
 * @desc    Search groups by name
 * @access  Public
 */
export const searchGroupsGlobal = async (req: Request, res: Response) => {
  try {
    const { q, limit = "8" } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: { groups: [] },
      });
    }

    const searchLimit = Math.min(parseInt(limit as string) || 8, 20);
    const result = await db.query(
      `SELECT
        id,
        name,
        description,
        "iconUrl" as icon_url,
        "memberCount" as member_count,
        "isVerified" as is_verified
      FROM groups
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY "memberCount" DESC, name ASC
      LIMIT $2`,
      [`%${q.trim()}%`, searchLimit],
    );

    return res.status(200).json({
      success: true,
      data: { groups: result.rows },
    });
  } catch (error) {
    console.error("Search groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/search/games
 * @desc    Search games by title
 * @access  Public
 */
export const searchGames = async (req: Request, res: Response) => {
  try {
    const { q, limit = "8" } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: { games: [] },
      });
    }

    const searchLimit = Math.min(parseInt(limit as string) || 8, 20);
    const result = await db.query(
      `SELECT
        g.id,
        g.title,
        g.description,
        g."thumbnailUrl" as thumbnail_url,
        g."iconUrl" as icon_url,
        g.visits,
        g.likes,
        g."currentPlayers" as current_players
      FROM games g
      WHERE g."isPublished" = true
        AND LOWER(g.title) LIKE LOWER($1)
      ORDER BY g.visits DESC, g.title ASC
      LIMIT $2`,
      [`%${q.trim()}%`, searchLimit],
    );

    return res.status(200).json({
      success: true,
      data: { games: result.rows },
    });
  } catch (error) {
    console.error("Search games error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const quickSearch = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
        },
      });
    }

    const searchQuery = q.trim();

    // Quick search - only exact username starts
    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified
       FROM users u
       WHERE u.username ILIKE $1
         AND u."isBanned" = FALSE
       ORDER BY u.username ASC
       LIMIT 5`,
      [`${searchQuery}%`]
    );

    return res.status(200).json({
      success: true,
      data: {
        users: result.rows,
      },
    });
  } catch (error) {
    console.error("Quick search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
