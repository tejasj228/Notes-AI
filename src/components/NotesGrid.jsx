'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { PAGES } from '@/utils/constants';
import { getNoteColor, getSizeStyles, extractImageSrcs, filterNotes } from '@/utils/helpers';

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
  loadingStates = {},
}) => {
  const [showTrashMenu, setShowTrashMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-container')) setShowTrashMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const {
    draggedNote,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleGridDragOver,
    handleGridDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = dragHandlers;

  let filteredNotes = filterNotes(notes, searchTerm);
  if (currentPage === PAGES.TRASH) {
    filteredNotes = filteredNotes.sort((a, b) => {
      if (a.deletedAt && b.deletedAt) return new Date(b.deletedAt) - new Date(a.deletedAt);
      if (a.deletedAt) return -1;
      if (b.deletedAt) return 1;
      return 0;
    });
  } else {
    filteredNotes = filteredNotes.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  const idOf = (n) => n._id || n.id;

  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center min-h-[55vh] py-16">
      <div className="border-3 border-ink bg-card shadow-brutal px-8 py-10 text-center max-w-md rotate-[-1deg]">
        <div className="text-5xl mb-4">
          {currentPage === PAGES.TRASH ? '🗑️' : currentPage === PAGES.FOLDER ? '📁' : '✍️'}
        </div>
        <h3 className="font-display font-extrabold text-2xl mb-2">
          {currentPage === PAGES.TRASH
            ? 'Trash is empty'
            : currentPage === PAGES.FOLDER
            ? 'Nothing in this folder'
            : 'No notes yet'}
        </h3>
        <p className="text-sm text-ink/70 mb-6">
          {currentPage === PAGES.TRASH
            ? 'Deleted notes land here first.'
            : currentPage === PAGES.FOLDER
            ? 'Add the first note to this folder.'
            : 'Hit “New note” to capture your first idea.'}
        </p>
        {(currentPage === PAGES.NOTES || (currentPage === PAGES.FOLDER && currentFolder)) && (
          <button className="brutal-btn bg-brand text-white px-5 py-2.5 text-sm" onClick={onAddNote}>
            <Plus size={18} strokeWidth={3} /> Create note
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="grid gap-5 md:gap-6 max-w-7xl mx-auto py-4 w-full"
      style={{
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gridAutoRows: isMobile ? '150px' : '190px',
      }}
      onDragOver={handleGridDragOver}
      onDrop={handleGridDrop}
    >
      {filteredNotes.length === 0 ? (
        <EmptyState />
      ) : (
        filteredNotes.map((note, index) => {
          const isDragged = draggedNote && idOf(draggedNote) === idOf(note);
          const isOver = dragOverIndex === index;
          const color = getNoteColor(note.color);
          const images = extractImageSrcs(note.content, 2);

          return (
            <div
              key={idOf(note)}
              className={`relative overflow-hidden border-3 border-ink p-4 flex flex-col transition-all duration-150 ${
                currentPage !== PAGES.TRASH ? 'cursor-grab' : 'cursor-default'
              } ${!isDragged && !isOver ? 'hover:-translate-x-[3px] hover:-translate-y-[3px]' : ''}`}
              style={{
                background: color,
                color: '#141210',
                transform: isDragged
                  ? 'rotate(-2deg) scale(0.97)'
                  : isOver
                  ? 'translate(-3px,-3px)'
                  : 'none',
                boxShadow: isDragged
                  ? '10px 12px 0 0 rgba(20,18,16,0.35)'
                  : isOver
                  ? '9px 9px 0 0 #7C5CFF'
                  : '5px 5px 0 0 rgb(var(--ink-rgb))',
                opacity: isDragged ? 0.85 : 1,
                touchAction: currentPage !== PAGES.TRASH ? 'manipulation' : 'auto',
                userSelect: 'none',
                ...getSizeStyles(note.size, isMobile),
              }}
              draggable={currentPage !== PAGES.TRASH}
              data-note-id={idOf(note)}
              data-note-index={index}
              onDragStart={(e) => handleDragStart(e, note, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onTouchStart={(e) => handleTouchStart(e, note, index)}
              onTouchMove={(e) => handleTouchMove(e, index)}
              onTouchEnd={handleTouchEnd}
              onClick={() => (currentPage !== PAGES.TRASH ? onOpenNote(note) : null)}
              onMouseEnter={(e) => {
                if (!isDragged && !isOver) e.currentTarget.style.boxShadow = '9px 9px 0 0 rgb(var(--ink-rgb))';
              }}
              onMouseLeave={(e) => {
                if (!isDragged && !isOver) e.currentTarget.style.boxShadow = '5px 5px 0 0 rgb(var(--ink-rgb))';
              }}
            >
              {/* deletion / restore overlay */}
              {((loadingStates.deletingNote && isDragged) ||
                (loadingStates.restoringNote && showTrashMenu === idOf(note))) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
                  <div className="w-8 h-8 border-3 border-ink border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Trash menu */}
              {currentPage === PAGES.TRASH && (
                <div className="absolute top-2 right-2 z-10 menu-container">
                  <button
                    className="border-2 border-ink bg-card w-7 h-7 flex items-center justify-center menu-container hover:bg-ink-fixed hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTrashMenu(showTrashMenu === idOf(note) ? null : idOf(note));
                    }}
                  >
                    <MoreVertical size={15} strokeWidth={2.75} />
                  </button>
                  {showTrashMenu === idOf(note) && (
                    <div className="absolute top-9 right-0 border-3 border-ink bg-card shadow-brutal min-w-[150px] menu-container animate-pop-in">
                      <button
                        className="w-full px-3 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-note-green menu-container disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!loadingStates.restoringNote) {
                            onRestoreNote(idOf(note));
                            setShowTrashMenu(null);
                          }
                        }}
                        disabled={loadingStates.restoringNote}
                      >
                        <RotateCcw size={15} strokeWidth={2.5} /> Restore
                      </button>
                      <div className="h-[3px] bg-ink" />
                      <button
                        className="w-full px-3 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-note-red menu-container disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!loadingStates.permanentDeletingNote) {
                            onPermanentDeleteNote(idOf(note));
                            setShowTrashMenu(null);
                          }
                        }}
                        disabled={loadingStates.permanentDeletingNote}
                      >
                        <Trash2 size={15} strokeWidth={2.5} /> Delete forever
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-display font-extrabold text-base md:text-lg leading-tight mb-2 pr-6 break-words">
                  {note.title}
                </h3>
                {note.content && (
                  <div
                    className="clamp text-xs md:text-sm text-ink-fixed/80 leading-snug flex-1"
                    style={{
                      // Fewer lines when an image thumbnail is also shown, so the two
                      // never fight for the same vertical space.
                      WebkitLineClamp: isMobile
                        ? images.length ? 2 : 4
                        : note.size === 'small'
                        ? images.length ? 1 : 3
                        : note.size === 'large'
                        ? images.length ? 8 : 11
                        : images.length ? 3 : 6,
                    }}
                    dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<img[^>]*>/gi, '') }}
                  />
                )}
              </div>

              {/* Footer: images + keywords */}
              <div className="mt-3 space-y-2 flex-shrink-0">
                {images.length > 0 && (
                  <div className="flex gap-2">
                    {images.map((src, idx) => (
                      <div
                        key={idx}
                        className="border-2 border-ink overflow-hidden bg-card flex-shrink-0"
                        style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56 }}
                      >
                        <img src={src} alt="note" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(note.keywords) && note.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.keywords.slice(0, 3).map((keyword, i) => (
                      <span
                        key={i}
                        className="inline-block border-2 border-ink bg-white/70 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide truncate max-w-[100px]"
                        title={keyword}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default NotesGrid;
