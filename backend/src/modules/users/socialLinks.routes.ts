import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {
  getUserSocialLinks,
  getMySocialLinks,
  upsertSocialLink,
  deleteSocialLink,
} from "./socialLinks.controller.js";

const router = Router();

/**
 * @route   GET /api/v1/users/social-links/me
 * @desc    Get current user's social links
 * @access  Private
 */
router.get("/me", verifyToken, getMySocialLinks);

/**
 * @route   GET /api/v1/users/social-links/:userId
 * @desc    Get user's social links by userId
 * @access  Public
 */
router.get("/:userId", getUserSocialLinks);

/**
 * @route   POST /api/v1/users/social-links
 * @desc    Add or update a social link
 * @access  Private
 */
router.post("/", verifyToken, upsertSocialLink);

/**
 * @route   DELETE /api/v1/users/social-links/:platform
 * @desc    Delete a social link
 * @access  Private
 */
router.delete("/:platform", verifyToken, deleteSocialLink);

export default router;
