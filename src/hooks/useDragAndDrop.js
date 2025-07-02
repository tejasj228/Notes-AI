import { useState, useEffect } from 'react';
import { DRAG_SETTINGS, PAGES } from '../utils/constants';

export const useDragAndDrop = (currentPage, getCurrentNotes, reorderNotes) => {
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Auto-scroll functionality during drag
  useEffect(() => {
    if (!draggedNote) return;

    let animationFrame = null;
    let isScrolling = false;

    const handleAutoScroll = (e) => {
      if (!e) return;
      const y = e.clientY;
      const windowHeight = window.innerHeight;
      let scrolled = false;
      
      if (y < DRAG_SETTINGS.SCROLL_ZONE) {
        window.scrollBy({ top: -DRAG_SETTINGS.SCROLL_SPEED, behavior: 'auto' });
        scrolled = true;
      } else if (y > windowHeight - DRAG_SETTINGS.SCROLL_ZONE) {
        window.scrollBy({ top: DRAG_SETTINGS.SCROLL_SPEED, behavior: 'auto' });
        scrolled = true;
      }
      
      if (scrolled) {
        isScrolling = true;
        animationFrame = requestAnimationFrame(() => handleAutoScroll(e));
      } else {
        isScrolling = false;
        cancelAnimationFrame(animationFrame);
      }
    };

    const onDragOver = (e) => {
      if (!isScrolling) handleAutoScroll(e);
    };

    const stopAutoScroll = () => {
      isScrolling = false;
      cancelAnimationFrame(animationFrame);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', stopAutoScroll);
    window.addEventListener('dragend', stopAutoScroll);
    window.addEventListener('mouseup', stopAutoScroll);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', stopAutoScroll);
      window.removeEventListener('dragend', stopAutoScroll);
      window.removeEventListener('mouseup', stopAutoScroll);
      stopAutoScroll();
    };
  }, [draggedNote]);

  // FIXED: Drag handlers without opacity changes
  const handleDragStart = (e, note, index) => {
    if (currentPage === 'trash') return;
    setDraggedNote(note);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id.toString());
    // REMOVED: e.target.style.opacity = '0.5'; - This was causing transparency
  };

  const handleDragEnd = (e) => {
    // REMOVED: e.target.style.opacity = '1'; - No need to reset opacity
    setDraggedNote(null);
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, hoverIndex) => {
    e.preventDefault();
    if (draggedNote && draggedIndex !== null && draggedIndex !== hoverIndex) {
      const currentNotes = getCurrentNotes();
      const updatedNotes = [...currentNotes];
      const [removed] = updatedNotes.splice(draggedIndex, 1);
      updatedNotes.splice(hoverIndex, 0, removed);

      // This is the EXACT logic from oldcode.jsx that was working
      reorderNotes(updatedNotes, draggedNote, currentPage, hoverIndex);

      setDraggedIndex(hoverIndex);
      setDragOverIndex(hoverIndex);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedNote(null);
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleGridDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGridDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedNote && draggedNote.id && dragOverIndex === null) {
      const currentNotes = getCurrentNotes();
      reorderNotes(currentNotes, draggedNote, currentPage, currentNotes.length - 1);
    }
    setDraggedNote(null);
    setDragOverIndex(null);
  };

  return {
    draggedNote,
    dragOverIndex,
    draggedIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleGridDragOver,
    handleGridDrop
  };
};