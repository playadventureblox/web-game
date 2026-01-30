import { Router } from "express";
import {
  createGroup,
  getGroupById,
  getAllGroups,
  updateGroup,
  joinGroup,
  getGroupMembers,
  getUserGroups,
  getGroupGames,
  getGroupWallPosts,
  createGroupWallPost,
  getWallPostReplies,
  createWallPostReply,
  deleteWallPostReply,
  makePrimaryGroup,
  leaveGroupEnhanced,
  removeMember,
  updateMemberRole,
  reportGroup,
  getGroupRoles,
  createGroupRole,
  updateGroupRole,
  deleteGroupRole,
  updateGroupShout,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
} from './groups.controller.js';
import {
  getGroupSettings,
  updateGroupSettings,
} from './groups.settings.controller.js';
import {
  getGroupSocialLinks,
  updateGroupSocialLinks,
} from './groups.social.controller.js';
import {
  getGroupAlliances,
  getAllianceRequests,
  sendAllianceRequest,
  respondToAllianceRequest,
  removeAlliance,
} from './groups.alliances.controller.js';
import { authMiddleware, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get("/", getAllGroups);
router.get("/:id", optionalAuth, getGroupById);
router.get("/:id/members", getGroupMembers);
router.get("/:id/games", getGroupGames);
router.get("/:id/wall", getGroupWallPosts);
router.get("/:id/wall/:postId/replies", getWallPostReplies);
router.get("/:id/roles", getGroupRoles);
router.get("/:id/settings", getGroupSettings);
router.get("/:id/social-links", getGroupSocialLinks);
router.get("/:id/alliances", getGroupAlliances);
router.get("/:id/alliances/requests", authMiddleware, getAllianceRequests);

// Protected routes - Group management
router.get("/user/me", authMiddleware, getUserGroups);
router.get("/user/:userId", getUserGroups);
router.post("/", authMiddleware, createGroup);
router.put("/:id", authMiddleware, updateGroup);
router.post("/:id/join", authMiddleware, joinGroup);
router.get("/:id/join-requests", authMiddleware, getJoinRequests);
router.post("/:id/join-requests/:requestId/accept", authMiddleware, acceptJoinRequest);
router.post("/:id/join-requests/:requestId/reject", authMiddleware, rejectJoinRequest);
router.post("/:id/leave", authMiddleware, leaveGroupEnhanced);
router.post("/:id/wall", authMiddleware, createGroupWallPost);
router.post("/:id/wall/:postId/replies", authMiddleware, createWallPostReply);
router.delete("/:id/wall/:postId/replies/:replyId", authMiddleware, deleteWallPostReply);
router.put("/:id/settings", authMiddleware, updateGroupSettings);
router.put("/:id/social-links", authMiddleware, updateGroupSocialLinks);

// Protected routes - Admin actions
router.post("/:id/primary", authMiddleware, makePrimaryGroup);
router.delete("/:id/members/:userId", authMiddleware, removeMember);
router.patch("/:id/members/:userId/role", authMiddleware, updateMemberRole);
router.post("/:id/report", authMiddleware, reportGroup);

// Protected routes - Role management
router.post("/:id/roles", authMiddleware, createGroupRole);
router.patch("/:id/roles/:roleId", authMiddleware, updateGroupRole);
router.delete("/:id/roles/:roleId", authMiddleware, deleteGroupRole);

// Protected routes - Shout management
router.put("/:id/shout", authMiddleware, updateGroupShout);

// Protected routes - Alliance management
router.post("/:id/alliances", authMiddleware, sendAllianceRequest);
router.patch("/:id/alliances/:allianceId", authMiddleware, respondToAllianceRequest);
router.delete("/:id/alliances/:allianceId", authMiddleware, removeAlliance);

export default router;
