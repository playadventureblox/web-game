import { Response } from "express";
import db from "../../lib/db.js";
import { createNotification } from "../notifications/notifications.controller.js";
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

/**
 * @route   POST /api/v1/friends/request
 * @desc    Send a friend request
 * @access  Private
 */
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { receiverId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate receiverId
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    // Check if trying to send request to self
    if (userId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    // Check if receiver exists
    const receiverResult = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [receiverId]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already friends
    const friendshipResult = await db.query(
      `SELECT id FROM friendships 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [userId, receiverId]
    );

    if (friendshipResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
    }

    // Check if request already exists
    const existingRequest = await db.query(
      `SELECT id, status FROM friend_requests 
       WHERE ("senderId" = $1 AND "receiverId" = $2) 
       OR ("senderId" = $2 AND "receiverId" = $1)`,
      [userId, receiverId]
    );

    if (existingRequest.rows.length > 0) {
      const request = existingRequest.rows[0];
      if (request.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "A friend request already exists",
        });
      }
    }

    // Create friend request
    const requestId = uuidv4();
    const result = await db.query(
      `INSERT INTO friend_requests ("id", "senderId", "receiverId", "status", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, "senderId" as sender_id, "receiverId" as receiver_id, status, "createdAt" as created_at`,
      [requestId, userId, receiverId, "pending"]
    );

    // Create notification for receiver
    try {
      await createNotification(
        receiverId,
        'friend_request',
        `${userId} sent you a friend request`,
        userId,
        requestId
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      data: {
        request: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/friends/accept/:requestId
 * @desc    Accept a friend request
 * @access  Private
 */
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get the request
    const requestResult = await db.query(
      `SELECT id, "senderId" as sender_id, "receiverId" as receiver_id, status 
       FROM friend_requests 
       WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    const request = requestResult.rows[0];

    // Verify user is the receiver
    if (request.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only accept requests sent to you",
      });
    }

    // Check if request is pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been responded to",
      });
    }

    // Update request status
    await db.query(
      `UPDATE friend_requests 
       SET status = $1, "respondedAt" = NOW() 
       WHERE id = $2`,
      ["accepted", requestId]
    );

    // Create friendship (bidirectional)
    const friendship1Id = uuidv4();
    const friendship2Id = uuidv4();

    console.log("Creating bidirectional friendship:");
    console.log("- Row 1: userId =", request.sender_id, ", friendId =", request.receiver_id);
    console.log("- Row 2: userId =", request.receiver_id, ", friendId =", request.sender_id);

    const insertResult = await db.query(
      `INSERT INTO friendships ("id", "userId", "friendId", "createdAt")
       VALUES ($1, $2, $3, NOW()), ($4, $5, $6, NOW())
       RETURNING *`,
      [
        friendship1Id,
        request.sender_id,
        request.receiver_id,
        friendship2Id,
        request.receiver_id,
        request.sender_id,
      ]
    );

    console.log("Friendships created:", insertResult.rows);

    // Create notification for sender
    const senderResult = await db.query(
      'SELECT "senderId" FROM friend_requests WHERE id = $1',
      [requestId]
    );
    
    if (senderResult.rows.length > 0) {
      const senderId = senderResult.rows[0].senderId as string;
      try {
        await createNotification(
          senderId,
          'friend_request_accepted',
          `${userId} accepted your friend request`,
          userId,
          requestId
        );
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/friends/decline/:requestId
 * @desc    Decline a friend request
 * @access  Private
 */
export const declineFriendRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get the request
    const requestResult = await db.query(
      `SELECT id, "senderId" as sender_id, "receiverId" as receiver_id, status 
       FROM friend_requests 
       WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    const request = requestResult.rows[0];

    // Verify user is the receiver
    if (request.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only decline requests sent to you",
      });
    }

    // Check if request is pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been responded to",
      });
    }

    // Update request status
    await db.query(
      `UPDATE friend_requests 
       SET status = $1, "respondedAt" = NOW() 
       WHERE id = $2`,
      ["declined", requestId]
    );

    return res.status(200).json({
      success: true,
      message: "Friend request declined",
    });
  } catch (error) {
    console.error("Decline friend request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   DELETE /api/v1/friends/:friendId
 * @desc    Remove a friend
 * @access  Private
 */
export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete friendship (both directions)
    const result = await db.query(
      `DELETE FROM friendships 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [userId, friendId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Friendship not found",
      });
    }

    // Also remove from best friends if exists
    await db.query(
      `DELETE FROM best_friends 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [userId, friendId]
    );

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Remove friend error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/friends
 * @desc    Get user's friends list
 * @access  Private
 */
export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("getFriends called for userId:", userId);

    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        u."lastLogin" as last_login,
        p."avatarUrl" as avatar_url,
        p."presenceStatus" as presence_status,
        bf.id as is_best_friend,
        f."createdAt" as friends_since
       FROM friendships f
       JOIN users u ON f."friendId" = u.id
       LEFT JOIN profiles p ON u.id = p."userId"
       LEFT JOIN best_friends bf ON bf."userId" = $1 AND bf."friendId" = u.id
       WHERE f."userId" = $1
       ORDER BY 
         CASE WHEN bf.id IS NOT NULL THEN 0 ELSE 1 END,
         u."displayName" ASC`,
      [userId]
    );

    console.log(`Found ${result.rows.length} friends for user ${userId}:`, result.rows);

    return res.status(200).json({
      success: true,
      data: {
        friends: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error("Get friends error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/friends/requests
 * @desc    Get friend requests (sent and received)
 * @access  Private
 */
export const getFriendRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get received requests
    const receivedResult = await db.query(
      `SELECT 
        fr.id,
        fr.status,
        fr."createdAt" as created_at,
        u.id as sender_id,
        u.username as sender_username,
        u."displayName" as sender_display_name,
        u."isVerified" as sender_is_verified
       FROM friend_requests fr
       JOIN users u ON fr."senderId" = u.id
       WHERE fr."receiverId" = $1 AND fr.status = 'pending'
       ORDER BY fr."createdAt" DESC`,
      [userId]
    );

    // Get sent requests
    const sentResult = await db.query(
      `SELECT 
        fr.id,
        fr.status,
        fr."createdAt" as created_at,
        u.id as receiver_id,
        u.username as receiver_username,
        u."displayName" as receiver_display_name,
        u."isVerified" as receiver_is_verified
       FROM friend_requests fr
       JOIN users u ON fr."receiverId" = u.id
       WHERE fr."senderId" = $1 AND fr.status = 'pending'
       ORDER BY fr."createdAt" DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        received: receivedResult.rows,
        sent: sentResult.rows,
      },
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/friends/best/:friendId
 * @desc    Add friend to best friends
 * @access  Private
 */
export const addBestFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if they are friends
    const friendshipResult = await db.query(
      `SELECT id FROM friendships WHERE "userId" = $1 AND "friendId" = $2`,
      [userId, friendId]
    );

    if (friendshipResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You can only add friends to best friends",
      });
    }

    // Add to best friends (no limit)
    const bestFriendId = uuidv4();
    await db.query(
      `INSERT INTO best_friends ("id", "userId", "friendId", "createdAt")
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [bestFriendId, userId, friendId]
    );

    return res.status(200).json({
      success: true,
      message: "Added to best friends",
    });
  } catch (error) {
    console.error("Add best friend error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   DELETE /api/v1/friends/best/:friendId
 * @desc    Remove friend from best friends
 * @access  Private
 */
export const removeBestFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await db.query(
      `DELETE FROM best_friends WHERE "userId" = $1 AND "friendId" = $2`,
      [userId, friendId]
    );

    return res.status(200).json({
      success: true,
      message: "Removed from best friends",
    });
  } catch (error) {
    console.error("Remove best friend error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/friends/block/:userId
 * @desc    Block a user
 * @access  Private
 */
/**
 * @route   GET /api/v1/friends/best
 * @desc    Get all best friends
 * @access  Private
 */
export const getBestFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get best friends with user details
    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        u."avatarUrl" as avatar_url,
        u."presenceStatus" as presence_status,
        u."currentGame" as current_game,
        bf."createdAt" as best_friend_since
       FROM best_friends bf
       JOIN users u ON bf."friendId" = u.id
       WHERE bf."userId" = $1
       ORDER BY bf."createdAt" DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        bestFriends: result.rows,
      },
    });
  } catch (error) {
    console.error("Get best friends error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/friends/block/:userId
 * @desc    Block a user
 * @access  Private
 */
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { userId: blockedUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (userId === blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    // Remove friendship if exists
    await db.query(
      `DELETE FROM friendships 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [userId, blockedUserId]
    );

    // Remove from best friends if exists
    await db.query(
      `DELETE FROM best_friends 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [userId, blockedUserId]
    );

    // Delete any pending friend requests
    await db.query(
      `DELETE FROM friend_requests 
       WHERE ("senderId" = $1 AND "receiverId" = $2) 
       OR ("senderId" = $2 AND "receiverId" = $1)`,
      [userId, blockedUserId]
    );

    // Add to blocked users
    const blockId = uuidv4();
    await db.query(
      `INSERT INTO blocked_users ("id", "userId", "blockedUserId", "blockedAt")
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [blockId, userId, blockedUserId]
    );

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Block user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   DELETE /api/v1/friends/unblock/:userId
 * @desc    Unblock a user
 * @access  Private
 */
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { userId: blockedUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await db.query(
      `DELETE FROM blocked_users WHERE "userId" = $1 AND "blockedUserId" = $2`,
      [userId, blockedUserId]
    );

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/friends/blocked
 * @desc    Get blocked users list
 * @access  Private
 */
export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        bu."blockedAt" as blocked_at
       FROM blocked_users bu
       JOIN users u ON bu."blockedUserId" = u.id
       WHERE bu."userId" = $1
       ORDER BY bu."blockedAt" DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        blocked: result.rows,
      },
    });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
