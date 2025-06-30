import React from 'react';
import { X, Folder } from 'lucide-react';
import { ColorPicker } from './UI';

// New Folder Modal
export const NewFolderModal = ({ 
  show, 
  folderDraft, 
  setFolderDraft, 
  onSave, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-5"
      style={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)' 
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-6 w-full max-w-md border relative"
        style={{ 
          background: '#2a2a2a',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-200">Create New Folder</h2>
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
        
        {/* Folder Name */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-medium">Folder Name</label>
          <input
            type="text"
            className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-4"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f3f3f3',
              borderColor: 'rgba(255,255,255,0.15)'
            }}
            value={folderDraft.name}
            onChange={e => setFolderDraft(prev => ({ ...prev, name: e.target.value }))}
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
          <ColorPicker
            selectedColor={folderDraft.color}
            onColorChange={color => setFolderDraft(prev => ({ ...prev, color }))}
            label="Folder Color"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            className="border rounded-xl px-6 py-3 text-gray-300 text-sm font-medium cursor-pointer transition-all duration-300"
            style={{
              background: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            onClick={onClose}
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
            onClick={onSave}
            disabled={!folderDraft.name.trim()}
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
  );
};

// Rename Folder Modal
export const RenameFolderModal = ({ 
  show, 
  folderDraft, 
  setFolderDraft, 
  onSave, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-5"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div 
        className="bg-[#232323] rounded-2xl p-6 w-full max-w-md border relative"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Edit Folder</h2>
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

        {/* Folder Name */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-medium">Folder Name</label>
          <input
            type="text"
            className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-4"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f3f3f3',
              borderColor: 'rgba(255,255,255,0.15)'
            }}
            value={folderDraft.name}
            onChange={e => setFolderDraft(prev => ({ 
              ...prev, 
              name: e.target.value.slice(0, 50) // Limit length
            }))}
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
          <ColorPicker
            selectedColor={folderDraft.color}
            onColorChange={color => setFolderDraft(prev => ({ ...prev, color }))}
            label="Folder Color"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            className="border rounded-xl px-6 py-3 text-gray-300 text-sm font-medium cursor-pointer transition-all duration-300"
            style={{
              background: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            onClick={onClose}
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
            onClick={onSave}
            disabled={!folderDraft.name.trim()}
            onMouseEnter={e => {
              if (!e.target.disabled) {
                e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={e => {
              e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};