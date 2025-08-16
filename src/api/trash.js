import api from "./index";

export const trashAPI = {
  getTrash: async (params = {}) => {
    const response = await api.get("/trash", { params });
    return response.data;
  },

  restoreNote: async (id) => {
    const response = await api.patch(`/trash/${id}/restore`);
    return response.data;
  },

  permanentlyDeleteNote: async (id) => {
    const response = await api.delete(`/trash/${id}`);
    return response.data;
  },

  emptyTrash: async () => {
    const response = await api.delete("/trash");
    return response.data;
  },
};
