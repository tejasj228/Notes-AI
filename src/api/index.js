import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  // Same-origin Next.js API routes by default; override only for an external API.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 30000, // Increased base timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Handle unauthorized access
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
