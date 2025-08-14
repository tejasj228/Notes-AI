import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { PAGES } from '../utils/constants';
import { getNoteBackground, getNoteHoverBackground, getSizeClasses, extractImageSrcs, filterNotes } from '../utils/helpers';

const NotesGrid = ({
  currentPage,
  currentFolder,
  notes,
  searchTerm,
  onOpenNote,
  onAddNote,
  onRestoreNote,
  onPermanentDeleteNote,
  dragHandlers
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
      className="grid gap-3 md:gap-5 max-w-6xl mx-auto py-3 md:py-5 w-full md:px-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      onDragOver={handleGridDragOver}
      onDrop={handleGridDrop}
    >
      {filteredNotes.length === 0 ? (
        <EmptyState />
      ) : (
        filteredNotes.map((note, index) => (
          <div
            key={note.id}
            className={`
              rounded-xl md:rounded-2xl p-3 md:p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-start h-full
              ${currentPage !== PAGES.TRASH ? 'cursor-grab' : 'cursor-default'}
              ${draggedNote && draggedNote.id === note.id ? 'opacity-30 cursor-grabbing z-50' : ''}
              ${dragOverIndex === index ? 'border-2' : ''}
              hover:shadow-2xl
              ${getSizeClasses(note.size)}
            `}
            style={{
              background: getNoteBackground(note.color),
              transform: draggedNote && draggedNote.id === note.id ? 'rotate(2deg) scale(0.95)' : 
                        dragOverIndex === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
              borderColor: dragOverIndex === index ? 'rgba(139, 92, 246, 0.6)' : 'transparent',
              boxShadow: draggedNote && draggedNote.id === note.id ? '0 20px 40px rgba(0, 0, 0, 0.5)' : 
                        dragOverIndex === index ? '0 15px 40px rgba(139, 92, 246, 0.4)' : '0 0 0 rgba(0, 0, 0, 0)',
              transition: 'all 0.3s ease',
              touchAction: currentPage !== PAGES.TRASH ? 'manipulation' : 'auto',
              userSelect: 'none'
            }}
            draggable={currentPage !== PAGES.TRASH}
            data-note-id={note.id}
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
              if (!(draggedNote && draggedNote.id === note.id) && dragOverIndex !== index) {
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
              <div className="absolute top-4 right-4 z-10">
                <button 
                  className="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-300"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrashMenu(showTrashMenu === note.id ? null : note.id);
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                    e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                {showTrashMenu === note.id && (
                  <div 
                    className="absolute top-10 right-0 border rounded-lg py-2 min-w-40 z-20"
                    style={{
                      background: '#2a2a2a',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <button 
                      className="bg-transparent border-none w-full py-3 px-4 text-gray-200 text-sm cursor-pointer flex items-center justify-start gap-3 transition-colors duration-200 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreNote(note.id);
                        setShowTrashMenu(null);
                      }}
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                    <button 
                      className="bg-transparent border-none w-full py-3 px-4 text-red-400 text-sm cursor-pointer flex items-center justify-start gap-3 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDeleteNote(note.id);
                        setShowTrashMenu(null);
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(220, 38, 38, 0.1)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      <Trash2 size={16} />
                      Remove from trash
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <div>
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-4 text-gray-200 leading-tight">{note.title}</h3>
                {note.content && (
                  <div 
                    className="flex-1 mb-2 md:mb-4 overflow-hidden text-gray-300 text-sm md:text-base"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: isMobile 
                        ? (note.size === 'small' ? 3 : note.size === 'medium' ? 5 : 8)
                        : (note.size === 'small' ? 5 : note.size === 'medium' ? 10 : 16)
                    }}
                    dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<img[^>]*>/gi, '') }}
                  />
                )}
              </div>
              <div className="mt-auto">
                {Array.isArray(note.keywords) && note.keywords.length > 0 && (
                  <div className="pb-2">
                    {note.keywords.slice(0, isMobile ? 4 : 3).map((keyword, index) => (
                      <span 
                        key={index} 
                        className="inline-block text-gray-200 border rounded-md md:rounded-lg px-2 md:px-3 py-1 text-xs mr-1 md:mr-2 mb-1 mt-1 transition-colors duration-200 whitespace-nowrap"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          borderColor: '#444'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {(() => {
                  const images = extractImageSrcs(note.content, 2);
                  if (images.length === 0) return null;
                  return (
                    <div className="flex gap-1 md:gap-1.5 mt-2 md:mt-2.5 w-full justify-start items-center">
                      {images.slice(0, 2).map((src, idx) => (
                        <img 
                          key={idx} 
                          src={src} 
                          alt="note" 
                          className={`rounded-md md:rounded-lg object-cover shadow-sm ${
                            images.length === 1 ? 'w-full h-14 md:h-20' : 'w-1/2 h-10 md:h-16'
                          }`}
                          style={{
                            background: '#181818',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.13)'
                          }}
                        />
                      ))}
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