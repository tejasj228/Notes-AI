import { useState } from 'react';
import { DEFAULT_NOTES, DEFAULT_FOLDERS, PAGES } from '../utils/constants';
import { getRandomSize } from '../utils/helpers';
import { useParams, useLocation } from 'react-router-dom';

export const useNotesData = () => {
  // State
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Get URL parameters and location
  const { noteId, folderId } = useParams();
  const location = useLocation();

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
      return folders.find(f => f.id.toString() === folderId || 
                              f.name.toLowerCase().replace(/\s+/g, '-') === folderId);
    }
    return null;
  };

  // Get current notes based on page and folder
  const getCurrentNotes = () => {
    const currentPage = getCurrentPageFromURL();
    const currentFolder = getCurrentFolderFromURL();
    
    if (currentPage === 'trash') {
      return trashedNotes;
    } else if (currentPage === 'folder' && currentFolder) {
      return notes.filter(note => note.folderId === currentFolder.id);
    } else {
      return notes.filter(note => note.folderId === null);
    }
  };

  // Create new note - RETURN the created note
  const createNote = (noteData) => {
    const currentPage = getCurrentPageFromURL();
    const currentFolder = getCurrentFolderFromURL();
    const folderId = currentPage === 'folder' && currentFolder ? currentFolder.id : null;
    
    const newNote = {
      id: Date.now(),
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      keywords: noteData.keywords || [],
      color: noteData.color,
      size: getRandomSize(),
      order: 0,
      images: [],
      folderId
    };

    // Update order for notes in the same context (folder or main)
    const updatedNotes = [newNote, ...notes].map((note, index) => {
      if (note.folderId === folderId) {
        return { ...note, order: index };
      }
      return note;
    });

    setNotes(updatedNotes);
    return newNote; // Return the created note
  };

  // Update note
  const updateNote = (noteId, field, value) => {
    const currentPage = getCurrentPageFromURL();
    if (currentPage !== 'trash') {
      setNotes(notes.map(note => 
        note.id === noteId ? { ...note, [field]: value } : note
      ));
    }
  };

  // Delete note (move to trash)
  const deleteNote = (noteId) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteId));
      setTrashedNotes([...trashedNotes, { ...noteToDelete, trashedAt: new Date() }]);
    }
  };

  // Permanently delete note from trash
  const permanentlyDeleteNote = (noteId) => {
    setTrashedNotes(trashedNotes.filter(note => note.id !== noteId));
  };

  // Restore note from trash
  const restoreNote = (noteId) => {
    const noteToRestore = trashedNotes.find(note => note.id === noteId);
    if (noteToRestore) {
      const { trashedAt, ...restoredNote } = noteToRestore;
      setTrashedNotes(trashedNotes.filter(note => note.id !== noteId));

      const updatedNotes = [{ ...restoredNote, order: -1 }, ...notes].map((note, index) => ({
        ...note,
        order: index
      }));

      setNotes(updatedNotes);
    }
  };

  // Reorder notes - EXACT logic from working oldcode.jsx
  const reorderNotes = (updatedCurrentNotes, draggedNote, page, hoverIndex) => {
    const currentFolder = getCurrentFolderFromURL();
    
    // Reorder within the current context (folder or main)
    const reorderedNotes = updatedCurrentNotes.map((note, index) => ({
      ...note,
      order: index
    }));

    // Update the main notes array - EXACT logic from oldcode.jsx
    if (page === 'folder' && currentFolder) {
      const otherNotes = notes.filter(note => note.folderId !== currentFolder.id);
      setNotes([...otherNotes, ...reorderedNotes]);
    } else if (page === 'notes') {
      const folderNotes = notes.filter(note => note.folderId !== null);
      setNotes([...reorderedNotes, ...folderNotes]);
    }
  };

  // Create new folder - RETURN the created folder
  const createFolder = (folderData) => {
    const newFolder = {
      id: Date.now(),
      name: folderData.name.trim(),
      color: folderData.color,
      createdAt: new Date()
    };

    setFolders([...folders, newFolder]);
    return newFolder; // Return the created folder
  };

  // Update folder
  const updateFolder = (folderId, updates) => {
    setFolders(folders.map(f =>
      f.id === folderId ? { ...f, ...updates } : f
    ));
  };

  // Delete folder
  const deleteFolder = (folderId) => {
    setFolders(folders.filter(f => f.id !== folderId));
  };

  return {
    // State
    notes,
    folders,
    trashedNotes,
    searchTerm,
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