import { uploadImage } from "../../config/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

export async function uploadMenuImage(req, res) {
  if (!req.file) throw new AppError(400, "Choose an image to upload");
  const result = await uploadImage(req.file.buffer);
  res.status(201).json({ success: true, data: { imageUrl: result.secure_url, imagePublicId: result.public_id } });
}
