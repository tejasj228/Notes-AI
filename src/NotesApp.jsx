import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import Sidebar from './components/Sidebar';
import NotesGrid from './components/NotesGrid';
import AIChatPage from './components/AIChatPage';
import NotificationSystem from './components/NotificationSystem';
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
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getCurrentNotes,
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
      const foundFolder = folders.find(f => {
        const fId = f._id || f.id;
        const matchesId = (fId && fId.toString() === folderId);
        const matchesSlug = (f.name && f.name.toLowerCase().replace(/\s+/g, '-') === folderId);
        return matchesId || matchesSlug;
      });
      
      console.log('getCurrentFolderFromURL:');
      console.log('- folderId from URL:', folderId);
      console.log('- all folders:', folders.map(f => ({ name: f.name, _id: f._id, id: f.id })));
      console.log('- found folder:', foundFolder);
      
      return foundFolder;
    }
    return null;
  };

  // Get current note for AI chat or edit modal
  const getCurrentNoteFromURL = () => {
    if (noteId) {
      const allNotes = [...notes, ...trashedNotes];
      return allNotes.find(note => {
        if (!note) return false;
        
        const noteIdStr = (note._id || note.id);
        const noteTitleSlug = note.title ? note.title.toLowerCase().replace(/\s+/g, '-') : '';
        
        return (noteIdStr && noteIdStr.toString() === noteId) || 
               (noteTitleSlug && noteTitleSlug === noteId);
      });
    }
    return null;
  };

  // Enhanced updateNote with notifications
  const handleUpdateNote = async (noteId, field, value) => {
    setLoading('updatingNote', true);
    
    // Find the note being updated for notification
    const noteToUpdate = notes.find(note => (note._id || note.id) === noteId);
    
    try {
      await updateNote(noteId, field, value);
      
      addNotification({
        type: 'success',
        title: 'Note Updated',
        message: noteToUpdate ? `"${noteToUpdate.title}" has been updated` : 'Note has been updated successfully',
        duration: 2500
      });
    } catch (error) {
      console.error('❌ Error updating note:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Update Note',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('updatingNote', false);
    }
  };

  // Enhanced restoreNote with notifications
  const handleRestoreNote = async (noteId) => {
    setLoading('restoringNote', true);
    
    // Find the note being restored for notification
    const noteToRestore = trashedNotes.find(note => (note._id || note.id) === noteId);
    
    try {
      await restoreNote(noteId);
      
      addNotification({
        type: 'success',
        title: 'Note Restored',
        message: noteToRestore ? `"${noteToRestore.title}" has been restored` : 'Note has been restored successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error restoring note:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Restore Note',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('restoringNote', false);
    }
  };

  // Enhanced permanentlyDeleteNote with notifications
  const handlePermanentDeleteNote = async (noteId) => {
    setLoading('permanentDeletingNote', true);
    
    // Find the note being permanently deleted for notification
    const noteToDelete = trashedNotes.find(note => (note._id || note.id) === noteId);
    
    try {
      await permanentlyDeleteNote(noteId);
      
      addNotification({
        type: 'delete',
        title: 'Note Permanently Deleted',
        message: noteToDelete ? `"${noteToDelete.title}" has been permanently deleted` : 'Note has been permanently deleted',
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error permanently deleting note:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Delete Note',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('permanentDeletingNote', false);
    }
  };

  // Drag and drop functionality
  const currentPage = getCurrentPageFromURL();
  const currentFolder = getCurrentFolderFromURL();
  const dragHandlers = useDragAndDrop(currentPage, getCurrentNotes, reorderNotes);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    creatingNote: false,
    updatingNote: false,
    deletingNote: false,
    restoringNote: false,
    permanentDeletingNote: false,
    creatingFolder: false,
    updatingFolder: false,
    deletingFolder: false
  });
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  
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

  // Notification helpers
  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, ...notification }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const setLoading = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

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
    console.log('openNewNotePopup called');
    setNewNoteDraft({
      title: '',
      content: '',
      keywords: '',
      color: getRandomColor(),
      size: getRandomSize()
    });
    setShowNewNotePopup(true);
  };

  const saveNewNote = async () => {
    console.log('💾 saveNewNote called');
    console.log('💾 Current page:', getCurrentPageFromURL());
    console.log('💾 Current folder:', getCurrentFolderFromURL());
    console.log('💾 Current URL:', location.pathname);
    console.log('💾 URL params - folderId:', folderId);
    
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

    const noteDataToCreate = {
      title: newNoteDraft.title || 'Untitled Note',
      content: newNoteDraft.content || '',
      keywords: keywordsArray,
      color: newNoteDraft.color || 'purple'
    };
    
    console.log('💾 Note data to create:', noteDataToCreate);

    setLoading('creatingNote', true);
    try {
      const newNote = await createNote(noteDataToCreate);
      
      console.log('💾 Note created successfully:', newNote);
      setShowNewNotePopup(false);
      
      addNotification({
        type: 'success',
        title: 'Note Created',
        message: `"${newNote.title}" has been created successfully`,
        duration: 3000
      });
      
      // Refresh the current notes view to see the new note
      console.log('💾 Current notes after creation:', getCurrentNotes());
    } catch (error) {
      console.error('❌ Error creating note:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Create Note',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('creatingNote', false);
    }
  };

  const handleDeleteNote = (noteId) => {
    setLoading('deletingNote', true);
    
    // Find the note being deleted for notification
    const noteToDelete = notes.find(note => (note._id || note.id) === noteId);
    
    deleteNote(noteId)
      .then(() => {
        addNotification({
          type: 'delete',
          title: 'Note Moved to Trash',
          message: noteToDelete ? `"${noteToDelete.title}" has been moved to trash` : 'Note has been moved to trash',
          duration: 3000
        });
        setSelectedNote(null); // Just close modal
      })
      .catch((error) => {
        console.error('❌ Error deleting note:', error);
        addNotification({
          type: 'error',
          title: 'Failed to Delete Note',
          message: 'Please try again',
          duration: 4000
        });
      })
      .finally(() => {
        setLoading('deletingNote', false);
      });
  };

  // Handle drag note to trash from sidebar
  const handleDragNoteToTrash = async (noteId) => {
    setLoading('deletingNote', true);
    
    // Find the note being deleted for notification
    const noteToDelete = notes.find(note => (note._id || note.id) === noteId);
    
    try {
      await deleteNote(noteId);
      addNotification({
        type: 'delete',
        title: 'Note Moved to Trash',
        message: noteToDelete ? `"${noteToDelete.title}" has been moved to trash` : 'Note has been moved to trash',
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Delete Note',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('deletingNote', false);
    }
  };

  // MODAL: Folder operations - Don't change URL unless specified
  const openNewFolderPopup = () => {
    setNewFolderDraft({
      name: '',
      color: getRandomColor()
    });
    setShowNewFolderPopup(true);
  };

  const saveNewFolder = async () => {
    if (!newFolderDraft.name || !newFolderDraft.name.trim()) return;
    
    setLoading('creatingFolder', true);
    try {
      const newFolder = await createFolder(newFolderDraft);
      setShowNewFolderPopup(false);
      
      addNotification({
        type: 'success',
        title: 'Folder Created',
        message: `"${newFolder.name}" has been created successfully`,
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Create Folder',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('creatingFolder', false);
    }
  };

  const handleRenameFolder = (folder) => {
    const resolvedId = folder._id || folder.id;
    setRenameFolderDraft({ 
      id: resolvedId, 
      name: folder.name, 
      color: folder.color 
    });
    setShowRenameFolder(true);
  };

  const saveRenameFolder = async () => {
    if (!renameFolderDraft.name || !renameFolderDraft.name.trim()) return;
    
    setLoading('updatingFolder', true);
    try {
      await updateFolder(renameFolderDraft.id, {
        name: renameFolderDraft.name,
        color: renameFolderDraft.color
      });
      setShowRenameFolder(false);
      
      addNotification({
        type: 'success',
        title: 'Folder Updated',
        message: `Folder has been updated successfully`,
        duration: 3000
      });
      
      // Update URL if we're currently in this folder
      if (
        currentFolder &&
        ((currentFolder._id || currentFolder.id)?.toString() === (renameFolderDraft.id || '').toString())
      ) {
        const newFolderSlug = renameFolderDraft.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/folder/${newFolderSlug}`);
      }
    } catch (error) {
      console.error('❌ Error updating folder:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Update Folder',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('updatingFolder', false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    console.log('handleDeleteFolder called with folderId:', folderId);
    
    setLoading('deletingFolder', true);
    
    // Find the folder being deleted for notification
    const folderToDelete = folders.find(folder => (folder._id || folder.id) === folderId);
    
    try {
      await deleteFolder(folderId);
      
      addNotification({
        type: 'delete',
        title: 'Folder Deleted',
        message: folderToDelete ? `"${folderToDelete.name}" has been deleted` : 'Folder has been deleted',
        duration: 3000
      });
      
      // If we're currently viewing this folder, navigate to notes
      if (currentFolder && (currentFolder._id === folderId || currentFolder.id === folderId)) {
        navigate('/notes');
      }
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Delete Folder',
        message: 'Please try again',
        duration: 4000
      });
    } finally {
      setLoading('deletingFolder', false);
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
    <div style={{ 
      background: '#1a1a1a',
      minHeight: '100vh',
      minHeight: '100dvh' // Dynamic viewport height for mobile
    }}>
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
            <div 
              className="relative border rounded-xl px-3 py-3 flex items-center gap-3"
              style={{ 
                background: 'rgba(40, 40, 40, 0.9)', 
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Hamburger Button - Separate from search */}
              <button
                className="text-gray-400 hover:text-gray-200 transition-colors duration-200 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              
              {/* Search Input Container */}
              <div className="relative flex items-center flex-1">
                <Search className="absolute left-3 text-gray-400 z-10" size={18} />
                
                {/* Search Input */}
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  className="w-full border rounded-xl py-2 pl-10 pr-3 text-gray-200 text-sm outline-none transition-all duration-300 placeholder-gray-400"
                  style={{
                    background: 'rgba(60, 60, 60, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={e => {
                    e.target.style.background = 'rgba(70, 70, 70, 0.9)';
                    e.target.style.borderColor = '#8b5cf6';
                  }}
                  onBlur={e => {
                    e.target.style.background = 'rgba(60, 60, 60, 0.8)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
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
              onDragNoteToTrash={handleDragNoteToTrash}
            />          <div 
            className={`transition-all duration-300 px-4 md:px-10 pb-10 ${
              sidebarOpen ? 'md:ml-64' : 'md:ml-18'
            } ml-0`}
            style={{ 
              paddingTop: window.innerWidth <= 768 ? (sidebarOpen ? '20px' : '80px') : '120px',
              minHeight: '100vh',
              minHeight: '100dvh' // Dynamic viewport height for mobile
            }}
          >
            {loading ? (
              // Loading Spinner
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-gray-400 text-lg">Loading your notes...</p>
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <p className="text-red-400 text-lg mb-2">Failed to load notes</p>
                  <p className="text-gray-500 text-sm">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              // Notes Grid
              <NotesGrid
                currentPage={currentPage}
                currentFolder={currentFolder}
                notes={getCurrentNotes()}
                searchTerm={searchTerm}
                onOpenNote={openNote}
                onAddNote={openNewNotePopup}
                onRestoreNote={handleRestoreNote}
                onPermanentDeleteNote={handlePermanentDeleteNote}
                dragHandlers={dragHandlers}
                loadingStates={loadingStates}
              />
            )}
          </div>
        </>
      )}

      {/* Mobile Floating Add Button */}
      {!isAIChatPage && !showNewNotePopup && !selectedNote && !showNewFolderPopup && !showRenameFolder && !imagePopup.open && currentPage !== 'trash' && (
        <button
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 z-50"
          style={{ background: '#7c3aed' }}
          onClick={() => {
            console.log('Mobile floating button clicked');
            console.log('Current page when clicking:', currentPage);
            openNewNotePopup();
          }}
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
              isLoading={loadingStates.creatingNote}
            />
          )}

          {/* Edit Note Modal - Just a popup, no URL change */}
          {selectedNote && (
            <EditNoteModal
              show={!!selectedNote}
              note={selectedNote}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onOpenWithAI={handleOpenWithAI}
              onClose={closeNotePopup}
              isDeleting={loadingStates.deletingNote}
              isUpdating={loadingStates.updatingNote}
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
              existingFoldersCount={folders.length}
              isLoading={loadingStates.creatingFolder}
            />
          )}

          {showRenameFolder && (
            <RenameFolderModal
              show={showRenameFolder}
              folderDraft={renameFolderDraft}
              setFolderDraft={setRenameFolderDraft}
              onSave={saveRenameFolder}
              onClose={() => setShowRenameFolder(false)}
              isLoading={loadingStates.updatingFolder}
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

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default NotesApp;