const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_ORIGIN = (configuredApiUrl || "http://localhost:5000").replace(/\/$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
