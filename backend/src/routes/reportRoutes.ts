import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createReport } from "../controllers/reportController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many reports. Please try again later." },
});

router.post("/", authenticate, reportLimiter, asyncHandler(createReport));

export default router;
