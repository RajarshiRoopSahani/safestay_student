
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  confirmReport,
  createReport,
  resolveReport,
} from "../controllers/reportController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many reports. Please try again later." },
});

// Student creates a report.
router.post(
  "/",
  authenticate,
  reportLimiter,
  asyncHandler(createReport)
);

// Property owner or admin marks the report as fixed.
router.patch(
  "/:id/resolve",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(resolveReport)
);

// Student who created the report confirms whether it is fixed.
router.patch(
  "/:id/confirm",
  authenticate,
  asyncHandler(confirmReport)
);

// IMPORTANT: Keep this at the very end of this file.
export default router;
