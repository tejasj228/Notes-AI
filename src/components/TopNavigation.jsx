import React from 'react';
import { Search, Plus, ArrowLeft, User } from 'lucide-react';
import { PAGES } from '../utils/constants';

const TopNavigation = ({ 
  currentPage, 
  currentFolder, 
  searchTerm, 
  onSearchChange, 
  onAddNote, 
  onGoBack, 
  getSearchPlaceholder 
}) => {
  return (
    <div 
      className="fixed top-5 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-full z-50 border"
      style={{ 
        background: 'rgba(40, 40, 40, 0.9)', 
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Back button for folder view */}
      {currentPage === PAGES.FOLDER && currentFolder && (
        <button
          className="border-none rounded-full p-2 text-gray-300 cursor-pointer transition-all duration-300 hover:text-white flex items-center"
          onClick={onGoBack}
          title="Back to Notes"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      {/* Search Input */}
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
          onChange={(e) => onSearchChange(e.target.value)}
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

      {/* Add Note Button */}
      {(currentPage === PAGES.NOTES || (currentPage === PAGES.FOLDER && currentFolder)) && (
        <button 
          className="border-none rounded-full px-5 py-2.5 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: '#7c3aed' }}
          onClick={onAddNote}
          onMouseEnter={e => e.target.style.background = '#6d28d9'}
          onMouseLeave={e => e.target.style.background = '#7c3aed'}
        >
          <Plus size={20} />
          Add a note...
        </button>
      )}

      {/* User Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
        style={{ background: '#8b5cf6' }}
        onMouseEnter={e => e.target.style.background = '#7c3aed'}
        onMouseLeave={e => e.target.style.background = '#8b5cf6'}
      >
        <User size={20} />
      </div>
    </div>
  );
};

export default TopNavigation;