import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createBooking, getBooking, listBookings, updateBooking } from "../controllers/bookingController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many booking requests. Please try again later." },
});

router.use(authenticate);
router.post("/", bookingLimiter, asyncHandler(createBooking));
router.get("/", asyncHandler(listBookings));
router.get("/:id", asyncHandler(getBooking));
router.put("/:id", asyncHandler(updateBooking));

export default router;
