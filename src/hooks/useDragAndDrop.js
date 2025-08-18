import { useState, useEffect, useRef } from 'react';
import { DRAG_SETTINGS, PAGES } from '../utils/constants';

export const useDragAndDrop = (currentPage, getCurrentNotes, reorderNotes, onNotifyReorder) => {
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState(null);
  const draggedElementRef = useRef(null);
  const placeholderRef = useRef(null);

  // Auto-scroll functionality during drag (works for both mouse and touch)
  useEffect(() => {
    if (!isDragging) return;

    let animationFrame = null;
    let isScrolling = false;

    const handleAutoScroll = (y) => {
      if (y === null || y === undefined) return;
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
        animationFrame = requestAnimationFrame(() => handleAutoScroll(y));
      } else {
        isScrolling = false;
        cancelAnimationFrame(animationFrame);
      }
    };

    const onDragOver = (e) => {
      if (!isScrolling) handleAutoScroll(e.clientY);
    };

    const onTouchMove = (e) => {
      if (!isScrolling && e.touches[0]) {
        handleAutoScroll(e.touches[0].clientY);
      }
    };

    const stopAutoScroll = () => {
      isScrolling = false;
      cancelAnimationFrame(animationFrame);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('drop', stopAutoScroll);
    window.addEventListener('dragend', stopAutoScroll);
    window.addEventListener('touchend', stopAutoScroll);
    window.addEventListener('mouseup', stopAutoScroll);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('drop', stopAutoScroll);
      window.removeEventListener('dragend', stopAutoScroll);
      window.removeEventListener('touchend', stopAutoScroll);
      window.removeEventListener('mouseup', stopAutoScroll);
      stopAutoScroll();
    };
  }, [isDragging]);

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e, note, index) => {
    if (currentPage === 'trash') return;
    
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedNote(note);
    setDraggedIndex(index);
    
    // Store reference to the dragged element
    draggedElementRef.current = e.target.closest('[data-note-id]');
    
    // Don't prevent default here - let click events work if not dragging
  };

  const handleTouchMove = (e, index) => {
    if (!draggedNote || !touchStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // Only start dragging if moved significantly
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
      
      // Now prevent scrolling during drag
      e.preventDefault();
      
      // Find the element under the touch point
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const noteElement = elementBelow?.closest('[data-note-index]');
      
      if (noteElement) {
        const hoverIndex = parseInt(noteElement.getAttribute('data-note-index'));
        if (hoverIndex !== null && !isNaN(hoverIndex) && draggedIndex !== null && draggedIndex !== hoverIndex) {
          const currentNotes = getCurrentNotes();
          const updatedNotes = [...currentNotes];
          const [removed] = updatedNotes.splice(draggedIndex, 1);
          updatedNotes.splice(hoverIndex, 0, removed);

          reorderNotes(updatedNotes, draggedNote, currentPage, hoverIndex, false);
          setDraggedIndex(hoverIndex);
          setDragOverIndex(hoverIndex);
        }
      }
    }
  };

  const handleTouchEnd = async (e) => {
    const wasDragging = isDragging;
    const finalDraggedNote = draggedNote;
    const finalDraggedIndex = draggedIndex;
    const finalDragOverIndex = dragOverIndex;
    
    // Clear drag state immediately to prevent UI from getting stuck
    setTouchStartPos(null);
    setDraggedNote(null);
    setDragOverIndex(null);
    setDraggedIndex(null);
    setIsDragging(false);
    
    // If we were dragging, save the final order to backend
    if (wasDragging && finalDraggedNote && finalDraggedIndex !== null) {
      const currentNotes = getCurrentNotes();
      const finalIndex = finalDragOverIndex !== null ? finalDragOverIndex : finalDraggedIndex;
      
      try {
        await reorderNotes(currentNotes, finalDraggedNote, currentPage, finalIndex, true);
        // Notify about successful reorder
        if (onNotifyReorder) {
          onNotifyReorder(finalDraggedNote);
        }
      } catch (error) {
        // Handle error if needed
        console.error('Failed to reorder notes:', error);
      }
    }
    setIsDragging(false);
    draggedElementRef.current = null;
    
    // If we were dragging, prevent the click event
    if (wasDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Original drag handlers (for desktop)
  const handleDragStart = (e, note, index) => {
    if (currentPage === 'trash') return;
    
    setDraggedNote(note);
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', (note._id || note.id || '').toString());
    
    // Set opacity like in original implementation
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = async (e) => {
    // Save final order to backend if we had a valid drag operation
    if (draggedNote && draggedIndex !== null) {
      const currentNotes = getCurrentNotes();
      const finalIndex = dragOverIndex !== null ? dragOverIndex : draggedIndex;
      
      try {
        await reorderNotes(currentNotes, draggedNote, currentPage, finalIndex, true);
        // Notify about successful reorder
        if (onNotifyReorder) {
          onNotifyReorder(draggedNote);
        }
      } catch (error) {
        // Handle error if needed
        console.error('Failed to reorder notes:', error);
      }
    }
    
    // Reset opacity like in original implementation
    e.target.style.opacity = '1';
    setDraggedNote(null);
    setDragOverIndex(null);
    setDraggedIndex(null);
    setIsDragging(false);
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

      // Only call reorderNotes for visual feedback, don't save to backend yet
      reorderNotes(updatedNotes, draggedNote, currentPage, hoverIndex, false);

      setDraggedIndex(hoverIndex);
      setDragOverIndex(hoverIndex);
    }
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    const finalDraggedNote = draggedNote;
    const finalDraggedIndex = draggedIndex;
    const finalDragOverIndex = dragOverIndex;
    
    // Clear drag state immediately to prevent UI from getting stuck
    setDraggedNote(null);
    setDragOverIndex(null);
    setDraggedIndex(null);
    setIsDragging(false);
    
    // If we have a valid drag operation, save the final order to backend
    if (finalDraggedNote && finalDraggedIndex !== null) {
      const currentNotes = getCurrentNotes();
      const finalIndex = finalDragOverIndex !== null ? finalDragOverIndex : index;
      
      try {
        await reorderNotes(currentNotes, finalDraggedNote, currentPage, finalIndex, true);
        // Notify about successful reorder
        if (onNotifyReorder) {
          onNotifyReorder(finalDraggedNote);
        }
      } catch (error) {
        // Handle error if needed
        console.error('Failed to reorder notes:', error);
      }
    }
  };

  const handleGridDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGridDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const finalDraggedNote = draggedNote;
    const finalDragOverIndex = dragOverIndex;
    
    // Clear drag state immediately to prevent UI from getting stuck
    setDraggedNote(null);
    setDragOverIndex(null);
    setIsDragging(false);

    if (finalDraggedNote && (finalDraggedNote._id || finalDraggedNote.id) && finalDragOverIndex === null) {
      const currentNotes = getCurrentNotes();
      
      try {
        await reorderNotes(currentNotes, finalDraggedNote, currentPage, currentNotes.length - 1, true);
        // Notify about successful reorder
        if (onNotifyReorder) {
          onNotifyReorder(finalDraggedNote);
        }
      } catch (error) {
        // Handle error if needed
        console.error('Failed to reorder notes:', error);
      }
    }
  };

  return {
    draggedNote,
    dragOverIndex,
    draggedIndex,
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
  };
};