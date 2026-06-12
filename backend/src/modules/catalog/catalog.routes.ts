import { Router } from "express";
import {
  getCatalogItems,
  getCatalogItemById,
  getCatalogCategories,
  getCatalogSubcategories,
} from "./catalog.controller.js";
import {
  getUserInventory,
  addToInventory,
} from "./inventory.controller.js";
import { searchRobloxCatalog } from "./roblox.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.get("/items", getCatalogItems);
router.get("/items/:id", getCatalogItemById);
router.get("/categories", getCatalogCategories);
router.get("/subcategories/:category", getCatalogSubcategories);
router.get("/roblox/search", searchRobloxCatalog);

// Private routes
router.get("/inventory", verifyToken, getUserInventory);
router.post("/inventory/:itemId", verifyToken, addToInventory);

export default router;
