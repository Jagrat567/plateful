import multer from "multer";
import { AppError } from "../utils/AppError.js";

export const imageUpload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype) ? callback(null, true) : callback(new AppError(400, "Only JPEG, PNG, and WebP images are allowed")),
});
