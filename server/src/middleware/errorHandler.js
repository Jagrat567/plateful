export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  const isUploadError = error.name === "MulterError";
  const statusCode = error.code === 11000 ? 409 : (isUploadError ? 400 : (error.statusCode ?? 500));
  const message = error.code === 11000 ? "An account with those details already exists" : (isUploadError ? (error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Invalid image upload") : (statusCode === 500 ? "Internal server error" : error.message));
  if (statusCode === 500) console.error(error);
  res.status(statusCode).json({ success: false, message });
}
