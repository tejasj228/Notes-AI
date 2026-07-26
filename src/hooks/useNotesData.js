'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { notesAPI } from '@/api/notes';
import { foldersAPI } from '@/api/folders';
import { trashAPI } from '@/api/trash';

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useParams();
  const folderId = params?.folderId;
  const pathname = usePathname() || '';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    // Load independently so a single slow/cold request (e.g. trash) doesn't
    // blank the whole app. Only the notes fetch is treated as fatal.
    const [notesRes, foldersRes, trashRes] = await Promise.allSettled([
      notesAPI.getAllNotes(),
      foldersAPI.getAllFolders({ includeNotesCount: true }),
      trashAPI.getTrash(),
    ]);

    if (notesRes.status === 'fulfilled') {
      setNotes(notesRes.value.data.notes);
    } else {
      console.error('Error loading notes:', notesRes.reason);
      setError(notesRes.reason?.message || 'Failed to load notes');
    }

    if (foldersRes.status === 'fulfilled') setFolders(foldersRes.value.data.folders);
    else console.error('Error loading folders:', foldersRes.reason);

    if (trashRes.status === 'fulfilled') setTrashedNotes(trashRes.value.data.notes);
    else console.error('Error loading trash:', trashRes.reason);

    setLoading(false);
  };

  const getCurrentPageFromURL = () => {
    if (pathname.startsWith('/ai-chat/')) return 'ai-chat';
    if (pathname.startsWith('/trash')) return 'trash';
    if (pathname.startsWith('/folder/')) return 'folder';
    return 'notes';
  };

  const getCurrentFolderFromURL = () => {
    if (folderId) {
      return folders.find((f) => {
        const fId = f._id || f.id;
        const matchById = fId && fId.toString() === folderId;
        const matchBySlug =
          f.name && f.name.toLowerCase().replace(/\s+/g, '-') === folderId;
        return matchById || matchBySlug;
      });
    }
    return null;
  };

  const getCurrentNotes = () => {
    const currentPage = getCurrentPageFromURL();
    const currentFolder = getCurrentFolderFromURL();

    if (currentPage === 'trash') {
      return trashedNotes;
    } else if (currentPage === 'folder' && currentFolder) {
      const targetFolderId = currentFolder._id || currentFolder.id;
      const targetIdStr = targetFolderId ? targetFolderId.toString() : null;

      return notes.filter((note) => {
        const noteFolderId = note.folderId;
        let noteIdStr = null;
        if (noteFolderId) {
          if (typeof noteFolderId === 'object' && noteFolderId._id) {
            noteIdStr = noteFolderId._id.toString();
          } else if (typeof noteFolderId === 'string') {
            noteIdStr = noteFolderId;
          } else {
            noteIdStr = noteFolderId.toString();
          }
        }
        return noteIdStr === targetIdStr;
      });
    }
    return notes.filter((note) => note.folderId === null);
  };

  const createNote = async (noteData) => {
    try {
      const currentPage = getCurrentPageFromURL();
      const currentFolder = getCurrentFolderFromURL();
      const targetFolderId =
        currentPage === 'folder' && currentFolder
          ? currentFolder._id || currentFolder.id
          : null;

      const response = await notesAPI.createNote({
        ...noteData,
        folderId: targetFolderId,
      });
      const newNote = response.data.note;
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

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

  const deleteNote = async (noteId) => {
    try {
      await notesAPI.deleteNote(noteId);
      const idStr = (noteId || '').toString();
      const noteToDelete = notes.find((note) => (note._id || note.id)?.toString() === idStr);
      setNotes((prev) => prev.filter((note) => (note._id || note.id)?.toString() !== idStr));
      if (noteToDelete) {
        setTrashedNotes((prev) => [
          { ...noteToDelete, trashedAt: new Date(), deletedAt: new Date() },
          ...prev,
        ]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const permanentlyDeleteNote = async (noteId) => {
    try {
      await trashAPI.permanentlyDeleteNote(noteId);
      setTrashedNotes((prev) => prev.filter((note) => note._id !== noteId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

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

  const reorderNotes = async (
    updatedCurrentNotes,
    draggedNote,
    page,
    hoverIndex,
    saveToBackend = true
  ) => {
    try {
      const currentFolder = getCurrentFolderFromURL();
      const targetFolderId =
        page === 'folder' && currentFolder ? currentFolder._id : null;

      if (page === 'folder' && currentFolder) {
        const folderNotes = updatedCurrentNotes.map((note, idx) => ({ ...note, order: idx }));
        const otherNotes = notes.filter((note) => note.folderId !== currentFolder._id);
        setNotes([...otherNotes, ...folderNotes]);
      } else if (page === 'notes') {
        const mainNotes = updatedCurrentNotes.map((note, idx) => ({ ...note, order: idx }));
        const folderNotes = notes.filter((note) => note.folderId !== null);
        setNotes([...mainNotes, ...folderNotes]);
      }

      if (saveToBackend) {
        const noteOrders = updatedCurrentNotes.map((note, index) => ({
          noteId: note._id,
          order: index,
        }));
        await notesAPI.reorderNotes(noteOrders, targetFolderId);
      }
    } catch (err) {
      setError(err.message);
      if (saveToBackend) throw err;
    }
  };

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

  const updateFolder = async (id, updates) => {
    try {
      const response = await foldersAPI.updateFolder(id, updates);
      setFolders((prev) =>
        prev.map((f) => {
          const fid = f._id || f.id;
          return fid && fid.toString() === (id || '').toString() ? response.data.folder : f;
        })
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteFolder = async (id) => {
    try {
      await foldersAPI.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f._id !== id));
      setNotes((prev) =>
        prev.map((note) => (note.folderId === id ? { ...note, folderId: null } : note))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    notes,
    folders,
    trashedNotes,
    searchTerm,
    loading,
    error,
    setSearchTerm,
    createNote,
    updateNote,
    deleteNote,
    permanentlyDeleteNote,
    restoreNote,
    reorderNotes,
    getCurrentNotes,
    createFolder,
    updateFolder,
    deleteFolder,
    getCurrentPageFromURL,
    getCurrentFolderFromURL,
  };
};
