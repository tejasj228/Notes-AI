import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Menu, X, Trash2, User, Sparkles, MoreVertical, RotateCcw, StickyNote, LogOut, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Folder, FolderOpen, ChevronDown, ChevronRight, FolderPlus, ArrowLeft, Save } from 'lucide-react';
let lastSizes = [];
let lastImagePasteTime = 0; // Place this outside the component (top of file or just above NotesApp)

const NotesApp = ({ user, onLogout }) => {
const [notes, setNotes] = useState([
{ id: 1, title: 'Web Development', content: 'Learning React, JavaScript, and CSS for modern web development. Focus on component-based architecture and responsive design.', keywords: ['React', 'JavaScript', 'CSS'], color: 'purple', size: 'medium', order: 0, images: [], folderId: null },
{ id: 2, title: 'Project Ideas', content: 'AI-powered note-taking app, Machine learning for content suggestions, Automation tools for productivity', keywords: ['AI', 'Machine Learning', 'Automation'], color: 'blue', size: 'large', order: 1, images: [], folderId: null },
{ id: 3, title: 'Shopping List', content: 'Groceries: Milk, Bread, Eggs\nHousehold: Cleaning supplies, Paper towels\nPersonal: Shampoo, Toothpaste', keywords: ['Groceries', 'Household', 'Personal'], color: 'green', size: 'small', order: 2, images: [], folderId: null },
{ id: 4, title: 'Meeting Notes', content: 'Project timeline discussion, deliverables for Q4, team responsibilities and deadlines', keywords: ['Timeline', 'Deliverables', 'Team'], color: 'orange', size: 'medium', order: 3, images: [], folderId: null },
{ id: 5, title: 'Book Recommendations', content: 'Programming: Clean Code, Design Patterns\nPsychology: Thinking Fast and Slow\nDesign: Don\'t Make Me Think', keywords: ['Programming', 'Psychology', 'Design'], color: 'teal', size: 'small', order: 4, images: [], folderId: null },
{ id: 6, title: 'Workout Plan', content: 'Monday: Chest and Triceps\nWednesday: Back and Biceps\nFriday: Legs and Shoulders\nCardio: 30 minutes on off days', keywords: ['Fitness', 'Health', 'Exercise'], color: 'red', size: 'medium', order: 5, images: [], folderId: null },
{ id: 7, title: 'Travel Itinerary', content: 'Day 1: Arrive in Paris, visit Eiffel Tower\nDay 2: Louvre Museum, Seine River cruise\nDay 3: Versailles Palace day trip', keywords: ['Vacation', 'Cities', 'Museums'], color: 'indigo', size: 'large', order: 6, images: [], folderId: null },
{ id: 8, title: 'Recipe Collection', content: 'Italian Pasta: Carbonara, Bolognese, Pesto\nPizza dough recipe with fresh herbs\nTiramisu for dessert', keywords: ['Cooking', 'Italian', 'Pasta'], color: 'yellow', size: 'medium', order: 7, images: [], folderId: null },
{ id: 9, title: 'Learning Goals', content: 'Master TypeScript this quarter\nLearn Docker and containerization\nImprove system design skills', keywords: ['Skills', 'Technology', 'Growth'], color: 'brown', size: 'small', order: 8, images: [], folderId: null }
]);

const [folders, setFolders] = useState([
{ id: 1, name: 'Work Projects', color: 'blue', createdAt: new Date() },
{ id: 2, name: 'Personal', color: 'green', createdAt: new Date() }
]);

const [trashedNotes, setTrashedNotes] = useState([]);
const [currentPage, setCurrentPage] = useState('notes'); // 'notes', 'trash', 'folder'
const [currentFolder, setCurrentFolder] = useState(null);
const [sidebarOpen, setSidebarOpen] = useState(true);
const [foldersExpanded, setFoldersExpanded] = useState(true);
const [selectedNote, setSelectedNote] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [showTrashMenu, setShowTrashMenu] = useState(null);
const [draggedNote, setDraggedNote] = useState(null);
const [dragOverIndex, setDragOverIndex] = useState(null);
const [draggedIndex, setDraggedIndex] = useState(null);
const [showNewNotePopup, setShowNewNotePopup] = useState(false);
const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
const [newNoteDraft, setNewNoteDraft] = useState({
title: '',
content: '',
keywords: '',
color: 'purple',
size: 'medium'
});
const [newFolderDraft, setNewFolderDraft] = useState({
name: '',
color: 'purple'
});
const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
const [folderMenuOpen, setFolderMenuOpen] = useState(null);
const [renameFolderDraft, setRenameFolderDraft] = useState({ id: null, name: '', color: '' });
const [showRenameFolder, setShowRenameFolder] = useState(false);
const textareaRef = useRef(null);
const newNoteTextareaRef = useRef(null);

// Get current notes based on page and folder
const getCurrentNotes = () => {
if (currentPage === 'trash') {
return trashedNotes;
} else if (currentPage === 'folder' && currentFolder) {
return notes.filter(note => note.folderId === currentFolder.id);
} else {
return notes.filter(note => note.folderId === null);
}
};

// Filter notes based on search term, then sort by order
const currentNotes = getCurrentNotes();
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
color: getRandomColor(),
size: getRandomSize()
});
setShowNewNotePopup(true);
setTimeout(() => {
if (newNoteTextareaRef.current) newNoteTextareaRef.current.focus();
}, 0);
};

