import { Router } from "express";
import { searchUsers, quickSearch, searchGroupsGlobal, searchGames } from './search.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Search routes with optional auth (to show friendship status if logged in)
router.get("/users", optionalAuth, searchUsers);
router.get("/groups", searchGroupsGlobal);
router.get("/games", searchGames);
router.get("/quick", quickSearch);

export default router;
