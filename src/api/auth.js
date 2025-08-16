import api from "./index";

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  googleAuth: async (googleData) => {
    const response = await api.post("/auth/google", googleData);
    return response.data;
  },

  googleLogin: async (googleUser) => {
    const response = await api.post("/auth/google", { user: googleUser });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.patch("/auth/preferences", preferences);
    return response.data;
  },
};
