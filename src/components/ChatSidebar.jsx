import React, { useState } from 'react';
import { Menu, MessageSquare, LogOut, Trash2, Plus } from 'lucide-react';

// Add custom CSS for line clamping and mobile viewport
const chatSidebarStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .chat-scroll::-webkit-scrollbar {
    width: 4px;
  }
  
  .chat-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }
  
  .chat-scroll::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
  
  .chat-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
  }
  
  /* Mobile safe area handling - simplified */
  @supports (padding: env(safe-area-inset-bottom)) {
    .mobile-chat-safe {
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
    }
  }
`;

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
  isChatLoading = false
}) => {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Get actual chat history for the selected note
  const displayHistory = chatHistory.length > 0 
    ? chatHistory.filter(chat => chat.noteId === selectedNote?.id || chat.noteId === selectedNote?._id) 
    : [];

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Inject custom styles */}
      <style>{chatSidebarStyles}</style>
      
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div 
        className={`
          ${isMobile 
            ? `fixed left-0 top-0 z-50 transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
          }
          ${sidebarOpen ? 'w-64' : 'w-18'}
          border-r transition-all duration-300 flex flex-col
        `}
        style={{ 
          background: 'rgba(30, 30, 30, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          height: '100vh',
          height: '100dvh' // Dynamic viewport height for mobile browsers
        }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {sidebarOpen && (
            <button 
              onClick={onBackToNotes}
              className="flex items-center gap-3 text-lg font-semibold bg-transparent border-none cursor-pointer transition-colors hover:opacity-80"
              style={{ color: '#8b5cf6' }}
            >
              Notes AI
            </button>
          )}
          <button 
            className="bg-transparent border-none text-gray-400 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* All content below - Only show when sidebar is open */}
        {sidebarOpen && (
          <>
            {/* Current Note Banner */}
            {selectedNote && (
              <div 
                className="mx-4 my-2 p-3 rounded-lg border"
                style={{ 
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderColor: 'rgba(139, 92, 246, 0.2)'
                }}
              >
                <div className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-1">
                  Current Note
                </div>
                <div className="text-white text-sm font-medium">
                  {selectedNote.title || 'Untitled Note'}
                </div>
              </div>
            )}

            {/* New Chat Button */}
            <div className="px-4 mb-4">
              <button
                onClick={onNewChat}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Chat History Section */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: '160px' }}>
              <div className="px-4 pb-1">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Chat History
                </h3>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto chat-scroll" 
                style={{ 
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  margin: '4px 16px 24px 16px'
                }}
              >
                <div className="space-y-1">
                  {isChatLoading ? (
                    // Loading state
                    <div className="text-center py-8 text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-3"></div>
                      <p className="text-sm">Loading chat history...</p>
                      <p className="text-xs mt-1">Please wait...</p>
                    </div>
                  ) : displayHistory.length === 0 ? (
                    // Empty state
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No chat history for this note yet.</p>
                      <p className="text-xs mt-1">Start a conversation to see it here!</p>
                    </div>
                  ) : (
                    // Chat history list
                    displayHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative mx-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          currentChatId === chat.id 
                            ? 'bg-violet-600/20 border-violet-500/30' 
                            : 'hover:bg-gray-700/50'
                        }`}
                        onClick={() => onSelectChat?.(chat)}
                        onMouseEnter={() => setHoveredChat(chat.id)}
                        onMouseLeave={() => setHoveredChat(null)}
                        style={{
                          border: currentChatId === chat.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent'
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium mb-1 truncate ${
                                currentChatId === chat.id ? 'text-violet-300' : 'text-gray-200'
                              }`}>
                                {chat.title}
                              </h4>
                              <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                {chat.preview}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{chat.timestamp}</span>
                              </div>
                            </div>
                            
                            {/* Delete button - show on hover */}
                            {hoveredChat === chat.id && onDeleteChat && (
                              <button
                                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 hover:bg-red-500/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                                }}
                                title="Delete chat"
                              >
                                <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* User Info & Logout - Always at bottom when open */}
            <div 
              className="absolute bottom-5 left-5 right-5 p-5 rounded-xl border"
              style={{ 
                background: 'rgba(40, 40, 40, 0.5)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom, 0px))' : '20px'
              }}
            >
              <div className="text-sm text-gray-400 mb-3 leading-5">
                Signed in as:<br />
                {user ? user.email : 'user@example.com'}
              </div>
              <button 
                className="border rounded-lg py-3 px-4 text-red-400 text-sm cursor-pointer w-full transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  borderColor: 'rgba(220, 38, 38, 0.3)'
                }}
                onClick={onLogout}
                onMouseEnter={e => e.target.style.background = 'rgba(220, 38, 38, 0.3)'}
                onMouseLeave={e => e.target.style.background = 'rgba(220, 38, 38, 0.2)'}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;
