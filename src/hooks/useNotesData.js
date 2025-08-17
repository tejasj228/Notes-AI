import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { notesAPI } from '../api/notes';
import { foldersAPI } from '../api/folders';
import { trashAPI } from '../api/trash';

export const useNotesData = () => {
  // State
  const [notes, setNotes] = useState([]);

  const [folders, setFolders] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get URL parameters and location
  const { folderId } = useParams();
  const location = useLocation();

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
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine current page from URL
  const getCurrentPageFromURL = () => {
    const path = location.pathname;
    if (path.startsWith('/ai-chat/')) return 'ai-chat';
    if (path.startsWith('/trash')) return 'trash';
    if (path.startsWith('/folder/')) return 'folder';
    return 'notes';
  };

  // Get current folder from URL
  const getCurrentFolderFromURL = () => {
    if (folderId) {
      console.log('🔍 getCurrentFolderFromURL - folderId from URL:', folderId);
      console.log('🔍 getCurrentFolderFromURL - available folders:', folders.map(f => ({
        _id: f._id,
        id: f.id,
        name: f.name,
        nameSlug: f.name ? f.name.toLowerCase().replace(/\s+/g, '-') : null
      })));
      
      const foundFolder = folders.find(f => {
        const fId = f._id || f.id;
        const matchById = (fId && fId.toString() === folderId);
        const matchBySlug = (f.name && f.name.toLowerCase().replace(/\s+/g, '-') === folderId);
        
        console.log(`🔍 Checking folder "${f.name}":`, {
          fId,
          matchById,
          matchBySlug,
          overall: matchById || matchBySlug
        });
        
        return matchById || matchBySlug;
      });
      
      console.log('🔍 getCurrentFolderFromURL - found folder:', foundFolder);
      return foundFolder;
    }
    console.log('🔍 getCurrentFolderFromURL - no folderId, returning null');
    return null;
  };

  // Get current notes based on page and folder
  const getCurrentNotes = () => {
    const currentPage = getCurrentPageFromURL();
    const currentFolder = getCurrentFolderFromURL();
    
    console.log('📋 getCurrentNotes - currentPage:', currentPage);
    console.log('📋 getCurrentNotes - currentFolder:', currentFolder);
    console.log('📋 getCurrentNotes - all notes count:', notes.length);
    console.log('📋 getCurrentNotes - all notes:', notes.map(n => ({
      _id: n._id,
      title: n.title,
      folderId: n.folderId,
      folderIdType: typeof n.folderId
    })));
    
    if (currentPage === 'trash') {
      console.log('📋 getCurrentNotes - returning trash notes:', trashedNotes.length);
      return trashedNotes;
    } else if (currentPage === 'folder' && currentFolder) {
      const targetFolderId = currentFolder._id || currentFolder.id;
      console.log('📋 getCurrentNotes - targetFolderId:', targetFolderId, typeof targetFolderId);
      
      const folderNotes = notes.filter(note => {
        const noteFolderId = note.folderId;
        console.log(`📋 Checking note "${note.title}":`, {
          noteFolderId,
          noteFolderIdType: typeof noteFolderId,
          targetFolderId,
          targetFolderIdType: typeof targetFolderId
        });
        
        // Handle different folderId formats from backend
        let noteIdStr = null;
        if (noteFolderId) {
          // If folderId is an object (populated), get the _id
          if (typeof noteFolderId === 'object' && noteFolderId._id) {
            noteIdStr = noteFolderId._id.toString();
          } 
          // If folderId is already a string
          else if (typeof noteFolderId === 'string') {
            noteIdStr = noteFolderId;
          }
          // If folderId is just an ObjectId
          else {
            noteIdStr = noteFolderId.toString();
          }
        }
        
        const targetIdStr = targetFolderId ? targetFolderId.toString() : null;
        
        const isMatch = noteIdStr === targetIdStr;
        console.log(`📋 Match comparison:`, {
          noteIdStr,
          targetIdStr,
          isMatch
        });
        console.log(`📋 Match result for note "${note.title}":`, isMatch);
        return isMatch;
      });
      
      console.log('📋 getCurrentNotes - folder notes found:', folderNotes.length);
      console.log('📋 getCurrentNotes - folder notes:', folderNotes.map(n => ({ title: n.title, _id: n._id })));
      return folderNotes;
    } else {
      const rootNotes = notes.filter(note => note.folderId === null);
      console.log('📋 getCurrentNotes - root notes found:', rootNotes.length);
      return rootNotes;
    }
  };

  // Create new note - RETURN the created note
  const createNote = async (noteData) => {
    try {
      const currentPage = getCurrentPageFromURL();
      const currentFolder = getCurrentFolderFromURL();
      const folderId = currentPage === 'folder' && currentFolder ? (currentFolder._id || currentFolder.id) : null;
      
      console.log('🚀 Creating note - currentPage:', currentPage);
      console.log('🚀 Creating note - currentFolder:', currentFolder);
      console.log('🚀 Creating note - derived folderId:', folderId);
      console.log('🚀 Creating note - noteData:', noteData);
      
      const requestPayload = {
        ...noteData,
        folderId,
      };
      
      console.log('🚀 API request payload:', requestPayload);
      
      const response = await notesAPI.createNote(requestPayload);
      console.log('🚀 API response:', response);

      const newNote = response.data.note;
      console.log('🚀 Created note from backend:', newNote);
      
      setNotes((prev) => {
        const updatedNotes = [newNote, ...prev];
        console.log('🚀 Updated notes state:', updatedNotes.length, 'total notes');
        console.log('🚀 New note in state:', updatedNotes.find(n => n._id === newNote._id));
        return updatedNotes;
      });
      
      return newNote;
    } catch (err) {
      console.error('❌ Error creating note:', err);
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
        prev.map((note) => {
          const id = note._id || note.id;
          return id === noteId ? response.data.note : note;
        })
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

  // Permanently delete note from trash
  const permanentlyDeleteNote = async (noteId) => {
    try {
      await trashAPI.permanentlyDeleteNote(noteId);
      setTrashedNotes((prev) => prev.filter((note) => note._id !== noteId));
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

  // Reorder notes
  const reorderNotes = async (
    updatedCurrentNotes,
    draggedNote,
    page,
    hoverIndex,
    saveToBackend = true
  ) => {
    try {
      const currentFolder = getCurrentFolderFromURL();
      const folderId =
        page === 'folder' && currentFolder ? currentFolder._id : null;

      // Always update the local state immediately for visual feedback
      if (page === 'folder' && currentFolder) {
        const folderNotes = updatedCurrentNotes.map((note, idx) => ({ ...note, order: idx }));
        const otherNotes = notes.filter((note) => note.folderId !== currentFolder._id);
        setNotes([...otherNotes, ...folderNotes]);
      } else if (page === 'notes') {
        const mainNotes = updatedCurrentNotes.map((note, idx) => ({ ...note, order: idx }));
        const folderNotes = notes.filter((note) => note.folderId !== null);
        setNotes([...mainNotes, ...folderNotes]);
      }

      // Only save to backend if requested (on drag end, not during drag)
      if (saveToBackend) {
        const noteOrders = updatedCurrentNotes.map((note, index) => ({
          noteId: note._id,
          order: index,
        }));

        await notesAPI.reorderNotes(noteOrders, folderId);
      }
    } catch (err) {
      setError(err.message);
      if (saveToBackend) {
        throw err;
      }
    }
  };

  // Create new folder - RETURN the created folder
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

  // Update folder
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

  // Delete folder
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
    getCurrentFolderFromURL
  };
};