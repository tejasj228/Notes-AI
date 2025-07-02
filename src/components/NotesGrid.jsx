import React, { useState } from 'react';
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
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const {
    draggedNote,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleGridDragOver,
    handleGridDrop
  } = dragHandlers;

  // Add CSS for drag animations - UPDATED to remove transparency AND fix z-index
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dragFloat {
        0% { transform: translateY(-12px) scale(1.05); }
        100% { transform: translateY(-16px) scale(1.08); }
      }
      
      @keyframes dragPulse {
        0%, 100% { box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4), 0 0 0 2px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 25px 50px rgba(139, 92, 246, 0.6), 0 0 0 3px rgba(139, 92, 246, 0.5); }
      }
      
      .drag-selected {
        animation: dragFloat 2s ease-in-out infinite alternate, dragPulse 1.5s ease-in-out infinite;
        /* FIXED: Lower z-index to stay below top navigation (z-50) */
        z-index: 40 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filter and sort notes
  const filteredNotes = filterNotes(notes, searchTerm)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Empty State Component
  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center min-h-[60vh] py-20 text-gray-400">
      <h3 className="text-xl font-semibold mb-2">
        {currentPage === PAGES.TRASH ? 'Trash is empty' :
         currentPage === PAGES.FOLDER ? 'No notes in this folder' : 'No notes yet'}
      </h3>
      <p className="text-sm text-center">
        {currentPage === PAGES.TRASH ? 'Deleted notes will appear here' :
         currentPage === PAGES.FOLDER ? 'Create your first note in this folder' : 'Create your first note to get started'}
      </p>
      {(currentPage === PAGES.NOTES || (currentPage === PAGES.FOLDER && currentFolder)) && (
        <button 
          className="mt-4 border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
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

  // Note Card Component - FIXED DRAG STYLING AND Z-INDEX
  const NoteCard = ({ note, index }) => {
    const images = extractImageSrcs(note.content, 2);

    return (
      <div
        key={note.id}
        className={`
          rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-start h-full
          ${currentPage !== PAGES.TRASH ? 'cursor-grab' : 'cursor-default'}
          ${draggedNote && draggedNote.id === note.id ? 'cursor-grabbing border-2 drag-selected' : ''}
          ${dragOverIndex === index ? 'border-2' : ''}
          hover:shadow-2xl
          ${getSizeClasses(note.size)}
        `}
        style={{
          // FIXED: Keep the original gradient when dragging - no overlay or transparency
          background: getNoteBackground(note.color),
          transform: dragOverIndex === index && !(draggedNote && draggedNote.id === note.id)
            ? 'translateY(-8px) scale(1.02)' 
            : draggedNote && draggedNote.id === note.id
              ? 'translateY(-12px) scale(1.05)'
              : 'translateY(0)',
          borderColor: draggedNote && draggedNote.id === note.id 
            ? 'rgba(139, 92, 246, 0.8)' 
            : dragOverIndex === index 
              ? 'rgba(139, 92, 246, 0.6)' 
              : 'transparent',
          // FIXED: Use z-index 40 instead of 50 to stay below top navigation
          zIndex: draggedNote && draggedNote.id === note.id ? '40' : 'auto',
          transition: draggedNote && draggedNote.id === note.id 
            ? 'border-color 0.3s ease, transform 0.3s ease' 
            : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        draggable={currentPage !== PAGES.TRASH}
        onDragStart={(e) => {
          handleDragStart(e, note, index);
          // FIXED: Don't change opacity on drag start
          // e.target.style.opacity = '0.5'; // REMOVED THIS LINE
        }}
        onDragEnd={(e) => {
          handleDragEnd(e);
          // FIXED: Don't reset opacity since we never changed it
          // e.target.style.opacity = '1'; // REMOVED THIS LINE
        }}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDrop={(e) => handleDrop(e, index)}
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
        {/* Trash Menu for deleted notes */}
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
                if (showTrashMenu === note.id) {
                  setShowTrashMenu(null);
                } else {
                  // Get button position for menu placement
                  const rect = e.target.getBoundingClientRect();
                  setMenuPosition({
                    x: rect.right - 160, // Position menu to the left of button
                    y: rect.bottom + 5   // Position below button
                  });
                  setShowTrashMenu(note.id);
                }
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

          </div>
        )}

        <div className="flex-1 flex flex-col">
          {/* Note Content */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-200 leading-tight">{note.title}</h3>
            {note.content && (
              <div 
                className="flex-1 mb-4 overflow-hidden text-gray-300"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: note.size === 'small' ? 5 : note.size === 'medium' ? 10 : 16
                }}
                // Remove images from preview
                dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<img[^>]*>/gi, '') }}
              />
            )}
          </div>
          {/* Bottom section: keywords and image preview */}
          <div className="mt-auto">
            {/* Keywords */}
            {Array.isArray(note.keywords) && note.keywords.length > 0 && (
              <div className="pb-2">
                {note.keywords.map((keyword, index) => (
                  <span 
                    key={index} 
                    className="inline-block text-gray-200 border rounded-lg px-3 py-1 text-xs mr-2 mb-1 mt-1 transition-colors duration-200 whitespace-nowrap"
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

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="flex gap-1.5 mt-2.5 w-full justify-start items-center">
                {images.slice(0, 2).map((src, idx) => (
                  <img 
                    key={idx} 
                    src={src} 
                    alt="note" 
                    className={`rounded-lg object-cover shadow-sm ${
                      images.length === 1 ? 'w-full h-20' : 'w-1/2 h-16'
                    }`}
                    style={{
                      background: '#181818',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.13)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="grid gap-5 max-w-6xl mx-auto py-5"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
      onDragOver={handleGridDragOver}
      onDrop={handleGridDrop}
    >
      {filteredNotes.length === 0 ? (
        <EmptyState />
      ) : (
        filteredNotes.map((note, index) => (
          <NoteCard key={note.id} note={note} index={index} />
        ))
      )}
      
      {/* Independent Trash Menu - positioned near the clicked button */}
      {showTrashMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowTrashMenu(null)}
        >
          <div
            className="absolute border rounded-lg py-2 min-w-40"
            style={{
              background: '#2a2a2a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'none' // Remove the centering transform
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="bg-transparent border-none w-full py-3 px-4 text-gray-200 text-sm cursor-pointer flex items-center justify-start gap-3 transition-colors duration-200 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onRestoreNote(showTrashMenu);
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
                onPermanentDeleteNote(showTrashMenu);
                setShowTrashMenu(null);
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(220, 38, 38, 0.1)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              <Trash2 size={16} />
              Remove from trash
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesGrid;