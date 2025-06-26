import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Menu, X, Trash2, User, Sparkles, MoreVertical, RotateCcw, StickyNote, LogOut, Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';

let lastSizes = [];

const NotesApp = ({ user, onLogout }) => {
  const [notes, setNotes] = useState([
    { id: 1, title: 'Web Development', content: '...', keywords: ['React', 'JavaScript', 'CSS'], color: 'purple', size: 'medium', order: 0, images: [] },
    { id: 2, title: 'Project Ideas', content: '...', keywords: ['AI', 'Machine Learning', 'Automation'], color: 'purple', size: 'large', order: 1, images: [] },
    { id: 3, title: 'Shopping List', content: '...', keywords: ['Groceries', 'Household', 'Personal'], color: 'purple', size: 'small', order: 2, images: [] },
    { id: 4, title: 'Meeting Notes', content: '...', keywords: ['Timeline', 'Deliverables', 'Team'], color: 'purple', size: 'medium', order: 3, images: [] },
    { id: 5, title: 'Book Recommendations', content: '...', keywords: ['Programming', 'Psychology', 'Design'], color: 'purple', size: 'small', order: 4, images: [] },
    { id: 6, title: 'Workout Plan', content: '...', keywords: ['Fitness', 'Health', 'Exercise'], color: 'purple', size: 'medium', order: 5, images: [] },
    { id: 7, title: 'Travel Itinerary', content: '...', keywords: ['Vacation', 'Cities', 'Museums'], color: 'purple', size: 'large', order: 6, images: [] },
    { id: 8, title: 'Recipe Collection', content: '...', keywords: ['Cooking', 'Italian', 'Pasta'], color: 'purple', size: 'medium', order: 7, images: [] },
    { id: 9, title: 'Learning Goals', content: '...', keywords: ['Skills', 'Technology', 'Growth'], color: 'purple', size: 'small', order: 8, images: [] }
  ]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [currentPage, setCurrentPage] = useState('notes'); // 'notes' or 'trash'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrashMenu, setShowTrashMenu] = useState(null);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null); // Add this state
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);
  const [newNoteDraft, setNewNoteDraft] = useState({
    title: '',
    content: '',
    keywords: '',
    color: 'purple',
    size: 'medium'
  });
  const textareaRef = useRef(null);
  const newNoteTextareaRef = useRef(null);

  // Filter notes based on search term and current page, then sort by order
  const currentNotes = currentPage === 'notes' ? notes : trashedNotes;
  const filteredNotes = currentNotes
    .filter(note => 
      (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (
        (
          Array.isArray(note.keywords)
            ? note.keywords.join(', ')
            : (typeof note.keywords === 'string' ? note.keywords : '')
        )
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      ) ||
      (note.content && 
        (
          (() => {
            const div = document.createElement('div');
            div.innerHTML = note.content;
            return (div.textContent || div.innerText || '');
          })()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getRandomColor = () => {
    const colors = ['teal', 'brown', 'yellow', 'blue', 'purple', 'green', 'orange', 'red', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomSize = () => {
    const sizes = ['small', 'medium', 'large'];
    const weights = [0.45, 0.45, 0.1]; // More small/medium, less large
    let filteredSizes = sizes.filter(size => !lastSizes.includes(size));
    if (filteredSizes.length === 0) filteredSizes = sizes;
    // Weighted random
    let sum = 0, random = Math.random();
    for (let i = 0; i < filteredSizes.length; i++) {
      sum += weights[sizes.indexOf(filteredSizes[i])];
      if (random <= sum) {
        lastSizes.push(filteredSizes[i]);
        if (lastSizes.length > 2) lastSizes.shift();
        return filteredSizes[i];
      }
    }
    // Fallback
    const choice = filteredSizes[Math.floor(Math.random() * filteredSizes.length)];
    lastSizes.push(choice);
    if (lastSizes.length > 2) lastSizes.shift();
    return choice;
  };

  const openNewNotePopup = () => {
    setNewNoteDraft({
      title: '',
      content: '',
      keywords: '',
      color: 'purple',
      size: getRandomSize() // Use random size here
    });
    setShowNewNotePopup(true);
    setTimeout(() => {
      if (newNoteTextareaRef.current) newNoteTextareaRef.current.focus();
    }, 0);
  };

  const saveNewNote = () => {
    const keywordsArray = newNoteDraft.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const newNote = {
      id: Date.now(),
      title: newNoteDraft.title || 'Untitled Note',
      content: newNoteDraft.content || '',
      // Only add keywords if any are present, otherwise omit the property
      ...(keywordsArray.length > 0 ? { keywords: keywordsArray } : {}),
      color: newNoteDraft.color,
      size: getRandomSize(),
      order: 0,
      images: []
    };
    const updatedNotes = [newNote, ...notes].map((note, index) => ({
      ...note,
      order: index
    }));
    setNotes(updatedNotes);
    setShowNewNotePopup(false);
  };

  const deleteNote = (noteId) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteId));
      setTrashedNotes([...trashedNotes, { ...noteToDelete, trashedAt: new Date() }]);
    }
    setSelectedNote(null);
  };

  const permanentlyDeleteNote = (noteId) => {
    setTrashedNotes(trashedNotes.filter(note => note.id !== noteId));
    setShowTrashMenu(null);
  };

  const restoreNote = (noteId) => {
    const noteToRestore = trashedNotes.find(note => note.id === noteId);
    if (noteToRestore) {
      const { trashedAt, ...restoredNote } = noteToRestore;
      setTrashedNotes(trashedNotes.filter(note => note.id !== noteId));
      
      // Add restored note at the top and reorder all notes
      const updatedNotes = [{ ...restoredNote, order: -1 }, ...notes].map((note, index) => ({
        ...note,
        order: index
      }));
      
      setNotes(updatedNotes);
    }
    setShowTrashMenu(null);
  };

  const updateNote = (noteId, field, value) => {
    if (currentPage === 'notes') {
      setNotes(notes.map(note => 
        note.id === noteId ? { ...note, [field]: value } : note
      ));
    }
    // Only update selectedNote for fields other than 'content'
    if (selectedNote && selectedNote.id === noteId && field !== 'content') {
      setSelectedNote({ ...selectedNote, [field]: value });
    }
  };

  const reorderNotes = (draggedId, targetIndex) => {
    const updatedNotes = [...notes];
    const draggedIndex = updatedNotes.findIndex(note => note.id === draggedId);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    // Remove the dragged note from its current position
    const [draggedNote] = updatedNotes.splice(draggedIndex, 1);
    
    // Insert the dragged note at the target position
    // This automatically pushes other notes out of the way
    updatedNotes.splice(targetIndex, 0, draggedNote);
    
    // Update order values to match new positions
    const reorderedNotes = updatedNotes.map((note, index) => ({
      ...note,
      order: index
    }));
    
    setNotes(reorderedNotes);
  };

  // Drag handlers
  const handleDragStart = (e, note, index) => {
    if (currentPage !== 'notes') return;
    setDraggedNote(note);
    setDraggedIndex(index); // Track the index
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id.toString());
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
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
      const updatedNotes = [...notes];
      const [removed] = updatedNotes.splice(draggedIndex, 1);
      updatedNotes.splice(hoverIndex, 0, removed);
      // Update order
      const reorderedNotes = updatedNotes.map((note, idx) => ({
        ...note,
        order: idx
      }));
      setNotes(reorderedNotes);
      setDraggedIndex(hoverIndex); // Update draggedIndex to new position
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

  // Grid container drag handlers
  const handleGridDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGridDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If dropped on grid but not on a specific note, append to end
    if (draggedNote && draggedNote.id && dragOverIndex === null) {
      const maxOrder = Math.max(...notes.map(note => note.order || 0));
      reorderNotes(draggedNote.id, notes.length - 1);
    }
    setDraggedNote(null);
    setDragOverIndex(null);
  };

  const openNote = (note) => {
    setSelectedNote(note);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.innerHTML = note.content || '';
      }
    }, 0);
  };

  const closeNotePopup = () => {
    setSelectedNote(null);
  };

  const switchToNotes = () => {
    setCurrentPage('notes');
    setSearchTerm('');
  };

  const switchToTrash = () => {
    setCurrentPage('trash');
    setSearchTerm('');
  };

  const formatText = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText.length === 0) return;

    let formattedText = '';
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'bullet':
        const bulletLines = selectedText.split('\n').map(line => `• ${line.trim()}`).join('\n');
        formattedText = bulletLines;
        break;
      case 'numbered':
        const numberedLines = selectedText.split('\n').map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
        formattedText = numberedLines;
        break;
      default:
        return;
    }

    const newContent = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end);
    
    updateNote(selectedNote.id, 'content', newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const renderFormattedContent = (content) => {
    if (!content) return '';
    
    return content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Bullet points
      .replace(/^• (.+)$/gm, '<div style="margin: 4px 0;">• $1</div>')
      // Numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<div style="margin: 4px 0;">$1. $2</div>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  const getNotePreview = (content) => {
  if (!content) return '';
  // Remove all HTML tags for preview
  const tmp = document.createElement('div');
  tmp.innerHTML = content;
  return tmp.textContent || tmp.innerText || '';
};

  useEffect(() => {
    if (selectedNote && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [selectedNote]);

  // Add this effect to set content when opening the new note popup
  useEffect(() => {
    if (showNewNotePopup && newNoteTextareaRef.current) {
      newNoteTextareaRef.current.innerHTML = newNoteDraft.content || '';
    }
  }, [showNewNotePopup]);

  // --- Add this useEffect to handle image paste and resizing in both new and edit popups ---
  useEffect(() => {
    const handlePaste = (e, editorRef, setContent) => {
      if (!editorRef.current) return;
      const clipboardItems = e.clipboardData && e.clipboardData.items;
      if (!clipboardItems) return;

      let handledImage = false;
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            // Insert image at caret position
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.maxWidth = '96%';
            img.style.maxHeight = '300px';
            img.style.display = 'block';
            img.style.margin = '16px auto';
            img.style.borderRadius = '10px';
            img.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              // Move caret after image
              range.setStartAfter(img);
              range.setEndAfter(img);
              sel.removeAllRanges();
              sel.addRange(range);
            } else {
              editorRef.current.appendChild(img);
            }
            // Update content state
            setContent(editorRef.current.innerHTML);
          };
          reader.readAsDataURL(file);
          handledImage = true;
          break;
        }
      }

      // If not image, handle plain text paste
      if (!handledImage) {
        const text = e.clipboardData.getData('text/plain');
        if (text) {
          e.preventDefault();
          // Insert plain text at caret position
          document.execCommand('insertText', false, text);
          setContent(editorRef.current.innerHTML);
        }
      }
    };

    // For new note popup
    if (showNewNotePopup && newNoteTextareaRef.current) {
      const handler = (e) => handlePaste(e, newNoteTextareaRef, (html) => setNewNoteDraft(d => ({ ...d, content: html })));
      const ref = newNoteTextareaRef.current;
      ref.addEventListener('paste', handler);
      return () => ref.removeEventListener('paste', handler);
    }

    // For edit note popup
    if (selectedNote && textareaRef.current) {
      const handler = (e) => handlePaste(e, textareaRef, (html) => updateNote(selectedNote.id, 'content', html));
      const ref = textareaRef.current;
      ref.addEventListener('paste', handler);
      return () => ref.removeEventListener('paste', handler);
    }
  }, [showNewNotePopup, selectedNote]);
  // --- In the note card preview, hide images in preview ---

  const scrollSpeed = 6; // px per frame (even slower for smoothness)
