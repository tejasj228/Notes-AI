'use client';

import React, { useEffect } from 'react';
import { COLORS } from '@/utils/constants';
import { getNoteColor } from '@/utils/helpers';

// ------------------------------------------------------------------
// Color Picker — solid swatches with hard borders
// ------------------------------------------------------------------
export const ColorPicker = ({ selectedColor, onColorChange, label = 'Color', disabled = false }) => {
  return (
    <div className={`flex gap-2 items-center flex-wrap ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <span className="brutal-eyebrow mr-1">{label}</span>
      {COLORS.map((color) => {
        const selected = selectedColor === color;
        return (
          <button
            type="button"
            key={color}
            className="flex-shrink-0 border-3 border-ink transition-transform"
            style={{
              width: '30px',
              height: '30px',
              background: getNoteColor(color),
              transform: selected ? 'translate(-1px,-1px)' : 'none',
              boxShadow: selected ? '3px 3px 0 0 #141210' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !disabled && onColorChange(color)}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
            aria-label={color}
          >
            {selected && (
              <span className="flex items-center justify-center h-full text-ink font-black text-sm leading-none">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------
// Keywords Editor
// ------------------------------------------------------------------
export const KeywordsEditor = ({ keywords, onChange, onBlur, placeholder = 'keywords, comma, separated' }) => {
  const value =
    typeof keywords === 'string' ? keywords : Array.isArray(keywords) ? keywords.join(', ') : '';
  const keywordCount = value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean).length;

  return (
    <div>
      <input
        type="text"
        className="brutal-input w-full px-3 py-2 text-sm font-mono"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <div className="brutal-eyebrow mt-1 text-right text-ink/60">{keywordCount}/3 tags</div>
    </div>
  );
};

// ------------------------------------------------------------------
// Content Editor (rich contentEditable)
// ------------------------------------------------------------------
export const ContentEditor = ({
  editorRef,
  content,
  onChange,
  placeholder = 'Start writing your note…',
  className = '',
  disabled = false,
}) => {
  useEffect(() => {
    if (editorRef.current && content !== undefined && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handlePaste = (e) => {
    if (
      e.clipboardData &&
      Array.from(e.clipboardData.items).some((item) => item.type.startsWith('image/'))
    ) {
      return;
    }
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={editorRef}
        className={`note-content-editable w-full border-3 border-ink bg-white p-4 text-sm leading-relaxed overflow-y-auto outline-none relative flex-1 ${className} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        contentEditable={!disabled}
        suppressContentEditableWarning={true}
        onInput={disabled ? undefined : onChange}
        onPaste={disabled ? undefined : handlePaste}
        data-placeholder={disabled ? 'Saving…' : placeholder}
        style={{ minHeight: '200px', maxHeight: '400px', color: '#141210' }}
      />
    </div>
  );
};

// ------------------------------------------------------------------
// Folder options menu
// ------------------------------------------------------------------
export const FolderMenu = ({ folderId, onRename, onDelete, onClose }) => {
  return (
    <div className="absolute right-0 top-9 z-30 border-3 border-ink bg-white shadow-brutal min-w-36 folder-menu-container animate-pop-in">
      <button
        className="w-full text-left px-4 py-2 text-ink hover:bg-note-yellow text-sm font-semibold folder-menu-container transition-colors"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Edit folder
      </button>
      <div className="h-[3px] bg-ink" />
      <button
        className="w-full text-left px-4 py-2 text-ink hover:bg-note-red text-sm font-semibold folder-menu-container transition-colors"
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
