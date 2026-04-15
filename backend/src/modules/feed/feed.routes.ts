import { Router } from "express";
import {
  getFeedPosts,
  createFeedPost,
  deleteFeedPost,
  toggleFeedPostLike,
  getFeedPostComments,
  createFeedPostComment,
} from './feed.controller.js';
import { authMiddleware, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get("/", optionalAuth, getFeedPosts);
router.post("/", authMiddleware, createFeedPost);
router.delete("/:id", authMiddleware, deleteFeedPost);
router.post("/:id/like", authMiddleware, toggleFeedPostLike);
router.get("/:id/comments", getFeedPostComments);
router.post("/:id/comments", authMiddleware, createFeedPostComment);

export default router;
