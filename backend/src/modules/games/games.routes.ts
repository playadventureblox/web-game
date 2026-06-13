import { Router } from "express";
import {
  getGames,
  getGameById,
  publishGame,
  publishGameByPlaceId,
  getSponsoredGames,
  sponsorGame,
  unsponsorGame,
} from "./games.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", getGames);
router.get("/sponsored", getSponsoredGames);
router.get("/:id", getGameById);
router.post("/publish", verifyToken, publishGame);
router.post("/publish-by-place-id", verifyToken, publishGameByPlaceId);
router.post("/:id/sponsor", verifyToken, sponsorGame);
router.delete("/:id/sponsor", verifyToken, unsponsorGame);

export default router;
