import { useState } from 'react';
import { DEFAULT_NOTES, DEFAULT_FOLDERS, PAGES } from '../utils/constants';
import { getRandomSize } from '../utils/helpers';

export const useNotesData = () => {
  // State
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(PAGES.NOTES);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get current notes based on page and folder
  const getCurrentNotes = () => {
    if (currentPage === PAGES.TRASH) {
      return trashedNotes;
    } else if (currentPage === PAGES.FOLDER && currentFolder) {
      return notes.filter(note => note.folderId === currentFolder.id);
    } else {
      return notes.filter(note => note.folderId === null);
    }
  };

  // Create new note
  const createNote = (noteData) => {
    const folderId = currentPage === PAGES.FOLDER && currentFolder ? currentFolder.id : null;
    
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
    return newNote;
  };

  // Update note
  const updateNote = (noteId, field, value) => {
    if (currentPage !== PAGES.TRASH) {
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

  // Create new folder
  const createFolder = (folderData) => {
    const newFolder = {
      id: Date.now(),
      name: folderData.name.trim(),
      color: folderData.color,
      createdAt: new Date()
    };

    setFolders([...folders, newFolder]);
    return newFolder;
  };

  // Update folder
  const updateFolder = (folderId, updates) => {
    setFolders(folders.map(f =>
      f.id === folderId ? { ...f, ...updates } : f
    ));
    
    // Update current folder if it's the one being edited
    if (currentFolder?.id === folderId) {
      setCurrentFolder({ ...currentFolder, ...updates });
    }
  };

  // Delete folder
  const deleteFolder = (folderId) => {
    setFolders(folders.filter(f => f.id !== folderId));
    
    // If we're currently viewing this folder, go back to notes
    if (currentFolder?.id === folderId) {
      setCurrentPage(PAGES.NOTES);
      setCurrentFolder(null);
    }
  };

  // Navigation functions
  const switchToNotes = () => {
    setCurrentPage(PAGES.NOTES);
    setCurrentFolder(null);
    setSearchTerm('');
  };

  const switchToTrash = () => {
    setCurrentPage(PAGES.TRASH);
    setCurrentFolder(null);
    setSearchTerm('');
  };

  const openFolder = (folder) => {
    setCurrentPage(PAGES.FOLDER);
    setCurrentFolder(folder);
    setSearchTerm('');
  };

  const goBackToNotes = () => {
    setCurrentPage(PAGES.NOTES);
    setCurrentFolder(null);
    setSearchTerm('');
  };

  // Helper functions
  const getPageTitle = () => {
    if (currentPage === PAGES.TRASH) return 'Trash';
    if (currentPage === PAGES.FOLDER && currentFolder) return currentFolder.name;
    return 'Notes';
  };

  const getSearchPlaceholder = () => {
    if (currentPage === PAGES.TRASH) return 'Search trash...';
    if (currentPage === PAGES.FOLDER && currentFolder) return `Search in ${currentFolder.name}...`;
    return 'Search notes...';
  };

  return {
    // State
    notes,
    folders,
    trashedNotes,
    currentPage,
    currentFolder,
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
    
    // Navigation
    switchToNotes,
    switchToTrash,
    openFolder,
    goBackToNotes,
    
    // Helpers
    getPageTitle,
    getSearchPlaceholder
  };
};