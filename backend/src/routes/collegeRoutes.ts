import { Router } from "express";
import { listColleges } from "../controllers/collegeController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.get("/", asyncHandler(listColleges));
export default router;
