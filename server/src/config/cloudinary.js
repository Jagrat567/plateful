import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { AppError } from "../utils/AppError.js";

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
if (configured) cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });

export function uploadImage(buffer) {
  if (!configured) throw new AppError(503, "Cloudinary is not configured. Add its credentials to server/.env");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "plateful/menu", resource_type: "image", transformation: [{ width: 1000, height: 750, crop: "limit" }, { quality: "auto", fetch_format: "auto" }] }, (error, result) => error ? reject(new AppError(502, "Image upload failed")) : resolve(result));
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (configured && publicId) await cloudinary.uploader.destroy(publicId);
}
