import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat, chatHistory, clearChatHistory, recommendHandler } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: "Too many AI requests. Please try again later." },
});

router.use(authenticate);
router.post("/recommend", aiLimiter, asyncHandler(recommendHandler));
router.post("/chat", aiLimiter, asyncHandler(chat));
router.get("/history", asyncHandler(chatHistory));
router.delete("/history", asyncHandler(clearChatHistory));

export default router;
