'use client';

import React from 'react';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import { PAGES } from '@/utils/constants';
import ThemeToggle from './ThemeToggle';

const TopNavigation = ({
  currentPage,
  currentFolder,
  pageTitle,
  searchTerm,
  onSearchChange,
  onAddNote,
  onGoBack,
  getSearchPlaceholder,
}) => {
  const canAdd = currentPage === PAGES.NOTES || (currentPage === PAGES.FOLDER && currentFolder);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl">
      <div className="flex items-center gap-3 bg-paper border-3 border-ink shadow-brutal px-3 py-2.5">
        {currentPage === PAGES.FOLDER && currentFolder && (
          <button
            className="brutal-btn bg-card px-2.5 py-2 text-ink"
            onClick={onGoBack}
            title="Back to notes"
          >
            <ArrowLeft size={18} strokeWidth={2.75} />
          </button>
        )}

        {/* Page title badge */}
        <div className="hidden md:flex items-center border-3 border-ink bg-brand text-white px-3 py-2 shadow-brutal-sm flex-shrink-0">
          <span className="font-display font-extrabold uppercase tracking-tight leading-none max-w-[10rem] truncate">
            {pageTitle}
          </span>
        </div>

        {/* Search */}
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-3 text-ink" size={18} strokeWidth={2.5} />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            className="brutal-input w-full py-2 pl-10 pr-3 text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <ThemeToggle />

        {canAdd && (
          <button
            className="brutal-btn bg-brand text-white px-3 md:px-4 py-2 text-xs"
            onClick={onAddNote}
          >
            <Plus size={18} strokeWidth={3} />
            <span className="hidden sm:inline">New note</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopNavigation;
