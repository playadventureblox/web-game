import { Request, Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

/**
 * @route   GET /api/v1/feed
 * @desc    Get homepage feed posts (all users)
 * @access  Public
 */
export const getFeedPosts = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = (req as any).userId;

    const postsResult = await db.query(
      `SELECT
        fp.id,
        fp.content,
        fp."imageUrl" as image_url,
        fp.likes,
        fp."commentCount" as comment_count,
        fp."createdAt" as created_at,
        fp."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
        ${userId ? `, EXISTS(SELECT 1 FROM feed_post_likes WHERE "postId" = fp.id AND "userId" = $3) as liked_by_me` : ''}
      FROM feed_posts fp
      LEFT JOIN users u ON fp."authorId" = u.id
      ORDER BY fp."createdAt" DESC
      LIMIT $1 OFFSET $2`,
      userId ? [limit, offset, userId] : [limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: {
        posts: postsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get feed posts error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   POST /api/v1/feed
 * @desc    Create a feed post
 * @access  Private
 */
export const createFeedPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { content, imageUrl } = req.body;

    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({ success: false, message: "Content or image is required" });
    }

    const postId = uuidv4();
    await db.query(
      `INSERT INTO feed_posts (id, "authorId", content, "imageUrl")
       VALUES ($1, $2, $3, $4)`,
      [postId, userId, content?.trim() || null, imageUrl || null],
    );

    const postResult = await db.query(
      `SELECT
        fp.id,
        fp.content,
        fp."imageUrl" as image_url,
        fp.likes,
        fp."commentCount" as comment_count,
        fp."createdAt" as created_at,
        fp."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM feed_posts fp
      LEFT JOIN users u ON fp."authorId" = u.id
      WHERE fp.id = $1`,
      [postId],
    );

    return res.status(201).json({
      success: true,
      data: { post: postResult.rows[0] },
    });
  } catch (error) {
    console.error("Create feed post error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   DELETE /api/v1/feed/:id
 * @desc    Delete a feed post (author only)
 * @access  Private
 */
export const deleteFeedPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const postId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await db.query(
      `DELETE FROM feed_posts WHERE id = $1 AND "authorId" = $2 RETURNING id`,
      [postId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found or not authorized" });
    }

    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete feed post error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   POST /api/v1/feed/:id/like
 * @desc    Toggle like on a feed post
 * @access  Private
 */
export const toggleFeedPostLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const postId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if already liked
    const existing = await db.query(
      `SELECT id FROM feed_post_likes WHERE "postId" = $1 AND "userId" = $2`,
      [postId, userId],
    );

    if (existing.rows.length > 0) {
      // Unlike
      await db.query(`DELETE FROM feed_post_likes WHERE "postId" = $1 AND "userId" = $2`, [postId, userId]);
      await db.query(`UPDATE feed_posts SET likes = GREATEST(likes - 1, 0) WHERE id = $1`, [postId]);
      return res.status(200).json({ success: true, liked: false });
    } else {
      // Like
      await db.query(
        `INSERT INTO feed_post_likes (id, "postId", "userId") VALUES ($1, $2, $3)`,
        [uuidv4(), postId, userId],
      );
      await db.query(`UPDATE feed_posts SET likes = likes + 1 WHERE id = $1`, [postId]);
      return res.status(200).json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("Toggle feed like error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   GET /api/v1/feed/:id/comments
 * @desc    Get comments for a feed post
 * @access  Public
 */
export const getFeedPostComments = async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.id);

    const result = await db.query(
      `SELECT
        c.id,
        c.content,
        c."createdAt" as created_at,
        c."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM feed_post_comments c
      LEFT JOIN users u ON c."authorId" = u.id
      WHERE c."postId" = $1
      ORDER BY c."createdAt" ASC`,
      [postId],
    );

    return res.status(200).json({
      success: true,
      data: { comments: result.rows },
    });
  } catch (error) {
    console.error("Get feed comments error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   POST /api/v1/feed/:id/comments
 * @desc    Add a comment to a feed post
 * @access  Private
 */
export const createFeedPostComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const postId = String(req.params.id);
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const commentId = uuidv4();
    await db.query(
      `INSERT INTO feed_post_comments (id, "postId", "authorId", content) VALUES ($1, $2, $3, $4)`,
      [commentId, postId, userId, content.trim()],
    );

    await db.query(
      `UPDATE feed_posts SET "commentCount" = "commentCount" + 1 WHERE id = $1`,
      [postId],
    );

    const result = await db.query(
      `SELECT
        c.id, c.content, c."createdAt" as created_at, c."authorId" as author_id,
        u.username as author_username, u."displayName" as author_display_name, u."isVerified" as author_is_verified
      FROM feed_post_comments c
      LEFT JOIN users u ON c."authorId" = u.id
      WHERE c.id = $1`,
      [commentId],
    );

    return res.status(201).json({
      success: true,
      data: { comment: result.rows[0] },
    });
  } catch (error) {
    console.error("Create feed comment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
