import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  addRoom,
  createBuilding,
  deleteRoom,
  getStats,
  listAdminProperties,
  listBuildings,
  listUsers,
  updateBuilding,
  updateRoom,
} from "../controllers/adminController";
import { adminListPhotos, analyzePhoto, clearAnalysis, deletePhoto, moderatePhoto } from "../controllers/adminPhotoController";
import { adminListReports, adminUpdateReport } from "../controllers/adminReportController";
import { adminListReviews, deleteReview, moderateReview } from "../controllers/adminReviewController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { error: "Too many AI analysis requests. Please try again later." },
});

router.use(authenticate, requireRole("ADMIN"));

// Dashboard
router.get("/stats", asyncHandler(getStats));

// Users and properties
router.get("/users", asyncHandler(listUsers));
router.get("/properties", asyncHandler(listAdminProperties));

// Buildings
router.get("/buildings", asyncHandler(listBuildings));
router.post("/buildings", asyncHandler(createBuilding));
router.put("/buildings/:id", asyncHandler(updateBuilding));

// Rooms
router.post("/properties/:id/rooms", asyncHandler(addRoom));
router.put("/rooms/:id", asyncHandler(updateRoom));
router.delete("/rooms/:id", asyncHandler(deleteRoom));

// Photo moderation
router.get("/photos", asyncHandler(adminListPhotos));
router.put("/photos/:id", asyncHandler(moderatePhoto));
router.delete("/photos/:id", asyncHandler(deletePhoto));
router.post("/photos/:id/analyze", analysisLimiter, asyncHandler(analyzePhoto));
router.delete("/photos/:id/analysis", asyncHandler(clearAnalysis));

// Review moderation
router.get("/reviews", asyncHandler(adminListReviews));
router.put("/reviews/:id", asyncHandler(moderateReview));
router.delete("/reviews/:id", asyncHandler(deleteReview));

// Reports
router.get("/reports", asyncHandler(adminListReports));
router.put("/reports/:id", asyncHandler(adminUpdateReport));

export default router;
