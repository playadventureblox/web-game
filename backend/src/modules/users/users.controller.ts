import { Request, Response } from "express";
import db from '../../lib/db.js';

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Fetch user profile with profile data
    const userResult = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u.email,
        u."birthMonth" as birth_month,
        u."birthDay" as birth_day,
        u."birthYear" as birth_year,
        u.gender,
        u."isVerified" as is_verified,
        u."isPlayer" as is_player,
        u."isStudio" as is_studio,
        u."isPremium" as is_premium,
	u."isAdmin" as is_admin,
	u.roblox_username,
	u.roblox_id,
	u.roblox_avatar_url,
        u."lastLogin" as last_login,
        u."createdAt" as created_at,
        u."lastOnline" as last_online,
        u."presenceStatus" as presence_status,
        u."currentGame" as current_game,
        u."followerCount" as follower_count,
        u."followingCount" as following_count,
        u.bio,
        u."statusMessage" as status_message,
        u."avatarUrl" as avatar_url,
        u.primary_group_id,
        p."profileTheme" as profile_theme,
        p."profileVisibility" as profile_visibility,
        p."canReceiveFriendRequests" as can_receive_friend_requests,
        p."canReceiveMessages" as can_receive_messages,
        p."showOnlineStatus" as show_online_status,
        p."showLastSeen" as show_last_seen,
        p."visitCount" as visit_count,
        p."placeVisits" as place_visits
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get user profile by username
 * @access  Public
 */
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Fetch user profile with profile data
    const userResult = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        u."isPlayer" as is_player,
        u."isStudio" as is_studio,
        u."createdAt" as created_at,
        u."lastOnline" as last_online,
        u."presenceStatus" as presence_status,
        u."currentGame" as current_game,
        u."followerCount" as follower_count,
        u."followingCount" as following_count,
        u.bio,
        u."statusMessage" as status_message,
        u."avatarUrl" as avatar_url,
        p."profileVisibility" as profile_visibility,
        p."visitCount" as visit_count,
        p."placeVisits" as place_visits
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.username = $1 AND u."isBanned" = false`,
      [username],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Check profile visibility
    if (user.profile_visibility === "private") {
      return res.status(403).json({
        success: false,
        message: "This profile is private",
      });
    }

    // Increment visit count
    await db.query(
      `UPDATE profiles SET "visitCount" = "visitCount" + 1 WHERE "userId" = $1`,
      [user.id],
    );

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user by username error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { displayName, username, bio, status, statusMessage, email, socialVisibility } = req.body;

    // Validate displayName if provided
    if (displayName) {
      if (displayName.length < 3 || displayName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Display name must be between 3 and 50 characters",
        });
      }
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      // Check if username is alphanumeric with underscores only
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, and underscores",
        });
      }

      // Check if username is already taken by another user
      const existingUser = await db.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, userId],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    // Validate bio if provided
    if (bio && bio.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 1000 characters",
      });
    }

    // Validate status if provided
    if (status && status.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Status cannot exceed 255 characters",
      });
    }

    // Validate statusMessage if provided
    if (statusMessage && statusMessage.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Status message cannot exceed 255 characters",
      });
    }

    // Update user table if displayName or username is provided
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    let userParamIndex = 1;

    if (displayName !== undefined) {
      userUpdates.push(`"displayName" = $${userParamIndex}`);
      userValues.push(displayName);
      userParamIndex++;
    }

    if (username !== undefined) {
      userUpdates.push(`username = $${userParamIndex}`);
      userValues.push(username);
      userParamIndex++;
    }

    if (statusMessage !== undefined) {
      userUpdates.push(`"statusMessage" = $${userParamIndex}`);
      userValues.push(statusMessage);
      userParamIndex++;
    }

    if (bio !== undefined) {
      userUpdates.push(`bio = $${userParamIndex}`);
      userValues.push(bio);
      userParamIndex++;
    }

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email address" });
      }
      const existingEmail = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email is already in use" });
      }
      userUpdates.push(`email = $${userParamIndex}`);
      userValues.push(email);
      userParamIndex++;
    }

    if (socialVisibility !== undefined) {
      userUpdates.push(`"socialVisibility" = $${userParamIndex}`);
      userValues.push(socialVisibility);
      userParamIndex++;
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`"updatedAt" = NOW()`);
      userValues.push(userId);

      await db.query(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${userParamIndex}`,
        userValues,
      );
    }

    // Check if profile exists for status field only
    const profileCheck = await db.query(
      `SELECT id FROM profiles WHERE "userId" = $1`,
      [userId],
    );

    if (status !== undefined) {
      if (profileCheck.rows.length === 0) {
        // Create profile if it doesn't exist
        await db.query(
          `INSERT INTO profiles (id, "userId", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::TEXT, $1, $2, NOW(), NOW())`,
          [userId, status],
        );
      } else {
        // Update existing profile
        await db.query(
          `UPDATE profiles SET status = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
          [status, userId],
        );
      }
    }

    // Fetch updated profile
    const updatedProfile = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        p.bio,
        p.status,
        p."updatedAt" as updated_at
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.id = $1`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedProfile.rows[0],
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/users/profile/settings
 * @desc    Update profile privacy settings
 * @access  Private
 */
export const updateProfileSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      profileVisibility,
      canReceiveFriendRequests,
      canReceiveMessages,
      showOnlineStatus,
      showLastSeen,
      profileTheme,
    } = req.body;

    // Validate enum values
    const validVisibility = ["public", "friends", "private"];
    const validPermissions = ["everyone", "friends", "no_one"];

    if (profileVisibility && !validVisibility.includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile visibility setting",
      });
    }

    if (
      canReceiveFriendRequests &&
      !validPermissions.includes(canReceiveFriendRequests)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid friend request setting",
      });
    }

    if (canReceiveMessages && !validPermissions.includes(canReceiveMessages)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message setting",
      });
    }

    // Check if profile exists
    const profileCheck = await db.query(
      `SELECT id FROM profiles WHERE "userId" = $1`,
      [userId],
    );

    if (profileCheck.rows.length === 0) {
      // Create profile with settings
      await db.query(
        `INSERT INTO profiles (id, "userId", "profileVisibility", "canReceiveFriendRequests",
         "canReceiveMessages", "showOnlineStatus", "showLastSeen", "profileTheme", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          userId,
          profileVisibility || "public",
          canReceiveFriendRequests || "everyone",
          canReceiveMessages || "everyone",
          showOnlineStatus !== undefined ? showOnlineStatus : true,
          showLastSeen !== undefined ? showLastSeen : true,
          profileTheme || "default",
        ],
      );
    } else {
      // Update existing profile settings
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (profileVisibility !== undefined) {
        updates.push(`"profileVisibility" = $${paramIndex}`);
        values.push(profileVisibility);
        paramIndex++;
      }

      if (canReceiveFriendRequests !== undefined) {
        updates.push(`"canReceiveFriendRequests" = $${paramIndex}`);
        values.push(canReceiveFriendRequests);
        paramIndex++;
      }

      if (canReceiveMessages !== undefined) {
        updates.push(`"canReceiveMessages" = $${paramIndex}`);
        values.push(canReceiveMessages);
        paramIndex++;
      }

      if (showOnlineStatus !== undefined) {
        updates.push(`"showOnlineStatus" = $${paramIndex}`);
        values.push(showOnlineStatus);
        paramIndex++;
      }

      if (showLastSeen !== undefined) {
        updates.push(`"showLastSeen" = $${paramIndex}`);
        values.push(showLastSeen);
        paramIndex++;
      }

      if (profileTheme !== undefined) {
        updates.push(`"profileTheme" = $${paramIndex}`);
        values.push(profileTheme);
        paramIndex++;
      }

      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        values.push(userId);

        await db.query(
          `UPDATE profiles SET ${updates.join(", ")} WHERE "userId" = $${paramIndex}`,
          values,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile settings updated successfully",
    });
  } catch (error) {
    console.error("Update profile settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/users/:userId/follow
 * @desc    Follow a user
 * @access  Private
 */
export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).userId;
    const { userId: followingId } = req.params;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Can't follow yourself
    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if user exists
    const userCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND "isBanned" = false',
      [followingId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already following
    const existingFollow = await db.query(
      'SELECT id FROM followers WHERE "followerId" = $1 AND "followingId" = $2',
      [followerId, followingId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Create follow relationship
    await db.query(
      'INSERT INTO followers ("followerId", "followingId", "createdAt") VALUES ($1, $2, NOW())',
      [followerId, followingId]
    );

    // Update follower counts
    await db.query(
      'UPDATE users SET "followerCount" = "followerCount" + 1 WHERE id = $1',
      [followingId]
    );
    await db.query(
      'UPDATE users SET "followingCount" = "followingCount" + 1 WHERE id = $1',
      [followerId]
    );

    return res.status(200).json({
      success: true,
      message: "Successfully followed user",
    });
  } catch (error) {
    console.error("Follow user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   DELETE /api/v1/users/:userId/follow
 * @desc    Unfollow a user
 * @access  Private
 */
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).userId;
    const { userId: followingId } = req.params;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if following
    const existingFollow = await db.query(
      'SELECT id FROM followers WHERE "followerId" = $1 AND "followingId" = $2',
      [followerId, followingId]
    );

    if (existingFollow.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Delete follow relationship
    await db.query(
      'DELETE FROM followers WHERE "followerId" = $1 AND "followingId" = $2',
      [followerId, followingId]
    );

    // Update follower counts
    await db.query(
      'UPDATE users SET "followerCount" = GREATEST("followerCount" - 1, 0) WHERE id = $1',
      [followingId]
    );
    await db.query(
      'UPDATE users SET "followingCount" = GREATEST("followingCount" - 1, 0) WHERE id = $1',
      [followerId]
    );

    return res.status(200).json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/users/following
 * @desc    Get list of users the current user is following
 * @access  Private
 */
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

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
        u."avatarUrl" as avatar_url,
        u."isVerified" as is_verified,
        u."presenceStatus" as presence_status,
        f."createdAt" as followed_at
      FROM followers f
      JOIN users u ON f."followingId" = u.id
      WHERE f."followerId" = $1 AND u."isBanned" = false
      ORDER BY f."createdAt" DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        following: result.rows,
      },
    });
  } catch (error) {
    console.error("Get following error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/users/followers
 * @desc    Get list of users following the current user
 * @access  Private
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

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
        u."avatarUrl" as avatar_url,
        u."isVerified" as is_verified,
        u."presenceStatus" as presence_status,
        f."createdAt" as followed_at
      FROM followers f
      JOIN users u ON f."followerId" = u.id
      WHERE f."followingId" = $1 AND u."isBanned" = false
      ORDER BY f."createdAt" DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        followers: result.rows,
      },
    });
  } catch (error) {
    console.error("Get followers error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/users/:userId/relationship
 * @desc    Get relationship status with a user (friend, following, etc.)
 * @access  Private
 */
export const getRelationship = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const { userId: targetUserId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if users are friends
    const friendshipCheck = await db.query(
      `SELECT id FROM friendships 
       WHERE ("userId" = $1 AND "friendId" = $2) 
       OR ("userId" = $2 AND "friendId" = $1)`,
      [currentUserId, targetUserId]
    );

    const isFriend = friendshipCheck.rows.length > 0;

    // Check if there's a pending friend request
    const friendRequestCheck = await db.query(
      `SELECT id, "senderId", "receiverId" FROM friend_requests 
       WHERE status = 'pending' 
       AND (("senderId" = $1 AND "receiverId" = $2) OR ("senderId" = $2 AND "receiverId" = $1))`,
      [currentUserId, targetUserId]
    );

    let friendRequestStatus = null;
    if (friendRequestCheck.rows.length > 0) {
      const request = friendRequestCheck.rows[0];
      friendRequestStatus = request.senderId === currentUserId ? 'sent' : 'received';
    }

    // Check if following
    const followingCheck = await db.query(
      'SELECT id FROM followers WHERE "followerId" = $1 AND "followingId" = $2',
      [currentUserId, targetUserId]
    );

    const isFollowing = followingCheck.rows.length > 0;

    // Check if best friend
    const bestFriendCheck = await db.query(
      'SELECT id FROM best_friends WHERE "userId" = $1 AND "friendId" = $2',
      [currentUserId, targetUserId]
    );

    const isBestFriend = bestFriendCheck.rows.length > 0;

    // Check if blocked
    const blockedCheck = await db.query(
      'SELECT id FROM blocked_users WHERE "userId" = $1 AND "blockedUserId" = $2',
      [currentUserId, targetUserId]
    );

    const isBlocked = blockedCheck.rows.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        isFriend,
        friendRequestStatus,
        isFollowing,
        isBestFriend,
        isBlocked,
      },
    });
  } catch (error) {
    console.error("Get relationship error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/users/presence
 * @desc    Update current user's presence status in the database
 * @access  Private
 */
export const updatePresence = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { presenceStatus, currentGame } = req.body;

    const validStatuses = ['online', 'offline', 'in-game'];
    if (!presenceStatus || !validStatuses.includes(presenceStatus)) {
      return res.status(400).json({ success: false, message: "Invalid presenceStatus" });
    }

    await db.query(
      `UPDATE users
       SET "presenceStatus" = $1, "lastOnline" = NOW(), "currentGame" = $2
       WHERE id = $3`,
      [presenceStatus, currentGame || null, userId]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update presence error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   POST /api/v1/users/roblox/connect
 * @desc    Connect Roblox account
 * @access  Private
 */
export const connectRoblox = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { robloxUsername } = req.body;

    if (!robloxUsername?.trim()) {
      return res.status(400).json({ success: false, message: "Roblox username is required" });
    }

    // Verify Roblox username exists via Roblox API
    const robloxRes = await fetch(
      `https://users.roblox.com/v1/usernames/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [robloxUsername.trim()], excludeBannedUsers: true }),
      }
    );

    if (!robloxRes.ok) {
      return res.status(502).json({ success: false, message: "Failed to verify Roblox account" });
    }

    const robloxData = await robloxRes.json() as any;
    const robloxUser = robloxData.data?.[0];

    if (!robloxUser) {
      return res.status(404).json({ success: false, message: "Roblox account not found" });
    }

    // Get Roblox avatar
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=150x150&format=Png`
    );
    let robloxAvatarUrl = null;
    if (avatarRes.ok) {
      const avatarData = await avatarRes.json() as any;
      robloxAvatarUrl = avatarData.data?.[0]?.imageUrl || null;
    }

    // Save to database
    await db.query(
      `UPDATE users SET roblox_username = $1, roblox_id = $2, roblox_avatar_url = $3 WHERE id = $4`,
      [robloxUser.name, String(robloxUser.id), robloxAvatarUrl, userId]
    );

    return res.json({
      success: true,
      message: "Roblox account connected successfully",
      data: {
        robloxUsername: robloxUser.name,
        robloxId: String(robloxUser.id),
        robloxAvatarUrl,
      },
    });
  } catch (error) {
    console.error("Connect Roblox error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   DELETE /api/v1/users/roblox/disconnect
 * @desc    Disconnect Roblox account
 * @access  Private
 */
export const disconnectRoblox = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await db.query(
      `UPDATE users SET roblox_username = NULL, roblox_id = NULL, roblox_avatar_url = NULL WHERE id = $1`,
      [userId]
    );

    return res.json({ success: true, message: "Roblox account disconnected successfully" });
  } catch (error) {
    console.error("Disconnect Roblox error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }

};
