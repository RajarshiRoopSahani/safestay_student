import { Router } from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, login, me, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many attempts. Please try again later." },
});

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));
router.post("/forgot-password", authLimiter, asyncHandler(forgotPassword));
router.get("/me", authenticate, asyncHandler(me));

export default router;