const openNewFolderPopup = () => {
setNewFolderDraft({
name: '',
color: getRandomColor()
});
setShowNewFolderPopup(true);
};

const saveNewNote = () => {
  const keywordsArray = newNoteDraft.keywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .slice(0, 3); // Enforce max 3

const folderId = currentPage === 'folder' && currentFolder ? currentFolder.id : null;

const newNote = {
id: Date.now(),
title: newNoteDraft.title || 'Untitled Note',
content: newNoteDraft.content || '',
...(keywordsArray.length > 0 ? { keywords: keywordsArray } : {}),
color: newNoteDraft.color,
size: getRandomSize(),
order: 0,
images: [],
folderId
};

// Update order for notes in the same context (folder or main)
const updatedNotes = [newNote, ...notes].map((note, index) => {
if (note.folderId === folderId) {
  return { ...note, order: index };
}
return note;
});

setNotes(updatedNotes);
setShowNewNotePopup(false);
};

const saveNewFolder = () => {
if (!newFolderDraft.name.trim()) return;

const newFolder = {
id: Date.now(),
name: newFolderDraft.name.trim(),
color: newFolderDraft.color,
createdAt: new Date()
};

setFolders([...folders, newFolder]);
setShowNewFolderPopup(false);
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
if (currentPage !== 'trash') {
setNotes(notes.map(note => 
  note.id === noteId ? { ...note, [field]: value } : note
));
}
if (selectedNote && selectedNote.id === noteId && field !== 'content') {
setSelectedNote({ ...selectedNote, [field]: value });
}
};

const reorderNotes = (draggedId, targetIndex) => {
const currentNotes = getCurrentNotes();
const updatedCurrentNotes = [...currentNotes];
const draggedIndex = updatedCurrentNotes.findIndex(note => note.id === draggedId);

if (draggedIndex === -1 || draggedIndex === targetIndex) return;

const [draggedNote] = updatedCurrentNotes.splice(draggedIndex, 1);
updatedCurrentNotes.splice(targetIndex, 0, draggedNote);

// Reorder within the current context (folder or main)
const reorderedNotes = updatedCurrentNotes.map((note, index) => ({
...note,
order: index
}));

// Update the main notes array
if (currentPage === 'folder' && currentFolder) {
const otherNotes = notes.filter(note => note.folderId !== currentFolder.id);
setNotes([...otherNotes, ...reorderedNotes]);
} else if (currentPage === 'notes') {
const folderNotes = notes.filter(note => note.folderId !== null);
setNotes([...reorderedNotes, ...folderNotes]);
}
};

