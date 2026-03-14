import { Request, Response } from "express";
import db from '../../lib/db.js';

interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

/**
 * @route   GET /api/v1/groups/:id/social-links
 * @desc    Get group social links
 * @access  Public
 */
export const getGroupSocialLinks = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const linksResult = await db.query(
      `SELECT
        id,
        "groupId" as group_id,
        discord,
        twitter,
        youtube,
        twitch,
        facebook,
        instagram,
        tiktok,
        website,
        discord_title,
        twitter_title,
        youtube_title,
        twitch_title,
        facebook_title,
        instagram_title,
        tiktok_title,
        website_title,
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM group_social_links
      WHERE "groupId" = $1`,
      [id],
    );

    if (linksResult.rows.length === 0) {
      // Create default empty links if they don't exist
      const createResult = await db.query(
        `INSERT INTO group_social_links ("groupId")
         VALUES ($1)
         RETURNING
           id,
           "groupId" as group_id,
           discord,
           twitter,
           youtube,
           twitch,
           facebook,
           instagram,
           tiktok,
           website,
           discord_title,
           twitter_title,
           youtube_title,
           twitch_title,
           facebook_title,
           instagram_title,
           tiktok_title,
           website_title,
           "createdAt" as created_at,
           "updatedAt" as updated_at`,
        [id],
      );

      return res.status(200).json({
        success: true,
        data: {
          socialLinks: createResult.rows[0],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        socialLinks: linksResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Get group social links error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/groups/:id/social-links
 * @desc    Update group social links
 * @access  Private (Owner only)
 */
export const updateGroupSocialLinks = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can update social links",
      });
    }

    const {
      discord,
      twitter,
      youtube,
      twitch,
      facebook,
      instagram,
      tiktok,
      website,
      discord_title,
      twitter_title,
      youtube_title,
      twitch_title,
      facebook_title,
      instagram_title,
      tiktok_title,
      website_title,
    } = req.body;

    // Check if social links exist
    const existingLinks = await db.query(
      'SELECT id FROM group_social_links WHERE "groupId" = $1',
      [id],
    );

    let linksResult;

    if (existingLinks.rows.length === 0) {
      // Create new social links
      linksResult = await db.query(
        `INSERT INTO group_social_links (
          "groupId",
          discord,
          twitter,
          youtube,
          twitch,
          facebook,
          instagram,
          tiktok,
          website,
          discord_title,
          twitter_title,
          youtube_title,
          twitch_title,
          facebook_title,
          instagram_title,
          tiktok_title,
          website_title,
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING
          id,
          "groupId" as group_id,
          discord,
          twitter,
          youtube,
          twitch,
          facebook,
          instagram,
          tiktok,
          website,
          discord_title,
          twitter_title,
          youtube_title,
          twitch_title,
          facebook_title,
          instagram_title,
          tiktok_title,
          website_title,
          "createdAt" as created_at,
          "updatedAt" as updated_at`,
        [
          id,
          discord || null,
          twitter || null,
          youtube || null,
          twitch || null,
          facebook || null,
          instagram || null,
          tiktok || null,
          website || null,
          discord_title || null,
          twitter_title || null,
          youtube_title || null,
          twitch_title || null,
          facebook_title || null,
          instagram_title || null,
          tiktok_title || null,
          website_title || null,
        ],
      );
    } else {
      // Update existing social links
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (discord !== undefined) {
        updates.push(`discord = $${paramIndex}`);
        values.push(discord || null);
        paramIndex++;
      }

      if (twitter !== undefined) {
        updates.push(`twitter = $${paramIndex}`);
        values.push(twitter || null);
        paramIndex++;
      }

      if (youtube !== undefined) {
        updates.push(`youtube = $${paramIndex}`);
        values.push(youtube || null);
        paramIndex++;
      }

      if (twitch !== undefined) {
        updates.push(`twitch = $${paramIndex}`);
        values.push(twitch || null);
        paramIndex++;
      }

      if (facebook !== undefined) {
        updates.push(`facebook = $${paramIndex}`);
        values.push(facebook || null);
        paramIndex++;
      }

      if (instagram !== undefined) {
        updates.push(`instagram = $${paramIndex}`);
        values.push(instagram || null);
        paramIndex++;
      }

      if (tiktok !== undefined) {
        updates.push(`tiktok = $${paramIndex}`);
        values.push(tiktok || null);
        paramIndex++;
      }

      if (website !== undefined) {
        updates.push(`website = $${paramIndex}`);
        values.push(website || null);
        paramIndex++;
      }

      // Title fields
      const titleFields = ['discord_title', 'twitter_title', 'youtube_title', 'twitch_title', 'facebook_title', 'instagram_title', 'tiktok_title', 'website_title'] as const;
      for (const field of titleFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${paramIndex}`);
          values.push(req.body[field] || null);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(id);

      linksResult = await db.query(
        `UPDATE group_social_links
         SET ${updates.join(", ")}
         WHERE "groupId" = $${paramIndex}
         RETURNING
           id,
           "groupId" as group_id,
           discord,
           twitter,
           youtube,
           twitch,
           facebook,
           instagram,
           tiktok,
           website,
           discord_title,
           twitter_title,
           youtube_title,
           twitch_title,
           facebook_title,
           instagram_title,
           tiktok_title,
           website_title,
           "createdAt" as created_at,
           "updatedAt" as updated_at`,
        values,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Social links updated successfully",
      data: {
        socialLinks: linksResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Update group social links error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
