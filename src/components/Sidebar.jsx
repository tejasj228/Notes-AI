'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  StickyNote,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Trash2,
  LogOut,
  MoreVertical,
  Share2,
  Sun,
  Moon,
} from 'lucide-react';
import { PAGES } from '@/utils/constants';
import { getFolderColor } from '@/utils/helpers';
import { useTheme } from '@/context/ThemeProvider';
import { FolderMenu } from './UI';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  currentFolder,
  folders,
  user,
  onSwitchToNotes,
  onSwitchToTrash,
  onOpenFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onLogout,
  onDragNoteToTrash,
}) => {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [folderMenuOpen, setFolderMenuOpen] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOverTrash, setDragOverTrash] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const insideMenu = event.target.closest('.folder-menu-container');
      if (!insideMenu) setFolderMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const maxFolders = 10;
  const canAddFolder = folders.length < maxFolders;

  const handleTrashDrop = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrash(false);
    try {
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId && onDragNoteToTrash) onDragNoteToTrash(noteId);
    } catch (_) {}
  };

  const isFolderActive = (folder) =>
    currentPage === PAGES.FOLDER &&
    currentFolder &&
    (currentFolder._id || currentFolder.id) === (folder._id || folder.id);

  const navItem = (active) =>
    `flex items-center gap-3 py-2.5 px-4 cursor-pointer w-full text-left font-mono text-sm font-bold uppercase tracking-wide transition-colors border-l-4 ${
      active
        ? 'bg-brand text-white border-ink'
        : 'text-ink border-transparent hover:bg-paper-2'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-40 h-[100dvh] bg-paper border-r-3 border-ink transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-16'
        } ${sidebarOpen ? 'block' : 'hidden md:block'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-3 border-ink">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="inline-block bg-brand text-white border-3 border-ink px-2 py-0.5 font-display font-extrabold leading-none shadow-brutal-sm">
                N
              </span>
              <span className="font-display font-extrabold text-lg leading-none">NOTES·AI</span>
            </div>
          )}
          <button
            className="text-ink p-1.5 border-3 border-ink bg-card shadow-brutal-sm hover:bg-note-yellow hover:text-ink-fixed transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} strokeWidth={2.75} />
          </button>
        </div>

        {/* Nav */}
        <div className="py-4">
          <button className={navItem(currentPage === PAGES.NOTES)} onClick={onSwitchToNotes}>
            <StickyNote size={20} strokeWidth={2.5} />
            {sidebarOpen && 'Notes'}
          </button>

          {/* Folders */}
          <div>
            <button
              className="flex items-center gap-3 py-2.5 px-4 w-full text-left font-mono text-sm font-bold uppercase tracking-wide text-ink hover:bg-paper-2 transition-colors border-l-4 border-transparent"
              onClick={() => setFoldersExpanded(!foldersExpanded)}
            >
              {foldersExpanded ? <ChevronDown size={18} strokeWidth={2.75} /> : <ChevronRight size={18} strokeWidth={2.75} />}
              {sidebarOpen && (
                <>
                  <span className="flex-1">Folders</span>
                  <span
                    role="button"
                    tabIndex={canAddFolder ? 0 : -1}
                    className={`p-1 border-2 border-ink ${
                      canAddFolder ? 'bg-card hover:bg-note-green hover:text-ink-fixed cursor-pointer' : 'bg-paper-2 opacity-40 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canAddFolder) onAddFolder();
                    }}
                    title={canAddFolder ? 'Add folder' : `Max ${maxFolders} folders`}
                  >
                    <FolderPlus size={14} strokeWidth={2.75} />
                  </span>
                </>
              )}
            </button>

            {foldersExpanded && sidebarOpen && (
              <div className="pl-2 pr-2 pt-1 space-y-1">
                {folders.map((folder) => (
                  <div key={folder._id || folder.id} className="relative">
                    <button
                      className={`flex items-center gap-2 py-2 px-2 w-full text-left text-sm font-semibold transition-colors border-2 ${
                        isFolderActive(folder)
                          ? 'border-ink shadow-brutal-sm text-ink-fixed'
                          : 'border-transparent hover:border-ink'
                      }`}
                      style={isFolderActive(folder) ? { background: getFolderColor(folder.color) } : {}}
                      onClick={() => onOpenFolder(folder)}
                    >
                      {isFolderActive(folder) ? (
                        <FolderOpen size={16} strokeWidth={2.5} />
                      ) : (
                        <Folder size={16} strokeWidth={2.5} />
                      )}
                      <span className="truncate flex-1" title={folder.name}>
                        {folder.name}
                      </span>
                      <span
                        className="w-3 h-3 border-2 border-ink flex-shrink-0"
                        style={{ background: getFolderColor(folder.color) }}
                      />
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-0.5 p-0.5 hover:bg-ink-fixed hover:text-white folder-menu-container transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = folder._id || folder.id;
                          setFolderMenuOpen(id === folderMenuOpen ? null : id);
                        }}
                        title="Folder options"
                      >
                        <MoreVertical size={15} strokeWidth={2.5} />
                      </span>
                    </button>
                    {folderMenuOpen === (folder._id || folder.id) && (
                      <FolderMenu
                        folderId={folder._id || folder.id}
                        onRename={() => onRenameFolder(folder)}
                        onDelete={onDeleteFolder}
                        onClose={() => setFolderMenuOpen(null)}
                      />
                    )}
                  </div>
                ))}
                <div className="brutal-eyebrow px-2 py-1 text-ink/50">
                  {folders.length}/{maxFolders} folders
                </div>
              </div>
            )}
          </div>

          {/* Trash — drop target */}
          <button
            className={`${navItem(currentPage === PAGES.TRASH)} mt-1 ${
              dragOverTrash ? 'bg-note-red text-ink-fixed border-ink' : ''
            }`}
            onClick={onSwitchToTrash}
            onDragOver={(e) => {
              if (isMobile) return;
              e.preventDefault();
              setDragOverTrash(true);
            }}
            onDragLeave={() => setDragOverTrash(false)}
            onDrop={handleTrashDrop}
          >
            <Trash2 size={20} strokeWidth={2.5} />
            {sidebarOpen && (
              <>
                Trash
                {dragOverTrash && <span className="ml-auto text-[10px] animate-blink">DROP!</span>}
              </>
            )}
          </button>

          {/* Knowledge graph */}
          <button className={`${navItem(false)} mt-1`} onClick={() => router.push('/graph')}>
            <Share2 size={20} strokeWidth={2.5} />
            {sidebarOpen && 'Graph'}
          </button>

          {/* Theme toggle */}
          <button className={`${navItem(false)} mt-1`} onClick={toggle}>
            {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
            {sidebarOpen && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
          </button>
        </div>

        {/* User / logout */}
        {sidebarOpen && (
          <div className="absolute bottom-4 left-3 right-3 border-3 border-ink bg-card shadow-brutal p-3">
            <div className="brutal-eyebrow text-ink/60 mb-1">Signed in</div>
            <div className="text-xs font-semibold text-ink break-words mb-3 leading-tight">
              {user ? user.email : 'user@example.com'}
            </div>
            <button className="brutal-btn w-full bg-note-red text-ink-fixed py-2 text-xs" onClick={onLogout}>
              <LogOut size={15} strokeWidth={2.75} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
