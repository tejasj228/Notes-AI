import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { PAGES } from '../utils/constants';
import { getNoteBackground, getNoteHoverBackground, getSizeClasses, getSizeStyles, extractImageSrcs, filterNotes } from '../utils/helpers';

const NotesGrid = ({
  currentPage,
  currentFolder,
  notes,
  searchTerm,
  onOpenNote,
  onAddNote,
  onRestoreNote,
  onPermanentDeleteNote,
  dragHandlers,
  loadingStates = {}
}) => {
  const [showTrashMenu, setShowTrashMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on a 3-dot button (MoreVertical icon)
      const isClickOn3DotButton = event.target.closest('button') && 
                                  event.target.closest('button').querySelector('svg') &&
                                  event.target.closest('.menu-container');
      
      // Check if click is inside any menu
      const isClickInsideMenu = event.target.closest('.menu-container');
      
      // Only close if click is outside both menu and 3-dot button
      if (!isClickInsideMenu && !isClickOn3DotButton) {
        setShowTrashMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const {
    draggedNote,
    dragOverIndex,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleGridDragOver,
    handleGridDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = dragHandlers;

  // Filter and sort notes
  const filteredNotes = filterNotes(notes, searchTerm)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Debug: Log note sizes
  useEffect(() => {
    if (filteredNotes.length > 0) {
      console.log('Notes with sizes:', filteredNotes.map(note => ({ 
        id: note.id, 
        title: note.title, 
        size: note.size,
        _id: note._id 
      })));
    }
  }, [filteredNotes.length]);

  // Empty State Component
  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] py-10 md:py-20 text-gray-400">
      <h3 className="text-lg md:text-xl font-semibold mb-2">
        {currentPage === PAGES.TRASH ? 'Trash is empty' :
         currentPage === PAGES.FOLDER ? 'No notes in this folder' : 'No notes yet'}
      </h3>
      <p className="text-sm text-center px-4">
        {currentPage === PAGES.TRASH ? 'Deleted notes will appear here' :
         currentPage === PAGES.FOLDER ? 'Create your first note in this folder' : 'Create your first note to get started'}
      </p>
      {(currentPage === PAGES.NOTES || (currentPage === PAGES.FOLDER && currentFolder)) && (
        <button 
          className="mt-4 border-none rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 md:hidden"
          style={{ background: '#7c3aed' }}
          onClick={onAddNote}
          onMouseEnter={e => e.target.style.background = '#6d28d9'}
          onMouseLeave={e => e.target.style.background = '#7c3aed'}
        >
          <Plus size={18} />
          Create Note
        </button>
      )}
    </div>
  );

  return (
    <div 
      className="grid gap-6 md:gap-8 max-w-6xl mx-auto py-3 md:py-5 w-full px-0 md:px-0"
      style={{
        gridTemplateColumns: isMobile 
          ? '1fr' // Single column on mobile for full width
          : 'repeat(auto-fill, minmax(280px, 1fr))',
        gridAutoRows: isMobile ? '120px' : '220px' // Increased to give proper space for notes
      }}
      onDragOver={handleGridDragOver}
      onDrop={handleGridDrop}
    >
      {filteredNotes.length === 0 ? (
        <EmptyState />
      ) : (
        filteredNotes.map((note, index) => (
          <div
            key={note._id || note.id}
            className={`
              note-card rounded-lg md:rounded-2xl p-3 md:p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-start h-full
              ${currentPage !== PAGES.TRASH ? 'cursor-grab' : 'cursor-default'}
              ${draggedNote && (draggedNote._id || draggedNote.id) === (note._id || note.id) ? 'opacity-30 cursor-grabbing z-50' : ''}
              ${dragOverIndex === index ? 'border-2' : ''}
              hover:shadow-2xl
            `}
            style={{
              background: getNoteBackground(note.color),
              transform: draggedNote && (draggedNote._id || draggedNote.id) === (note._id || note.id) ? 'rotate(2deg) scale(0.95)' : 
                        dragOverIndex === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
              borderColor: dragOverIndex === index ? 'rgba(139, 92, 246, 0.6)' : 'transparent',
              boxShadow: draggedNote && (draggedNote._id || draggedNote.id) === (note._id || note.id) ? '0 20px 40px rgba(0, 0, 0, 0.5)' : 
                        dragOverIndex === index ? '0 15px 40px rgba(139, 92, 246, 0.4)' : '0 0 0 rgba(0, 0, 0, 0)',
              transition: 'all 0.3s ease',
              touchAction: currentPage !== PAGES.TRASH ? 'manipulation' : 'auto',
              userSelect: 'none',
              ...getSizeStyles(note.size, isMobile)
            }}
            draggable={currentPage !== PAGES.TRASH}
            data-note-id={note._id || note.id}
            data-note-index={index}
            onDragStart={(e) => handleDragStart(e, note, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={(e) => handleTouchStart(e, note, index)}
            onTouchMove={(e) => handleTouchMove(e, index)}
            onTouchEnd={handleTouchEnd}
            onClick={() => currentPage !== PAGES.TRASH ? onOpenNote(note) : null}
            onMouseEnter={e => {
              if (!(draggedNote && (draggedNote._id || draggedNote.id) === (note._id || note.id)) && dragOverIndex !== index) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = getNoteHoverBackground(note.color);
              }
            }}
            onMouseLeave={e => {
              if (!(draggedNote && draggedNote.id === note.id) && dragOverIndex !== index) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = getNoteBackground(note.color);
              }
            }}
          >
            {currentPage === PAGES.TRASH && (
              <div className="absolute top-4 right-4 z-10 menu-container">
                <button 
                  className="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-300 menu-container"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrashMenu(showTrashMenu === (note._id || note.id) ? null : (note._id || note.id));
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                {showTrashMenu === (note._id || note.id) && (
                  <div 
                    className="absolute border rounded-lg py-2 z-50 menu-container"
                    style={{
                      background: '#2a2a2a',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                      top: '45px', // Below the 3-dot button
                      right: '5px', // Aligned with the right edge
                      minWidth: isMobile ? '120px' : '160px',
                      maxWidth: isMobile ? '120px' : '160px'
                    }}
                  >
                    <button 
                      className={`bg-transparent border-none w-full text-gray-200 cursor-pointer flex items-center justify-start gap-2 transition-colors duration-200 hover:bg-white/10 menu-container ${
                        isMobile ? 'py-2 px-3 text-xs' : 'py-3 px-4 text-sm'
                      } ${loadingStates.restoringNote ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!loadingStates.restoringNote) {
                          onRestoreNote(note._id || note.id);
                          setShowTrashMenu(null);
                        }
                      }}
                      disabled={loadingStates.restoringNote}
                    >
                      {loadingStates.restoringNote ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                      ) : (
                        <RotateCcw size={isMobile ? 14 : 16} />
                      )}
                      {loadingStates.restoringNote ? 'Restoring...' : 'Restore'}
                    </button>
                    <button 
                      className={`bg-transparent border-none w-full text-red-400 cursor-pointer flex items-center justify-start gap-2 transition-colors duration-200 menu-container ${
                        isMobile ? 'py-2 px-3 text-xs' : 'py-3 px-4 text-sm'
                      } ${loadingStates.permanentDeletingNote ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!loadingStates.permanentDeletingNote) {
                          onPermanentDeleteNote(note._id || note.id);
                          setShowTrashMenu(null);
                        }
                      }}
                      disabled={loadingStates.permanentDeletingNote}
                      onMouseEnter={e => {
                        if (!loadingStates.permanentDeletingNote) {
                          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!loadingStates.permanentDeletingNote) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {loadingStates.permanentDeletingNote ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      ) : (
                        <Trash2 size={isMobile ? 14 : 16} />
                      )}
                      {loadingStates.permanentDeletingNote ? 'Deleting...' : (isMobile ? 'Remove' : 'Remove from trash')}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex-1">
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-4 text-gray-200 leading-tight">{note.title}</h3>
                {note.content && (
                  <div 
                    className="flex-1 mb-2 md:mb-4 overflow-hidden text-gray-300 text-xs md:text-base"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      // Adjust line clamp based on card size and device
                      WebkitLineClamp: isMobile 
                        ? 4 // Increased from 1 to 4 lines for better mobile preview
                        : (note.size === 'small' ? 3 : note.size === 'medium' ? 6 : 12)
                    }}
                    dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<img[^>]*>/gi, '') }}
                  />
                )}
              </div>
              <div className="mt-auto">
                {Array.isArray(note.keywords) && note.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-end mb-3">
                    {note.keywords.slice(0, isMobile ? 3 : (note.size === 'small' ? 3 : 4)).map((keyword, index) => (
                      <span 
                        key={index} 
                        className="inline-block text-gray-200 border rounded-md px-2 py-1 text-xs transition-colors duration-200 leading-tight"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          borderColor: '#444',
                          maxWidth: note.size === 'small' ? '80px' : '100px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          minHeight: '24px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={keyword}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {(() => {
                  const images = extractImageSrcs(note.content, 2); // Only show 2 images max
                  if (images.length === 0) return null;
                  return (
                    <div className="mt-2 mb-3">
                      {images.length === 1 && (
                        <div className="flex mb-2" style={{ maxWidth: isMobile ? '78px' : '155px' }}>
                          <div className="flex-1 overflow-hidden rounded-md md:rounded-lg bg-gray-800 aspect-square">
                            <img 
                              src={images[0]} 
                              alt="note" 
                              className="w-full h-full object-cover"
                              style={{
                                background: '#181818',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.13)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {images.length === 2 && (
                        <div className="flex gap-3 mb-2" style={{ maxWidth: isMobile ? '160px' : 'none' }}>
                          {images.map((src, idx) => (
                            <div 
                              key={idx}
                              className="flex-1 overflow-hidden rounded-md md:rounded-lg bg-gray-800 aspect-square"
                            >
                              <img 
                                src={src} 
                                alt="note" 
                                className="w-full h-full object-cover"
                                style={{
                                  background: '#181818',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.13)'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotesGrid;