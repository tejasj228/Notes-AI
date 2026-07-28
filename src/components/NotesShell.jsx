'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Menu, Search } from 'lucide-react';
import TopNavigation from './TopNavigation';
import Sidebar from './Sidebar';
import NotesGrid from './NotesGrid';
import NotificationSystem from './NotificationSystem';
import { NewNoteModal, EditNoteModal, ImagePopup } from './NoteModals';
import { NewFolderModal, RenameFolderModal } from './FolderModals';
import ThemeToggle from './ThemeToggle';
import { useNotesData } from '@/hooks/useNotesData';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { getRandomColor, getRandomSize } from '@/utils/helpers';
import { useAuth } from '@/context/AuthProvider';
import { graphAPI } from '@/api/graph';

// Fire-and-forget: (re)build a note's knowledge-graph slice after it changes.
const reindexNote = (id) => {
  if (id) graphAPI.indexNote(id).catch(() => {});
};

const NotesShell = ({ page }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

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
    deleteFolder,
    getCurrentFolderFromURL,
  } = useNotesData();

  const currentPage = page;
  const currentFolder = getCurrentFolderFromURL();

  const dragHandlers = useDragAndDrop(currentPage, getCurrentNotes, reorderNotes);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});

  const [showNewNotePopup, setShowNewNotePopup] = useState(false);
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
  const [selectedNote, setSelectedNote] = useState(null);

  const [newNoteDraft, setNewNoteDraft] = useState({ title: '', content: '', keywords: '', color: 'purple', size: 'medium' });
  const [newFolderDraft, setNewFolderDraft] = useState({ name: '', color: 'purple' });
  const [renameFolderDraft, setRenameFolderDraft] = useState({ id: null, name: '', color: '' });

  const addNotification = (n) => setNotifications((prev) => [...prev, { id: Date.now() + Math.random(), ...n }]);
  const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const setLoading = (key, value) => setLoadingStates((prev) => ({ ...prev, [key]: value }));

  const notify = (type, title, message, duration = 3000) => addNotification({ type, title, message, duration });

  // image click → popup within note editors
  useEffect(() => {
    function handleImageClick(e) {
      if (e.target.tagName === 'IMG') setImagePopup({ open: true, src: e.target.src });
    }
    const editors = document.querySelectorAll('.note-content-editable');
    editors.forEach((editor) => editor && editor.addEventListener('click', handleImageClick));
    return () => editors.forEach((editor) => editor && editor.removeEventListener('click', handleImageClick));
  }, [showNewNotePopup, selectedNote]);

  // ---------- navigation ----------
  const switchToNotes = () => {
    router.push('/notes');
    setSearchTerm('');
  };
  const switchToTrash = () => {
    router.push('/trash');
    setSearchTerm('');
  };
  const openFolder = (folder) => {
    router.push(`/folder/${folder.name.toLowerCase().replace(/\s+/g, '-')}`);
    setSearchTerm('');
  };
  // Navigate by id (titles with & / punctuation don't survive as URL slugs).
  const handleOpenWithAI = (note) => router.push(`/ai-chat/${note._id || note.id}`);

  // ---------- notes ----------
  const openNewNotePopup = () => {
    setNewNoteDraft({ title: '', content: '', keywords: '', color: getRandomColor(), size: getRandomSize() });
    setShowNewNotePopup(true);
  };

  const saveNewNote = async () => {
    if (loadingStates.creatingNote) return; // guard against double-submit
    let keywordsArray = [];
    if (typeof newNoteDraft.keywords === 'string') {
      keywordsArray = newNoteDraft.keywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 3);
    } else if (Array.isArray(newNoteDraft.keywords)) {
      keywordsArray = newNoteDraft.keywords.slice(0, 3);
    }
    setLoading('creatingNote', true);
    try {
      const newNote = await createNote({
        title: newNoteDraft.title || 'Untitled Note',
        content: newNoteDraft.content || '',
        keywords: keywordsArray,
        color: newNoteDraft.color || 'purple',
        // Size is randomized (for bento variety), picked once when the modal
        // opened — not derived from content, which made every note with
        // similar content render at the exact same size.
        size: newNoteDraft.size || getRandomSize(),
      });
      setShowNewNotePopup(false);
      reindexNote(newNote._id || newNote.id);
      notify('success', 'Note created', `“${newNote.title}” is live.`);
    } catch (e) {
      notify('error', 'Couldn’t create note', 'Please try again.', 4000);
    } finally {
      setLoading('creatingNote', false);
    }
  };

  const handleUpdateNote = async (noteId, field, value) => {
    setLoading('updatingNote', true);
    const noteToUpdate = notes.find((n) => (n._id || n.id) === noteId);
    try {
      await updateNote(noteId, field, value);
      if (field === 'title' || field === 'content') reindexNote(noteId);
      notify('success', 'Note updated', noteToUpdate ? `“${noteToUpdate.title}” saved.` : 'Saved.', 2500);
    } catch (e) {
      notify('error', 'Update failed', 'Please try again.', 4000);
    } finally {
      setLoading('updatingNote', false);
    }
  };

  const handleDeleteNote = (noteId) => {
    setLoading('deletingNote', true);
    const noteToDelete = notes.find((n) => (n._id || n.id) === noteId);
    deleteNote(noteId)
      .then(() => {
        notify('delete', 'Moved to trash', noteToDelete ? `“${noteToDelete.title}” is in the trash.` : 'Moved to trash.');
        setSelectedNote(null);
      })
      .catch(() => notify('error', 'Delete failed', 'Please try again.', 4000))
      .finally(() => setLoading('deletingNote', false));
  };

  const handleDragNoteToTrash = async (noteId) => {
    setLoading('deletingNote', true);
    const noteToDelete = notes.find((n) => (n._id || n.id) === noteId);
    try {
      await deleteNote(noteId);
      notify('delete', 'Moved to trash', noteToDelete ? `“${noteToDelete.title}” is in the trash.` : 'Moved to trash.');
    } catch (e) {
      notify('error', 'Delete failed', 'Please try again.', 4000);
    } finally {
      setLoading('deletingNote', false);
    }
  };

  const handleRestoreNote = async (noteId) => {
    setLoading('restoringNote', true);
    const noteToRestore = trashedNotes.find((n) => (n._id || n.id) === noteId);
    try {
      await restoreNote(noteId);
      notify('success', 'Note restored', noteToRestore ? `“${noteToRestore.title}” is back.` : 'Restored.');
    } catch (e) {
      notify('error', 'Restore failed', 'Please try again.', 4000);
    } finally {
      setLoading('restoringNote', false);
    }
  };

  const handlePermanentDeleteNote = async (noteId) => {
    setLoading('permanentDeletingNote', true);
    const noteToDelete = trashedNotes.find((n) => (n._id || n.id) === noteId);
    try {
      await permanentlyDeleteNote(noteId);
      notify('delete', 'Deleted forever', noteToDelete ? `“${noteToDelete.title}” is gone.` : 'Deleted.');
    } catch (e) {
      notify('error', 'Delete failed', 'Please try again.', 4000);
    } finally {
      setLoading('permanentDeletingNote', false);
    }
  };

  // ---------- folders ----------
  const openNewFolderPopup = () => {
    setNewFolderDraft({ name: '', color: getRandomColor() });
    setShowNewFolderPopup(true);
  };

  const saveNewFolder = async () => {
    if (!newFolderDraft.name?.trim()) return;
    setLoading('creatingFolder', true);
    try {
      const newFolder = await createFolder(newFolderDraft);
      setShowNewFolderPopup(false);
      notify('success', 'Folder created', `“${newFolder.name}” is ready.`);
    } catch (e) {
      notify('error', 'Couldn’t create folder', 'Please try again.', 4000);
    } finally {
      setLoading('creatingFolder', false);
    }
  };

  const handleRenameFolder = (folder) => {
    setRenameFolderDraft({ id: folder._id || folder.id, name: folder.name, color: folder.color });
    setShowRenameFolder(true);
  };

  const saveRenameFolder = async () => {
    if (!renameFolderDraft.name?.trim()) return;
    setLoading('updatingFolder', true);
    try {
      await updateFolder(renameFolderDraft.id, { name: renameFolderDraft.name, color: renameFolderDraft.color });
      setShowRenameFolder(false);
      notify('success', 'Folder updated', 'Changes saved.');
      if (
        currentFolder &&
        (currentFolder._id || currentFolder.id)?.toString() === (renameFolderDraft.id || '').toString()
      ) {
        router.push(`/folder/${renameFolderDraft.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (e) {
      notify('error', 'Update failed', 'Please try again.', 4000);
    } finally {
      setLoading('updatingFolder', false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    setLoading('deletingFolder', true);
    const folderToDelete = folders.find((f) => (f._id || f.id) === folderId);
    try {
      await deleteFolder(folderId);
      notify('delete', 'Folder deleted', folderToDelete ? `“${folderToDelete.name}” removed.` : 'Deleted.');
      if (currentFolder && (currentFolder._id === folderId || currentFolder.id === folderId)) router.push('/notes');
    } catch (e) {
      notify('error', 'Delete failed', 'Please try again.', 4000);
    } finally {
      setLoading('deletingFolder', false);
    }
  };

  // ---------- helpers ----------
  const getPageTitle = () => {
    if (currentPage === 'trash') return 'Trash';
    if (currentPage === 'folder' && currentFolder) return currentFolder.name;
    return 'Notes';
  };
  const getSearchPlaceholder = () => {
    if (currentPage === 'trash') return 'Search trash…';
    if (currentPage === 'folder' && currentFolder) return `Search ${currentFolder.name}…`;
    return 'Search notes…';
  };

  return (
    <div className="min-h-[100dvh]">
      {/* Desktop top nav */}
      <div className="hidden md:block">
        <TopNavigation
          currentPage={currentPage}
          currentFolder={currentFolder}
          pageTitle={getPageTitle()}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddNote={openNewNotePopup}
          onGoBack={() => router.back()}
          getSearchPlaceholder={getSearchPlaceholder}
        />
      </div>

      {/* Mobile search bar */}
      <div className={`md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-30 w-[92%] ${sidebarOpen ? 'hidden' : 'block'}`}>
        <div className="flex items-center gap-2 bg-paper border-3 border-ink shadow-brutal px-2.5 py-2">
          <button className="brutal-btn bg-card text-ink p-1.5" onClick={() => setSidebarOpen(true)}>
            <Menu size={16} strokeWidth={2.75} />
          </button>
          <div className="relative flex items-center flex-1">
            <Search className="absolute left-2.5 text-ink" size={16} strokeWidth={2.5} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              className="brutal-input w-full py-1.5 pl-8 pr-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ThemeToggle iconSize={16} className="p-1.5" />
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
        onLogout={logout}
        onDragNoteToTrash={handleDragNoteToTrash}
      />

      <div
        className={`transition-all duration-200 px-4 md:px-10 pb-16 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}
        style={{ paddingTop: '96px', minHeight: '100dvh' }}
      >
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block w-10 h-10 border-3 border-ink border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-mono text-sm">Loading your notes…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="border-3 border-ink bg-note-red text-ink-fixed shadow-brutal p-6 text-center max-w-sm">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="font-display font-extrabold text-lg mb-1">Couldn’t load notes</p>
              <p className="text-xs text-ink-fixed/70 mb-4">{error}</p>
              <button className="brutal-btn bg-card text-ink px-4 py-2 text-xs" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          <NotesGrid
            currentPage={currentPage}
            currentFolder={currentFolder}
            notes={getCurrentNotes()}
            searchTerm={searchTerm}
            onOpenNote={setSelectedNote}
            onAddNote={openNewNotePopup}
            onRestoreNote={handleRestoreNote}
            onPermanentDeleteNote={handlePermanentDeleteNote}
            dragHandlers={dragHandlers}
            loadingStates={loadingStates}
          />
        )}
      </div>

      {/* Mobile add button */}
      {!showNewNotePopup && !selectedNote && !showNewFolderPopup && !showRenameFolder && !imagePopup.open && currentPage !== 'trash' && (
        <button
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 border-3 border-ink bg-brand text-white shadow-brutal flex items-center justify-center z-40 active:translate-x-0.5 active:translate-y-0.5"
          onClick={openNewNotePopup}
          aria-label="New note"
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      )}

      {/* Modals */}
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
      {selectedNote && (
        <EditNoteModal
          show={!!selectedNote}
          note={selectedNote}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onOpenWithAI={handleOpenWithAI}
          onClose={() => setSelectedNote(null)}
          isDeleting={loadingStates.deletingNote}
          isUpdating={loadingStates.updatingNote}
        />
      )}
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
      {imagePopup.open && (
        <ImagePopup show={imagePopup.open} imageSrc={imagePopup.src} onClose={() => setImagePopup({ open: false, src: '' })} />
      )}

      <NotificationSystem notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default NotesShell;
