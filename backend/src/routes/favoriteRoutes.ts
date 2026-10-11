import { Router } from "express";
import { addFavorite, listFavorites, removeFavorite } from "../controllers/favoriteController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listFavorites));
router.post("/", asyncHandler(addFavorite));
router.delete("/:propertyId", asyncHandler(removeFavorite));

export default router;
