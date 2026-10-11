import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createProperty,
  deleteProperty,
  getProperty,
  updateProperty,
} from "../controllers/propertyController";
import {
  listPhotos,
  uploadPhoto,
} from "../controllers/photoController";
import {
  createReview,
  listReviews,
} from "../controllers/reviewController";
import { searchProperties } from "../controllers/searchController";
import {
  authenticate,
  optionalAuth,
  requireRole,
} from "../middleware/auth";
import { uploadSingleImage } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    error: "Too many uploads. Please try again later.",
  },
});

router.get("/", asyncHandler(searchProperties));

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(getProperty)
);

router.get(
  "/:id/reviews",
  optionalAuth,
  asyncHandler(listReviews)
);

router.post(
  "/:id/reviews",
  authenticate,
  asyncHandler(createReview)
);

router.get(
  "/:id/photos",
  asyncHandler(listPhotos)
);

router.post(
  "/:id/photos",
  authenticate,
  uploadLimiter,
  uploadSingleImage,
  asyncHandler(uploadPhoto)
);

/*
 * Property management
 * OWNER can manage their own properties.
 * ADMIN can manage all properties.
 */
router.post(
  "/",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(createProperty)
);

router.put(
  "/:id",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(updateProperty)
);

router.delete(
  "/:id",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(deleteProperty)
);

export default router;
