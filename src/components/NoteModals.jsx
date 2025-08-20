import React, { useRef, useEffect, useState } from 'react';
import { X, Trash2, ImagePlus, ChevronLeft } from 'lucide-react';
import { ColorPicker, KeywordsEditor, ContentEditor } from './UI';
import { resizeImage, insertImageAtCaret } from '../utils/helpers';

// Small helper to detect phone-sized viewports (tailwind's sm breakpoint ~640px)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
};

// Shared: lock body scroll when a full-screen sheet is open
const useLockBodyScroll = (active) => {
  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [active]);
};

// -----------------------------------------------------------------------------
// New Note — Phone gets a full-screen sheet; desktop keeps the centered modal
// -----------------------------------------------------------------------------
export const NewNoteModal = ({ 
  show, 
  noteDraft, 
  setNoteDraft, 
  onSave, 
  onClose,
  onOpenWithAI, // optional
  isLoading = false
}) => {
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const isMobile = useIsMobile();
  useLockBodyScroll(show);

  // initialize content only on first open (avoids innerHTML clobbering)
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      if (editorRef.current && editorRef.current.innerHTML === '') {
        editorRef.current.innerHTML = noteDraft.content || '';
        editorRef.current.focus();
      }
      if (titleRef.current && titleRef.current.textContent !== noteDraft.title) {
        titleRef.current.textContent = noteDraft.title || '';
      }
    }, 80);
    return () => clearTimeout(t);
  }, [show]);

  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(editorRef, resizedDataUrl);
      if (editorRef.current) {
        setNoteDraft(prev => ({ ...prev, content: editorRef.current.innerHTML }));
      }
    };
    input.click();
  };

  const handleKeywordsChange = (e) => setNoteDraft(prev => ({ ...prev, keywords: e.target.value }));
  const handleKeywordsBlur = (e) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3);
    setNoteDraft(prev => ({ ...prev, keywords }));
  };

  if (!show) return null;

  // ------------------ FULL-SCREEN PHONE SHEET ------------------
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#1f1f1f] text-gray-200">
        {/* Fixed Header: Back (left) + Save (right) */}
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-3 border-b bg-[#1f1f1f]" style={{borderColor:'rgba(255,255,255,0.08)'}}>
          <button
            className="rounded-lg p-2 hover:bg-white/10"
            onClick={onClose}
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            disabled={isLoading}
            onClick={() => !isLoading && onSave()}
            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              background: isLoading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'
            }}
          >
            {isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>

                  {/* Scrollable Body - Full height with proper padding */}
        <div className="flex-1 overflow-y-auto px-3" style={{paddingTop: '72px', paddingBottom: '72px'}}>
          {/* Title */}
          <div
            ref={titleRef}
            contentEditable
            className="w-full bg-transparent border-none text-xl font-semibold outline-none placeholder-gray-500 mt-2 mb-4 leading-tight"
            onInput={(e) => setNoteDraft(prev => ({ ...prev, title: e.target.textContent || '' }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            style={{ 
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              lineHeight: '1.3',
              minHeight: '1.5em'
            }}
            suppressContentEditableWarning={true}
            data-placeholder={!noteDraft.title ? 'Title' : ''}
          />

          {/* Color Picker */}
          <div className="mb-4">
            <ColorPicker
              selectedColor={noteDraft.color}
              onColorChange={color => setNoteDraft(prev => ({ ...prev, color }))}
            />
          </div>

          {/* Keywords */}
          <div className="mb-4">
            <KeywordsEditor
              keywords={noteDraft.keywords}
              onChange={handleKeywordsChange}
              onBlur={handleKeywordsBlur}
            />
          </div>

          {/* Content Editor - No separate box, just the contenteditable div */}
          <div
            ref={editorRef}
            contentEditable
            className="w-full bg-transparent text-gray-200 text-sm leading-relaxed outline-none min-h-[60vh] focus:outline-none"
            onInput={() => {
              if (editorRef.current) {
                setNoteDraft(prev => ({ ...prev, content: editorRef.current.innerHTML }));
              }
            }}
            placeholder="Write your note..."
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{ __html: noteDraft.content || '' }}
          />
        </div>

        {/* Fixed Bottom Toolbar */}
        <div className="fixed bottom-0 left-0 right-0 z-10 px-3 py-3 bg-[#242424] border-t flex items-center justify-between"
             style={{borderColor:'rgba(255,255,255,0.08)'}}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInsertImage}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-600/20 text-purple-300"
              title="Add image"
              disabled={isLoading}
              style={{border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.1)'}}
            >
              <ImagePlus size={18} />
            </button>
            {onOpenWithAI && (
              <button
                onClick={() => onOpenWithAI(noteDraft)}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                title="Open with AI"
                disabled={isLoading}
                style={{
                  background: isLoading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  <circle cx="12" cy="8" r="1"/>
                  <circle cx="8" cy="16" r="1"/>
                  <circle cx="16" cy="16" r="1"/>
                </svg>
                Open with AI
              </button>
            )}
          </div>
          <button
            onClick={() => {
              // treat trash as "discard draft"
              setNoteDraft({ title: '', keywords: '', color: 'purple', content: '' });
              onClose();
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-600/20 text-red-400"
            title="Discard"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ------------------ DESKTOP MODAL (unchanged visuals) ------------------
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)'}}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-4 sm:p-6 border relative flex flex-col box-border overflow-hidden"
        style={{ 
          background: '#2a2a2a',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          width: '820px', height: '650px', maxWidth: '98vw', maxHeight: '98vh', minWidth: '340px', minHeight: '400px', display: 'flex'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-3 sm:px-2">
          <input
            type="text"
            className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-4 sm:mr-5"
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

        {/* Keywords */}
        <KeywordsEditor
          keywords={noteDraft.keywords}
          onChange={handleKeywordsChange}
          onBlur={handleKeywordsBlur}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <ContentEditor
            editorRef={editorRef}
            content={undefined}
            onChange={() => {
              if (editorRef.current) {
                setNoteDraft(prev => ({ ...prev, content: editorRef.current.innerHTML }));
              }
            }}
            onImageInsert={handleInsertImage}
          />
        </div>

        {/* Bottom row */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleInsertImage}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload image to note"
            disabled={isLoading}
            style={{ backgroundColor:'rgba(139,92,246,0.1)', borderColor:'rgba(139,92,246,0.3)', border:'1px solid'}}
          >
            <ImagePlus size={16} />
          </button>

          <button
            className="border-none rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-gray-200 text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1 sm:gap-2 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: isLoading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)', boxShadow:'0 0 0 rgba(139,92,246,0)'}}
            onClick={() => { if (!isLoading) onSave(); }}
            disabled={isLoading}
            onMouseEnter={e => { if (!isLoading) { e.target.style.boxShadow = '0 5px 15px rgba(139,92,246,0.4)'; }}}
            onMouseLeave={e => { e.target.style.boxShadow = '0 0 0 rgba(139,92,246,0)'; }}
          >
            {isLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Creating...</>) : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Edit Note — Phone full-screen with toolbar; desktop modal kept intact
// -----------------------------------------------------------------------------
export const EditNoteModal = ({ 
  show, 
  note, 
  onUpdate, 
  onDelete, 
  onOpenWithAI, 
  onClose,
  isDeleting = false,
  isUpdating = false
}) => {
  const textareaRef = useRef(null);
  const titleRef = useRef(null);
  const isMobile = useIsMobile();
  useLockBodyScroll(show);

  // Local state mirrors props while editing
  const [titleValue, setTitleValue] = useState('');
  const [keywordsValue, setKeywordsValue] = useState('');
  const [colorValue, setColorValue] = useState('purple');
  const [contentValue, setContentValue] = useState('');

  useEffect(() => {
    if (show && note && textareaRef.current) {
      textareaRef.current.innerHTML = note.content || '';
    }
    if (show && note && titleRef.current && titleRef.current.textContent !== (note.title || '')) {
      titleRef.current.textContent = note.title || '';
    }
  }, [show, note]);

  useEffect(() => {
    if (!note) return;
    setTitleValue(note.title || '');
    const keywordsString = typeof note.keywords === 'string' ? note.keywords : Array.isArray(note.keywords) ? note.keywords.join(', ') : '';
    setKeywordsValue(keywordsString);
    setColorValue(note.color || 'purple');
    setContentValue(note.content || '');
  }, [note]);

  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(textareaRef, resizedDataUrl);
      if (textareaRef.current) setContentValue(textareaRef.current.innerHTML);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!note) return;
    const updates = [];
    if (titleValue !== (note.title || '')) updates.push(onUpdate(note._id, 'title', titleValue));
    const keywords = keywordsValue.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3);
    const originalKeywords = Array.isArray(note.keywords) ? note.keywords : typeof note.keywords === 'string' ? note.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (JSON.stringify(keywords) !== JSON.stringify(originalKeywords)) updates.push(onUpdate(note._id, 'keywords', keywords));
    if (colorValue !== (note.color || 'purple')) updates.push(onUpdate(note._id, 'color', colorValue));
    if (contentValue !== (note.content || '')) updates.push(onUpdate(note._id, 'content', contentValue));
    if (updates.length > 0) await Promise.all(updates);
    onClose();
  };

  if (!show || !note) return null;

  // ------------------ FULL-SCREEN PHONE SHEET ------------------
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#1f1f1f] text-gray-200">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-3 border-b bg-[#1f1f1f]" style={{borderColor:'rgba(255,255,255,0.08)'}}>
          <button className="rounded-lg p-2 hover:bg-white/10" onClick={onClose} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'}}
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-3" style={{paddingTop: '72px', paddingBottom: '72px'}}>
          <div
            ref={titleRef}
            contentEditable
            className="w-full bg-transparent border-none text-xl font-semibold outline-none placeholder-gray-500 mt-2 mb-4 disabled:opacity-50 leading-tight"
            onInput={(e) => setTitleValue(e.target.textContent || '')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            style={{ 
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              lineHeight: '1.3',
              minHeight: '1.5em',
              opacity: isUpdating ? 0.5 : 1,
              pointerEvents: isUpdating ? 'none' : 'auto'
            }}
            suppressContentEditableWarning={true}
            data-placeholder={!titleValue ? 'Title' : ''}
          />

          <div className="mb-4">
            <ColorPicker selectedColor={colorValue} onColorChange={setColorValue} disabled={isUpdating} />
          </div>

          <div className="mb-4">
            <input
              type="text"
              className="w-full bg-transparent border-none text-sm text-gray-300 outline-none font-normal placeholder-gray-500 disabled:opacity-50"
              value={keywordsValue}
              onChange={(e)=>setKeywordsValue(e.target.value)}
              placeholder="Keywords (comma separated)…"
              disabled={isUpdating}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {keywordsValue.split(',').map(k=>k.trim()).filter(Boolean).length}/3 keywords
            </div>
          </div>

          {/* Content Editor - Direct contenteditable div */}
          <div
            ref={textareaRef}
            contentEditable
            className="w-full bg-transparent text-gray-200 text-sm leading-relaxed outline-none min-h-[60vh] focus:outline-none disabled:opacity-50"
            onInput={(e) => setContentValue(e.currentTarget.innerHTML)}
            placeholder="Write your note..."
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            suppressContentEditableWarning={true}
          />
        </div>

        {/* Fixed Bottom Toolbar */}
        <div className="fixed bottom-0 left-0 right-0 z-10 px-3 py-3 bg-[#242424] border-t flex items-center justify-between"
             style={{borderColor:'rgba(255,255,255,0.08)'}}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInsertImage}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-600/20 text-purple-300 disabled:opacity-50"
              title="Add image"
              disabled={isUpdating}
              style={{border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.1)'}}
            >
              <ImagePlus size={18} />
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              onClick={() => onOpenWithAI && onOpenWithAI(note)}
              title="Open with AI"
              disabled={isUpdating}
              style={{
                background: isUpdating ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                <circle cx="12" cy="8" r="1"/>
                <circle cx="8" cy="16" r="1"/>
                <circle cx="16" cy="16" r="1"/>
              </svg>
              Open with AI
            </button>
          </div>
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-600/20 text-red-400 disabled:opacity-50"
            onClick={() => !isDeleting && onDelete(note._id || note.id)}
            title="Delete"
            disabled={isDeleting}
          >
            {isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div> : <Trash2 size={18} />}
          </button>
        </div>
      </div>
    );
  }

  // ------------------ DESKTOP MODAL (existing) ------------------
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)'}}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-4 sm:p-6 border relative flex flex-col box-border overflow-hidden"
        style={{ background:'#2a2a2a', borderColor:'rgba(255,255,255,0.1)', width:'820px', height:'650px', maxWidth:'98vw', maxHeight:'98vh', minWidth:'340px', minHeight:'400px', display:'flex' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-3 sm:px-2">
          <input
            type="text"
            className="bg-transparent border-none text-xl font-semibold text-gray-200 outline-none flex-1 mr-4 sm:mr-5 disabled:opacity-50"
            value={titleValue}
            onChange={(e)=>setTitleValue(e.target.value)}
            placeholder="Note title..."
            disabled={isUpdating}
          />
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button 
              className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
              onClick={() => !isDeleting && onDelete(note._id || note.id)}
              title="Delete note"
              disabled={isDeleting}
              style={{ background:'rgba(255,255,255,0.1)', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1 }}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
              ) : (
                <Trash2 size={16} />
              )}
            </button>
            <button 
              className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
              style={{ background:'rgba(255,255,255,0.1)' }}
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <ColorPicker selectedColor={colorValue} onColorChange={setColorValue} disabled={isUpdating} />

        <div>
          <input
            type="text"
            className="bg-transparent border-none text-sm text-gray-300 outline-none mb-3 w-full font-normal p-0 placeholder-gray-500 disabled:opacity-50"
            value={keywordsValue}
            onChange={(e)=>setKeywordsValue(e.target.value)}
            placeholder="Keywords (comma separated)..."
            disabled={isUpdating}
          />
          <div className="text-xs text-gray-400 mb-2 text-right">
            {keywordsValue.split(',').map(k => k.trim()).filter(Boolean).length}/3 keywords
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <ContentEditor
            editorRef={textareaRef}
            content={contentValue}
            onChange={(e)=>setContentValue(e.currentTarget.innerHTML)}
            onImageInsert={handleInsertImage}
            disabled={isUpdating}
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleInsertImage}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload image to note"
            disabled={isUpdating}
            style={{ backgroundColor:'rgba(139,92,246,0.1)', borderColor:'rgba(139,92,246,0.3)', border:'1px solid' }}
          >
            <ImagePlus size={16} />
          </button>

          <div className="flex gap-2">
            <button
              className="border-none rounded-xl px-3 py-2 text-gray-200 text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-2"
              style={{ background:'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'}}
              onClick={() => onOpenWithAI && onOpenWithAI(note)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e2e8f0' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                <circle cx="12" cy="8" r="1"/>
                <circle cx="8" cy="16" r="1"/>
                <circle cx="16" cy="16" r="1"/>
              </svg>
              <span className="hidden sm:inline">Open with AI</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              className="border-none rounded-xl px-3 py-2 text-gray-200 text-xs sm:text-sm font-medium cursor-pointer"
              style={{ background:'linear-gradient(135deg,#8b5cf6 0%, #7c3aed 100%)'}}
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// ImagePopup stays the same (no change required for mobile full-screen editor)
// -----------------------------------------------------------------------------
export const ImagePopup = ({ show, imageSrc, onClose }) => {
  useLockBodyScroll(show);
  if (!show) return null;
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-5"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)'}}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl border relative flex flex-col"
        style={{ background:'#2a2a2a', borderColor:'rgba(255,255,255,0.1)', maxWidth:'95vw', maxHeight:'90vh', width:'auto', height:'auto', display:'flex', justifyContent:'center', alignItems:'center', padding:0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-end w-full px-4 sm:px-6 pt-4" style={{paddingBottom:0}}>
          <a href={imageSrc} download={`note-image-${Date.now()}.jpg`} className="rounded-lg p-2 text-gray-200 hover:bg-white/10" title="Download" onClick={e => e.stopPropagation()}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <button className="rounded-lg p-2 text-gray-200 hover:bg-white/10 ml-1 sm:ml-2" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-center items-center w-full h-full px-4 sm:px-6 pb-4" style={{ minHeight:'40vh' }}>
          <img src={imageSrc} alt="Preview" style={{ maxWidth:'90vw', maxHeight:'80vh', width:'auto', height:'auto', objectFit:'contain', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 4px 12px rgba(0,0,0,0.3)', borderRadius:'16px', background:'#181818' }} />
        </div>
      </div>
    </div>
  );
};