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
      className="fixed top-3 md:top-5 left-1/2 transform -translate-x-1/2 flex items-center gap-2 md:gap-4 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-3xl z-50 border w-11/12 md:w-4/5 max-w-2xl"
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
      <div className="relative flex items-center flex-1">
        <Search className="absolute left-3 md:left-4 text-gray-400 z-10" size={18} />
        <input
          type="text"
          placeholder={getSearchPlaceholder()}
          className="border rounded-xl md:rounded-3xl py-2 md:py-2.5 pl-9 md:pl-11 pr-3 md:pr-4 text-gray-200 text-sm outline-none transition-all duration-300 placeholder-gray-400 w-full"
          style={{
            background: 'rgba(60, 60, 60, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
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
          className="border-none rounded-full px-3 md:px-5 py-2 md:py-2.5 text-gray-200 text-sm font-medium cursor-pointer flex items-center gap-1 md:gap-2 transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: '#7c3aed' }}
          onClick={onAddNote}
          onMouseEnter={e => e.target.style.background = '#6d28d9'}
          onMouseLeave={e => e.target.style.background = '#7c3aed'}
        >
          <Plus size={16} className="md:hidden" />
          <Plus size={20} className="hidden md:block" />
          <span className="hidden sm:inline">Add a note...</span>
          <span className="sm:hidden">Add</span>
        </button>
      )}
    </div>
  );
};

export default TopNavigation;