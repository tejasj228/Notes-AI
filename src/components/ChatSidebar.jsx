'use client';

import React, { useState, useEffect } from 'react';
import { Menu, MessageSquare, LogOut, Trash2, Plus, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
  onNewChat,
  chatHistory = [],
  currentChatId,
  onSelectChat,
  onDeleteChat,
  selectedNote,
  onBackToNotes,
  isChatLoading = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayHistory =
    chatHistory.length > 0
      ? chatHistory.filter((chat) => chat.noteId === selectedNote?.id || chat.noteId === selectedNote?._id)
      : [];

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-[999]" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`${
          isMobile
            ? `fixed left-0 top-0 z-[1000] transition-transform duration-200 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } w-64`
            : 'relative'
        } ${!isMobile ? (sidebarOpen ? 'w-64' : 'w-16') : ''} h-[100dvh] bg-paper border-r-3 border-ink flex flex-col flex-shrink-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-3 border-ink">
          {sidebarOpen && (
            <button
              onClick={onBackToNotes}
              className="flex items-center gap-2 font-display font-extrabold text-lg leading-none hover:text-brand transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={2.75} /> NOTES·AI
            </button>
          )}
          <div className="flex items-center gap-2">
            {sidebarOpen && <ThemeToggle iconSize={16} />}
            <button
              className="text-ink p-1.5 border-3 border-ink bg-card shadow-brutal-sm hover:bg-note-yellow transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} strokeWidth={2.75} />
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="flex-1 flex flex-col min-h-0">
            {selectedNote && (
              <div className="m-3 border-3 border-ink bg-brand text-white shadow-brutal-sm p-3">
                <div className="brutal-eyebrow text-white/80 mb-0.5">Current note</div>
                <div className="font-display font-extrabold leading-tight truncate">
                  {selectedNote.title || 'Untitled note'}
                </div>
              </div>
            )}

            <div className="px-3 mb-3">
              <button onClick={onNewChat} className="brutal-btn w-full bg-note-green text-ink-fixed py-2.5 text-xs">
                <Plus size={16} strokeWidth={2.75} /> New chat
              </button>
            </div>

            <div className="px-4 brutal-eyebrow text-ink/60 mb-2">Chat history</div>

            <div className="flex-1 overflow-y-auto px-3 pb-40 space-y-2">
              {isChatLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-3 border-ink border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-mono">Loading…</p>
                </div>
              ) : displayHistory.length === 0 ? (
                <div className="text-center py-8 text-ink/60">
                  <MessageSquare size={28} strokeWidth={2} className="mx-auto mb-2" />
                  <p className="text-xs font-semibold">No chats yet.</p>
                  <p className="text-[11px] mt-1">Ask something to start.</p>
                </div>
              ) : (
                displayHistory.map((chat) => {
                  const active = currentChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      className={`group relative border-3 border-ink p-2.5 cursor-pointer transition-all ${
                        active ? 'bg-note-yellow shadow-brutal-sm' : 'bg-card hover:-translate-y-0.5'
                      }`}
                      onClick={() => onSelectChat?.(chat)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold mb-0.5 truncate">{chat.title}</h4>
                          <p className="text-[11px] text-ink/70 clamp" style={{ WebkitLineClamp: 2 }}>
                            {chat.preview}
                          </p>
                          <span className="brutal-eyebrow text-ink/50 mt-1 block">{chat.timestamp}</span>
                        </div>
                        {onDeleteChat && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 border-2 border-ink bg-note-red hover:bg-ink-fixed hover:text-white transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                            title="Delete chat"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 border-3 border-ink bg-card shadow-brutal p-3">
              <div className="brutal-eyebrow text-ink/60 mb-1">Signed in</div>
              <div className="text-xs font-semibold break-words mb-3 leading-tight">
                {user ? user.email : 'user@example.com'}
              </div>
              <button className="brutal-btn w-full bg-note-red text-ink-fixed py-2 text-xs" onClick={onLogout}>
                <LogOut size={15} strokeWidth={2.75} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;
