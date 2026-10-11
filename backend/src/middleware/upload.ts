import multer from "multer";
import { AppError } from "./errorHandler";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// Files stay in memory (max 5 MB) and go straight to Cloudinary. Nothing is saved on disk.
export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new AppError(400, "Only JPG, PNG or WebP images are allowed"));
    }
    cb(null, true);
  },
}).single("photo");
