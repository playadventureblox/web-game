import { Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

/**
 * @route   GET /api/v1/messages/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get all unique conversations with last message
    const result = await db.query(
      `WITH conversation_users AS (
        SELECT DISTINCT
          CASE 
            WHEN "senderId" = $1 THEN "receiverId"
            ELSE "senderId"
          END as other_user_id
        FROM messages
        WHERE "senderId" = $1 OR "receiverId" = $1
      ),
      last_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN "senderId" = $1 THEN "receiverId"
            ELSE "senderId"
          END
        )
          id,
          "senderId",
          "receiverId",
          content,
          "isRead",
          "createdAt",
          CASE 
            WHEN "senderId" = $1 THEN "receiverId"
            ELSE "senderId"
          END as other_user_id
        FROM messages
        WHERE "senderId" = $1 OR "receiverId" = $1
        ORDER BY 
          CASE 
            WHEN "senderId" = $1 THEN "receiverId"
            ELSE "senderId"
          END,
          "createdAt" DESC
      )
      SELECT 
        u.id,
        u.username,
        u."displayName" as display_name,
        u."avatarUrl" as avatar_url,
        u."presenceStatus" as presence_status,
        lm.content as last_message,
        lm."createdAt" as last_message_time,
        lm."isRead" as is_read,
        lm."senderId" = $1 as is_sender,
        (SELECT COUNT(*) FROM messages 
         WHERE "receiverId" = $1 
         AND "senderId" = u.id 
         AND "isRead" = false) as unread_count
      FROM conversation_users cu
      JOIN users u ON cu.other_user_id = u.id
      LEFT JOIN last_messages lm ON lm.other_user_id = u.id
      ORDER BY lm."createdAt" DESC NULLS LAST`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        conversations: result.rows,
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/messages/:userId
 * @desc    Get message history with a specific user
 * @access  Private
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const { userId: otherUserId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get messages between two users
    const result = await db.query(
      `SELECT 
        m.id,
        m."senderId" as sender_id,
        m."receiverId" as receiver_id,
        m.content,
        m."isRead" as is_read,
        m."readAt" as read_at,
        m."createdAt" as created_at,
        s.username as sender_username,
        s."displayName" as sender_display_name,
        s."avatarUrl" as sender_avatar_url
       FROM messages m
       JOIN users s ON m."senderId" = s.id
       WHERE (m."senderId" = $1 AND m."receiverId" = $2)
          OR (m."senderId" = $2 AND m."receiverId" = $1)
       ORDER BY m."createdAt" DESC
       LIMIT $3 OFFSET $4`,
      [currentUserId, otherUserId, limit, offset]
    );

    // Mark messages as read
    await db.query(
      `UPDATE messages 
       SET "isRead" = true, "readAt" = NOW()
       WHERE "receiverId" = $1 AND "senderId" = $2 AND "isRead" = false`,
      [currentUserId, otherUserId]
    );

    return res.status(200).json({
      success: true,
      data: {
        messages: result.rows.reverse(), // Reverse to show oldest first
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/messages/:userId
 * @desc    Send a message to a user (REST fallback)
 * @access  Private
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.userId;
    const { userId: receiverId } = req.params;
    const { content } = req.body;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long (max 2000 characters)",
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

    // Create message
    const messageId = uuidv4();
    const result = await db.query(
      `INSERT INTO messages (id, "senderId", "receiverId", content, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING 
         id,
         "senderId" as sender_id,
         "receiverId" as receiver_id,
         content,
         "isRead" as is_read,
         "createdAt" as created_at`,
      [messageId, senderId, receiverId, content.trim()]
    );

    // Create notification for the receiver (backend has direct DB access — no RLS)
    try {
      await db.query(
        `INSERT INTO notifications (id, "userId", type, content, "relatedUserId", "isRead", "createdAt")
         VALUES (gen_random_uuid()::TEXT, $1, 'message', $2, $3, false, NOW())`,
        [receiverId, content.trim().slice(0, 100), senderId]
      );
    } catch (notifErr) {
      console.error('Failed to create message notification:', notifErr);
    }

    return res.status(201).json({
      success: true,
      data: {
        message: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/messages/:senderId/read-all
 * @desc    Mark all messages from a sender as read
 * @access  Private
 */
export const markConversationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { senderId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await db.query(
      `UPDATE messages
       SET "isRead" = true, "readAt" = NOW()
       WHERE "receiverId" = $1 AND "senderId" = $2 AND "isRead" = false`,
      [userId, senderId]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark conversation as read error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   PUT /api/v1/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Mark message as read (only if user is receiver)
    const result = await db.query(
      `UPDATE messages 
       SET "isRead" = true, "readAt" = NOW()
       WHERE id = $1 AND "receiverId" = $2
       RETURNING id`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
