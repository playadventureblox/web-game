import { Router } from "express";
import {
  getGames,
  getGameById,
  publishGame,
  publishGameByPlaceId,
} from "./games.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", getGames);
router.get("/:id", getGameById);
router.post("/publish", verifyToken, publishGame);
router.post("/publish-by-place-id", verifyToken, publishGameByPlaceId);

export default router;
