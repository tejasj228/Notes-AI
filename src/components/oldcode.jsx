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
  const [currentPage, setCurrentPage] = useState('notes');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrashMenu, setShowTrashMenu] = useState(null);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);
  const [newNoteDraft, setNewNoteDraft] = useState({
    title: '',
    content: '',
    keywords: '',
    color: 'purple',
    size: 'medium'
  });
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
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
    const weights = [0.45, 0.45, 0.1];
    let filteredSizes = sizes.filter(size => !lastSizes.includes(size));
    if (filteredSizes.length === 0) filteredSizes = sizes;
    let sum = 0, random = Math.random();
    for (let i = 0; i < filteredSizes.length; i++) {
      sum += weights[sizes.indexOf(filteredSizes[i])];
      if (random <= sum) {
        lastSizes.push(filteredSizes[i]);
        if (lastSizes.length > 2) lastSizes.shift();
        return filteredSizes[i];
      }
    }
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
      size: getRandomSize()
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
    if (selectedNote && selectedNote.id === noteId && field !== 'content') {
      setSelectedNote({ ...selectedNote, [field]: value });
    }
  };

  const reorderNotes = (draggedId, targetIndex) => {
    const updatedNotes = [...notes];
    const draggedIndex = updatedNotes.findIndex(note => note.id === draggedId);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const [draggedNote] = updatedNotes.splice(draggedIndex, 1);
    updatedNotes.splice(targetIndex, 0, draggedNote);
    
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
    setDraggedIndex(index);
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
      const reorderedNotes = updatedNotes.map((note, idx) => ({
        ...note,
        order: idx
      }));
      setNotes(reorderedNotes);
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

  useEffect(() => {
    if (selectedNote && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [selectedNote]);

  useEffect(() => {
    if (showNewNotePopup && newNoteTextareaRef.current) {
      newNoteTextareaRef.current.innerHTML = newNoteDraft.content || '';
    }
  }, [showNewNotePopup]);

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
              range.setStartAfter(img);
              range.setEndAfter(img);
              sel.removeAllRanges();
              sel.addRange(range);
            } else {
              editorRef.current.appendChild(img);
            }
            setContent(editorRef.current.innerHTML);
          };
          reader.readAsDataURL(file);
          handledImage = true;
          break;
        }
      }

      if (!handledImage) {
        const text = e.clipboardData.getData('text/plain');
        if (text) {
          e.preventDefault();
          document.execCommand('insertText', false, text);
          setContent(editorRef.current.innerHTML);
        }
      }
    };

    if (showNewNotePopup && newNoteTextareaRef.current) {
      const handler = (e) => handlePaste(e, newNoteTextareaRef, (html) => setNewNoteDraft(d => ({ ...d, content: html })));
      const ref = newNoteTextareaRef.current;
      ref.addEventListener('paste', handler);
      return () => ref.removeEventListener('paste', handler);
    }

    if (selectedNote && textareaRef.current) {
      const handler = (e) => handlePaste(e, textareaRef, (html) => updateNote(selectedNote.id, 'content', html));
      const ref = textareaRef.current;
      ref.addEventListener('paste', handler);
      return () => ref.removeEventListener('paste', handler);
    }
  }, [showNewNotePopup, selectedNote]);

  useEffect(() => {
    // Attach click handler to images in contentEditable areas
    function handleImageClick(e) {
      if (e.target.tagName === 'IMG') {
        setImagePopup({ open: true, src: e.target.src });
      }
    }
    const editors = [textareaRef.current, newNoteTextareaRef.current].filter(Boolean);
    editors.forEach(editor => {
      editor && editor.addEventListener('click', handleImageClick);
    });
    return () => {
      editors.forEach(editor => {
        editor && editor.removeEventListener('click', handleImageClick);
      });
    };
  }, [showNewNotePopup, selectedNote]);

  const scrollSpeed = 6;
  const scrollZone = 80;

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
    window.addEventListener('mouseup', stopAutoScroll);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', stopAutoScroll);
      window.removeEventListener('dragend', stopAutoScroll);
      window.removeEventListener('mouseup', stopAutoScroll);
      stopAutoScroll();
    };
  }, [draggedNote]);

  const handleInsertImage = async (editorRef, setContent) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(editorRef, resizedDataUrl);
      setContent(editorRef.current.innerHTML);
    };
    input.click();
  };

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* Global Styles */}
      <style>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: #606060 #2a2a2a;
        }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
        *::-webkit-scrollbar-thumb { background: #606060; border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: #707070; }

        /* Custom content editor styles */
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

        /* List styles for content editor */
        .note-content-editable ul,
        .note-content-editable ol {
          margin-left: 0;
          padding-left: 2.2em; /* more space for marker */
          list-style-position: outside;
        }
        .note-content-editable li {
          margin-bottom: 0.5em;
          color: #cccccc;
          font-size: 1em;
          line-height: 1.8;
          padding-left: 0.2em; /* extra space between marker and text */
          text-indent: 0;
        }

        .note-content-editable img:hover {
          cursor: pointer;
        }
      `}</style>

      {/* Top Navigation */}
      <div 
        className="fixed top-5 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-full z-50 border"
        style={{ 
          background: 'rgba(40, 40, 40, 0.9)', 
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 z-10" size={20} />
          <input
            type="text"
            placeholder={`Search ${currentPage}...`}
            className="border rounded-full py-2.5 pl-11 pr-4 text-gray-200 text-sm outline-none transition-all duration-300 placeholder-gray-400"
            style={{
              background: 'rgba(60, 60, 60, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              width: '300px'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={e => {
              e.target.style.background = 'rgba(70, 70, 70, 0.9)';
              e.target.style.borderColor = '#8b5cf6';
            }}
            onBlur={e => {
              e.target.style.background = 'rgba(60, 60, 60, 0.8)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
        </div>
        {currentPage === 'notes' && (
          <button 
            className="border-none rounded-full px-5 py-2.5 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: '#7c3aed' }}
            onClick={openNewNotePopup}
            onMouseEnter={e => e.target.style.background = '#6d28d9'}
            onMouseLeave={e => e.target.style.background = '#7c3aed'}
          >
            <Plus size={20} />
            Add a note...
          </button>
        )}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
          style={{ background: '#8b5cf6' }}
          onMouseEnter={e => e.target.style.background = '#7c3aed'}
          onMouseLeave={e => e.target.style.background = '#8b5cf6'}
        >
          <User size={20} />
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen border-r transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-18'
        }`}
        style={{ 
          background: 'rgba(30, 30, 30, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 text-lg font-semibold" style={{ color: '#8b5cf6' }}>
              NOTES AI
            </div>
          )}
          <button 
            className="bg-transparent border-none text-gray-400 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="py-5">
          <button 
            className={`flex items-center gap-3 py-3 px-5 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left ${
              currentPage === 'notes' 
                ? 'text-violet-500 border-r-3' 
                : 'text-gray-300 hover:text-violet-500'
            }`}
            style={{
              background: currentPage === 'notes' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              borderRightColor: currentPage === 'notes' ? '#8b5cf6' : 'transparent'
            }}
            onClick={switchToNotes}
            onMouseEnter={e => {
              if (currentPage !== 'notes') {
                e.target.style.background = 'rgba(139, 92, 246, 0.1)';
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== 'notes') {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <StickyNote size={20} />
            {sidebarOpen && 'Notes'}
          </button>
          <button 
            className={`flex items-center gap-3 py-3 px-5 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left ${
              currentPage === 'trash' 
                ? 'text-violet-500 border-r-3' 
                : 'text-gray-300 hover:text-violet-500'
            }`}
            style={{
              background: currentPage === 'trash' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              borderRightColor: currentPage === 'trash' ? '#8b5cf6' : 'transparent'
            }}
            onClick={switchToTrash}
            onMouseEnter={e => {
              if (currentPage !== 'trash') {
                e.target.style.background = 'rgba(139, 92, 246, 0.1)';
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== 'trash') {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <Trash2 size={20} />
            {sidebarOpen && 'Trash'}
          </button>
        </div>

        {sidebarOpen && (
          <div 
            className="absolute bottom-5 left-5 right-5 p-5 rounded-xl border"
            style={{ 
              background: 'rgba(40, 40, 40, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
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

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 pt-25 px-10 pb-10 min-h-screen ${
          sidebarOpen ? 'ml-64' : 'ml-18'
        }`}
        style={{ paddingTop: '100px' }}
      >
        <div 
          className="grid gap-5 max-w-6xl mx-auto py-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
          onDragOver={handleGridDragOver}
          onDrop={handleGridDrop}
        >
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              className={`
                rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-start h-full
                ${currentPage === 'notes' ? 'cursor-grab' : 'cursor-default'}
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
                transition: 'all 0.3s ease'
              }}
              draggable={currentPage === 'notes'}
              onDragStart={(e) => handleDragStart(e, note, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => currentPage === 'notes' ? openNote(note) : null}
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
              {currentPage === 'trash' && (
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
                          restoreNote(note.id);
                        }}
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button 
                        className="bg-transparent border-none w-full py-3 px-4 text-red-400 text-sm cursor-pointer flex items-center justify-start gap-3 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          permanentlyDeleteNote(note.id);
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
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-200 leading-tight">{note.title}</h3>
                {note.content && (
                  <div 
                    className="flex-1 mb-4 overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: note.size === 'small' ? 5 : note.size === 'medium' ? 10 : 16
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (note.content || '').replace(/<img[^>]*>/gi, '')
                    }}
                  />
                )}
              </div>
              {Array.isArray(note.keywords) && note.keywords.length > 0 && (
                <div className="mt-auto pb-2">
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
              {(() => {
                const images = extractImageSrcs(note.content, 4);
                if (images.length === 0) return null;
                return (
                  <div className={`flex gap-1.5 mt-2.5 w-full justify-start items-center`}>
                    {images.map((src, idx) => (
                      <img 
                        key={idx} 
                        src={src} 
                        alt="note" 
                        className={`rounded-lg object-cover shadow-sm ${
                          images.length === 1 ? 'w-full h-20' :
                          images.length === 2 ? 'w-1/2 h-16' :
                          images.length === 3 ? 'w-1/3 h-14' :
                          'w-1/4 h-12'
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
          ))}
        </div>
      </div>

      {/* New Note Popup */}
      {showNewNotePopup && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-5"
          style={{ 
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)' 
          }}
          onClick={() => setShowNewNotePopup(false)}
        >
          <div 
            className="rounded-2xl p-6 w-full max-w-4xl border relative flex flex-col box-border overflow-hidden"
            style={{ 
              background: '#2a2a2a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              height: 'min(85vh, 750px)',
              maxHeight: '85vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <input
                type="text"
                className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-4"
                value={newNoteDraft.title}
                onChange={e => setNewNoteDraft({ ...newNoteDraft, title: e.target.value })}
                placeholder="Note title..."
              />
              <div className="flex gap-2">
                <button
                  className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={() => setShowNewNotePopup(false)}
                  title="Close"
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Color Picker */}
            <div className="flex gap-2 items-center mb-4">
              <span className="text-sm text-gray-300 mr-2 font-medium">Color:</span>
              {['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'].map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-full cursor-pointer border-3 transition-all duration-300 relative hover:scale-110"
                  style={{
                    background: getColorPickerBackground(color),
                    borderColor: newNoteDraft.color === color ? '#ffffff' : 'transparent',
                    transform: newNoteDraft.color === color ? 'scale(1.15)' : 'scale(1)'
                  }}
                  onClick={() => setNewNoteDraft({ ...newNoteDraft, color })}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                >
                  {newNoteDraft.color === color && (
                    <span 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold"
                      style={{ textShadow: '0 0 3px rgba(0, 0, 0, 0.5)' }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Keywords */}
            <input
              type="text"
              className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500"
              value={newNoteDraft.keywords}
              onChange={e => setNewNoteDraft({ ...newNoteDraft, keywords: e.target.value })}
              placeholder="Keywords (comma separated)..."
            />
            
            {/* Content Editor */}
            <div className="flex-1 flex flex-col">
              <div
                ref={newNoteTextareaRef}
                className="note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={e => setNewNoteDraft({ ...newNoteDraft, content: e.currentTarget.innerHTML })}
                data-placeholder="Start writing your note here..."
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  minHeight: '350px',
                  maxHeight: 'calc(85vh - 250px)',
                  color: '#cccccc'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#8b5cf6';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <div className="flex items-center justify-end mt-2">
                <button
                  type="button"
                  className="border-none rounded-md p-2 text-gray-300 cursor-pointer transition-all duration-300 mr-2 flex items-center text-xs"
                  title="Insert Image"
                  onClick={() => handleInsertImage(newNoteTextareaRef, html => setNewNoteDraft(d => ({ ...d, content: html })))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    height: '32px'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.color = '#cccccc';
                  }}
                >
                  🖼️ Insert Image
                </button>
                <FormattingToolbar editorRef={newNoteTextareaRef} />
                <button
                  className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 ml-6 mr-2 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
                  }}
                  onClick={saveNewNote}
                  onMouseEnter={e => {
                    e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Popup */}
      {selectedNote && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-5"
          style={{ 
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)' 
          }}
          onClick={closeNotePopup}
        >
          <div 
            className="rounded-2xl p-6 w-full max-w-4xl border relative flex flex-col box-border overflow-hidden"
            style={{ 
              background: '#2a2a2a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              height: 'min(90vh, 800px)',
              maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <input
                type="text"
                className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-4"
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, 'title', e.target.value)}
                placeholder="Note title..."
              />
              <div className="flex gap-2">
                <button 
                  className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={() => deleteNote(selectedNote.id)}
                  title="Delete note"
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(220, 38, 38, 0.3)';
                    e.target.style.color = '#ff6b6b';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.color = '#ffffff';
                  }}
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={closeNotePopup}
                  title="Close"
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="flex gap-2 items-center mb-4">
              <span className="text-sm text-gray-300 mr-2 font-medium">Color:</span>
              {['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'].map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-full cursor-pointer border-3 transition-all duration-300 relative hover:scale-110"
                  style={{
                    background: getColorPickerBackground(color),
                    borderColor: selectedNote.color === color ? '#ffffff' : 'transparent',
                    transform: selectedNote.color === color ? 'scale(1.15)' : 'scale(1)'
                  }}
                  onClick={() => updateNote(selectedNote.id, 'color', color)}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                >
                  {selectedNote.color === color && (
                    <span 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold"
                      style={{ textShadow: '0 0 3px rgba(0, 0, 0, 0.5)' }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Keywords Editor */}
            <input
              type="text"
              className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500"
              value={Array.isArray(selectedNote.keywords) ? selectedNote.keywords.join(', ') : selectedNote.keywords}
              onChange={e => {
                updateNote(
                  selectedNote.id,
                  'keywords',
                  e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                );
              }}
              placeholder="Keywords (comma separated)..."
            />
            
            {/* Content Editor */}
            <div className="flex-1 flex flex-col">
              <div
                ref={textareaRef}
                className="note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={e => updateNote(selectedNote.id, 'content', e.currentTarget.innerHTML)}
                data-placeholder="Start writing your note here..."
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  minHeight: '400px',
                  maxHeight: 'calc(90vh - 270px)',
                  color: '#cccccc'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#8b5cf6';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <div className="flex items-center justify-end mt-0">
                <button
                  type="button"
                  className="border-none rounded-md p-2 text-gray-300 cursor-pointer transition-all duration-300 mr-2 flex items-center text-xs"
                  title="Insert Image"
                  onClick={() => handleInsertImage(textareaRef, html => updateNote(selectedNote.id, 'content', html))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    height: '32px'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.color = '#cccccc';
                  }}
                >
                  🖼️ Insert Image
                </button>
                <FormattingToolbar editorRef={textareaRef} />
                <button
                  className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 ml-6 mr-2 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
                  }}
                  onMouseEnter={e => {
                    e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
                  }}
                >
                  <Sparkles size={18} />
                  Open with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Popup */}
      {imagePopup.open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/80"
          style={{ backdropFilter: 'blur(6px)' }}
          onClick={() => setImagePopup({ open: false, src: '' })}
        >
          <div
            className="relative bg-transparent flex flex-col items-center justify-center"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={imagePopup.src}
              alt="Full"
              className="rounded-xl shadow-2xl max-h-[80vh] max-w-[80vw] object-contain"
              style={{ background: '#181818' }}
            />
            <button
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-gray-200 rounded-full p-2 transition-all"
              style={{ zIndex: 10 }}
              onClick={() => setImagePopup({ open: false, src: '' })}
              title="Close"
            >
              <X size={22} />
            </button>
            <a
              href={imagePopup.src}
              download="note-image.jpg"
              className="absolute top-3 right-14 bg-black/60 hover:bg-black/80 text-gray-200 rounded-full p-2 transition-all"
              style={{ zIndex: 10 }}
              title="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16.5a1 1 0 0 1-1-1V6.91l-3.29 3.3a1 1 0 1 1-1.42-1.42l5-5a1 1 0 0 1 1.42 0l5 5a1 1 0 1 1-1.42 1.42L13 6.91V15.5a1 1 0 0 1-1 1Zm-7 3a1 1 0 0 1 0-2h14a1 1 0 1 1 0 2H5Z"/></svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const FormattingToolbar = ({ editorRef }) => {
  const handleFormatting = (cmd) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Handle list commands specially
    if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // If there's selected text, apply list to it
        if (!range.collapsed) {
          document.execCommand(cmd, false, null);
        } else {
          // If no selection, create a new list item
          const listType = cmd === 'insertUnorderedList' ? 'ul' : 'ol';
          const listItem = document.createElement('li');
          listItem.innerHTML = '&nbsp;'; // Non-breaking space to make it clickable
          
          const list = document.createElement(listType);
          list.appendChild(listItem);
          
          range.insertNode(list);
          
          // Position cursor inside the list item
          const newRange = document.createRange();
          newRange.setStart(listItem, 0);
          newRange.setEnd(listItem, 0);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } else {
      // Handle other formatting commands normally
      document.execCommand(cmd, false, null);
    }
    
    editor.focus();
  };

  return (
    <div className="flex gap-2">
      {[
        { icon: Bold, cmd: 'bold', title: 'Bold' },
        { icon: Italic, cmd: 'italic', title: 'Italic' },
        { icon: Underline, cmd: 'underline', title: 'Underline' },
        { icon: Strikethrough, cmd: 'strikeThrough', title: 'Strikethrough' },
        { icon: List, cmd: 'insertUnorderedList', title: 'Bullet List' },
        { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered List' }
      ].map(({ icon: Icon, cmd, title }) => (
        <button 
          key={cmd}
          type="button" 
          title={title}
          className="border-none rounded-md p-2 text-gray-300 cursor-pointer transition-all duration-300 flex items-center"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
          onMouseDown={e => { 
            e.preventDefault(); 
            handleFormatting(cmd);
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(139, 92, 246, 0.15)';
            e.target.style.color = '#8b5cf6';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            e.target.style.color = '#cccccc';
          }}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};

// Helper functions
function extractImageSrcs(html, max = 4) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = Array.from(div.querySelectorAll('img')).slice(0, max);
  return imgs.map(img => img.src);
}

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
  if (
    sel &&
    sel.rangeCount > 0 &&
    editor.contains(sel.anchorNode)
  ) {
    let range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.insertBefore(img, editor.firstChild);
  }
}

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

// Note background functions
function getNoteBackground(color) {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #0f766e 100%)',
    brown: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #a16207 100%)',
    yellow: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #d97706 100%)',
    blue: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #1e40af 100%)',
    purple: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #7c3aed 100%)',
    green: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #059669 100%)',
    orange: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #ea580c 100%)',
    red: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #dc2626 100%)',
    indigo: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #4f46e5 100%)'
  };
  return backgrounds[color] || backgrounds.purple;
}

function getNoteHoverBackground(color) {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #0f766e 0%, #0f766e 60%, #134e4a 80%, #242424 100%)',
    brown: 'linear-gradient(45deg, #a16207 0%, #a16207 60%, #b45309 80%, #242424 100%)',
    yellow: 'linear-gradient(45deg, #d97706 0%, #d97706 60%, #ea580c 80%, #242424 100%)',
    blue: 'linear-gradient(45deg, #1e40af 0%, #1e40af 60%, #1e3a8a 80%, #242424 100%)',
    purple: 'linear-gradient(45deg, #7c3aed 0%, #7c3aed 60%, #6b21a8 80%, #242424 100%)',
    green: 'linear-gradient(45deg, #059669 0%, #059669 60%, #047857 80%, #242424 100%)',
    orange: 'linear-gradient(45deg, #ea580c 0%, #ea580c 60%, #c2410c 80%, #242424 100%)',
    red: 'linear-gradient(45deg, #dc2626 0%, #dc2626 60%, #b91c1c 80%, #242424 100%)',
    indigo: 'linear-gradient(45deg, #4f46e5 0%, #4f46e5 60%, #4338ca 80%, #242424 100%)'
  };
  return backgrounds[color] || backgrounds.purple;
}

// Size classes
function getSizeClasses(size) {
  const sizeMap = {
    small: 'row-span-1',
    medium: 'row-span-2', 
    large: 'row-span-3'
  };
  return sizeMap[size] || sizeMap.medium;
}

// Color picker backgrounds
function getColorPickerBackground(color) {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #0f766e, #14b8a6)',
    brown: 'linear-gradient(45deg, #a16207, #d97706)',
    yellow: 'linear-gradient(45deg, #d97706, #f59e0b)',
    blue: 'linear-gradient(45deg, #1e40af, #3b82f6)',
    purple: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
    green: 'linear-gradient(45deg, #059669, #10b981)',
    orange: 'linear-gradient(45deg, #ea580c, #f97316)',
    red: 'linear-gradient(45deg, #dc2626, #ef4444)',
    indigo: 'linear-gradient(45deg, #4f46e5, #6366f1)'
  };
  return backgrounds[color] || backgrounds.purple;
}

export default NotesApp;