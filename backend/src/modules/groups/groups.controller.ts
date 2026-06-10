import { Request, Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

const resolveGroupId = async (id: string | string[]): Promise<string | null> => {
  const raw = Array.isArray(id) ? id[0] : id;
  const isNumeric = /^\d+$/.test(raw);
  const result = await db.query(
    isNumeric
      ? 'SELECT id FROM groups WHERE "groupNumber" = $1'
      : 'SELECT id FROM groups WHERE id = $1',
    [isNumeric ? parseInt(raw, 10) : raw],
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
};

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

    if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({ success: false, message: "Group name must be 3–50 characters" });
    }

    const SPAM_GROUP_PATTERNS = ['fuck', 'benisgay', 'fucku', 'spam', 'bot'];
    const nameLower = name.toLowerCase();
    if (SPAM_GROUP_PATTERNS.some(p => nameLower.includes(p))) {
      return res.status(400).json({ success: false, message: "Group name contains disallowed words" });
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
          "canPostOnWall",
          "canDeleteWallPosts",
          "canPostShout",
          "canManageMembers",
          "canDeleteMembers",
          "canBanMembers",
          "canSpendGroupFunds",
          "canAdvertiseGroup",
          "canManageAds",
          "canManageAlliances",
          "canManageRoles",
          "canManageStore",
          "canManageGames"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          ownerRoleId,
          group.id,
          "Owner",
          255,
          "The group's owner with full permissions.",
          true, // canPostOnWall
          true, // canDeleteWallPosts
          true, // canPostShout
          true, // canManageMembers
          true, // canDeleteMembers
          true, // canBanMembers
          true, // canSpendGroupFunds
          true, // canAdvertiseGroup
          true, // canManageAds
          true, // canManageAlliances
          true, // canManageRoles
          true, // canManageStore
          true, // canManageGames
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
          "canPostOnWall",
          "canDeleteWallPosts",
          "canPostShout",
          "canManageMembers",
          "canDeleteMembers",
          "canBanMembers",
          "canSpendGroupFunds",
          "canAdvertiseGroup",
          "canManageAds",
          "canManageAlliances",
          "canManageRoles",
          "canManageStore",
          "canManageGames"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          memberRoleId,
          group.id,
          "Member",
          0,
          "Default member role with basic permissions.",
          true,  // canPostOnWall
          false, // canDeleteWallPosts
          false, // canPostShout
          false, // canManageMembers
          false, // canDeleteMembers
          false, // canBanMembers
          false, // canSpendGroupFunds
          false, // canAdvertiseGroup
          false, // canManageAds
          false, // canManageAlliances
          false, // canManageRoles
          false, // canManageStore
          false, // canManageGames
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

      // Create group_settings entry with manual approval based on joinSetting
      const manualApproval = joinSetting === 'approval';
      console.log("Creating group settings with manualApproval:", manualApproval);
      await db.query(
        `INSERT INTO group_settings (
          "groupId",
          "manualApproval",
          "accountAgeRequirement",
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, NOW(), NOW())`,
        [group.id, manualApproval, 'none'],
      );
      console.log("Group settings created successfully");
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
  } catch (error: any) {
    console.error("Create group error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || String(error),
      details: process.env.NODE_ENV === "development" ? error : undefined,
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
    const id = String(req.params.id);

    // Support lookup by UUID id OR by groupNumber
    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? `g."groupNumber" = $1` : `g.id = $1`;
    const lookupParam = isNumeric ? parseInt(id, 10) : id;

    const groupResult = await db.query(
      `SELECT
        g.id,
        g."groupNumber" as group_number,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        g."joinSetting" as join_setting,
        (SELECT COUNT(*) FROM group_members gm WHERE gm."groupId" = g.id)::int as member_count,
        g."isVerified" as is_verified,
        g."shoutText" as shout_text,
        g."shoutImageUrl" as shout_image_url,
        g."shoutPostedAt" as shout_posted_at,
        g."shoutPostedBy" as shout_posted_by,
        g."createdAt" as created_at,
        u.username as owner_username,
        u."displayName" as owner_display_name,
        shout_user.username as shout_posted_by_username,
        shout_user."avatarUrl" as shout_posted_by_avatar
      FROM groups g
      LEFT JOIN users u ON g."ownerId" = u.id
      LEFT JOIN users shout_user ON g."shoutPostedBy" = shout_user.id
      WHERE ${whereClause}`,
      [lookupParam],
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
      // Always look up actual role name from group_roles (works for Owner too)
      const memberResult = await db.query(
        `SELECT gr.name as role_name
         FROM group_members gm
         LEFT JOIN group_roles gr ON gm."roleId" = gr.id
         WHERE gm."groupId" = $1 AND gm."userId" = $2`,
        [group.id, userId],
      );

      if (memberResult.rows.length > 0) {
        group.role = memberResult.rows[0].role_name || "Member";
      } else if (group.owner_id === userId) {
        // Fallback: if somehow not in group_members but is owner
        group.role = "Owner";
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
        g."groupNumber" as group_number,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        (SELECT COUNT(*) FROM group_members gm WHERE gm."groupId" = g.id)::int as member_count,
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

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
        [name, groupId],
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
    values.push(groupId);

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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete the group",
      });
    }

    // Delete all group members first (due to foreign key)
    await db.query('DELETE FROM group_members WHERE "groupId" = $1', [groupId]);

    // Delete the group
    await db.query("DELETE FROM groups WHERE id = $1", [groupId]);

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

    // Resolve groupNumber or UUID to actual group UUID
    const rawId = Array.isArray(id) ? id[0] : id;
    const isNumeric = /^\d+$/.test(rawId);
    const groupLookup = await db.query(
      isNumeric
        ? 'SELECT id, "joinSetting", "memberCount" FROM groups WHERE "groupNumber" = $1'
        : 'SELECT id, "joinSetting", "memberCount" FROM groups WHERE id = $1',
      [isNumeric ? parseInt(rawId, 10) : rawId],
    );

    // Use groupResult alias for the rest of the function
    const groupResult = groupLookup;

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Always use the real UUID for all subsequent queries
    const groupId = groupResult.rows[0].id;

    // Check if user is already a member
    const memberResult = await db.query(
      'SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2',
      [groupId, userId],
    );

    if (memberResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Check if user has a pending join request
    const existingRequestResult = await db.query(
      'SELECT id, status FROM group_join_requests WHERE "groupId" = $1 AND "userId" = $2',
      [groupId, userId],
    );

    if (existingRequestResult.rows.length > 0) {
      const request = existingRequestResult.rows[0];
      if (request.status === 'pending') {
        return res.status(409).json({
          success: false,
          message: "You already have a pending join request for this group",
        });
      } else if (request.status === 'rejected') {
        await db.query(
          'DELETE FROM group_join_requests WHERE "groupId" = $1 AND "userId" = $2',
          [groupId, userId],
        );
      } else if (request.status === 'approved') {
        await db.query(
          'DELETE FROM group_join_requests WHERE "groupId" = $1 AND "userId" = $2',
          [groupId, userId],
        );
      }
    }

    // Get group settings to check join requirements
    let settingsResult = await db.query(
      'SELECT "manualApproval", "accountAgeRequirement" FROM group_settings WHERE "groupId" = $1',
      [groupId],
    );

    // If settings don't exist, create default settings
    if (settingsResult.rows.length === 0) {
      await db.query(
        `INSERT INTO group_settings ("groupId", "manualApproval", "accountAgeRequirement") 
         VALUES ($1, false, 'none')`,
        [groupId],
      );
      settingsResult = await db.query(
        'SELECT "manualApproval", "accountAgeRequirement" FROM group_settings WHERE "groupId" = $1',
        [groupId],
      );
    }

    const settings = settingsResult.rows[0] || {};
    const manualApproval = settings.manualApproval || false;
    const accountAgeRequirement = settings.accountAgeRequirement || 'none';

    // Check account age requirement
    if (accountAgeRequirement !== 'none') {
      const userResult = await db.query(
        'SELECT "createdAt" FROM users WHERE id = $1',
        [userId],
      );

      if (userResult.rows.length > 0) {
        const userCreatedAt = new Date(userResult.rows[0].createdAt);
        const now = new Date();
        const accountAgeDays = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

        const requiredDays: Record<string, number> = {
          '1day': 1,
          '3days': 3,
          '7days': 7,
          '30days': 30,
          '90days': 90,
        };

        const required = requiredDays[accountAgeRequirement] || 0;
        if (accountAgeDays < required) {
          return res.status(403).json({
            success: false,
            message: `Your account must be at least ${required} day(s) old to join this group. Your account is ${accountAgeDays} day(s) old.`,
          });
        }
      }
    }

    // If manual approval is enabled, create a join request
    if (manualApproval) {
      const requestId = uuidv4();
      await db.query(
        `INSERT INTO group_join_requests (
          id,
          "groupId",
          "userId",
          status,
          "requestedAt"
        ) VALUES ($1, $2, $3, 'pending', NOW())`,
        [requestId, groupId, userId],
      );

      return res.status(200).json({
        success: true,
        message: "Join request submitted successfully. Please wait for approval from group administrators.",
        requiresApproval: true,
      });
    }

    // Get the default Member role for this group
    const memberRoleResult = await db.query(
      'SELECT id FROM group_roles WHERE "groupId" = $1 AND name = $2',
      [groupId, 'Member'],
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
      [memberId, groupId, userId, memberRoleId],
    );

    // Update member count
    await db.query(
      'UPDATE groups SET "memberCount" = "memberCount" + 1 WHERE id = $1',
      [groupId],
    );

    return res.status(200).json({
      success: true,
      message: "Successfully joined the group",
      requiresApproval: false,
    });
  } catch (error: any) {
    console.error("Join group error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error?.message : undefined,
      details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/join-requests
 * @desc    Get pending join requests for a group
 * @access  Private (Group admins only)
 */
export const getJoinRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user has permission to manage members
    const memberResult = await db.query(
      `SELECT gm.id, gr.name, gr."canManageMembers"
       FROM group_members gm
       LEFT JOIN group_roles gr ON gm."roleId" = gr.id
       WHERE gm."groupId" = $1 AND gm."userId" = $2`,
      [groupId, userId],
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const member = memberResult.rows[0];
    if (member.name !== 'Owner' && !member.canManageMembers) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view join requests",
      });
    }

    // Get pending join requests
    const requestsResult = await db.query(
      `SELECT
        jr.id,
        jr."userId" as user_id,
        jr.status,
        jr."requestedAt" as requested_at,
        jr.message,
        u.username,
        u."displayName" as display_name,
        u."avatarUrl" as avatar_url,
        u."createdAt" as user_created_at
      FROM group_join_requests jr
      LEFT JOIN users u ON jr."userId" = u.id
      WHERE jr."groupId" = $1 AND jr.status = 'pending'
      ORDER BY jr."requestedAt" DESC`,
      [groupId],
    );

    return res.status(200).json({
      success: true,
      data: {
        requests: requestsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get join requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/join-requests/:requestId/accept
 * @desc    Accept a join request
 * @access  Private (Group admins only)
 */
export const acceptJoinRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user has permission to manage members
    const memberResult = await db.query(
      `SELECT gm.id, gr.name, gr."canManageMembers"
       FROM group_members gm
       LEFT JOIN group_roles gr ON gm."roleId" = gr.id
       WHERE gm."groupId" = $1 AND gm."userId" = $2`,
      [groupId, userId],
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const member = memberResult.rows[0];
    if (member.name !== 'Owner' && !member.canManageMembers) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to accept join requests",
      });
    }

    // Get the join request
    const requestResult = await db.query(
      'SELECT "userId", status FROM group_join_requests WHERE id = $1 AND "groupId" = $2',
      [requestId, groupId],
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Join request not found",
      });
    }

    const request = requestResult.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    // Get the default Member role
    const memberRoleResult = await db.query(
      'SELECT id FROM group_roles WHERE "groupId" = $1 AND name = $2',
      [groupId, 'Member'],
    );

    const memberRoleId = memberRoleResult.rows.length > 0 
      ? memberRoleResult.rows[0].id 
      : null;

    // Add user to group
    const newMemberId = uuidv4();
    await db.query(
      `INSERT INTO group_members (
        id,
        "groupId",
        "userId",
        "roleId",
        "joinedAt"
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [newMemberId, groupId, request.userId, memberRoleId],
    );

    // Update join request status
    await db.query(
      `UPDATE group_join_requests 
       SET status = 'approved', "respondedAt" = NOW(), "respondedBy" = $1
       WHERE id = $2`,
      [userId, requestId],
    );

    // Update member count
    await db.query(
      'UPDATE groups SET "memberCount" = "memberCount" + 1 WHERE id = $1',
      [groupId],
    );

    return res.status(200).json({
      success: true,
      message: "Join request accepted successfully",
    });
  } catch (error) {
    console.error("Accept join request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/join-requests/:requestId/reject
 * @desc    Reject a join request
 * @access  Private (Group admins only)
 */
export const rejectJoinRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user has permission to manage members
    const memberResult = await db.query(
      `SELECT gm.id, gr.name, gr."canManageMembers"
       FROM group_members gm
       LEFT JOIN group_roles gr ON gm."roleId" = gr.id
       WHERE gm."groupId" = $1 AND gm."userId" = $2`,
      [groupId, userId],
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const member = memberResult.rows[0];
    if (member.name !== 'Owner' && !member.canManageMembers) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reject join requests",
      });
    }

    // Get the join request
    const requestResult = await db.query(
      'SELECT status FROM group_join_requests WHERE id = $1 AND "groupId" = $2',
      [requestId, groupId],
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Join request not found",
      });
    }

    const request = requestResult.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    // Update join request status
    await db.query(
      `UPDATE group_join_requests 
       SET status = 'rejected', "respondedAt" = NOW(), "respondedBy" = $1
       WHERE id = $2`,
      [userId, requestId],
    );

    return res.status(200).json({
      success: true,
      message: "Join request rejected successfully",
    });
  } catch (error) {
    console.error("Reject join request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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

    // Resolve groupNumber or UUID
    const rawId = Array.isArray(id) ? id[0] : id;
    const isNumeric = /^\d+$/.test(rawId);
    const groupLookup = await db.query(
      isNumeric
        ? 'SELECT id, "ownerId" FROM groups WHERE "groupNumber" = $1'
        : 'SELECT id, "ownerId" FROM groups WHERE id = $1',
      [isNumeric ? parseInt(rawId, 10) : rawId],
    );

    if (groupLookup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const groupId = groupLookup.rows[0].id;

    // Check if user is the owner
    if (groupLookup.rows[0].ownerId === userId) {
      return res.status(403).json({
        success: false,
        message:
          "Group owner cannot leave the group. Transfer ownership or delete the group instead.",
      });
    }

    // Check if user is a member
    const memberResult = await db.query(
      'SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2',
      [groupId, userId],
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
      [groupId, userId],
    );

    // Update member count
    await db.query(
      'UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1',
      [groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const membersResult = await db.query(
      `SELECT
        gm.id,
        gm."userId" as user_id,
        gm."roleId" as role_id,
        gm."joinedAt" as joined_at,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        gr.name as role_name
      FROM group_members gm
      LEFT JOIN users u ON gm."userId" = u.id
      LEFT JOIN group_roles gr ON gm."roleId" = gr.id
      WHERE gm."groupId" = $1
      ORDER BY gm."joinedAt" ASC`,
      [groupId],
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
        g."groupNumber" as group_number,
        g.name,
        g.description,
        g."iconUrl" as icon_url,
        g."coverPhotoUrl" as cover_photo_url,
        g."ownerId" as owner_id,
        g."memberCount" as member_count,
        g."isVerified" as is_verified,
        g."createdAt" as created_at,
        gr.name as role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm."groupId"
      LEFT JOIN group_roles gr ON gm."roleId" = gr.id
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
 * @route   GET /api/v1/groups/search
 * @desc    Search groups by name for alliance requests
 * @access  Public
 */
export const searchGroups = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const groupsResult = await db.query(
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
      LIMIT 20`,
      [searchTerm],
    );

    return res.status(200).json({
      success: true,
      data: {
        groups: groupsResult.rows,
      },
    });
  } catch (error: any) {
    console.error("Search groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error?.message : undefined,
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

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
      [groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const postsResult = await db.query(
      `SELECT
        gwp.id,
        gwp.content,
        gwp."imageUrl" as image_url,
        gwp.likes,
        gwp."replyCount" as reply_count,
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
      [groupId, limit, offset],
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM group_wall_posts WHERE "groupId" = $1`,
      [groupId],
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
    const { content, imageUrl } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Content or image is required",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is a member of the group
    const memberCheck = await db.query(
      `SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [groupId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to post on the wall",
      });
    }

    const postId = uuidv4();
    await db.query(
      `INSERT INTO group_wall_posts (id, "groupId", "authorId", content, "imageUrl", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [postId, groupId, userId, content?.trim() || '', imageUrl || null],
    );

    const postResult = await db.query(
      `SELECT
        gwp.id,
        gwp.content,
        gwp."imageUrl" as image_url,
        gwp.likes,
        gwp."replyCount" as reply_count,
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
 * @route   GET /api/v1/groups/:id/wall/:postId/replies
 * @desc    Get replies for a wall post
 * @access  Public
 */
export const getWallPostReplies = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const repliesResult = await db.query(
      `SELECT
        r.id,
        r.content,
        r."createdAt" as created_at,
        r."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM group_wall_post_replies r
      LEFT JOIN users u ON r."authorId" = u.id
      WHERE r."postId" = $1
      ORDER BY r."createdAt" ASC`,
      [postId],
    );

    return res.status(200).json({
      success: true,
      data: {
        replies: repliesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get wall post replies error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/wall/:postId/replies
 * @desc    Create a reply to a wall post
 * @access  Private
 */
export const createWallPostReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
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

    // Verify post exists and get group ID
    const postCheck = await db.query(
      `SELECT "groupId" FROM group_wall_posts WHERE id = $1`,
      [postId],
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wall post not found",
      });
    }

    const groupId = postCheck.rows[0].groupId;

    // Check if user is a member of the group
    const memberCheck = await db.query(
      `SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [groupId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to reply",
      });
    }

    const replyId = uuidv4();
    await db.query(
      `INSERT INTO group_wall_post_replies (id, "postId", "authorId", content, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [replyId, postId, userId, content.trim()],
    );

    // Increment reply count on the post
    await db.query(
      `UPDATE group_wall_posts SET "replyCount" = "replyCount" + 1 WHERE id = $1`,
      [postId],
    );

    const replyResult = await db.query(
      `SELECT
        r.id,
        r.content,
        r."createdAt" as created_at,
        r."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified
      FROM group_wall_post_replies r
      LEFT JOIN users u ON r."authorId" = u.id
      WHERE r.id = $1`,
      [replyId],
    );

    return res.status(201).json({
      success: true,
      message: "Reply created successfully",
      data: {
        reply: replyResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Create wall post reply error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/wall/:postId/replies/:replyId
 * @desc    Delete a wall post reply
 * @access  Private
 */
export const deleteWallPostReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { replyId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if reply exists and user is the author
    const replyCheck = await db.query(
      `SELECT "authorId" FROM group_wall_post_replies WHERE id = $1`,
      [replyId],
    );

    if (replyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    if (replyCheck.rows[0].authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own replies",
      });
    }

    // Get postId before deleting
    const postIdResult = await db.query(
      `SELECT "postId" FROM group_wall_post_replies WHERE id = $1`,
      [replyId],
    );
    const postId = postIdResult.rows[0]?.postId;

    await db.query(`DELETE FROM group_wall_post_replies WHERE id = $1`, [replyId]);

    // Decrement reply count on the post
    if (postId) {
      await db.query(
        `UPDATE group_wall_posts SET "replyCount" = GREATEST("replyCount" - 1, 0) WHERE id = $1`,
        [postId],
      );
    }

    return res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete wall post reply error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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

    // Resolve groupNumber or UUID
    const rawId = Array.isArray(id) ? id[0] : id;
    const isNumeric = /^\d+$/.test(rawId);
    const groupLookup = await db.query(
      isNumeric
        ? 'SELECT id FROM groups WHERE "groupNumber" = $1'
        : 'SELECT id FROM groups WHERE id = $1',
      [isNumeric ? parseInt(rawId, 10) : rawId],
    );

    if (groupLookup.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const groupId = groupLookup.rows[0].id;

    // Check if user is a member of the group
    const memberCheck = await db.query(
      `SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [groupId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to set it as primary",
      });
    }

    // Update user's primary group
    await db.query(`UPDATE users SET primary_group_id = $1 WHERE id = $2`, [
      groupId,
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner and get member count
    const groupResult = await db.query(
      `SELECT "ownerId", "memberCount" FROM groups WHERE id = $1`,
      [groupId],
    );

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
      await db.query(
        `UPDATE users SET primary_group_id = NULL WHERE primary_group_id = $1`,
        [groupId],
      );
      await db.query(`DELETE FROM group_wall_posts WHERE "groupId" = $1`, [groupId]);
      await db.query(`DELETE FROM group_members WHERE "groupId" = $1`, [groupId]);
      await db.query(`DELETE FROM group_roles WHERE "groupId" = $1`, [groupId]);
      await db.query(
        `DELETE FROM group_alliances WHERE "groupId" = $1 OR "alliedGroupId" = $1`,
        [groupId],
      );
      await db.query(`UPDATE games SET "groupId" = NULL WHERE "groupId" = $1`, [groupId]);
      await db.query(`DELETE FROM groups WHERE id = $1`, [groupId]);

      return res.status(200).json({
        success: true,
        message: "Group deleted successfully",
      });
    }

    // Regular member leaving
    const deleteResult = await db.query(
      `DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2 RETURNING id`,
      [groupId, userId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    await db.query(
      `UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1`,
      [groupId],
    );

    await db.query(
      `UPDATE users SET primary_group_id = NULL WHERE id = $1 AND primary_group_id = $2`,
      [userId, groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if requester is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (group.ownerId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can remove members",
      });
    }

    if (userId === group.ownerId) {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the group owner",
      });
    }

    const deleteResult = await db.query(
      `DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2 RETURNING id`,
      [groupId, userId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    await db.query(
      `UPDATE groups SET "memberCount" = "memberCount" - 1 WHERE id = $1`,
      [groupId],
    );

    await db.query(
      `UPDATE users SET primary_group_id = NULL WHERE id = $1 AND primary_group_id = $2`,
      [userId, groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if requester is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (group.ownerId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can change member roles",
      });
    }

    if (userId === group.ownerId) {
      return res.status(403).json({
        success: false,
        message: "Cannot change the owner's role",
      });
    }

    if (roleId) {
      const roleCheck = await db.query(
        `SELECT id FROM group_roles WHERE id = $1 AND "groupId" = $2`,
        [roleId, groupId],
      );

      if (roleCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Role not found in this group",
        });
      }
    }

    const updateResult = await db.query(
      `UPDATE group_members SET "roleId" = $1 WHERE "groupId" = $2 AND "userId" = $3 RETURNING id`,
      [roleId || null, groupId, userId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId", name FROM groups WHERE id = $1`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete the group",
      });
    }

    await db.query(`UPDATE users SET primary_group_id = NULL WHERE primary_group_id = $1`, [groupId]);
    await db.query(`DELETE FROM group_wall_posts WHERE "groupId" = $1`, [groupId]);
    await db.query(`DELETE FROM group_members WHERE "groupId" = $1`, [groupId]);
    await db.query(`DELETE FROM group_roles WHERE "groupId" = $1`, [groupId]);
    await db.query(`DELETE FROM group_alliances WHERE "groupId" = $1 OR "alliedGroupId" = $1`, [groupId]);
    await db.query(`UPDATE games SET "groupId" = NULL WHERE "groupId" = $1`, [groupId]);
    await db.query(`DELETE FROM groups WHERE id = $1`, [groupId]);

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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

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
        "canManageAlliances" as can_manage_alliances,
        "createdAt" as created_at
      FROM group_roles
      WHERE "groupId" = $1
      ORDER BY rank DESC`,
      [groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId],
    );

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
        "canManageAlliances",
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
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
        "canManageAlliances" as can_manage_alliances`,
      [
        roleId,
        groupId,
        name,
        rank || 0,
        canManageMembers || false,
        canManageRoles || false,
        canPostOnWall !== false,
        canDeleteWallPosts || false,
        canPostShout || false,
        canManageStore || false,
        canManageGames || false,
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
      canManageAlliances,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId],
    );

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
    values.push(roleId, groupId);

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
    const { shoutText, shoutImageUrl } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can update the shout",
      });
    }

    const updateResult = await db.query(
      `UPDATE groups 
       SET "shoutText" = $1, 
           "shoutImageUrl" = $2,
           "shoutPostedAt" = NOW(), 
           "shoutPostedBy" = $3,
           "updatedAt" = NOW()
       WHERE id = $4
       RETURNING 
         "shoutText" as shout_text,
         "shoutImageUrl" as shout_image_url,
         "shoutPostedAt" as shout_posted_at,
         "shoutPostedBy" as shout_posted_by`,
      [shoutText || null, shoutImageUrl || null, userId, groupId],
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

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (group.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete roles",
      });
    }

    await db.query(
      `UPDATE group_members SET "roleId" = NULL WHERE "roleId" = $1 AND "groupId" = $2`,
      [roleId, groupId],
    );

    const deleteResult = await db.query(
      `DELETE FROM group_roles WHERE id = $1 AND "groupId" = $2 RETURNING id`,
      [roleId, groupId],
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

/**
 * @route   GET /api/v1/groups/feed/me
 * @desc    Get a feed of recent wall posts from all groups the user is a member of
 * @access  Private
 */
export const getMyGroupFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const feedResult = await db.query(
      `SELECT
        gwp.id,
        gwp.content,
        gwp."imageUrl" as image_url,
        gwp.likes,
        gwp."replyCount" as reply_count,
        gwp."createdAt" as created_at,
        gwp."authorId" as author_id,
        u.username as author_username,
        u."displayName" as author_display_name,
        u."isVerified" as author_is_verified,
        g.id as group_id,
        g.name as group_name,
        g."iconUrl" as group_icon_url,
        g."groupNumber" as group_number
      FROM group_wall_posts gwp
      INNER JOIN group_members gm ON gm."groupId" = gwp."groupId" AND gm."userId" = $1
      LEFT JOIN users u ON gwp."authorId" = u.id
      LEFT JOIN groups g ON gwp."groupId" = g.id
      ORDER BY gwp."createdAt" DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: {
        posts: feedResult.rows,
      },
    });
  } catch (error) {
    console.error("Get my group feed error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
/**
 * @route   DELETE /api/v1/groups/:id/wall/:postId
 * @desc    Delete a wall post (post author or group owner only)
 * @access  Private
 */
export const deleteGroupWallPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const postCheck = await db.query(
      `SELECT "authorId" FROM group_wall_posts WHERE id = $1 AND "groupId" = $2`,
      [postId, groupId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wall post not found",
      });
    }

    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [groupId]
    );

    const isAuthor = postCheck.rows[0].authorId === userId;
    const isOwner = groupResult.rows[0].ownerId === userId;

    if (!isAuthor && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts or posts in your group",
      });
    }

    await db.query(
      `DELETE FROM group_wall_post_replies WHERE "postId" = $1`,
      [postId]
    );

    await db.query(
      `DELETE FROM group_wall_posts WHERE id = $1`,
      [postId]
    );

    return res.status(200).json({
      success: true,
      message: "Wall post deleted successfully",
    });
  } catch (error) {
    console.error("Delete wall post error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
