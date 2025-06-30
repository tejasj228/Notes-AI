import React from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { COLORS } from '../utils/constants';
import { getColorPickerBackground } from '../utils/helpers';

// Formatting Toolbar Component
export const FormattingToolbar = ({ editorRef }) => {
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

// Color Picker Component
export const ColorPicker = ({ selectedColor, onColorChange, label = "Color:" }) => {
  return (
    <div className="flex gap-2 items-center mb-4">
      <span className="text-sm text-gray-300 mr-2 font-medium">{label}</span>
      {COLORS.map((color) => (
        <div
          key={color}
          className="w-8 h-8 rounded-full cursor-pointer border-3 transition-all duration-300 relative hover:scale-110"
          style={{
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
    <div className="absolute right-0 top-10 z-30 bg-[#232323] border rounded-lg shadow-lg py-2 min-w-36">
      <button
        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 text-sm"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Edit Folder
      </button>
      <button
        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 text-sm"
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

// Content Editor Component
export const ContentEditor = ({ 
  editorRef, 
  content, 
  onChange, 
  onImageInsert, 
  placeholder = "Start writing your note here...",
  className = ""
}) => {
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={editorRef}
        className={`note-content-editable w-full border rounded-xl p-4 text-sm leading-relaxed font-inherit mb-4 overflow-y-auto transition-colors duration-200 outline-none relative flex-1 ${className}`}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={onChange}
        onPaste={handlePaste}
        data-placeholder={placeholder}
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
      <div className="flex items-center justify-between mt-2 w-full">
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
        {/* Action buttons will be placed here from NoteModals */}
        {/** children or slot for action buttons if needed **/}
      </div>
    </div>
  );
};