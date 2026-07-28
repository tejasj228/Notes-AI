'use client';

import React, { useRef, useEffect, useState } from 'react';
import { X, Trash2, ImagePlus, ChevronLeft, Sparkles, Save } from 'lucide-react';
import { ColorPicker, KeywordsEditor, ContentEditor } from './UI';
import { resizeImage, insertImageAtCaret, computeNoteSize } from '@/utils/helpers';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
};

const useLockBodyScroll = (active) => {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
};

const pickImage = (onPicked) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resizedDataUrl = await resizeImage(file);
    onPicked(resizedDataUrl);
  };
  input.click();
};

// ==================================================================
// New Note
// ==================================================================
export const NewNoteModal = ({ show, noteDraft, setNoteDraft, onSave, onClose, isLoading = false }) => {
  const editorRef = useRef(null);
  const isMobile = useIsMobile();
  useLockBodyScroll(show);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      if (editorRef.current && editorRef.current.innerHTML === '') {
        editorRef.current.innerHTML = noteDraft.content || '';
        editorRef.current.focus();
      }
    }, 60);
    return () => clearTimeout(t);
  }, [show]);

  const handleInsertImage = () =>
    pickImage((url) => {
      insertImageAtCaret(editorRef, url);
      if (editorRef.current) setNoteDraft((p) => ({ ...p, content: editorRef.current.innerHTML }));
    });

  const handleKeywordsChange = (e) => setNoteDraft((p) => ({ ...p, keywords: e.target.value }));
  const handleKeywordsBlur = (e) => {
    const keywords = e.target.value.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 3);
    setNoteDraft((p) => ({ ...p, keywords }));
  };

  if (!show) return null;

  return (
    <ModalShell isMobile={isMobile} onClose={onClose} title="New note">
      <ModalHeader
        isMobile={isMobile}
        title={
          <input
            type="text"
            className="bg-transparent border-none font-display font-extrabold text-xl md:text-2xl text-ink outline-none flex-1 min-w-0 placeholder:text-ink/40"
            value={noteDraft.title}
            onChange={(e) => setNoteDraft((p) => ({ ...p, title: e.target.value }))}
            placeholder="Note title…"
          />
        }
        onClose={onClose}
        onSave={() => !isLoading && onSave()}
        saving={isLoading}
        saveLabel={isLoading ? 'Saving…' : 'Save'}
      />

      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-4 flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto md:overflow-visible">
        <ColorPicker
          selectedColor={noteDraft.color}
          onColorChange={(color) => setNoteDraft((p) => ({ ...p, color }))}
        />
        <KeywordsEditor keywords={noteDraft.keywords} onChange={handleKeywordsChange} onBlur={handleKeywordsBlur} />
        <ContentEditor
          editorRef={editorRef}
          content={undefined}
          onChange={() => editorRef.current && setNoteDraft((p) => ({ ...p, content: editorRef.current.innerHTML }))}
        />
        <div className="flex justify-start">
          <button className="brutal-btn bg-note-teal text-ink-fixed px-3 py-2 text-xs" onClick={handleInsertImage} disabled={isLoading}>
            <ImagePlus size={16} strokeWidth={2.5} /> Add image
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ==================================================================
// Edit Note
// ==================================================================
export const EditNoteModal = ({
  show,
  note,
  onUpdate,
  onDelete,
  onOpenWithAI,
  onClose,
  isDeleting = false,
  isUpdating = false,
}) => {
  const editorRef = useRef(null);
  const isMobile = useIsMobile();
  useLockBodyScroll(show);

  const [titleValue, setTitleValue] = useState('');
  const [keywordsValue, setKeywordsValue] = useState('');
  const [colorValue, setColorValue] = useState('purple');
  const [contentValue, setContentValue] = useState('');

  // Re-run on isMobile changes: the mobile/desktop layouts remount the editor, so
  // the content must be re-applied after a layout switch (otherwise it shows empty).
  useEffect(() => {
    if (show && note && editorRef.current) editorRef.current.innerHTML = note.content || '';
  }, [show, note, isMobile]);

  useEffect(() => {
    if (!note) return;
    setTitleValue(note.title || '');
    setKeywordsValue(
      typeof note.keywords === 'string' ? note.keywords : Array.isArray(note.keywords) ? note.keywords.join(', ') : ''
    );
    setColorValue(note.color || 'purple');
    setContentValue(note.content || '');
  }, [note]);

  const handleInsertImage = () =>
    pickImage((url) => {
      insertImageAtCaret(editorRef, url);
      if (editorRef.current) setContentValue(editorRef.current.innerHTML);
    });

  const handleSave = async () => {
    if (!note) return;
    const updates = [];
    if (titleValue !== (note.title || '')) updates.push(onUpdate(note._id, 'title', titleValue));
    const keywords = keywordsValue.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 3);
    const originalKeywords = Array.isArray(note.keywords)
      ? note.keywords
      : typeof note.keywords === 'string'
      ? note.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [];
    if (JSON.stringify(keywords) !== JSON.stringify(originalKeywords)) updates.push(onUpdate(note._id, 'keywords', keywords));
    if (colorValue !== (note.color || 'purple')) updates.push(onUpdate(note._id, 'color', colorValue));
    if (contentValue !== (note.content || '')) updates.push(onUpdate(note._id, 'content', contentValue));

    // Grow/shrink the card to fit its (possibly just-edited) content, so the
    // bento grid stays proportional instead of clipping/overlapping.
    const newSize = computeNoteSize(titleValue, contentValue, keywords.length);
    if (newSize !== (note.size || 'medium')) updates.push(onUpdate(note._id, 'size', newSize));

    if (updates.length > 0) await Promise.all(updates);
    onClose();
  };

  if (!show || !note) return null;

  return (
    <ModalShell isMobile={isMobile} onClose={onClose} title="Edit note">
      <ModalHeader
        isMobile={isMobile}
        title={
          <input
            type="text"
            className="bg-transparent border-none font-display font-extrabold text-xl md:text-2xl text-ink outline-none flex-1 min-w-0 placeholder:text-ink/40 disabled:opacity-50"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            placeholder="Note title…"
            disabled={isUpdating}
          />
        }
        onClose={onClose}
        onSave={handleSave}
        saving={isUpdating}
        saveLabel={isUpdating ? 'Saving…' : 'Save'}
        onDelete={() => !isDeleting && onDelete(note._id || note.id)}
        deleting={isDeleting}
      />

      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-4 flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto md:overflow-visible">
        <ColorPicker selectedColor={colorValue} onColorChange={setColorValue} disabled={isUpdating} />
        <KeywordsEditor
          keywords={keywordsValue}
          onChange={(e) => setKeywordsValue(e.target.value)}
          onBlur={(e) =>
            setKeywordsValue(e.target.value.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 3).join(', '))
          }
        />
        <ContentEditor
          editorRef={editorRef}
          content={undefined}
          onChange={(e) => setContentValue(e.currentTarget.innerHTML)}
          disabled={isUpdating}
        />
        <div className="flex justify-between items-center gap-2">
          <button className="brutal-btn bg-note-teal text-ink-fixed px-3 py-2 text-xs" onClick={handleInsertImage} disabled={isUpdating}>
            <ImagePlus size={16} strokeWidth={2.5} /> Add image
          </button>
          <button
            className="brutal-btn bg-brand text-white px-3 py-2 text-xs"
            onClick={() => onOpenWithAI && onOpenWithAI(note)}
          >
            <Sparkles size={16} strokeWidth={2.5} /> Open with AI
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ==================================================================
// Shared modal chrome
// ==================================================================
const ModalShell = ({ isMobile, onClose, children }) => {
  if (isMobile) {
    return <div className="fixed inset-0 z-50 flex flex-col bg-paper">{children}</div>;
  }
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div
        className="bg-paper border-3 border-ink shadow-brutal-xl flex flex-col w-full"
        style={{ maxWidth: '760px', height: '640px', maxHeight: '94vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ isMobile, title, onClose, onSave, saving, saveLabel, onDelete, deleting }) => (
  <div className="flex items-center gap-3 p-4 md:px-6 md:py-4 border-b-3 border-ink">
    {isMobile && (
      <button className="brutal-btn bg-card text-ink p-2" onClick={onClose} aria-label="Back">
        <ChevronLeft size={18} strokeWidth={2.75} />
      </button>
    )}
    {title}
    <div className="flex items-center gap-2 flex-shrink-0">
      {onDelete && (
        <button className="brutal-btn bg-note-red text-ink-fixed p-2" onClick={onDelete} disabled={deleting} title="Delete note">
          {deleting ? (
            <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={16} strokeWidth={2.5} />
          )}
        </button>
      )}
      {onSave && (
        <button className="brutal-btn bg-brand text-white px-4 py-2 text-xs" onClick={onSave} disabled={saving}>
          <Save size={15} strokeWidth={2.75} /> {saveLabel}
        </button>
      )}
      {!isMobile && (
        <button className="brutal-btn bg-card text-ink p-2" onClick={onClose} title="Close">
          <X size={16} strokeWidth={2.75} />
        </button>
      )}
    </div>
  </div>
);

// ==================================================================
// Image popup
// ==================================================================
export const ImagePopup = ({ show, imageSrc, onClose }) => {
  useLockBodyScroll(show);
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-paper border-3 border-ink shadow-brutal-xl flex flex-col max-w-[95vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2 p-3 border-b-3 border-ink">
          <a
            href={imageSrc}
            download={`note-image-${Date.now()}.jpg`}
            className="brutal-btn bg-note-green text-ink-fixed p-2"
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button className="brutal-btn bg-card text-ink p-2" onClick={onClose} title="Close">
            <X size={16} strokeWidth={2.75} />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center overflow-auto">
          <img
            src={imageSrc}
            alt="Preview"
            className="border-3 border-ink"
            style={{ maxWidth: '86vw', maxHeight: '74vh', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );
};
