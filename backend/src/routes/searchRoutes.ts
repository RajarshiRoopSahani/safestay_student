import { Router } from "express";
import { searchProperties } from "../controllers/searchController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.get("/", asyncHandler(searchProperties));
export default router;
