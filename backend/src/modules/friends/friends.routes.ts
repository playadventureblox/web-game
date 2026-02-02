import { Router } from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getUserFriends,
  getFriendRequests,
  addBestFriend,
  removeBestFriend,
  getBestFriends,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from './friends.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Public route - Get specific user's friends
router.get("/user/:userId", getUserFriends);

// All other routes require authentication
router.use(authMiddleware);

// Friend requests
router.post("/request", sendFriendRequest);
router.post("/accept/:requestId", acceptFriendRequest);
router.post("/decline/:requestId", declineFriendRequest);
router.get("/requests", getFriendRequests);

// Friends management
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);

// Best friends
router.get("/best", getBestFriends);
router.post("/best/:friendId", addBestFriend);
router.delete("/best/:friendId", removeBestFriend);

// Block/unblock
router.post("/block/:userId", blockUser);
router.delete("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);

export default router;
