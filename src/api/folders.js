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
    console.log('🚀 Frontend: Starting folder update');
    console.log('🚀 Frontend: Folder ID:', id);
    console.log('🚀 Frontend: Updates to send:', updates);
    
    try {
      if (!id) {
        console.error('❌ Frontend: updateFolder called without a valid id');
        return Promise.reject({ response: { status: 400, data: { success: false, message: 'Missing folder id on client' } } });
      }
      const response = await api.put(`/folders/${id}`, updates);
      console.log('✅ Frontend: Folder update successful');
      console.log('✅ Frontend: Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Folder update failed');
      console.error('❌ Frontend: Error details:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      console.error('❌ Frontend: Error status:', error.response?.status);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },
};
