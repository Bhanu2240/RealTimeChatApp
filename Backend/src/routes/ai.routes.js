import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generateSmartReplies } from "../controllers/ai.controller.js";

const router = express.Router();

router.post(
  "/smart-replies",
  protectRoute,
  generateSmartReplies
);

export default router;