import React, { useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { ColorPicker } from './UI';

// New Folder Modal
export const NewFolderModal = ({ 
  show, 
  folderDraft, 
  setFolderDraft, 
  onSave, 
  onClose,
  existingFoldersCount = 0, // Add this prop to check current folder count
  isLoading = false
}) => {
  const maxFolders = 10;
  const maxNameLength = 10;
  const canCreateFolder = existingFoldersCount < maxFolders;

  // Disable scrolling when modal is open
  useEffect(() => {
    if (show) {
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Re-enable scrolling
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [show]);

  if (!show) return null;

  const handleNameChange = (e) => {
    const value = e.target.value;
    // Restrict to max 10 characters
    if (value.length <= maxNameLength) {
      setFolderDraft(prev => ({ ...prev, name: value }));
    }
  };

  const handleSave = () => {
    if (canCreateFolder && folderDraft.name.trim() && !isLoading) {
      onSave();
    }
  };

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

        {/* Folder Limit Warning */}
        {!canCreateFolder && (
          <div className="mb-4 p-3 rounded-lg border" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}>
            <p className="text-red-400 text-sm">
              You've reached the maximum limit of {maxFolders} folders. Delete a folder to create a new one.
            </p>
          </div>
        )}
        
        {/* Folder Name */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-300 font-medium">Folder Name</label>
            <span className="text-xs text-gray-400">
              {folderDraft.name.length}/{maxNameLength}
            </span>
          </div>
          <input
            type="text"
            className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-2"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f3f3f3',
              borderColor: folderDraft.name.length === maxNameLength 
                ? 'rgba(239, 68, 68, 0.5)' 
                : 'rgba(255,255,255,0.15)'
            }}
            value={folderDraft.name}
            onChange={handleNameChange}
            placeholder="Enter folder name..."
            autoFocus
            disabled={!canCreateFolder}
            maxLength={maxNameLength}
            onFocus={e => {
              if (canCreateFolder) {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onBlur={e => {
              e.target.style.borderColor = folderDraft.name.length === maxNameLength 
                ? 'rgba(239, 68, 68, 0.5)' 
                : 'rgba(255, 255, 255, 0.1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
          {folderDraft.name.length === maxNameLength && (
            <p className="text-xs text-red-400">
              Maximum {maxNameLength} characters reached
            </p>
          )}
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
            className="border-none rounded-xl px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: (canCreateFolder && folderDraft.name.trim() && !isLoading) 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              color: (canCreateFolder && folderDraft.name.trim() && !isLoading) ? '#ffffff' : '#888888',
              boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
              cursor: (canCreateFolder && folderDraft.name.trim() && !isLoading) ? 'pointer' : 'not-allowed'
            }}
            onClick={handleSave}
            disabled={!canCreateFolder || !folderDraft.name.trim() || isLoading}
            onMouseEnter={e => {
              if (canCreateFolder && folderDraft.name.trim() && !isLoading) {
                e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={e => {
              e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Folder size={18} className="inline mr-2" />
                Create Folder
              </>
            )}
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
  onClose,
  isLoading = false
}) => {
  const maxNameLength = 10;

  // Disable scrolling when modal is open
  useEffect(() => {
    if (show) {
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Re-enable scrolling
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [show]);

  if (!show) return null;

  const handleNameChange = (e) => {
    const value = e.target.value;
    // Restrict to max 10 characters
    if (value.length <= maxNameLength) {
      setFolderDraft(prev => ({ ...prev, name: value }));
    }
  };

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-300 font-medium">Folder Name</label>
            <span className="text-xs text-gray-400">
              {folderDraft.name.length}/{maxNameLength}
            </span>
          </div>
          <input
            type="text"
            className="w-full border rounded-xl p-3 text-gray-200 outline-none mb-2"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f3f3f3',
              borderColor: folderDraft.name.length === maxNameLength 
                ? 'rgba(239, 68, 68, 0.5)' 
                : 'rgba(255,255,255,0.15)'
            }}
            value={folderDraft.name}
            onChange={handleNameChange}
            placeholder="Enter folder name..."
            autoFocus
            maxLength={maxNameLength}
            onFocus={e => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={e => {
              e.target.style.borderColor = folderDraft.name.length === maxNameLength 
                ? 'rgba(239, 68, 68, 0.5)' 
                : 'rgba(255, 255, 255, 0.1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
          {folderDraft.name.length === maxNameLength && (
            <p className="text-xs text-red-400">
              Maximum {maxNameLength} characters reached
            </p>
          )}
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
              background: (folderDraft.name.trim() && !isLoading) 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
              cursor: (folderDraft.name.trim() && !isLoading) ? 'pointer' : 'not-allowed'
            }}
            onClick={() => !isLoading && onSave()}
            disabled={!folderDraft.name.trim() || isLoading}
            onMouseEnter={e => {
              if (folderDraft.name.trim() && !isLoading) {
                e.target.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={e => {
              e.target.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};