// Navigation functions
const switchToNotes = () => {
setCurrentPage('notes');
setCurrentFolder(null);
setSearchTerm('');
};

const switchToTrash = () => {
setCurrentPage('trash');
setCurrentFolder(null);
setSearchTerm('');
};

const openFolder = (folder) => {
setCurrentPage('folder');
setCurrentFolder(folder);
setSearchTerm('');
};

const goBackToNotes = () => {
setCurrentPage('notes');
setCurrentFolder(null);
setSearchTerm('');
};

// Get page title for header
const getPageTitle = () => {
if (currentPage === 'trash') return 'Trash';
if (currentPage === 'folder' && currentFolder) return currentFolder.name;
return 'Notes';
};

// Get search placeholder
const getSearchPlaceholder = () => {
if (currentPage === 'trash') return 'Search trash...';
if (currentPage === 'folder' && currentFolder) return `Search in ${currentFolder.name}...`;
return 'Search notes...';
};

// Drag handlers
const handleDragStart = (e, note, index) => {
if (currentPage === 'trash') return;
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
const currentNotes = getCurrentNotes();
const updatedNotes = [...currentNotes];
const [removed] = updatedNotes.splice(draggedIndex, 1);
updatedNotes.splice(hoverIndex, 0, removed);

// Update the main notes array
if (currentPage === 'folder' && currentFolder) {
  const folderNotes = updatedNotes.map((note, idx) => ({ ...note, order: idx }));
  const otherNotes = notes.filter(note => note.folderId !== currentFolder.id);
  setNotes([...otherNotes, ...folderNotes]);
} else if (currentPage === 'notes') {
  const mainNotes = updatedNotes.map((note, idx) => ({ ...note, order: idx }));
  const folderNotes = notes.filter(note => note.folderId !== null);
  setNotes([...mainNotes, ...folderNotes]);
}

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
reorderNotes(draggedNote.id, currentNotes.length - 1);
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

// Auto-scroll functionality
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
  function handleImageClick(e) {
    if (e.target.tagName === 'IMG') {
      setImagePopup({ open: true, src: e.target.src });
    }
  }

  // Capture refs at effect run
  const editors = [textareaRef.current, newNoteTextareaRef.current].filter(Boolean);

  editors.forEach(editor => {
    if (editor) {
      editor.addEventListener('click', handleImageClick);
    }
  });

  return () => {
    editors.forEach(editor => {
      if (editor && editor.removeEventListener) {
        editor.removeEventListener('click', handleImageClick);
      }
    });
  };
}, [showNewNotePopup, selectedNote]);

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

// Rename and delete folder handlers
const handleRenameFolder = (folder) => {
  setRenameFolderDraft({ id: folder.id, name: folder.name, color: folder.color });
  setShowRenameFolder(true);
  setFolderMenuOpen(null);
};

const handleDeleteFolder = (folderId) => {
  setFolders(folders.filter(f => f.id !== folderId));
  if (currentFolder?.id === folderId) {
    setCurrentPage('notes');
    setCurrentFolder(null);
  }
  setFolderMenuOpen(null);
};

