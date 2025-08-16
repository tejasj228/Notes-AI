# Frontend-Backend Integration Guide

## 🔗 Connecting Your React Frontend to the Backend

This guide explains how to integrate the existing React frontend with the new Node.js backend without changing any UI or styling.

## 📋 Integration Steps

### 1. Install Additional Frontend Dependencies

In your frontend directory (`Notes-AI/`), install the HTTP client:

```bash
npm install axios
```

### 2. Create API Service Layer

Create a new file `src/api/index.js`:

```javascript
import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
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
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Create API Service Functions

Create `src/api/auth.js`:

```javascript
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

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.patch("/auth/preferences", preferences);
    return response.data;
  },
};
```

Create `src/api/notes.js`:

```javascript
import api from "./index";

export const notesAPI = {
  getAllNotes: async (params = {}) => {
    const response = await api.get("/notes", { params });
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
```

### 4. Update useNotesData Hook

Replace the content of `src/hooks/useNotesData.js` with backend integration:

```javascript
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { notesAPI } from "../api/notes";
import { foldersAPI } from "../api/folders";
import { trashAPI } from "../api/trash";

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { noteId, folderId } = useParams();
  const location = useLocation();

  // Determine current page from URL
  const getCurrentPageFromURL = () => {
    const path = location.pathname;
    if (path.startsWith("/ai-chat/")) return "ai-chat";
    if (path.startsWith("/trash")) return "trash";
    if (path.startsWith("/folder/")) return "folder";
    return "notes";
  };

  // Get current folder from URL
  const getCurrentFolderFromURL = () => {
    if (folderId) {
      return folders.find(
        (f) =>
          f._id === folderId ||
          f.name.toLowerCase().replace(/\s+/g, "-") === folderId
      );
    }
    return null;
  };

  // Load data from backend
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [notesRes, foldersRes, trashRes] = await Promise.all([
        notesAPI.getAllNotes(),
        foldersAPI.getAllFolders({ includeNotesCount: true }),
        trashAPI.getTrash(),
      ]);

      setNotes(notesRes.data.notes);
      setFolders(foldersRes.data.folders);
      setTrashedNotes(trashRes.data.notes);
    } catch (err) {
      setError(err.message);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get current notes based on page and folder
  const getCurrentNotes = () => {
    const currentPage = getCurrentPageFromURL();
    const currentFolder = getCurrentFolderFromURL();

    if (currentPage === "trash") {
      return trashedNotes;
    } else if (currentPage === "folder" && currentFolder) {
      return notes.filter((note) => note.folderId === currentFolder._id);
    } else {
      return notes.filter((note) => note.folderId === null);
    }
  };

  // Create new note
  const createNote = async (noteData) => {
    try {
      const currentPage = getCurrentPageFromURL();
      const currentFolder = getCurrentFolderFromURL();
      const folderId =
        currentPage === "folder" && currentFolder ? currentFolder._id : null;

      const response = await notesAPI.createNote({
        ...noteData,
        folderId,
      });

      const newNote = response.data.note;
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update note
  const updateNote = async (noteId, field, value) => {
    try {
      const updates = { [field]: value };
      const response = await notesAPI.updateNote(noteId, updates);

      setNotes((prev) =>
        prev.map((note) => (note._id === noteId ? response.data.note : note))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete note (move to trash)
  const deleteNote = async (noteId) => {
    try {
      await notesAPI.deleteNote(noteId);

      const noteToDelete = notes.find((note) => note._id === noteId);
      if (noteToDelete) {
        setNotes((prev) => prev.filter((note) => note._id !== noteId));
        setTrashedNotes((prev) => [
          ...prev,
          { ...noteToDelete, trashedAt: new Date() },
        ]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Restore note from trash
  const restoreNote = async (noteId) => {
    try {
      const response = await trashAPI.restoreNote(noteId);

      const restoredNote = response.data.note;
      setTrashedNotes((prev) => prev.filter((note) => note._id !== noteId));
      setNotes((prev) => [restoredNote, ...prev]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Permanently delete note
  const permanentlyDeleteNote = async (noteId) => {
    try {
      await trashAPI.permanentlyDeleteNote(noteId);
      setTrashedNotes((prev) => prev.filter((note) => note._id !== noteId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reorder notes
  const reorderNotes = async (
    updatedCurrentNotes,
    draggedNote,
    page,
    hoverIndex
  ) => {
    try {
      const currentFolder = getCurrentFolderFromURL();
      const folderId =
        page === "folder" && currentFolder ? currentFolder._id : null;

      const noteOrders = updatedCurrentNotes.map((note, index) => ({
        noteId: note._id,
        order: index,
      }));

      await notesAPI.reorderNotes(noteOrders, folderId);

      // Update local state
      if (page === "folder" && currentFolder) {
        const otherNotes = notes.filter(
          (note) => note.folderId !== currentFolder._id
        );
        setNotes([...otherNotes, ...updatedCurrentNotes]);
      } else if (page === "notes") {
        const folderNotes = notes.filter((note) => note.folderId !== null);
        setNotes([...updatedCurrentNotes, ...folderNotes]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Folder operations
  const createFolder = async (folderData) => {
    try {
      const response = await foldersAPI.createFolder(folderData);
      const newFolder = response.data.folder;
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateFolder = async (folderId, updates) => {
    try {
      const response = await foldersAPI.updateFolder(folderId, updates);
      setFolders((prev) =>
        prev.map((f) => (f._id === folderId ? response.data.folder : f))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      await foldersAPI.deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f._id !== folderId));

      // Move folder notes to root
      setNotes((prev) =>
        prev.map((note) =>
          note.folderId === folderId ? { ...note, folderId: null } : note
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    // State
    notes,
    folders,
    trashedNotes,
    searchTerm,
    loading,
    error,
    setSearchTerm,

    // Note operations
    createNote,
    updateNote,
    deleteNote,
    permanentlyDeleteNote,
    restoreNote,
    reorderNotes,
    getCurrentNotes,

    // Folder operations
    createFolder,
    updateFolder,
    deleteFolder,

    // URL-based helpers
    getCurrentPageFromURL,
    getCurrentFolderFromURL,

    // Utility
    refreshData: loadInitialData,
  };
};
```

### 5. Update Authentication

Modify your `Login.jsx` and `Signup.jsx` components to use the backend:

```javascript
// In Login.jsx
import { authAPI } from "../api/auth";

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await authAPI.login(loginData);

    // Store token and user data
    localStorage.setItem("authToken", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    onLogin(response.data.user);
  } catch (error) {
    console.error("Login error:", error);
    // Handle error (show message to user)
  } finally {
    setIsLoading(false);
  }
};
```

### 6. Environment Variables

Add to your frontend `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 7. Start Both Servers

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd ..
npm start
```

## 🔄 Data Migration

The backend expects slightly different data structures:

### ID Changes

- Frontend uses `id` → Backend uses `_id`
- Update components to handle both for compatibility

### Date Fields

- Backend uses ISO date strings
- Frontend date handling remains the same

### Folder References

- Frontend uses `folderId: null` → Backend uses `folderId: null`
- No changes needed

## 🚀 Benefits of Backend Integration

✅ **Real Data Persistence**: Notes survive browser refresh  
✅ **User Accounts**: Multiple users with isolated data  
✅ **AI Features**: Real Google Gemini integration  
✅ **File Storage**: Proper image upload and storage  
✅ **Search**: Advanced search capabilities  
✅ **Performance**: Pagination and optimized queries  
✅ **Security**: Authentication and data protection  
✅ **Scalability**: Ready for production deployment

## 🎯 Testing Integration

1. **Authentication Flow**: Login/signup should work
2. **Notes CRUD**: Create, edit, delete notes
3. **Folder Management**: Create and organize folders
4. **Drag & Drop**: Note reordering should persist
5. **Search**: Real-time search across all notes
6. **AI Chat**: If Gemini API key is configured
7. **Image Upload**: If Cloudinary is configured

## 🐛 Troubleshooting

### CORS Issues

Make sure `FRONTEND_URL=http://localhost:3000` in backend `.env`

### Database Connection

Ensure MongoDB is running and accessible

### API Errors

Check browser Network tab for failed requests

### Authentication Issues

Clear localStorage and try fresh login

## 📝 Next Steps

After integration:

1. Test all features thoroughly
2. Configure Cloudinary for image uploads
3. Set up Google Gemini AI API key
4. Deploy to production
5. Add real-time features with WebSockets

Your frontend UI and styling will remain completely unchanged! 🎨
