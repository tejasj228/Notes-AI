import api from "./index";

export const aiAPI = {
  sendMessage: async (noteId, messageData) => {
    // Support both old string format and new object format
    const payload = typeof messageData === 'string' 
      ? { message: messageData }
      : messageData;
    
    // Increase timeout for AI requests
    const response = await api.post(`/ai/chat/${noteId}`, payload, {
      timeout: 60000 // 60 seconds for AI requests
    });
    return response.data;
  },

  getChatHistory: async (noteId, params = {}) => {
    // Increase timeout for chat history requests
    const response = await api.get(`/ai/chat/${noteId}/history`, { 
      params,
      timeout: 60000 // 60 seconds for chat history requests
    });
    return response.data;
  },

  deleteChatHistory: async (noteId, params = {}) => {
    const response = await api.delete(`/ai/chat/${noteId}/history`, { 
      params,
      timeout: 30000 // 30 seconds for delete requests
    });
    return response.data;
  },

  getSuggestions: async (noteId, type = 'general') => {
    const response = await api.post(`/ai/suggestions/${noteId}`, { type });
    return response.data;
  },

  getRecentChats: async (params = {}) => {
    const response = await api.get("/ai/recent-chats", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/ai/stats");
    return response.data;
  },
};
