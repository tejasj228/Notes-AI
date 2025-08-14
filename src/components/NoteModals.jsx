import React, { useRef, useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ColorPicker, KeywordsEditor, ContentEditor } from './UI';
import { resizeImage, insertImageAtCaret } from '../utils/helpers';

// New Note Modal - MINIMAL CHANGES, just fix the innerHTML access
export const NewNoteModal = ({ 
  show, 
  noteDraft, 
  setNoteDraft, 
  onSave, 
  onClose 
}) => {
  const newNoteTextareaRef = useRef(null);

  useEffect(() => {
    if (show) {
      // Only set content if the modal is shown and the editor is empty (first open)
      const timer = setTimeout(() => {
        if (newNoteTextareaRef.current && newNoteTextareaRef.current.innerHTML === '') {
          newNoteTextareaRef.current.innerHTML = noteDraft.content || '';
          newNoteTextareaRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [show]); // Remove noteDraft.content from deps

  // Handle image insertion
  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(newNoteTextareaRef, resizedDataUrl);
      if (newNoteTextareaRef.current) {
        setNoteDraft(prev => ({ ...prev, content: newNoteTextareaRef.current.innerHTML }));
      }
    };
    input.click();
  };

  // Handle keywords change
  const handleKeywordsChange = (e) => {
    const value = e.target.value;
    setNoteDraft(prev => ({ ...prev, keywords: value }));
  };

  const handleKeywordsBlur = (e) => {
    const keywords = e.target.value
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .slice(0, 3);
    setNoteDraft(prev => ({ ...prev, keywords }));
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)' 
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-4 sm:p-6 border relative flex flex-col box-border overflow-hidden"
        style={{ 
          background: '#2a2a2a',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          width: '820px',         // reduced from 900px
          height: '650px',        // reduced from 710px
          maxWidth: '98vw',
          maxHeight: '98vh',
          minWidth: '340px',
          minHeight: '400px',
          display: 'flex'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1 sm:px-0">
          <input
            type="text"
            className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-2 sm:mr-4"
            value={noteDraft.title}
            onChange={e => setNoteDraft(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Note title..."
          />
          <button
            className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300 flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            onClick={onClose}
            title="Close"
            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Color Picker */}
        <ColorPicker
          selectedColor={noteDraft.color}
          onColorChange={color => setNoteDraft(prev => ({ ...prev, color }))}
        />
        
        {/* Keywords Editor */}
        <KeywordsEditor
          keywords={noteDraft.keywords}
          onChange={handleKeywordsChange}
          onBlur={handleKeywordsBlur}
        />
        
        {/* Content Editor */}
        <div className="flex-1 flex flex-col min-h-0 mb-4">
          <ContentEditor
            editorRef={newNoteTextareaRef}
            content={undefined} // Don't pass content prop to avoid resetting innerHTML
            onChange={() => {
              if (newNoteTextareaRef.current) {
                setNoteDraft(prev => ({ ...prev, content: newNoteTextareaRef.current.innerHTML }));
              }
            }}
            onImageInsert={handleInsertImage}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end flex-shrink-0">
          <button
            className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
            }}
            onClick={onSave}
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
  );
};

// Edit Note Modal - FIXED VERSION with Local State for Color
export const EditNoteModal = ({ 
  show, 
  note, 
  onUpdate, 
  onDelete, 
  onOpenWithAI, 
  onClose 
}) => {
  const textareaRef = useRef(null);
  
  // Local state for title to handle editing properly
  const [titleValue, setTitleValue] = useState('');
  // Local state for keywords to handle editing properly
  const [keywordsValue, setKeywordsValue] = useState('');
  // FIXED: Local state for color to handle editing properly
  const [colorValue, setColorValue] = useState('purple');

  useEffect(() => {
    if (show && note && textareaRef.current) {
      textareaRef.current.innerHTML = note.content || '';
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [show, note]);

  // Initialize title, keywords, and color when note changes
  useEffect(() => {
    if (note) {
      setTitleValue(note.title || '');
      const keywordsString = typeof note.keywords === 'string'
        ? note.keywords
        : Array.isArray(note.keywords)
          ? note.keywords.join(', ')
          : '';
      setKeywordsValue(keywordsString);
      // FIXED: Initialize color from note
      setColorValue(note.color || 'purple');
    }
  }, [note]);

  // Handle image insertion
  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(textareaRef, resizedDataUrl);
      if (textareaRef.current) {
        onUpdate(note.id, 'content', textareaRef.current.innerHTML);
      }
    };
    input.click();
  };

  // Handle title change - use local state
  const handleTitleChange = (e) => {
    setTitleValue(e.target.value);
  };

  // Handle title blur - save to main state
  const handleTitleBlur = () => {
    onUpdate(note.id, 'title', titleValue);
  };

  // Handle keywords change - use local state
  const handleKeywordsChange = (e) => {
    setKeywordsValue(e.target.value);
  };

  const handleKeywordsBlur = (e) => {
    const keywords = e.target.value
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .slice(0, 3);
    onUpdate(note.id, 'keywords', keywords);
  };

  // FIXED: Handle color change - use local state and update immediately
  const handleColorChange = (color) => {
    setColorValue(color);
    onUpdate(note.id, 'color', color);
  };

  if (!show || !note) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)' 
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-4 sm:p-6 border relative flex flex-col box-border overflow-hidden"
        style={{ 
          background: '#2a2a2a',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          width: '820px',         // reduced from 900px
          height: '650px',        // reduced from 710px
          maxWidth: '98vw',
          maxHeight: '98vh',
          minWidth: '340px',
          minHeight: '400px',
          display: 'flex'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - FIXED: Use local state for title */}
        <div className="flex items-center justify-between mb-5 px-1 sm:px-0">
          <input
            type="text"
            className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-2 sm:mr-4"
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Note title..."
          />
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button 
              className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
              onClick={() => onDelete(note.id)}
              title="Delete note"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
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
              onClick={onClose}
              title="Close"
              onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Color Picker - FIXED: Use local state */}
        <ColorPicker
          selectedColor={colorValue}
          onColorChange={handleColorChange}
        />
        
        {/* Keywords Editor - FIXED: Use local state */}
        <div>
          <input
            type="text"
            className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500"
            value={keywordsValue}
            onChange={handleKeywordsChange}
            onBlur={handleKeywordsBlur}
            placeholder="Keywords (comma separated)..."
          />
          <div className="text-xs text-gray-400 mb-2 text-right">
            {keywordsValue.split(',').map(k => k.trim()).filter(Boolean).length}/3 keywords
          </div>
        </div>
        
        {/* Content Editor */}
        <div className="flex-1 flex flex-col min-h-0 mb-4">
          <ContentEditor
            editorRef={textareaRef}
            content={note.content}
            onChange={e => onUpdate(note.id, 'content', e.currentTarget.innerHTML)}
            onImageInsert={handleInsertImage}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 flex-shrink-0">
          <button
            className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
            }}
            onClick={() => onOpenWithAI && onOpenWithAI(note)}
            onMouseEnter={e => {
              e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={e => {
              e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e2e8f0' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              <circle cx="12" cy="8" r="1"/>
              <circle cx="8" cy="16" r="1"/>
              <circle cx="16" cy="16" r="1"/>
            </svg>
            Open with AI
          </button>
          <button
            className="border-none rounded-xl px-6 py-3 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
            }}
            onClick={onClose}
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
  );
};

// Image Popup Modal
export const ImagePopup = ({ show, imageSrc, onClose }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)' 
      }}
      onClick={onClose}
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
        <div className="flex items-center justify-end w-full px-4 sm:px-6 pt-4 sm:pt-6" style={{paddingBottom: 0}}>
          <a
            href={imageSrc}
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
            className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300 ml-1 sm:ml-2"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            onClick={onClose}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-center items-center w-full h-full px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: '40vh' }}>
          <img 
            src={imageSrc} 
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
  );
};