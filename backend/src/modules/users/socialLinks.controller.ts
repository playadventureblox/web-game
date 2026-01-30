import { Request, Response } from "express";
import db from '../../lib/db.js';

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * @route   GET /api/v1/users/social-links/:userId
 * @desc    Get user's social links
 * @access  Public
 */
export const getUserSocialLinks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT id, platform, url, "displayOrder" as display_order
       FROM user_social_links
       WHERE "userId" = $1
       ORDER BY "displayOrder" ASC, "createdAt" ASC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        socialLinks: result.rows,
      },
    });
  } catch (error) {
    console.error("Get social links error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/users/social-links/me
 * @desc    Get current user's social links
 * @access  Private
 */
export const getMySocialLinks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await db.query(
      `SELECT id, platform, url, "displayOrder" as display_order
       FROM user_social_links
       WHERE "userId" = $1
       ORDER BY "displayOrder" ASC, "createdAt" ASC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        socialLinks: result.rows,
      },
    });
  } catch (error) {
    console.error("Get my social links error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/users/social-links
 * @desc    Add or update a social link
 * @access  Private
 */
export const upsertSocialLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: "Platform and URL are required",
      });
    }

    // Validate platform
    const validPlatforms = ['youtube', 'twitter', 'twitch', 'discord', 'facebook', 'instagram', 'tiktok', 'github', 'website'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform",
      });
    }

    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: "URL must start with http:// or https://",
      });
    }

    // Upsert social link
    await db.query(
      `INSERT INTO user_social_links (id, "userId", platform, url, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::TEXT, $1, $2, $3, NOW(), NOW())
       ON CONFLICT ("userId", platform)
       DO UPDATE SET url = $3, "updatedAt" = NOW()`,
      [userId, platform, url]
    );

    return res.status(200).json({
      success: true,
      message: "Social link saved successfully",
    });
  } catch (error) {
    console.error("Upsert social link error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/users/social-links/:platform
 * @desc    Delete a social link
 * @access  Private
 */
export const deleteSocialLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { platform } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await db.query(
      `DELETE FROM user_social_links WHERE "userId" = $1 AND platform = $2`,
      [userId, platform]
    );

    return res.status(200).json({
      success: true,
      message: "Social link deleted successfully",
    });
  } catch (error) {
    console.error("Delete social link error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
