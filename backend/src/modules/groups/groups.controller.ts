import { Request, Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

/**
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Private
 */
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, description, iconUrl, coverPhotoUrl, joinSetting } = req.body;

    // Validate required fields
    if (!name || !iconUrl) {
      return res.status(400).json({
        success: false,
        message: "Name and icon are required",
      });
    }

    // Check if group name already exists
    const existingGroup = await db.query(
      "SELECT id FROM groups WHERE LOWER(name) = LOWER($1)",
      [name],
    );

    if (existingGroup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Group name already exists",
      });
    }

    const groupId = uuidv4();

    // Create the group
    const groupResult = await db.query(
      `INSERT INTO groups (
        id,
        name,
        description,
        "iconUrl",
        "coverPhotoUrl",
        "ownerId",
        "joinSetting",
        "memberCount",
        "isVerified",
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING
        id,
        name,
        description,
        "iconUrl" as icon_url,
        "coverPhotoUrl" as cover_photo_url,
        "ownerId" as owner_id,
        "joinSetting" as join_setting,
        "memberCount" as member_count,
        "isVerified" as is_verified,
        "createdAt" as created_at`,
      [
        groupId,
        name,
        description || null,
        iconUrl,
        coverPhotoUrl || null,
        userId,
        joinSetting || "open",
        1,
        false,
      ],
    );

    const group = groupResult.rows[0];

    try {
      // Create default Owner role
      const ownerRoleId = uuidv4();
      console.log("Creating Owner role for group:", group.id);
      await db.query(
        `INSERT INTO group_roles (
          id,
          "groupId",
          name,
          rank,
          description,
          "canManageMembers",
          "canManageRoles",
          "canPostOnWall",
          "canDeleteWallPosts",
          "canPostShout",
          "canManageStore",
          "canManageGames",
          "canViewAuditLogs",
          "canManageAlliances",
          "canManageAds",
          "canSpendGroupFunds",
          "canCreateInvites",
          "canBanMembers"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          ownerRoleId,
          group.id,
          "Owner",
          255,
          "The group's owner with full permissions.",
          true, // canManageMembers
          true, // canManageRoles
          true, // canPostOnWall
          true, // canDeleteWallPosts
          true, // canPostShout
          true, // canManageStore
          true, // canManageGames
          true, // canViewAuditLogs
          true, // canManageAlliances
          true, // canManageAds
          true, // canSpendGroupFunds
          true, // canCreateInvites
          true, // canBanMembers
        ],
      );
      console.log("Owner role created successfully");

      // Create default Member role
      const memberRoleId = uuidv4();
      console.log("Creating Member role for group:", group.id);
      await db.query(
        `INSERT INTO group_roles (
          id,
          "groupId",
          name,
          rank,
          description,
          "canManageMembers",
          "canManageRoles",
          "canPostOnWall",
          "canDeleteWallPosts",
          "canPostShout",
          "canManageStore",
          "canManageGames",
          "canViewAuditLogs",
          "canManageAlliances",
          "canManageAds",
          "canSpendGroupFunds",
          "canCreateInvites",
          "canBanMembers"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          memberRoleId,
          group.id,
          "Member",
          0,
          "Default member role with basic permissions.",
          false, // canManageMembers
          false, // canManageRoles
          true,  // canPostOnWall
          false, // canDeleteWallPosts
          false, // canPostShout
          false, // canManageStore
          false, // canManageGames
          false, // canViewAuditLogs
          false, // canManageAlliances
          false, // canManageAds
          false, // canSpendGroupFunds
          true,  // canCreateInvites
          false, // canBanMembers
        ],
      );
      console.log("Member role created successfully");

      // Add creator as owner in group_members with Owner role
      const memberId = uuidv4();
      console.log("Adding creator to group_members with Owner role");
      await db.query(
        `INSERT INTO group_members (
          id,
          "groupId",
          "userId",
          "roleId",
          "joinedAt"
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [memberId, group.id, userId, ownerRoleId],
      );
      console.log("Creator added to group successfully");
    } catch (roleError: any) {
      console.error("Error creating roles or adding member:", roleError);
      // Rollback: delete the group since role creation failed
      await db.query(`DELETE FROM groups WHERE id = $1`, [group.id]);
      throw new Error(`Failed to create default roles: ${roleError?.message || roleError}`);
    }

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get group by ID
 * @access  Public
 */
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const groupResult = await db.query(
      `SELECT
        g.id,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        g."joinSetting" as join_setting,
        g."memberCount" as member_count,
        g."isVerified" as is_verified,
        g."shoutText" as shout_text,
        g."shoutImageUrl" as shout_image_url,
        g."shoutPostedAt" as shout_posted_at,
        g."shoutPostedBy" as shout_posted_by,
        g."createdAt" as created_at,
        u.username as owner_username,
        u."displayName" as owner_display_name
      FROM groups g
      LEFT JOIN users u ON g."ownerId" = u.id
      WHERE g.id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    // Check if there's an authenticated user and get their role
    const userId = (req as any).userId;
    if (userId) {
      // Check if user is owner
      if (group.owner_id === userId) {
        group.role = "Owner";
      } else {
        // Check if user is a member and get their role
        const memberResult = await db.query(
          `SELECT gm.id, gr.name as role_name
           FROM group_members gm
           LEFT JOIN group_roles gr ON gm."roleId" = gr.id
           WHERE gm."groupId" = $1 AND gm."userId" = $2`,
          [id, userId],
        );

        if (memberResult.rows.length > 0) {
          group.role = memberResult.rows[0].role_name || "Member";
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("Get group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups
 * @desc    Get all groups (with pagination)
 * @access  Public
 */
export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = `
      SELECT
        g.id,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        g."memberCount" as member_count,
        g."isVerified" as is_verified,
        g."createdAt" as created_at,
        u.username as owner_username,
        u."displayName" as owner_display_name
      FROM groups g
      LEFT JOIN users u ON g."ownerId" = u.id
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` WHERE LOWER(g.name) LIKE LOWER($${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY g."createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const groupsResult = await db.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM groups";
    const countParams: any[] = [];

    if (search) {
      countQuery += " WHERE LOWER(name) LIKE LOWER($1)";
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return res.status(200).json({
      success: true,
      data: {
        groups: groupsResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update group
 * @access  Private (Owner only)
 */
export const updateGroup = async (req: AuthRequest, res: Response) => {
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
        message: "Only the group owner can update the group",
      });
    }

    const { name, description, iconUrl, coverPhotoUrl, joinSetting } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      // Check if new name already exists (excluding current group)
      const existingGroup = await db.query(
        "SELECT id FROM groups WHERE LOWER(name) = LOWER($1) AND id != $2",
        [name, id],
      );

      if (existingGroup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Group name already exists",
        });
      }

      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (iconUrl !== undefined) {
      updates.push(`"iconUrl" = $${paramIndex}`);
      values.push(iconUrl);
      paramIndex++;
    }

    if (coverPhotoUrl !== undefined) {
      updates.push(`"coverPhotoUrl" = $${paramIndex}`);
      values.push(coverPhotoUrl);
      paramIndex++;
    }

    if (joinSetting !== undefined) {
      updates.push(`"joinSetting" = $${paramIndex}`);
      values.push(joinSetting);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(id);

    const updateResult = await db.query(
      `UPDATE groups SET ${updates.join(", ")} WHERE id = $${paramIndex}
      RETURNING
        id,
        name,
        description,
        "iconUrl" as icon_url,
        "coverPhotoUrl" as cover_photo_url,
        "ownerId" as owner_id,
        "joinSetting" as join_setting,
        "memberCount" as member_count,
        "isVerified" as is_verified,
        "createdAt" as created_at`,
      values,
    );

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: {
        group: updateResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Update group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete group
 * @access  Private (Owner only)
 */
export const deleteGroup = async (req: AuthRequest, res: Response) => {
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
        message: "Only the group owner can delete the group",
      });
    }

    // Delete all group members first (due to foreign key)
    await db.query('DELETE FROM group_members WHERE "groupId" = $1', [id]);

    // Delete the group
    await db.query("DELETE FROM groups WHERE id = $1", [id]);

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/join
 * @desc    Join a group
 * @access  Private
 */
export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if group exists
    const groupResult = await db.query(
      'SELECT "joinSetting", "memberCount" FROM groups WHERE id = $1',
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is already a member
    const memberResult = await db.query(
      'SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2',
      [id, userId],
    );

    if (memberResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Get the default Member role for this group
    const memberRoleResult = await db.query(
      'SELECT id FROM group_roles WHERE "groupId" = $1 AND name = $2',
      [id, 'Member'],
    );

    const memberRoleId = memberRoleResult.rows.length > 0 
      ? memberRoleResult.rows[0].id 
      : null;

    // Add user to group with Member role
    const memberId = uuidv4();
    await db.query(
      `INSERT INTO group_members (
        id,
        "groupId",
        "userId",
        "roleId",
        "joinedAt"
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [memberId, id, userId, memberRoleId],
    );

    // Update member count
    await db.query(
      'UPDATE groups SET "memberCount" = "memberCount" + 1 WHERE id = $1',
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Successfully joined the group",
    });
  } catch (error) {
    console.error("Join group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/leave
 * @desc    Leave a group
 * @access  Private
 */
export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if group exists and if user is owner
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

    // Check if user is the owner
    if (groupResult.rows[0].ownerId === userId) {
      return res.status(403).json({
        success: false,
        message:
          "Group owner cannot leave the group. Transfer ownership or delete the group instead.",
      });
    }

    // Check if user is a member
    const memberResult = await db.query(
      'SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2',
      [id, userId],
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // Remove user from group
    await db.query(
      'DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2',
      [id, userId],
    );

    // Update member count
    await db.query(
      'UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1',
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("Leave group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/members
 * @desc    Get group members
 * @access  Public
 */
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const membersResult = await db.query(
      `SELECT
        gm.id,
        gm."userId" as user_id,
        gm."roleId" as role_id,
        gm."joinedAt" as joined_at,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified
      FROM group_members gm
      LEFT JOIN users u ON gm."userId" = u.id
      WHERE gm."groupId" = $1
      ORDER BY gm."joinedAt" ASC`,
      [id],
    );

    return res.status(200).json({
      success: true,
      data: {
        members: membersResult.rows,
      },
    });
  } catch (error) {
    console.error("Get group members error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/user/:userId
 * @desc    Get groups for a specific user
 * @access  Public
 */
export const getUserGroups = async (req: AuthRequest, res: Response) => {
  try {
    // Use authenticated userId if available (from /user/me route), otherwise use URL param
    const userId = req.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const groupsResult = await db.query(
      `SELECT
        g.id,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        g."memberCount" as member_count,
        g."isVerified" as is_verified,
        g."createdAt" as created_at,
        CASE
          WHEN g."ownerId" = $1 THEN 'Owner'
          ELSE 'Member'
        END as role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm."groupId"
      WHERE gm."userId" = $1
      ORDER BY g."createdAt" DESC`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      data: {
        groups: groupsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get user groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/games
 * @desc    Get games associated with a group
 * @access  Public
 */
export const getGroupGames = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gamesResult = await db.query(
      `SELECT
        g.id,
        g.title,
        g.description,
        g."thumbnailUrl" as thumbnail_url,
        g."iconUrl" as icon_url,
        g.visits,
        g.likes,
        g.dislikes,
        g."currentPlayers" as current_players,
        g."createdAt" as created_at
      FROM games g
      WHERE g."groupId" = $1 AND g."isPublished" = true
      ORDER BY g."createdAt" DESC`,
      [id],
    );

    return res.status(200).json({
      success: true,
      data: {
        games: gamesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get group games error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/wall
 * @desc    Get wall posts for a group
 * @access  Public
 */
export const getGroupWallPosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const postsResult = await db.query(
      `SELECT
        gwp.id,
        gwp.content,
        gwp.likes,
        gwp."createdAt" as created_at,
        gwp."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM group_wall_posts gwp
      LEFT JOIN users u ON gwp."authorId" = u.id
      WHERE gwp."groupId" = $1
      ORDER BY gwp."createdAt" DESC
      LIMIT $2 OFFSET $3`,
      [id, limit, offset],
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM group_wall_posts WHERE "groupId" = $1`,
      [id],
    );

    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        posts: postsResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get group wall posts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/wall
 * @desc    Create a wall post in a group
 * @access  Private
 */
export const createGroupWallPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    // Check if user is a member of the group
    const memberCheck = await db.query(
      `SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [id, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to post on the wall",
      });
    }

    const postId = uuidv4();
    await db.query(
      `INSERT INTO group_wall_posts (id, "groupId", "authorId", content, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [postId, id, userId, content.trim()],
    );

    const postResult = await db.query(
      `SELECT
        gwp.id,
        gwp.content,
        gwp.likes,
        gwp."createdAt" as created_at,
        gwp."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM group_wall_posts gwp
      LEFT JOIN users u ON gwp."authorId" = u.id
      WHERE gwp.id = $1`,
      [postId],
    );

    return res.status(201).json({
      success: true,
      message: "Wall post created successfully",
      data: {
        post: postResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Create group wall post error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/primary
 * @desc    Set group as user's primary group
 * @access  Private
 */
export const makePrimaryGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is a member of the group
    const memberCheck = await db.query(
      `SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [id, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to set it as primary",
      });
    }

    // Update user's primary group
    await db.query(`UPDATE users SET primary_group_id = $1 WHERE id = $2`, [
      id,
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Group set as primary successfully",
    });
  } catch (error) {
    console.error("Error setting primary group:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/leave
 * @desc    Leave a group (Roblox-style: owner can only leave if last member, which deletes group)
 * @access  Private
 */
export const leaveGroupEnhanced = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner and get member count
    const groupResult = await db.query(
      `SELECT "ownerId", "memberCount" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];
    const isOwner = group.ownerId === userId;

    // If owner, check if they're the last member
    if (isOwner) {
      if (group.memberCount > 1) {
        return res.status(403).json({
          success: false,
          message:
            "Group owner cannot leave while there are other members. Remove all members first, then you can leave to delete the group.",
        });
      }

      // Owner is last member - delete the entire group
      // Clear primary group references
      await db.query(
        `UPDATE users SET primary_group_id = NULL WHERE primary_group_id = $1`,
        [id],
      );

      // Delete group wall posts
      await db.query(`DELETE FROM group_wall_posts WHERE "groupId" = $1`, [id]);

      // Delete group members
      await db.query(`DELETE FROM group_members WHERE "groupId" = $1`, [id]);

      // Delete group roles
      await db.query(`DELETE FROM group_roles WHERE "groupId" = $1`, [id]);

      // Delete group alliances
      await db.query(
        `DELETE FROM group_alliances WHERE "groupId" = $1 OR "alliedGroupId" = $1`,
        [id],
      );

      // Update games to remove group association
      await db.query(`UPDATE games SET "groupId" = NULL WHERE "groupId" = $1`, [
        id,
      ]);

      // Delete the group
      await db.query(`DELETE FROM groups WHERE id = $1`, [id]);

      return res.status(200).json({
        success: true,
        message: "Group deleted successfully",
      });
    }

    // Regular member leaving
    // Remove user from group
    const deleteResult = await db.query(
      `DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2 RETURNING id`,
      [id, userId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // Update member count
    await db.query(
      `UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1`,
      [id],
    );

    // Clear primary group if it was this group
    await db.query(
      `UPDATE users SET primary_group_id = NULL WHERE id = $1 AND primary_group_id = $2`,
      [userId, id],
    );

    return res.status(200).json({
      success: true,
      message: "Left group successfully",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/members/:userId
 * @desc    Remove a member from group (owner/admin only)
 * @access  Private
 */
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.userId;
    const { id, userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if requester is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can remove members",
      });
    }

    // Cannot remove the owner
    if (userId === group.ownerId) {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the group owner",
      });
    }

    // Remove member
    const deleteResult = await db.query(
      `DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2 RETURNING id`,
      [id, userId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    // Update member count
    await db.query(
      `UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1`,
      [id],
    );

    // Clear primary group if it was this group
    await db.query(
      `UPDATE users SET primary_group_id = NULL WHERE id = $1 AND primary_group_id = $2`,
      [userId, id],
    );

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   PATCH /api/v1/groups/:id/members/:userId/role
 * @desc    Promote or demote a member (owner/admin only)
 * @access  Private
 */
export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.userId;
    const { id, userId } = req.params;
    const { roleId } = req.body;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if requester is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can change member roles",
      });
    }

    // Cannot change owner's role
    if (userId === group.ownerId) {
      return res.status(403).json({
        success: false,
        message: "Cannot change the owner's role",
      });
    }

    // Verify roleId exists for this group if provided
    if (roleId) {
      const roleCheck = await db.query(
        `SELECT id FROM group_roles WHERE id = $1 AND "groupId" = $2`,
        [roleId, id],
      );

      if (roleCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Role not found in this group",
        });
      }
    }

    // Update member role
    const updateResult = await db.query(
      `UPDATE group_members SET "roleId" = $1 WHERE "groupId" = $2 AND "userId" = $3 RETURNING id`,
      [roleId || null, id, userId],
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this group",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/report
 * @desc    Report a group for abuse
 * @access  Private
 */
export const reportGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { category, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Report category is required",
      });
    }

    // Check if group exists
    const groupCheck = await db.query(`SELECT id FROM groups WHERE id = $1`, [
      id,
    ]);

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Create report
    const reportId = uuidv4();
    await db.query(
      `INSERT INTO reports (
        id,
        "reporterId",
        "reportedUserId",
        category,
        description,
        status,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, NULL, $3, $4, 'pending', NOW(), NOW())`,
      [reportId, userId, category, description || null],
    );

    return res.status(201).json({
      success: true,
      message:
        "Group reported successfully. Our moderation team will review it.",
    });
  } catch (error) {
    console.error("Error reporting group:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete a group (owner only) - Enhanced version
 * @access  Private
 */
export const deleteGroupEnhanced = async (req: AuthRequest, res: Response) => {
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
      `SELECT "ownerId", name FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete the group",
      });
    }

    // Clear primary group references
    await db.query(
      `UPDATE users SET primary_group_id = NULL WHERE primary_group_id = $1`,
      [id],
    );

    // Delete group wall posts
    await db.query(`DELETE FROM group_wall_posts WHERE "groupId" = $1`, [id]);

    // Delete group members
    await db.query(`DELETE FROM group_members WHERE "groupId" = $1`, [id]);

    // Delete group roles
    await db.query(`DELETE FROM group_roles WHERE "groupId" = $1`, [id]);

    // Delete group alliances
    await db.query(
      `DELETE FROM group_alliances WHERE "groupId" = $1 OR "alliedGroupId" = $1`,
      [id],
    );

    // Update games to remove group association
    await db.query(`UPDATE games SET "groupId" = NULL WHERE "groupId" = $1`, [
      id,
    ]);

    // Delete the group
    await db.query(`DELETE FROM groups WHERE id = $1`, [id]);

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/roles
 * @desc    Get all roles for a group
 * @access  Public
 */
export const getGroupRoles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rolesResult = await db.query(
      `SELECT
        id,
        "groupId" as group_id,
        name,
        rank,
        "canManageMembers" as can_manage_members,
        "canManageRoles" as can_manage_roles,
        "canPostOnWall" as can_post_on_wall,
        "canDeleteWallPosts" as can_delete_wall_posts,
        "canPostShout" as can_post_shout,
        "canManageStore" as can_manage_store,
        "canManageGames" as can_manage_games,
        "canViewAuditLogs" as can_view_audit_logs,
        "canManageAlliances" as can_manage_alliances,
        "createdAt" as created_at
      FROM group_roles
      WHERE "groupId" = $1
      ORDER BY rank DESC`,
      [id],
    );

    return res.status(200).json({
      success: true,
      data: {
        roles: rolesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching group roles:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/roles
 * @desc    Create a new role in a group (owner only)
 * @access  Private
 */
export const createGroupRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      name,
      rank,
      canManageMembers,
      canManageRoles,
      canPostOnWall,
      canDeleteWallPosts,
      canPostShout,
      canManageStore,
      canManageGames,
      canViewAuditLogs,
      canManageAlliances,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can create roles",
      });
    }

    // Create role
    const roleId = uuidv4();
    const roleResult = await db.query(
      `INSERT INTO group_roles (
        id,
        "groupId",
        name,
        rank,
        "canManageMembers",
        "canManageRoles",
        "canPostOnWall",
        "canDeleteWallPosts",
        "canPostShout",
        "canManageStore",
        "canManageGames",
        "canViewAuditLogs",
        "canManageAlliances",
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING
        id,
        "groupId" as group_id,
        name,
        rank,
        "canManageMembers" as can_manage_members,
        "canManageRoles" as can_manage_roles,
        "canPostOnWall" as can_post_on_wall,
        "canDeleteWallPosts" as can_delete_wall_posts,
        "canPostShout" as can_post_shout,
        "canManageStore" as can_manage_store,
        "canManageGames" as can_manage_games,
        "canViewAuditLogs" as can_view_audit_logs,
        "canManageAlliances" as can_manage_alliances`,
      [
        roleId,
        id,
        name,
        rank || 0,
        canManageMembers || false,
        canManageRoles || false,
        canPostOnWall !== false,
        canDeleteWallPosts || false,
        canPostShout || false,
        canManageStore || false,
        canManageGames || false,
        canViewAuditLogs || false,
        canManageAlliances || false,
      ],
    );

    return res.status(201).json({
      success: true,
      data: {
        role: roleResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Error creating group role:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   PATCH /api/v1/groups/:id/roles/:roleId
 * @desc    Update a role in a group (owner only)
 * @access  Private
 */
export const updateGroupRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, roleId } = req.params;
    const {
      name,
      rank,
      canManageMembers,
      canManageRoles,
      canPostOnWall,
      canDeleteWallPosts,
      canPostShout,
      canManageStore,
      canManageGames,
      canViewAuditLogs,
      canManageAlliances,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can update roles",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (rank !== undefined) {
      updates.push(`rank = $${paramCount++}`);
      values.push(rank);
    }
    if (canManageMembers !== undefined) {
      updates.push(`"canManageMembers" = $${paramCount++}`);
      values.push(canManageMembers);
    }
    if (canManageRoles !== undefined) {
      updates.push(`"canManageRoles" = $${paramCount++}`);
      values.push(canManageRoles);
    }
    if (canPostOnWall !== undefined) {
      updates.push(`"canPostOnWall" = $${paramCount++}`);
      values.push(canPostOnWall);
    }
    if (canDeleteWallPosts !== undefined) {
      updates.push(`"canDeleteWallPosts" = $${paramCount++}`);
      values.push(canDeleteWallPosts);
    }
    if (canPostShout !== undefined) {
      updates.push(`"canPostShout" = $${paramCount++}`);
      values.push(canPostShout);
    }
    if (canManageStore !== undefined) {
      updates.push(`"canManageStore" = $${paramCount++}`);
      values.push(canManageStore);
    }
    if (canManageGames !== undefined) {
      updates.push(`"canManageGames" = $${paramCount++}`);
      values.push(canManageGames);
    }
    if (canViewAuditLogs !== undefined) {
      updates.push(`"canViewAuditLogs" = $${paramCount++}`);
      values.push(canViewAuditLogs);
    }
    if (canManageAlliances !== undefined) {
      updates.push(`"canManageAlliances" = $${paramCount++}`);
      values.push(canManageAlliances);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(roleId, id);

    const updateResult = await db.query(
      `UPDATE group_roles SET ${updates.join(", ")}
       WHERE id = $${paramCount++} AND "groupId" = $${paramCount++}
       RETURNING
        id,
        "groupId" as group_id,
        name,
        rank,
        "canManageMembers" as can_manage_members,
        "canManageRoles" as can_manage_roles,
        "canPostOnWall" as can_post_on_wall,
        "canDeleteWallPosts" as can_delete_wall_posts,
        "canPostShout" as can_post_shout,
        "canManageStore" as can_manage_store,
        "canManageGames" as can_manage_games,
        "canViewAuditLogs" as can_view_audit_logs,
        "canManageAlliances" as can_manage_alliances`,
      values,
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating group role:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   PUT /api/v1/groups/:id/shout
 * @desc    Update group shout (owner only)
 * @access  Private
 */
export const updateGroupShout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { shoutText } = req.body;

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
        message: "Only the group owner can update the shout",
      });
    }

    // Update shout
    const updateResult = await db.query(
      `UPDATE groups 
       SET "shoutText" = $1, 
           "shoutPostedAt" = NOW(), 
           "shoutPostedBy" = $2,
           "updatedAt" = NOW()
       WHERE id = $3
       RETURNING 
         "shoutText" as shout_text,
         "shoutPostedAt" as shout_posted_at,
         "shoutPostedBy" as shout_posted_by`,
      [shoutText || null, userId, id],
    );

    return res.status(200).json({
      success: true,
      message: "Shout updated successfully",
      data: {
        shout: updateResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Update shout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/roles/:roleId
 * @desc    Delete a role from a group (owner only)
 * @access  Private
 */
export const deleteGroupRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, roleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete roles",
      });
    }

    // Set roleId to null for members with this role
    await db.query(
      `UPDATE group_members SET "roleId" = NULL WHERE "roleId" = $1 AND "groupId" = $2`,
      [roleId, id],
    );

    // Delete role
    const deleteResult = await db.query(
      `DELETE FROM group_roles WHERE id = $1 AND "groupId" = $2 RETURNING id`,
      [roleId, id],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group role:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