const scrollZone = 80;  // px from top/bottom

useEffect(() => {
  if (!draggedNote) return;

  let animationFrame = null;
  let isScrolling = false;

  const handleAutoScroll = (e) => {
    if (!e) return;
    const y = e.clientY;
    const windowHeight = window.innerHeight;
    let scrolled = false;
    if (y < scrollZone) {
      window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
      scrolled = true;
    } else if (y > windowHeight - scrollZone) {
      window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
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
  window.addEventListener('mouseup', stopAutoScroll); // <--- important for stuck scroll

  return () => {
    window.removeEventListener('dragover', onDragOver);
    window.removeEventListener('drop', stopAutoScroll);
    window.removeEventListener('dragend', stopAutoScroll);
    window.removeEventListener('mouseup', stopAutoScroll);
    stopAutoScroll();
  };
}, [draggedNote]);

  return (
    <div className="notes-app">
      <style jsx>{`
        .notes-app {
          min-height: 100vh;
          background: #1a1a1a;
        }

        /* Global scrollbar styles */
        * {
          scrollbar-width: thin;
          scrollbar-color: #606060 #2a2a2a;
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb {
          background: #606060;
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #707070;
        }

        /* Top Navigation Bar */
        .top-nav {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(40, 40, 40, 0.9);
          backdrop-filter: blur(20px);
          padding: 12px 20px;
          border-radius: 50px;
          z-index: 1000;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          background: rgba(60, 60, 60, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          padding: 10px 16px 10px 45px;
          color: #ffffff;
          font-size: 14px;
          width: 300px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          background: rgba(70, 70, 70, 0.9);
          border-color: #8b5cf6;
        }

        .search-input::placeholder {
          color: #888;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          color: #888;
          z-index: 1;
        }

        .add-note-btn {
          background: #7c3aed; /* Changed from #8b5cf6 to match card purple */
          border: none;
          border-radius: 50px;
          padding: 10px 20px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .add-note-btn:hover {
          background: #6d28d9; /* Slightly darker on hover */
          transform: translateY(-1px);
        }

        .account-circle {
          width: 40px;
          height: 40px;
          background: #8b5cf6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .account-circle:hover {
          background: #7c3aed;
          transform: scale(1.05);
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          background: rgba(30, 30, 30, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          z-index: 999;
          width: ${sidebarOpen ? '250px' : '70px'};
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #8b5cf6;
        }

        .menu-toggle {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .sidebar-menu {
          padding: 20px 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .menu-item.active {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border-right: 3px solid #8b5cf6;
        }

        .user-info {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          padding: 20px;
          background: rgba(40, 40, 40, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-email {
          font-size: 14px;
          color: #888;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .sign-out-btn {
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ff6b6b;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }

        .sign-out-btn:hover {
          background: rgba(220, 38, 38, 0.3);
        }

        /* Main Content */
        .main-content {
          margin-left: ${sidebarOpen ? '250px' : '70px'};
          padding: 100px 40px 40px;
          transition: all 0.3s ease;
          min-height: 100vh;
        }

        /* Notes Grid */
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 0;
        }

        /* Note Card */
        .note-card {
          border-radius: 16px;
          padding: 20px;
          cursor: ${currentPage === 'notes' ? 'grab' : 'default'};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          height: 100%; /* Ensure card takes full height */
        }

        .note-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .note-card.dragging {
          opacity: 0.3;
          cursor: grabbing;
          transform: rotate(2deg) scale(0.95);
          z-index: 1000;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .note-card.drag-over {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
          border: 2px solid rgba(139, 92, 246, 0.6);
        }

        .note-card.drag-over::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 20px;
          z-index: -1;
        }

        .note-card.small {
          grid-row: span 1;
          min-height: 120px; /* was 180px */
        }

        .note-card.medium {
          grid-row: span 2;
          min-height: 170px; /* was 240px */
        }

        .note-card.large {
          grid-row: span 3;
          min-height: 230px; /* was 320px */
        }

        /* Color variations - Modern gradients with slightly lighter base for contrast */
        .note-card.teal {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #0f766e 100%);
          transition: all 0.4s ease;
        }

        .note-card.teal:hover {
          background: linear-gradient(45deg, #0f766e 0%, #0f766e 60%, #134e4a 80%, #242424 100%);
        }

        .note-card.brown {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #a16207 100%);
          transition: all 0.4s ease;
        }

        .note-card.brown:hover {
          background: linear-gradient(45deg, #a16207 0%, #a16207 60%, #b45309 80%, #242424 100%);
        }

        .note-card.yellow {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #d97706 100%);
          transition: all 0.4s ease;
        }

        .note-card.yellow:hover {
          background: linear-gradient(45deg, #d97706 0%, #d97706 60%, #ea580c 80%, #242424 100%);
        }

        .note-card.blue {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #1e40af 100%);
          transition: all 0.4s ease;
        }

        .note-card.blue:hover {
          background: linear-gradient(45deg, #1e40af 0%, #1e40af 60%, #1e3a8a 80%, #242424 100%);
        }

        .note-card.purple {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #7c3aed 100%);
          transition: all 0.4s ease;
        }

        .note-card.purple:hover {
          background: linear-gradient(45deg, #7c3aed 0%, #7c3aed 60%, #6b21a8 80%, #242424 100%);
        }

        .note-card.green {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #059669 100%);
          transition: all 0.4s ease;
        }

        .note-card.green:hover {
          background: linear-gradient(45deg, #059669 0%, #059669 60%, #047857 80%, #242424 100%);
        }

        .note-card.orange {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #ea580c 100%);
          transition: all 0.4s ease;
        }

        .note-card.orange:hover {
          background: linear-gradient(45deg, #ea580c 0%, #ea580c 60%, #c2410c 80%, #242424 100%);
        }

        .note-card.red {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #dc2626 100%);
          transition: all 0.4s ease;
        }

        .note-card.red:hover {
          background: linear-gradient(45deg, #dc2626 0%, #dc2626 60%, #b91c1c 80%, #242424 100%);
        }

        .note-card.indigo {
          background: linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #4f46e5 100%);
          transition: all 0.4s ease;
        }

        .note-card.indigo:hover {
          background: linear-gradient(45deg, #4f46e5 0%, #4f46e5 60%, #4338ca 80%, #242424 100%);
        }

        .note-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #ffffff;
          line-height: 1.3;
        }

        .note-content-preview {
          flex: 1 1 auto;
          margin-bottom: 18px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          /* Clamp lines based on card size */
        }

        .note-card.small .note-content-preview {
          -webkit-line-clamp: 5;
        }

        .note-card.medium .note-content-preview {
          -webkit-line-clamp: 10;
        }

        .note-card.large .note-content-preview {
          -webkit-line-clamp: 16;
        }

        .note-keywords {
          margin-top: auto;
          padding-bottom: 8px; /* Optional: more gap from bottom */
        }

        .keyword-tag {
          display: inline-block;
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 3px 12px;
          font-size: 13px;
          margin-right: 8px;
          margin-bottom: 4px;
          margin-top: 4px;
          transition: background 0.2s;
          white-space: nowrap;
        }

        /* Trash menu styles */
        .note-card-header {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
        }

        .trash-menu-btn {
          background: rgba(0, 0, 0, 0.3);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .trash-menu-btn:hover {
          background: rgba(0, 0, 0, 0.5);
          color: #ffffff;
        }

        .trash-menu {
          position: absolute;
          top: 40px;
          right: 0;
          background: #2a2a2a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 0;
          min-width: 160px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 20;
        }

        .trash-menu-item {
          background: none;
          border: none;
          width: 100%;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          transition: background 0.2s ease;
          text-align: left;
        }

        .trash-menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .trash-menu-item.delete {
          color: #ff6b6b;
        }

        .trash-menu-item.delete:hover {
          background: rgba(220, 38, 38, 0.1);
        }

        /* Formatting buttons */
        .popup-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .formatting-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .format-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          padding: 8px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .format-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .format-btn:active {
          background: rgba(139, 92, 246, 0.3);
          color: #8b5cf6;
        }

        /* Rich text display */
        .note-content-display {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.6;
          min-height: 400px;
          max-height: 600px;
          font-family: inherit;
          margin-bottom: 16px;
          overflow-y: auto;
          flex: 1;
          cursor: pointer;
        }

        .note-content-display:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .note-content-display strong {
          font-weight: bold;
          color: #ffffff;
        }

        .note-content-display em {
          font-style: italic;
          color: #e0e0e0;
        }

        .note-content-display del {
          text-decoration: line-through;
          color: #888;
        }

        .note-content-display u {
          text-decoration: underline;
        }

        .edit-mode-btn {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #8b5cf6;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: 8px;
        }

        .edit-mode-btn:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        /* Note Popup */
        .note-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .note-popup {
          background: #2a2a2a;
          border-radius: 16px;
          padding: 32px;
          width: 750px;         
          height: 800px;        /* Default for new note popup */
          max-width: 90vw;
          max-height: 90vh;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Only for edit note popup: make popup and content editor larger */
        .note-popup.edit-mode {
          height: 900px !important;
        }
        .note-popup.edit-mode .note-content-editable {
          min-height: 550px !important;
          height: 550px !important;
          max-height: 600px;
        }

        .note-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .note-title-input {
          background: transparent;
          border: none;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          outline: none;
          flex: 1;
          margin-right: 16px;
        }

        .popup-actions {
          display: flex;
          gap: 8px;
        }

        .popup-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          padding: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .popup-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .popup-btn.delete:hover {
          background: rgba(220, 38, 38, 0.3);
          color: #ff6b6b;
        }

        .note-content-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          min-height: 400px;
          max-height: 600px;
          font-family: inherit;
          margin-bottom: 16px;
          overflow-y: auto;
          flex: 1;
        }

        .note-content-textarea:focus {
          border-color: #8b5cf6;
          background: rgba(255, 255, 255, 0.08);
        }

        .open-ai-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          margin: 0 auto;
        }

        .open-ai-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4);
        }

        /* Color picker styles */
        .color-picker {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
        }

        .color-picker-label {
          font-size: 14px;
          color: #cccccc;
          margin-right: 8px;
          font-weight: 500;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.3s ease;
          position: relative;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.selected {
          border-color: #ffffff;
          transform: scale(1.15);
        }

        .color-option.selected::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }

        .color-option.teal { background: linear-gradient(45deg, #0f766e, #14b8a6); }
        .color-option.brown { background: linear-gradient(45deg, #a16207, #d97706); }
        .color-option.yellow { background: linear-gradient(45deg, #d97706, #f59e0b); }
        .color-option.blue { background: linear-gradient(45deg, #1e40af, #3b82f6); }
        .color-option.purple { background: linear-gradient(45deg, #7c3aed, #8b5cf6); }
        .color-option.green { background: linear-gradient(45deg, #059669, #10b981); }
        .color-option.orange { background: linear-gradient(45deg, #ea580c, #f97316); }
        .color-option.red { background: linear-gradient(45deg, #dc2626, #ef4444); }
        .color-option.indigo { background: linear-gradient(45deg, #4f46e5, #6366f1); }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 100px 20px 40px;
          }

          .sidebar {
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
            width: 250px;
          }

          .top-nav {
            left: 20px;
            right: 20px;
            transform: none;
          }

          .search-input {
            width: 200px;
          }

          .notes-grid {
            grid-template-columns: 1fr;
          }

          .note-card {
            cursor: default;
          }
        }

        .note-keywords-input {
          background: transparent;
          border: none;
          font-size: 14px;
          color: #cccccc;
          outline: none;
          margin-bottom: 12px;
          width: 100%;
          font-weight: 400;
          padding: 0;
        }

        .note-keywords-input::placeholder {
          color: #888;
          font-weight: 400;
        }

        .formatting-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .formatting-toolbar button {
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 6px;
          padding: 6px 8px;
          color: #cccccc;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
        }
        .formatting-toolbar button:hover {
          background: rgba(139,92,246,0.15);
          color: #8b5cf6;
        }
        .note-content-editable {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
          color: #fff;
          font-size: 14px;
          line-height: 1.6;
          min-height: 500px;    /* Increased from 200px */
          max-height: 600px;    /* Keep max-height for scroll */
          font-family: inherit;
          margin-bottom: 16px;
          overflow-y: auto;
          transition: border-color 0.2s;
          outline: none;
          position: relative;
        }
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
        .note-content-editable:focus {
          border-color: #8b5cf6;
          background: rgba(255,255,255,0.08);
        }

        /* Note Images Collage */
.note-images-collage {
  display: flex;
  gap: 6px;
  margin: 10px 0 0 0;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
}
.note-images-collage img {
  border-radius: 8px;
  object-fit: cover;
  background: #181818;
  box-shadow: 0 2px 8px rgba(0,0,0,0.13);
}
.note-images-collage.images-1 img {
  width: 100%;
  height: 90px;
}
.note-images-collage.images-2 img {
  width: 49%;
  height: 70px;
}
.note-images-collage.images-3 img {
  width: 32%;
  height: 60px;
}
.note-images-collage.images-4 img {
  width: 24%;
  height: 55px;
}
      `}</style>

      {/* Top Navigation */}
      <div className="top-nav">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={`Search ${currentPage}...`}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {currentPage === 'notes' && (
          <button className="add-note-btn" onClick={openNewNotePopup}>
            <Plus size={20} />
            Add a note...
          </button>
        )}
        <div className="account-circle">
          <User size={20} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          {sidebarOpen && <div className="logo">NOTES AI</div>}
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
        </div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${currentPage === 'notes' ? 'active' : ''}`}
            onClick={switchToNotes}
          >
            <StickyNote size={20} />
            {sidebarOpen && 'Notes'}
          </button>
          <button 
            className={`menu-item ${currentPage === 'trash' ? 'active' : ''}`}
            onClick={switchToTrash}
          >
            <Trash2 size={20} />
            {sidebarOpen && 'Trash'}
          </button>
        </div>

        {sidebarOpen && (
          <div className="user-info">
            <div className="user-email">
              Signed in as:<br />
              {user ? user.email : 'user@example.com'}
            </div>
            <button className="sign-out-btn" onClick={onLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div 
          className="notes-grid"
          onDragOver={handleGridDragOver}
          onDrop={handleGridDrop}
        >
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              className={`note-card ${note.color} ${note.size} ${
                draggedNote && draggedNote.id === note.id ? 'dragging' : ''
              } ${
                dragOverIndex === index ? 'drag-over' : ''
              }`}
              draggable={currentPage === 'notes'}
              onDragStart={(e) => handleDragStart(e, note, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => currentPage === 'notes' ? openNote(note) : null}
              style={{ cursor: currentPage === 'trash' ? 'default' : 'grab' }}
            >
              {currentPage === 'trash' && (
                <div className="note-card-header">
                  <button 
                    className="trash-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTrashMenu(showTrashMenu === note.id ? null : note.id);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showTrashMenu === note.id && (
                    <div className="trash-menu">
                      <button 
                        className="trash-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreNote(note.id);
                        }}
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button 
                        className="trash-menu-item delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          permanentlyDeleteNote(note.id);
                        }}
                      >
                        <Trash2 size={16} />
                        Remove from trash
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div>
                <h3 className="note-title">{note.title}</h3>
                {note.content && (
                  <div 
                    className="note-content-preview"
                    dangerouslySetInnerHTML={{ 
                      __html: (note.content || '').replace(/<img[^>]*>/gi, '') // Remove images for card preview
                    }}
                  />
                )}
              </div>
              {Array.isArray(note.keywords) && note.keywords.length > 0 && (
                <div className="note-keywords">
                  {note.keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              {(() => {
  const images = extractImageSrcs(note.content, 4);
  if (images.length === 0) return null;
  return (
    <div className={`note-images-collage images-${images.length}`}>
      {images.map((src, idx) => (
        <img key={idx} src={src} alt="note" />
      ))}
    </div>
  );
})()}
            </div>
          ))}
        </div>
      </div>

      {/* New Note Popup */}
      {showNewNotePopup && (
        <div className="note-popup-overlay" onClick={() => setShowNewNotePopup(false)}>
          <div className="note-popup" onClick={e => e.stopPropagation()}>
            <div className="note-popup-header">
              <input
                type="text"
                className="note-title-input"
                value={newNoteDraft.title}
                onChange={e => setNewNoteDraft({ ...newNoteDraft, title: e.target.value })}
                placeholder="Note title..."
              />
              <div className="popup-actions">
                <button
                  className="popup-btn"
                  onClick={() => setShowNewNotePopup(false)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Color Picker */}
            <div className="color-picker">
              <span className="color-picker-label">Color:</span>
              {['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'].map((color) => (
                <div
                  key={color}
                  className={`color-option ${color} ${newNoteDraft.color === color ? 'selected' : ''}`}
                  onClick={() => setNewNoteDraft({ ...newNoteDraft, color })}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
            {/* Keywords */}
            <input
              type="text"
              className="note-title-input"
              value={newNoteDraft.keywords}
              onChange={e => setNewNoteDraft({ ...newNoteDraft, keywords: e.target.value })}
              placeholder="Keywords (comma separated)..."
              style={{ marginBottom: 12 }}
            />
            {/* Formatting Toolbar BELOW the content box */}
            <div>
              <div
                ref={newNoteTextareaRef}
                className="note-content-editable"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={e => setNewNoteDraft({ ...newNoteDraft, content: e.currentTarget.innerHTML })}
                data-placeholder="Start writing your note here..."
                style={{ minHeight: 500, maxHeight: 600, outline: 'none', height: 500, overflowY: 'auto' }}
              />
              <div className="popup-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="format-btn"
                  title="Insert Image"
                  onClick={() => handleInsertImage(newNoteTextareaRef, html => setNewNoteDraft(d => ({ ...d, content: html })))}
                  style={{
                    marginRight: 8,
                    padding: '8px',        // Match .format-btn
                    fontSize: '13px',      // Match icon size
                    height: '32px',        // Ensures same height as formatting buttons
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  🖼️ Insert Image
                </button>
                <FormattingToolbar editorRef={newNoteTextareaRef} />
                <button
                  className="open-ai-btn"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    marginLeft: 24,
                    marginRight: 8
                  }}
                  onClick={saveNewNote}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Popup */}
      {selectedNote && (
        <div className="note-popup-overlay" onClick={closeNotePopup}>
          <div className="note-popup edit-mode" onClick={e => e.stopPropagation()}>
            <div className="note-popup-header">
              <input
                type="text"
                className="note-title-input"
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, 'title', e.target.value)}
                placeholder="Note title..."
              />
              <div className="popup-actions">
                <button 
                  className="popup-btn delete"
                  onClick={() => deleteNote(selectedNote.id)}
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  className="popup-btn"
                  onClick={closeNotePopup}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="color-picker">
              <span className="color-picker-label">Color:</span>
              {['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'].map((color) => (
                <div
                  key={color}
                  className={`color-option ${color} ${selectedNote.color === color ? 'selected' : ''}`}
                  onClick={() => updateNote(selectedNote.id, 'color', color)}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
            
            {/* Keywords Editor */}
            <input
              type="text"
              className="note-keywords-input"
              value={Array.isArray(selectedNote.keywords) ? selectedNote.keywords.join(', ') : selectedNote.keywords}
              onChange={e => {
                updateNote(
                  selectedNote.id,
                  'keywords',
                  e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                );
              }}
              placeholder="Keywords (comma separated)..."
              style={{ marginBottom: 12 }}
            />
            {/* Formatting Toolbar BELOW the content box */}
            <div>
              <div
                ref={textareaRef}
                className="note-content-editable"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={e => updateNote(selectedNote.id, 'content', e.currentTarget.innerHTML)}
                data-placeholder="Start writing your note here..."
                style={{ minHeight: 500, maxHeight: 600, outline: 'none', height: 500, overflowY: 'auto' }}
              />
              <div className="popup-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="format-btn"
                  title="Insert Image"
                  onClick={() => handleInsertImage(textareaRef, html => updateNote(selectedNote.id, 'content', html))}
                  style={{ marginRight: 8 }}
                >
                  🖼️ Insert Image
                </button>
                <FormattingToolbar editorRef={textareaRef} />
                <button
                  className="open-ai-btn"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    marginLeft: 24,
                    marginRight: 8
                  }}
                >
                  <Sparkles size={18} style={{ marginRight: 8 }} />
                  Open with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FormattingToolbar editorRef={textareaRef} />
    </div>
  );
};

const FormattingToolbar = ({ editorRef }) => (
  <div className="formatting-toolbar">
    <button type="button" title="Bold" onMouseDown={e => { e.preventDefault(); document.execCommand('bold'); editorRef.current.focus(); }}>
      <Bold size={16} />
    </button>
    <button type="button" title="Italic" onMouseDown={e => { e.preventDefault(); document.execCommand('italic'); editorRef.current.focus(); }}>
      <Italic size={16} />
    </button>
    <button type="button" title="Underline" onMouseDown={e => { e.preventDefault(); document.execCommand('underline'); editorRef.current.focus(); }}>
      <Underline size={16} />
    </button>
    <button type="button" title="Strikethrough" onMouseDown={e => { e.preventDefault(); document.execCommand('strikeThrough'); editorRef.current.focus(); }}>
      <Strikethrough size={16} />
    </button>
    <button type="button" title="Bullet List" onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); editorRef.current.focus(); }}>
      <List size={16} />
    </button>
    <button type="button" title="Numbered List" onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); editorRef.current.focus(); }}>
      <ListOrdered size={16} />
    </button>
  </div>
);

function extractImageSrcs(html, max = 4) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = Array.from(div.querySelectorAll('img')).slice(0, max);
  return imgs.map(img => img.src);
}

// Add this helper function at the top (outside the component)
function insertImageAtCaret(editorRef, imageUrl) {
  const editor = editorRef.current;
  if (!editor) return;
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.maxWidth = '96%';
  img.style.maxHeight = '300px';
  img.style.display = 'block';
  img.style.margin = '16px auto';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';

  const sel = window.getSelection();
  // Check if selection is inside the editor
  if (
    sel &&
    sel.rangeCount > 0 &&
    editor.contains(sel.anchorNode)
  ) {
    let range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    // Move caret after image
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Insert at the start of the content
    editor.insertBefore(img, editor.firstChild);
  }
}

// ...inside NotesApp component...

// Add this handler inside NotesApp (before return)
const handleInsertImage = async (editorRef, setContent) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Only allow images < 1MB
    // if (file.size > 1024 * 1024) {
    //   alert('Please select an image smaller than 1MB.');
    //   return;
    // }
    const resizedDataUrl = await resizeImage(file);
    insertImageAtCaret(editorRef, resizedDataUrl);
    setContent(editorRef.current.innerHTML);
  };
  input.click();
};

function resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default NotesApp;
