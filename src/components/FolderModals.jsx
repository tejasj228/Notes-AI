'use client';

import React, { useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { ColorPicker } from './UI';

const MAX_NAME = 10;
const MAX_FOLDERS = 10;

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

const FolderModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50" onClick={onClose}>
    <div
      className="bg-paper border-3 border-ink shadow-brutal-xl w-full max-w-md p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-extrabold text-2xl">{title}</h2>
        <button className="brutal-btn bg-card text-ink p-2" onClick={onClose} title="Close">
          <X size={16} strokeWidth={2.75} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const NameField = ({ value, onChange }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-1.5">
      <label className="brutal-eyebrow">Folder name</label>
      <span className="brutal-eyebrow text-ink/60">
        {value.length}/{MAX_NAME}
      </span>
    </div>
    <input
      type="text"
      className="brutal-input w-full px-3 py-2.5 font-sans"
      value={value}
      onChange={onChange}
      placeholder="Enter folder name…"
      autoFocus
      maxLength={MAX_NAME}
    />
  </div>
);

export const NewFolderModal = ({
  show,
  folderDraft,
  setFolderDraft,
  onSave,
  onClose,
  existingFoldersCount = 0,
  isLoading = false,
}) => {
  useLockBodyScroll(show);
  if (!show) return null;

  const canCreate = existingFoldersCount < MAX_FOLDERS;
  const handleNameChange = (e) => {
    if (e.target.value.length <= MAX_NAME) setFolderDraft((p) => ({ ...p, name: e.target.value }));
  };
  const disabled = !canCreate || !folderDraft.name.trim() || isLoading;

  return (
    <FolderModalShell title="New folder" onClose={onClose}>
      {!canCreate && (
        <div className="mb-4 border-3 border-ink bg-note-red p-3 text-sm font-semibold text-ink-fixed">
          You’ve hit the max of {MAX_FOLDERS} folders. Delete one to make room.
        </div>
      )}
      <NameField value={folderDraft.name} onChange={handleNameChange} />
      <div className="mb-6">
        <ColorPicker
          selectedColor={folderDraft.color}
          onColorChange={(color) => setFolderDraft((p) => ({ ...p, color }))}
          label="Folder color"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button className="brutal-btn bg-card text-ink px-4 py-2 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button
          className="brutal-btn bg-brand text-white px-4 py-2 text-xs"
          onClick={() => !disabled && onSave()}
          disabled={disabled}
        >
          <Folder size={15} strokeWidth={2.5} />
          {isLoading ? 'Creating…' : 'Create folder'}
        </button>
      </div>
    </FolderModalShell>
  );
};

export const RenameFolderModal = ({ show, folderDraft, setFolderDraft, onSave, onClose, isLoading = false }) => {
  useLockBodyScroll(show);
  if (!show) return null;

  const handleNameChange = (e) => {
    if (e.target.value.length <= MAX_NAME) setFolderDraft((p) => ({ ...p, name: e.target.value }));
  };
  const disabled = !folderDraft.name.trim() || isLoading;

  return (
    <FolderModalShell title="Edit folder" onClose={onClose}>
      <NameField value={folderDraft.name} onChange={handleNameChange} />
      <div className="mb-6">
        <ColorPicker
          selectedColor={folderDraft.color}
          onColorChange={(color) => setFolderDraft((p) => ({ ...p, color }))}
          label="Folder color"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button className="brutal-btn bg-card text-ink px-4 py-2 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button
          className="brutal-btn bg-brand text-white px-4 py-2 text-xs"
          onClick={() => !disabled && onSave()}
          disabled={disabled}
        >
          {isLoading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </FolderModalShell>
  );
};