const saveRenameFolder = () => {
  setFolders(folders.map(f =>
    f.id === renameFolderDraft.id
      ? { ...f, name: renameFolderDraft.name, color: renameFolderDraft.color }
      : f
  ));
  if (currentFolder?.id === renameFolderDraft.id) {
    setCurrentFolder({ ...currentFolder, name: renameFolderDraft.name, color: renameFolderDraft.color });
  }
  setShowRenameFolder(false);
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
    padding-left: 2.2em;
    list-style-position: outside;
  }
  .note-content-editable li {
    margin-bottom: 0.5em;
    color: #cccccc;
    font-size: 1em;
    line-height: 1.8;
    padding-left: 0.2em;
    text-indent: 0;
  }

  .note-content-editable img {
    max-width: 98% !important;
    max-height: 320px !important;
    display: block;
    margin: 18px auto;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    cursor: pointer;
    transition: box-shadow 0.18s;
  }
  .note-content-editable img:hover {
    box-shadow: 0 4px 24px rgba(139,92,246,0.25);
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
  {/* Back button for folder view */}
  {currentPage === 'folder' && currentFolder && (
    <button
      className="border-none rounded-full p-2 text-gray-300 cursor-pointer transition-all duration-300 hover:text-white flex items-center"
      onClick={goBackToNotes}
      title="Back to Notes"
      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
      onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
      onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
    >
      <ArrowLeft size={20} />
    </button>
  )}
  
  <div className="relative flex items-center">
    <Search className="absolute left-4 text-gray-400 z-10" size={20} />
    <input
      type="text"
      placeholder={getSearchPlaceholder()}
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
  {(currentPage === 'notes' || (currentPage === 'folder' && currentFolder)) && (
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
    {/* Notes */}
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
            <button
              className="border-none bg-transparent text-gray-400 hover:text-violet-500 p-1 rounded transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                openNewFolderPopup();
              }}
              title="Add Folder"
            >
              <FolderPlus size={16} />
            </button>
          </>
        )}
      </button>
      
      {foldersExpanded && sidebarOpen && (
        <div className="ml-6">
          {folders.map((folder) => (
            <div key={folder.id} className="relative group">
              <button
                className={`
                  flex items-center gap-3 py-2 px-4 cursor-pointer transition-all duration-300 border-none bg-transparent w-full text-left text-sm
                  ${currentPage === 'folder' && currentFolder?.id === folder.id
                    ? 'text-violet-500 border-r-3'
                    : 'text-gray-300 hover:text-violet-500'
                  }
                `}
                style={{
                  background: currentPage === 'folder' && currentFolder?.id === folder.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  borderRightColor: currentPage === 'folder' && currentFolder?.id === folder.id ? '#8b5cf6' : 'transparent'
                }}
                onClick={() => openFolder(folder)}
              >
                {currentPage === 'folder' && currentFolder?.id === folder.id ? 
                  <FolderOpen size={16} /> : 
                  <Folder size={16} />
                }
                <span className="truncate">{folder.name}</span>
                <span 
                  className="w-2 h-2 rounded-full ml-auto"
                  style={{ background: getFolderColor(folder.color) }}
                />
                {/* 3-dots menu button */}
                <button
                  className="ml-2 border-none bg-transparent text-gray-400 hover:text-violet-500 p-1 rounded transition-colors duration-200"
                  onClick={e => {
                    e.stopPropagation();
                    setFolderMenuOpen(folder.id === folderMenuOpen ? null : folder.id);
                  }}
                  title="Folder options"
                >
                  <MoreVertical size={16} />
                </button>
              </button>
              {/* Folder menu */}
              {folderMenuOpen === folder.id && (
                <div className="absolute right-0 top-10 z-30 bg-[#232323] border rounded-lg shadow-lg py-2 min-w-36">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 text-sm"
                    onClick={() => handleRenameFolder(folder)}
                  >Edit Folder</button>
                  <button
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 text-sm"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    
    {/* Trash */}
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
  {/* Page Header */}
  <div className="max-w-6xl mx-auto mb-6">
    {/* Removed page title and note count header for a cleaner empty state */}
  </div>

  {/* Notes Grid */}
  <div 
    className="grid gap-5 max-w-6xl mx-auto py-5"
    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
    onDragOver={handleGridDragOver}
    onDrop={handleGridDrop}
  >
    {filteredNotes.length === 0 ? (
      <div className="col-span-full flex flex-col items-center justify-center min-h-[60vh] py-20 text-gray-400">
        <h3 className="text-xl font-semibold mb-2">
          {currentPage === 'trash' ? 'Trash is empty' :
           currentPage === 'folder' ? 'No notes in this folder' : 'No notes yet'}
        </h3>
        <p className="text-sm text-center">
          {currentPage === 'trash' ? 'Deleted notes will appear here' :
           currentPage === 'folder' ? 'Create your first note in this folder' : 'Create your first note to get started'}
        </p>
        {(currentPage === 'notes' || (currentPage === 'folder' && currentFolder)) && (
          <button 
            className="mt-4 border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: '#7c3aed' }}
            onClick={openNewNotePopup}
            onMouseEnter={e => e.target.style.background = '#6d28d9'}
            onMouseLeave={e => e.target.style.background = '#7c3aed'}
          >
            <Plus size={18} />
            Create Note
          </button>
        )}
      </div>
    ) : (
      filteredNotes.map((note, index) => (
        <div
          key={note.id}
          className={`
            rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-start h-full
            ${currentPage !== 'trash' ? 'cursor-grab' : 'cursor-default'}
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
          draggable={currentPage !== 'trash'}
          onDragStart={(e) => handleDragStart(e, note, index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onClick={() => currentPage !== 'trash' ? openNote(note) : null}
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
            // Always limit to 2 images
            const images = extractImageSrcs(note.content, 2);
            if (images.length === 0) return null;
            return (
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
            );
          })()}
        </div>
      ))
    )}
  </div>
</div>

{/* New Folder Popup */}
{showNewFolderPopup && (
  <div 
    className="fixed inset-0 flex items-center justify-center z-50 p-5"
    style={{ 
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)' 
    }}
    onClick={() => setShowNewFolderPopup(false)}
  >
    <div 
      className="rounded-2xl p-6 w-full max-w-md border relative"
      style={{ 
        background: '#2a2a2a',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-200">Create New Folder</h2>
        <button
          className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          onClick={() => setShowNewFolderPopup(false)}
          title="Close"
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Folder Name */}
      <div className="mb-5">
        <label className="block text-sm text-gray-300 mb-2 font-medium">Folder Name</label>
        <input
          type="text"
          className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-4"
          style={{
            background: 'rgba(255,255,255,0.08)', // dark background
            color: '#f3f3f3', // light text
            borderColor: 'rgba(255,255,255,0.15)'
          }}
          value={newFolderDraft.name}
          onChange={e => setNewFolderDraft({ ...newFolderDraft, name: e.target.value })}
          placeholder="Enter folder name..."
          autoFocus
          onFocus={e => {
            e.target.style.borderColor = '#8b5cf6';
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        />
      </div>
      
      {/* Color Picker */}
      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-3 font-medium">Folder Color</label>
        <div className="flex gap-2 flex-wrap">
          {['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'].map((color) => (
            <div
              key={color}
              className="w-10 h-10 rounded-full cursor-pointer border-3 transition-all duration-300 relative hover:scale-110"
              style={{
                background: getColorPickerBackground(color),
                borderColor: newFolderDraft.color === color ? '#ffffff' : 'transparent',
                transform: newFolderDraft.color === color ? 'scale(1.15)' : 'scale(1)'
              }}
              onClick={() => setNewFolderDraft({ ...newFolderDraft, color })}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              {newFolderDraft.color === color && (
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
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          className="border rounded-xl px-6 py-3 text-gray-300 text-sm font-medium cursor-pointer transition-all duration-300"
          style={{
            background: 'transparent',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
          onClick={() => setShowNewFolderPopup(false)}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Cancel
        </button>
        <button
          className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
          }}
          onClick={saveNewFolder}
          disabled={!newFolderDraft.name.trim()}
          onMouseEnter={e => {
            if (!e.target.disabled) {
              e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
            }
          }}
          onMouseLeave={e => {
            e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
          }}
        >
          <Folder size={18} className="inline mr-2" />
          Create Folder
        </button>
      </div>
    </div>
  </div>
)}


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
      className="rounded-2xl p-6 border relative flex flex-col box-border overflow-hidden"
      style={{ 
        background: '#2a2a2a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '900px',         // <--- wider
        height: '800px',        // <--- taller
        maxWidth: '98vw',
        maxHeight: '98vh',
        minWidth: '340px',
        minHeight: '440px',
        display: 'flex'
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
        onChange={e => {
          let value = e.target.value;
          let keywords = value.split(',').map(k => k.trim())
          .filter(Boolean)
          .slice(0, 3); // Enforce max 3

          setNewNoteDraft({ ...newNoteDraft, keywords: value });
        }}
        placeholder="Keywords (comma separated)..."
      />
      <div className="text-xs text-gray-400 mb-2 text-right">
        {(Array.isArray(newNoteDraft.keywords) ? newNoteDraft.keywords.filter(k => k.trim()).length : 0)}/3 keywords
      </div>
      
      {/* Content Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          ref={newNoteTextareaRef}
          className="note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={e => setNewNoteDraft({ ...newNoteDraft, content: e.currentTarget.innerHTML })}
          onPaste={e => {
            // If image is present in clipboard, allow default paste (browser will handle image)
            if (
              e.clipboardData &&
              Array.from(e.clipboardData.items).some(item => item.type.startsWith('image/'))
            ) {
              return;
            }
            // Otherwise, paste as plain text
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          data-placeholder="Start writing your note here..."
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            minHeight: '440px',   // <--- bigger
            maxHeight: '700px',   // <--- bigger
            color: '#cccccc',
            overflowY: 'auto',
            flex: 1
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
            onClick={() => handleInsertImage(
  newNoteTextareaRef,
  html => setNewNoteDraft(d => ({ ...d, content: html }))
)}
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
      className="rounded-2xl p-6 border relative flex flex-col box-border overflow-hidden"
      style={{ 
        background: '#2a2a2a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '900px',         // <--- wider
        height: '800px',        // <--- taller
        maxWidth: '98vw',
        maxHeight: '98vh',
        minWidth: '340px',
        minHeight: '440px',
        display: 'flex'
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
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold">✓</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Keywords Editor */}
      <input
        type="text"
        className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500"
        value={typeof selectedNote.keywords === 'string'
    ? selectedNote.keywords
    : Array.isArray(selectedNote.keywords)
      ? selectedNote.keywords.join(', ')
      : ''
  }
        onChange={e => {
          // Store as a simple string during editing, no validation here
          setSelectedNote(prev => ({
            ...prev,
            keywords: e.target.value
          }));
        }}
        onBlur={e => {
          // On blur, convert to array and validate (max 3)
          let keywords = e.target.value
            .split(',')
            .map(k => k.trim())
            .filter(Boolean)
            .slice(0, 3);
          updateNote(
            selectedNote.id,
            'keywords',
            keywords
          );
        }}
        placeholder="Keywords (comma separated)..."
      />
      <div className="text-xs text-gray-400 mb-2 text-right">
        {(Array.isArray(selectedNote.keywords) ? selectedNote.keywords.filter(k => k.trim()).length : 0)}/3 keywords
      </div>
      
      {/* Content Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          ref={textareaRef}
          className="note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={e => updateNote(selectedNote.id, 'content', e.currentTarget.innerHTML)}
          onPaste={e => {
            // If image is present in clipboard, allow default paste (browser will handle image)
            if (
              e.clipboardData &&
              Array.from(e.clipboardData.items).some(item => item.type.startsWith('image/'))
            ) {
              return;
            }
            // Otherwise, paste as plain text
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          data-placeholder="Start writing your note here..."
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            minHeight: '440px',
            maxHeight: '700px',
            color: '#cccccc',
            overflowY: 'auto',
            flex: 1
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
            onClick={closeNotePopup}
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

{/* Image Popup */}
{imagePopup.open && (
  <div 
    className="fixed inset-0 flex items-center justify-center z-50 p-5"
    style={{ 
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)' 
    }}
    onClick={() => setImagePopup({ open: false, src: '' })}
  >
    <div 
      className="rounded-2xl border relative flex flex-col"
      style={{ 
        background: '#2a2a2a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        maxWidth: '95vw',
        maxHeight: '90vh',
        width: 'auto',
        height: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-end w-full" style={{padding: 24, paddingBottom: 0}}>
        <a
          href={imagePopup.src}
          download={`note-image-${Date.now()}.jpg`}
          className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          title="Download"
          onClick={e => e.stopPropagation()}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <button
          className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300 ml-2"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          onClick={() => setImagePopup({ open: false, src: '' })}
          title="Close"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-center items-center w-full h-full" style={{ minHeight: '40vh', padding: 24 }}>
        <img 
          src={imagePopup.src} 
          alt="Preview" 
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            background: '#181818'
          }}
        />
      </div>
    </div>
  </div>
)}

{/* Rename/Color Modal */}
{showRenameFolder && (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-5"
    style={{ background: 'rgba(0,0,0,0.7)' }}
    onClick={() => setShowRenameFolder(false)}
  >
    <div className="bg-[#232323] rounded-2xl p-6 w-full max-w-md border relative"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      onClick={e => e.stopPropagation()}
    >
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Edit Folder</h2>
      <input
        type="text"
        className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-4"
        style={{
          background: 'rgba(255,255,255,0.08)', // dark background
          color: '#f3f3f3', // light text
          borderColor: 'rgba(255,255,255,0.15)'
        }}
        value={renameFolderDraft.name}
        onChange={e => setRenameFolderDraft(d => ({ ...d, name: e.target.value.slice(0, 14) }))}
      />
      <div className="flex gap-2 justify-end">
        <button
          className="border rounded-xl px-6 py-2 text-gray-300 text-sm"
          onClick={() => setShowRenameFolder(false)}
        >Cancel</button>
        <button
          className="border-none rounded-xl px-6 py-2 text-gray-200 text-sm bg-violet-600"
          onClick={saveRenameFolder}
        >Save</button>
      </div>
    </div>
  </div>
)}
</div>
);
};

export default NotesApp;

// Helper: Extract image srcs from HTML
function extractImageSrcs(html, max = 2) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = Array.from(div.querySelectorAll('img'));
  return imgs.slice(0, max).map(img => img.src);
}

// Helper: Insert image at caret in contentEditable
function insertImageAtCaret(editorRef, imageUrl) {
  const editor = editorRef.current;
  if (!editor) return;
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.maxWidth = '96%';      // Make image smaller
  img.style.maxHeight = '220px';   // Reduce max height for popup
  img.style.display = 'block';
  img.style.margin = '16px auto';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
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

// Helper: Resize image before inserting
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
        ctx.drawImage(img, 0,  0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
     
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Helper: Note background gradient
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

// Helper: Note size classes
function getSizeClasses(size) {
  const sizeMap = {
    small: 'row-span-1',
    medium: 'row-span-2', 
    large: 'row-span-3'
  };
  return sizeMap[size] || sizeMap.medium;
}

// Helper: Color picker backgrounds
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

// Helper: Folder color
function getFolderColor(color) {
  const colors = {
    teal: '#14b8a6',
    brown: '#d97706',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
    indigo: '#6366f1'
  };
  return colors[color] || colors.purple;
}

// FormattingToolbar component (copy from oldcode.jsx)
const FormattingToolbar = ({ editorRef }) => {
  const handleFormatting = (cmd) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          document.execCommand(cmd, false, null);
        } else {
          const listType = cmd === 'insertUnorderedList' ? 'ul' : 'ol';
          const listItem = document.createElement('li');
          listItem.innerHTML = '&nbsp;';
          const list = document.createElement(listType);
          list.appendChild(listItem);
          range.insertNode(list);
          const newRange = document.createRange();
          newRange.setStart(listItem, 0);
          newRange.setEnd(listItem, 0);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } else {
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
          className="
            border-none rounded-md p-2 text-gray-300 cursor-pointer
            transition-all duration-300 flex items-center
            bg-[rgba(255,255,255,0.08)]
            hover:bg-[rgba(139,92,246,0.15)]
            hover:text-[#8b5cf6]
          "
          onMouseDown={e => {
            e.preventDefault();
            handleFormatting(cmd);
          }}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};