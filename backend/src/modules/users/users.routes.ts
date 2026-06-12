import { Router } from "express";
import {
  getProfile,
  getUserByUsername,
  updateProfile,
  updateProfileSettings,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getRelationship,
  updatePresence,
  connectRoblox,
  disconnectRoblox,
} from './users.controller.js';import { verifyToken, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile (displayName, bio, status)
 * @access  Private
 */
router.put("/profile", verifyToken, updateProfile);

/**
 * @route   PUT /api/v1/users/profile/settings
 * @desc    Update profile privacy settings
 * @access  Private
 */
router.put("/profile/settings", verifyToken, updateProfileSettings);

/**
 * @route   GET /api/v1/users/following
 * @desc    Get list of users the current user is following
 * @access  Private
 */
router.get("/following", verifyToken, getFollowing);

/**
 * @route   GET /api/v1/users/followers
 * @desc    Get list of users following the current user
 * @access  Private
 */
router.get("/followers", verifyToken, getFollowers);

/**
 * @route   POST /api/v1/users/:userId/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post("/:userId/follow", verifyToken, followUser);

/**
 * @route   DELETE /api/v1/users/:userId/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete("/:userId/follow", verifyToken, unfollowUser);

/**
 * @route   GET /api/v1/users/:userId/relationship
 * @desc    Get relationship status with a user
 * @access  Private
 */
router.get("/:userId/relationship", verifyToken, getRelationship);

/**
 * @route   PUT /api/v1/users/presence
 * @desc    Update current user's presence status
 * @access  Private
 */
router.put("/presence", verifyToken, updatePresence);

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get user profile by username
 * @access  Public (with optional auth)
 */
router.post("/roblox/connect", verifyToken, connectRoblox);
router.delete("/roblox/disconnect", verifyToken, disconnectRoblox);
router.get("/:username", optionalAuth, getUserByUsername);

export default router;
