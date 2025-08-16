import api from "./index";

export const foldersAPI = {
  getAllFolders: async (params = {}) => {
    const response = await api.get("/folders", { params });
    return response.data;
  },

  getFolder: async (id) => {
    const response = await api.get(`/folders/${id}`);
    return response.data;
  },

  createFolder: async (folderData) => {
    const response = await api.post("/folders", folderData);
    return response.data;
  },

  updateFolder: async (id, updates) => {
    const response = await api.put(`/folders/${id}`, updates);
    return response.data;
  },

  deleteFolder: async (id) => {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },
};
