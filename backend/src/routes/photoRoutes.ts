import { Router } from "express";
import { myPhotos } from "../controllers/photoController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.get("/mine", authenticate, asyncHandler(myPhotos));
export default router;
