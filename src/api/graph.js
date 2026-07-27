import api from "./index";

export const graphAPI = {
  // Fire-and-forget (re)index of a single note's triplets.
  indexNote: (noteId) =>
    api.post(`/graph/index/${noteId}`, {}, { timeout: 60000 }),

  // Re-index all of the user's notes.
  rebuild: (force = false) =>
    api.post("/graph/rebuild", { force }, { timeout: 300000 }),

  // Fetch graph nodes+links (optionally scoped by noteId or entityId).
  getGraph: async (params = {}) => {
    const res = await api.get("/graph", { params });
    return res.data;
  },
};
