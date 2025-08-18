import React, { useState } from 'react';
import { Menu, StickyNote, Folder, FolderOpen, ChevronDown, ChevronRight, FolderPlus, Trash2, LogOut, MoreVertical } from 'lucide-react';
import { PAGES } from '../utils/constants';
import { getFolderColor } from '../utils/helpers';
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
  onDragNoteToTrash // Add this new prop
}) => {
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [folderMenuOpen, setFolderMenuOpen] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dragOverTrash, setDragOverTrash] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close folder menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any menu or 3-dot button
      const isClickInsideMenu = event.target.closest('.folder-menu-container');
      const isClickOn3Dot = event.target.closest('button') && event.target.closest('button').querySelector('svg');
      
      if (!isClickInsideMenu && !isClickOn3Dot) {
        setFolderMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const maxFolders = 10;
  const canAddFolder = folders.length < maxFolders;

  // Debug folder selection
  React.useEffect(() => {
    console.log('Sidebar - currentFolder:', currentFolder);
    console.log('Sidebar - folders:', folders.map(f => ({ name: f.name, _id: f._id, id: f.id })));
  }, [currentFolder, folders]);

  // Handle drag and drop for notes to trash (desktop only)
  const handleTrashDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrash(true);
  };

  const handleTrashDragLeave = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrash(false);
  };

  const handleTrashDrop = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrash(false);
    
    try {
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId && onDragNoteToTrash) {
        onDragNoteToTrash(noteId);
      }
    } catch (error) {
      console.error('Error handling trash drop:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 border-r transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-18'
        } ${sidebarOpen ? 'block' : 'hidden md:block'}`}
        style={{ 
          background: 'rgba(30, 30, 30, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          height: '100vh',
          height: '100dvh' // Dynamic viewport height for mobile browsers
        }}
      >
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        {sidebarOpen && (
          <div className="flex items-center gap-3 text-lg font-semibold" style={{ color: '#8b5cf6' }}>
            NOTES AI
          </div>
        )}
        {/* Hamburger button - show on mobile when sidebar is open */}
        <button 
          className="md:hidden bg-transparent border-none text-gray-400 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>
        {/* Desktop hamburger button */}
        <button 
          className="hidden md:block bg-transparent border-none text-gray-400 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Navigation */}
      <div className="py-5">
        {/* Notes */}
        <button 
          className={`flex items-center gap-3 py-3 px-5 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left ${
            currentPage === PAGES.NOTES 
              ? 'text-violet-500 border-r-3' 
              : 'text-gray-300 hover:text-violet-500'
          }`}
          style={{
            background: currentPage === PAGES.NOTES ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            borderRightColor: currentPage === PAGES.NOTES ? '#8b5cf6' : 'transparent'
          }}
          onClick={onSwitchToNotes}
          onMouseEnter={e => {
            if (currentPage !== PAGES.NOTES) {
              e.target.style.background = 'rgba(139, 92, 246, 0.1)';
            }
          }}
          onMouseLeave={e => {
            if (currentPage !== PAGES.NOTES) {
              e.target.style.background = 'transparent';
            }
          }}
        >
          <StickyNote size={20} />
          {sidebarOpen && 'Notes'}
        </button>
        
        {/* Folders Section */}
        <div>
          <button 
            className="flex items-center gap-3 py-3 px-5 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left text-gray-300 hover:text-violet-500"
            onClick={() => setFoldersExpanded(!foldersExpanded)}
            onMouseEnter={e => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            {foldersExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            {sidebarOpen && (
              <>
                <Folder size={20} />
                <span className="flex-1">Folders</span>
                <div className="relative group">
                  <div
                    className={`border-none bg-transparent p-1 rounded transition-all duration-200 ${
                      canAddFolder 
                        ? 'text-gray-400 hover:text-violet-500 cursor-pointer' 
                        : 'text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canAddFolder) {
                        onAddFolder();
                      }
                    }}
                    role="button"
                    tabIndex={canAddFolder ? 0 : -1}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && canAddFolder) {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddFolder();
                      }
                    }}
                    title={canAddFolder ? "Add Folder" : `Maximum ${maxFolders} folders allowed`}
                  >
                    <FolderPlus size={16} />
                  </div>
                  
                  {/* Tooltip for disabled state */}
                  {!canAddFolder && (
                    <div className="absolute right-0 top-8 hidden group-hover:block z-50">
                      <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap border border-gray-600">
                        Max {maxFolders} folders reached
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </button>
          
          {/* Folder List */}
          {foldersExpanded && sidebarOpen && (
            <div className="ml-6">
              {folders.map((folder) => (
                <div key={folder._id || folder.id} className="relative group">
                  <button
                    className={`
                      flex items-center gap-3 py-2 px-4 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left text-sm
                      ${currentPage === PAGES.FOLDER && 
                        currentFolder && 
                        ((currentFolder._id || currentFolder.id) === (folder._id || folder.id))
                        ? 'text-violet-500 border-r-3'
                        : 'text-gray-300 hover:text-violet-500'
                      }
                    `}
                    style={{
                      background: currentPage === PAGES.FOLDER && 
                                 currentFolder && 
                                 ((currentFolder._id || currentFolder.id) === (folder._id || folder.id)) 
                                 ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      borderRightColor: currentPage === PAGES.FOLDER && 
                                       currentFolder && 
                                       ((currentFolder._id || currentFolder.id) === (folder._id || folder.id))
                                       ? '#8b5cf6' : 'transparent'
                    }}
                    onClick={() => onOpenFolder(folder)}
                  >
                    {currentPage === PAGES.FOLDER && 
                     currentFolder && 
                     ((currentFolder._id || currentFolder.id) === (folder._id || folder.id)) ? 
                      <FolderOpen size={16} /> : 
                      <Folder size={16} />
                    }
                    <span className="truncate" title={folder.name}>{folder.name}</span>
                    <span 
                      className="w-2 h-2 rounded-full ml-auto"
                      style={{ background: getFolderColor(folder.color) }}
                    />
                    {/* 3-dots menu div */}
                    <div
                      className="ml-2 border-none bg-transparent text-gray-400 hover:text-violet-500 p-1 rounded transition-colors duration-200 folder-menu-container cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        const folderId = folder._id || folder.id;
                        setFolderMenuOpen(folderId === folderMenuOpen ? null : folderId);
                      }}
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          const folderId = folder._id || folder.id;
                          setFolderMenuOpen(folderId === folderMenuOpen ? null : folderId);
                        }
                      }}
                      title="Folder options"
                    >
                      <MoreVertical size={16} />
                    </div>
                  </button>
                  {/* Folder menu */}
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
              
              {/* Folder count indicator */}
              {sidebarOpen && (
                <div className="px-4 py-2 text-xs text-gray-500">
                  {folders.length}/{maxFolders} folders
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Trash */}
        <button 
          className={`flex items-center gap-3 py-3 px-5 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left ${
            currentPage === PAGES.TRASH 
              ? 'text-violet-500 border-r-3' 
              : 'text-gray-300 hover:text-violet-500'
          } ${dragOverTrash ? 'bg-red-500/20 border-red-500/50' : ''}`}
          style={{
            background: currentPage === PAGES.TRASH 
              ? 'rgba(139, 92, 246, 0.2)' 
              : dragOverTrash 
                ? 'rgba(239, 68, 68, 0.15)' 
                : 'transparent',
            borderRightColor: currentPage === PAGES.TRASH ? '#8b5cf6' : 'transparent',
            borderLeft: dragOverTrash ? '3px solid rgba(239, 68, 68, 0.6)' : '3px solid transparent'
          }}
          onClick={onSwitchToTrash}
          onDragOver={handleTrashDragOver}
          onDragLeave={handleTrashDragLeave}
          onDrop={handleTrashDrop}
          onMouseEnter={e => {
            if (currentPage !== PAGES.TRASH && !dragOverTrash) {
              e.target.style.background = 'rgba(139, 92, 246, 0.1)';
            }
          }}
          onMouseLeave={e => {
            if (currentPage !== PAGES.TRASH && !dragOverTrash) {
              e.target.style.background = 'transparent';
            }
          }}
        >
          <Trash2 size={20} />
          {sidebarOpen && (
            <>
              Trash
              {dragOverTrash && !isMobile && (
                <span className="ml-auto text-xs text-red-400 animate-pulse">
                  Drop to delete
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* User Info & Logout */}
      {sidebarOpen && (
        <div 
          className="absolute bottom-5 left-5 right-5 p-5 rounded-xl border"
          style={{ 
            background: 'rgba(40, 40, 40, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom, 0px))' : '20px'
          }}
        >
          <div className="text-sm text-gray-400 mb-3 leading-5">
            Signed in as:<br />
            {user ? user.email : 'user@example.com'}
          </div>
          <button 
            className="border rounded-lg py-3 px-4 text-red-400 text-sm cursor-pointer w-full transition-all duration-300 flex items-center justify-center gap-2 font-medium"
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              borderColor: 'rgba(220, 38, 38, 0.3)'
            }}
            onClick={onLogout}
            onMouseEnter={e => e.target.style.background = 'rgba(220, 38, 38, 0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(220, 38, 38, 0.2)'}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default Sidebar;