import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import Sidebar from './components/Sidebar';
import NotesGrid from './components/NotesGrid';
import AIChatPage from './components/AIChatPage';
import { NewNoteModal, EditNoteModal, ImagePopup } from './components/NoteModals';
import { NewFolderModal, RenameFolderModal } from './components/FolderModals';
import { useNotesData } from './hooks/useNotesData';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { getRandomColor, getRandomSize } from './utils/helpers';

const NotesApp = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId, folderId } = useParams();

  // Custom hooks for data management
  const {
    notes,
    folders,
    trashedNotes,
    searchTerm,
    setSearchTerm,
    createNote,
    updateNote,
    deleteNote,
    permanentlyDeleteNote,
    restoreNote,
    reorderNotes,
    createFolder,
    updateFolder,
    deleteFolder
  } = useNotesData();

  // Determine current page and folder from URL
  const getCurrentPageFromURL = () => {
    const path = location.pathname;
    if (path.startsWith('/ai-chat/')) return 'ai-chat';
    if (path.startsWith('/trash')) return 'trash';
    if (path.startsWith('/folder/')) return 'folder';
    return 'notes';
  };

  const getCurrentFolderFromURL = () => {
    if (folderId) {
      return folders.find(f => f.id.toString() === folderId || 
                              f.name.toLowerCase().replace(/\s+/g, '-') === folderId);
    }
    return null;
  };

  const getCurrentNotesForPage = () => {
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

  // Get current note for AI chat or edit modal
  const getCurrentNoteFromURL = () => {
    if (noteId) {
      const allNotes = [...notes, ...trashedNotes];
      return allNotes.find(note => 
        note.id.toString() === noteId || 
        note.title.toLowerCase().replace(/\s+/g, '-') === noteId
      );
    }
    return null;
  };

  // Drag and drop functionality
  const currentPage = getCurrentPageFromURL();
  const currentFolder = getCurrentFolderFromURL();
  const dragHandlers = useDragAndDrop(currentPage, getCurrentNotesForPage, reorderNotes);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // MODAL STATE - These don't affect URL
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
  
  // EDIT NOTE MODAL STATE - Separate from URL, just a popup
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Draft states
  const [newNoteDraft, setNewNoteDraft] = useState({
    title: '',
    content: '',
    keywords: '',
    color: 'purple',
    size: 'medium'
  });
  
  const [newFolderDraft, setNewFolderDraft] = useState({
    name: '',
    color: 'purple'
  });
  
  const [renameFolderDraft, setRenameFolderDraft] = useState({
    id: null,
    name: '',
    color: ''
  });

  // Handle image clicks in content editors
  useEffect(() => {
    function handleImageClick(e) {
      if (e.target.tagName === 'IMG') {
        setImagePopup({ open: true, src: e.target.src });
      }
    }

    const editors = document.querySelectorAll('.note-content-editable');
    editors.forEach(editor => {
      if (editor) {
        editor.addEventListener('click', handleImageClick);
      }
    });

    return () => {
      editors.forEach(editor => {
        if (editor && editor.removeEventListener) {
          editor.removeEventListener('click', handleImageClick);
        }
      });
    };
  }, [showNewNotePopup, selectedNote]);

  // Navigation functions with routing
  const switchToNotes = () => {
    navigate('/notes');
    setSearchTerm('');
  };

  const switchToTrash = () => {
    navigate('/trash');
    setSearchTerm('');
  };

  const openFolder = (folder) => {
    const folderSlug = folder.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/folder/${folderSlug}`);
    setSearchTerm('');
  };

  // FIXED: openNote - Just open modal, don't change URL
  const openNote = (note) => {
    setSelectedNote(note);
  };

  // FIXED: closeNotePopup - Just close modal, don't change URL
  const closeNotePopup = () => {
    setSelectedNote(null);
  };

  // NAVIGATION: handleOpenWithAI - Changes URL
  const handleOpenWithAI = (note) => {
    const noteSlug = note.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/ai-chat/${noteSlug}`);
  };

  // NAVIGATION: handleBackFromAI - Browser back
  const handleBackFromAI = () => {
    // Reset all modal states when navigating back from AI chat
    setSelectedNote(null);
    setShowNewNotePopup(false);
    setShowNewFolderPopup(false);
    setShowRenameFolder(false);
    setImagePopup({ open: false, src: '' });
    
    navigate(-1); // Use browser back
  };

  // MODAL: Note operations - Don't change URL
  const openNewNotePopup = () => {
    setNewNoteDraft({
      title: '',
      content: '',
      keywords: '',
      color: getRandomColor(),
      size: getRandomSize()
    });
    setShowNewNotePopup(true);
  };

  const saveNewNote = () => {
    let keywordsArray = [];
    
    if (typeof newNoteDraft.keywords === 'string') {
      keywordsArray = newNoteDraft.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
        .slice(0, 3);
    } else if (Array.isArray(newNoteDraft.keywords)) {
      keywordsArray = newNoteDraft.keywords.slice(0, 3);
    }

    const newNote = createNote({
      title: newNoteDraft.title || 'Untitled Note',
      content: newNoteDraft.content || '',
      keywords: keywordsArray,
      color: newNoteDraft.color || 'purple'
    });
    
    setShowNewNotePopup(false);
    // Don't navigate after creating note, stay on same page
  };

  const handleDeleteNote = (noteId) => {
    deleteNote(noteId);
    setSelectedNote(null); // Just close modal
  };

  // MODAL: Folder operations - Don't change URL unless specified
  const openNewFolderPopup = () => {
    setNewFolderDraft({
      name: '',
      color: getRandomColor()
    });
    setShowNewFolderPopup(true);
  };

  const saveNewFolder = () => {
    if (!newFolderDraft.name || !newFolderDraft.name.trim()) return;
    const newFolder = createFolder(newFolderDraft);
    setShowNewFolderPopup(false);
    // Don't auto-navigate to new folder, let user decide
  };

  const handleRenameFolder = (folder) => {
    setRenameFolderDraft({ 
      id: folder.id, 
      name: folder.name, 
      color: folder.color 
    });
    setShowRenameFolder(true);
  };

  const saveRenameFolder = () => {
    if (!renameFolderDraft.name || !renameFolderDraft.name.trim()) return;
    updateFolder(renameFolderDraft.id, {
      name: renameFolderDraft.name,
      color: renameFolderDraft.color
    });
    setShowRenameFolder(false);
    
    // Update URL if we're currently in this folder
    if (currentFolder && currentFolder.id === renameFolderDraft.id) {
      const newFolderSlug = renameFolderDraft.name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/folder/${newFolderSlug}`);
    }
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolder(folderId);
    // If we're currently viewing this folder, navigate to notes
    if (currentFolder && currentFolder.id === folderId) {
      navigate('/notes');
    }
  };

  // Helper functions
  const getPageTitle = () => {
    const currentPage = getCurrentPageFromURL();
    if (currentPage === 'trash') return 'Trash';
    if (currentPage === 'folder' && currentFolder) return currentFolder.name;
    return 'Notes';
  };

  const getSearchPlaceholder = () => {
    const currentPage = getCurrentPageFromURL();
    if (currentPage === 'trash') return 'Search trash...';
    if (currentPage === 'folder' && currentFolder) return `Search in ${currentFolder.name}...`;
    return 'Search notes...';
  };

  // Get current note for AI chat only (not for edit modal)
  const aiChatNote = getCurrentNoteFromURL();
  const isAIChatPage = getCurrentPageFromURL() === 'ai-chat';

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* Global Styles */}
      <style>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: #606060 #2a2a2a;
        }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
        *::-webkit-scrollbar-thumb { background: #606060; border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: #707070; }

        .note-content-editable:empty:before {
          content: attr(data-placeholder);
          color: #888;
          pointer-events: none;
          position: absolute;
          left: 16px;
          top: 16px;
          font-size: 14px;
          font-style: italic;
        }

        .note-content-editable ul,
        .note-content-editable ol {
          margin-left: 0;
          padding-left: 2.2em;
          list-style-position: outside;
        }
        .note-content-editable li {
          margin-bottom: 0.5em;
          color: #cccccc;
          font-size: 1em;
          line-height: 1.8;
          padding-left: 0.2em;
          text-indent: 0;
        }

        .note-content-editable img {
          max-width: 98% !important;
          max-height: 320px !important;
          display: block;
          margin: 18px auto;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
          cursor: pointer;
          transition: box-shadow 0.18s;
        }
        .note-content-editable img:hover {
          box-shadow: 0 4px 24px rgba(139,92,246,0.25);
        }
      `}</style>

      {/* Conditional Rendering */}
      {isAIChatPage ? (
        <AIChatPage
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          folders={folders}
          user={user}
          onSwitchToNotes={switchToNotes}
          onSwitchToTrash={switchToTrash}
          onOpenFolder={openFolder}
          onAddFolder={openNewFolderPopup}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onLogout={onLogout}
          selectedNote={aiChatNote}
          onUpdateNote={updateNote}
          onBackToNotes={handleBackFromAI}
        />
      ) : (
        <>
          {/* TopNavigation - Only show on desktop */}
          <div className="hidden md:block">
            <TopNavigation
              currentPage={currentPage}
              currentFolder={currentFolder}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddNote={openNewNotePopup}
              onGoBack={() => navigate(-1)}
              getSearchPlaceholder={getSearchPlaceholder}
            />
          </div>

          {/* Mobile Search Bar with Hamburger - Only show when sidebar is closed */}
          <div className={`md:hidden fixed top-3 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-sm ${sidebarOpen ? 'hidden' : 'block'}`}>
            <div className="relative">
              {/* Hamburger Button - Inside search bar */}
              <button
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200 z-20"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              
              {/* Search Icon */}
              <Search className="absolute left-12 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
              
              {/* Search Input */}
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                className="w-full border rounded-full py-2.5 pl-20 pr-4 text-gray-200 text-sm outline-none transition-all duration-300 placeholder-gray-400"
                style={{
                  background: 'rgba(60, 60, 60, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            currentFolder={currentFolder}
            folders={folders}
            user={user}
            onSwitchToNotes={switchToNotes}
            onSwitchToTrash={switchToTrash}
            onOpenFolder={openFolder}
            onAddFolder={openNewFolderPopup}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onLogout={onLogout}
          />

          <div 
            className={`transition-all duration-300 min-h-screen px-4 md:px-10 pb-10 ${
              sidebarOpen ? 'md:ml-64' : 'md:ml-18'
            } ml-0`}
            style={{ 
              paddingTop: window.innerWidth <= 768 ? (sidebarOpen ? '20px' : '70px') : '100px'
            }}
          >
            <NotesGrid
              currentPage={currentPage}
              currentFolder={currentFolder}
              notes={getCurrentNotesForPage()}
              searchTerm={searchTerm}
              onOpenNote={openNote}
              onAddNote={openNewNotePopup}
              onRestoreNote={restoreNote}
              onPermanentDeleteNote={permanentlyDeleteNote}
              dragHandlers={dragHandlers}
            />
          </div>
        </>
      )}

      {/* Mobile Floating Add Button */}
      {!isAIChatPage && !showNewNotePopup && !selectedNote && !showNewFolderPopup && !showRenameFolder && !imagePopup.open && (
        <button
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 z-50"
          style={{ background: '#7c3aed' }}
          onClick={openNewNotePopup}
          onMouseEnter={e => e.target.style.background = '#6d28d9'}
          onMouseLeave={e => e.target.style.background = '#7c3aed'}
        >
          <Plus size={24} />
        </button>
      )}

      {/* MODALS - These don't change URL */}
      {!isAIChatPage && (
        <>
          {/* New Note Modal - No URL change */}
          {showNewNotePopup && (
            <NewNoteModal
              show={showNewNotePopup}
              noteDraft={newNoteDraft}
              setNoteDraft={setNewNoteDraft}
              onSave={saveNewNote}
              onClose={() => setShowNewNotePopup(false)}
            />
          )}

          {/* Edit Note Modal - Just a popup, no URL change */}
          {selectedNote && (
            <EditNoteModal
              show={!!selectedNote}
              note={selectedNote}
              onUpdate={updateNote}
              onDelete={handleDeleteNote}
              onOpenWithAI={handleOpenWithAI}
              onClose={closeNotePopup}
            />
          )}

          {/* Folder Modals - No URL change */}
          {showNewFolderPopup && (
            <NewFolderModal
              show={showNewFolderPopup}
              folderDraft={newFolderDraft}
              setFolderDraft={setNewFolderDraft}
              onSave={saveNewFolder}
              onClose={() => setShowNewFolderPopup(false)}
            />
          )}

          {showRenameFolder && (
            <RenameFolderModal
              show={showRenameFolder}
              folderDraft={renameFolderDraft}
              setFolderDraft={setRenameFolderDraft}
              onSave={saveRenameFolder}
              onClose={() => setShowRenameFolder(false)}
            />
          )}

          {/* Image Popup - No URL change */}
          {imagePopup.open && (
            <ImagePopup
              show={imagePopup.open}
              imageSrc={imagePopup.src}
              onClose={() => setImagePopup({ open: false, src: '' })}
            />
          )}
        </>
      )}
    </div>
  );
};

export default NotesApp;