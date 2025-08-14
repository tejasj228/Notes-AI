import React, { useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { COLORS } from '../utils/constants';
import { getColorPickerBackground } from '../utils/helpers';

// Bulletproof Formatting Toolbar Component
export const FormattingToolbar = ({ editorRef }) => {
  const executeCommand = (command, value = null) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Focus the editor first
    editor.focus();
    
    // Save the current selection
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      // If no selection, place cursor at end of editor
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Execute the command
    document.execCommand(command, false, value);
    
    // Keep focus on editor
    editor.focus();
  };

  const handleButtonClick = (e, command) => {
    e.preventDefault();
    e.stopPropagation();
    executeCommand(command);
  };

  return (
    <div className="flex gap-2" style={{ userSelect: 'none' }}>
      <button
        type="button"
        className="format-btn"
        title="Bold (Ctrl+B)"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'bold')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <Bold size={16} />
      </button>

      <button
        type="button"
        className="format-btn"
        title="Italic (Ctrl+I)"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'italic')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <Italic size={16} />
      </button>

      <button
        type="button"
        className="format-btn"
        title="Underline (Ctrl+U)"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'underline')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <Underline size={16} />
      </button>

      <button
        type="button"
        className="format-btn"
        title="Strikethrough"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'strikeThrough')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <Strikethrough size={16} />
      </button>

      <button
        type="button"
        className="format-btn"
        title="Bullet List"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'insertUnorderedList')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <List size={16} />
      </button>

      <button
        type="button"
        className="format-btn"
        title="Numbered List"
        style={{
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: '#cccccc',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => handleButtonClick(e, 'insertOrderedList')}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(139,92,246,0.15)';
          e.target.style.color = '#8b5cf6';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
          e.target.style.color = '#cccccc';
        }}
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

// Color Picker Component
export const ColorPicker = ({ selectedColor, onColorChange, label = "Color:" }) => {
  return (
    <div className="flex gap-2 items-center mb-4 flex-wrap">
      <span className="text-sm text-gray-300 mr-2 font-medium">{label}</span>
      {COLORS.map((color) => (
        <div
          key={color}
          className="flex-shrink-0 rounded-full cursor-pointer border-3 transition-all duration-300 relative hover:scale-110"
          style={{
            width: '32px',
            height: '32px',
            background: getColorPickerBackground(color),
            borderColor: selectedColor === color ? '#ffffff' : 'transparent',
            transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)'
          }}
          onClick={() => onColorChange(color)}
          title={color.charAt(0).toUpperCase() + color.slice(1)}
        >
          {selectedColor === color && (
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
  );
};

// Trash Menu Component
export const TrashMenu = ({ noteId, onRestore, onPermanentDelete, onClose }) => {
  return (
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
          onRestore(noteId);
          onClose();
        }}
      >
        <RotateCcw size={16} />
        Restore
      </button>
      <button 
        className="bg-transparent border-none w-full py-3 px-4 text-red-400 text-sm cursor-pointer flex items-center justify-start gap-3 transition-colors duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onPermanentDelete(noteId);
          onClose();
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(220, 38, 38, 0.1)'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        <Trash2 size={16} />
        Remove from trash
      </button>
    </div>
  );
};

// Folder Menu Component
export const FolderMenu = ({ folderId, onRename, onDelete, onClose }) => {
  return (
    <div className="absolute right-0 top-10 z-30 bg-[#232323] border rounded-lg shadow-lg py-2 min-w-36 folder-menu-container">
      <button
        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 text-sm folder-menu-container"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Edit Folder
      </button>
      <button
        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 text-sm folder-menu-container"
        onClick={() => {
          onDelete(folderId);
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
};

// Keywords Editor Component
export const KeywordsEditor = ({ keywords, onChange, onBlur, placeholder = "Keywords (comma separated)..." }) => {
  const keywordCount = Array.isArray(keywords) 
    ? keywords.filter(k => k.trim()).length 
    : typeof keywords === 'string'
      ? keywords.split(',').map(k => k.trim()).filter(Boolean).length
      : 0;

  return (
    <>
      <input
        type="text"
        className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500"
        value={typeof keywords === 'string'
          ? keywords
          : Array.isArray(keywords)
            ? keywords.join(', ')
            : ''
        }
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <div className="text-xs text-gray-400 mb-2 text-right">
        {keywordCount}/3 keywords
      </div>
    </>
  );
};

// Content Editor Component - FIXED: Removed internal button layout
export const ContentEditor = ({ 
  editorRef, 
  content, 
  onChange, 
  onImageInsert, 
  placeholder = "Start writing your note here...",
  className = ""
}) => {
  // Set initial content when component mounts or content changes
  useEffect(() => {
    if (editorRef.current && content !== undefined && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handlePaste = (e) => {
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
  };

  const handleInput = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={editorRef}
        className={`note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1 ${className}`}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          minHeight: '200px',  // Reduced for better modal fit
          maxHeight: '400px',  // Reduced for better modal fit
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
      
      {/* Toolbar Section - Separate from buttons */}
      {/* <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border-none rounded-md p-2 text-gray-300 cursor-pointer transition-all duration-300 flex items-center text-xs"
            title="Insert Image"
            onClick={onImageInsert}
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
          <FormattingToolbar editorRef={editorRef} />
        </div>
      </div> */}
    </div>
  );
};