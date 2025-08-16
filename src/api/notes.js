import api from "./index";

export const notesAPI = {
  getAllNotes: async (params = {}) => {
    console.log('Notes API - Getting all notes with params:', params);
    const response = await api.get("/notes", { params });
    console.log('Notes API - Notes response:', response.data);
    return response.data;
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (noteData) => {
    const response = await api.post("/notes", noteData);
    return response.data;
  },

  updateNote: async (id, updates) => {
    const response = await api.put(`/notes/${id}`, updates);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  reorderNotes: async (noteOrders, folderId = null) => {
    const response = await api.patch("/notes/reorder", {
      noteOrders,
      folderId,
    });
    return response.data;
  },

  duplicateNote: async (id) => {
    const response = await api.post(`/notes/${id}/duplicate`);
    return response.data;
  },
};
