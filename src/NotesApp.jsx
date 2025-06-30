import React, { useState, useEffect } from 'react';
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
  // Custom hooks for data management
  const {
    notes,
    folders,
    trashedNotes,
    currentPage,
    currentFolder,
    searchTerm,
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
    switchToNotes,
    switchToTrash,
    openFolder,
    goBackToNotes,
    getPageTitle,
    getSearchPlaceholder
  } = useNotesData();

  // Drag and drop functionality
  const dragHandlers = useDragAndDrop(currentPage, getCurrentNotes, reorderNotes);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentView, setCurrentView] = useState('notes');
  const [aiChatNote, setAiChatNote] = useState(null);
  
  // Modal states
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
  
  // Draft states - Initialize with safe defaults
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

  // Note operations
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

    createNote({
      title: newNoteDraft.title || 'Untitled Note',
      content: newNoteDraft.content || '',
      keywords: keywordsArray,
      color: newNoteDraft.color || 'purple'
    });
    
    setShowNewNotePopup(false);
  };

  const openNote = (note) => {
    setSelectedNote(note);
  };

  const closeNotePopup = () => {
    setSelectedNote(null);
  };

  const handleDeleteNote = (noteId) => {
    deleteNote(noteId);
    setSelectedNote(null);
  };

  // AI functionality
  const handleOpenWithAI = (note) => {
    setAiChatNote(note);
    setCurrentView('ai-chat');
    setSelectedNote(null);
  };

  const handleBackToNotes = () => {
    setCurrentView('notes');
    setAiChatNote(null);
  };

  // Folder operations
  const openNewFolderPopup = () => {
    setNewFolderDraft({
      name: '',
      color: getRandomColor()
    });
    setShowNewFolderPopup(true);
  };

  const saveNewFolder = () => {
    if (!newFolderDraft.name || !newFolderDraft.name.trim()) return;
    createFolder(newFolderDraft);
    setShowNewFolderPopup(false);
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
  };

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
      {currentView === 'ai-chat' ? (
        <AIChatPage
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          folders={folders}
          user={user}
          onSwitchToNotes={handleBackToNotes}
          onSwitchToTrash={() => {
            setCurrentView('notes');
            setAiChatNote(null);
            switchToTrash();
          }}
          onOpenFolder={(folder) => {
            setCurrentView('notes');
            setAiChatNote(null);
            openFolder(folder);
          }}
          onAddFolder={openNewFolderPopup}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={deleteFolder}
          onLogout={onLogout}
          selectedNote={aiChatNote}
          onUpdateNote={updateNote}
        />
      ) : (
        <>
          <TopNavigation
            currentPage={currentPage}
            currentFolder={currentFolder}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddNote={openNewNotePopup}
            onGoBack={goBackToNotes}
            getSearchPlaceholder={getSearchPlaceholder}
          />

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
            onDeleteFolder={deleteFolder}
            onLogout={onLogout}
          />

          <div 
            className={`transition-all duration-300 pt-25 px-10 pb-10 min-h-screen ${
              sidebarOpen ? 'ml-64' : 'ml-18'
            }`}
            style={{ paddingTop: '100px' }}
          >
            <NotesGrid
              currentPage={currentPage}
              currentFolder={currentFolder}
              notes={getCurrentNotes()}
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

      {/* Modals */}
      {currentView !== 'ai-chat' && (
        <>
          {showNewNotePopup && (
            <NewNoteModal
              show={showNewNotePopup}
              noteDraft={newNoteDraft}
              setNoteDraft={setNewNoteDraft}
              onSave={saveNewNote}
              onClose={() => setShowNewNotePopup(false)}
            />
          )}

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