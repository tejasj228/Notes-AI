import React, { useState } from 'react';
import { Menu, MessageSquare, LogOut, Trash2, Plus } from 'lucide-react';

// Add custom CSS for line clamping
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
  selectedNote
}) => {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Generate note-specific mock chat history based on the selected note
  const generateNoteChatHistory = (note) => {
    if (!note) return [];
    
    return [
      {
        id: `${note.id}_chat_1`,
        title: `Analysis of "${note.title}"`,
        lastMessage: "Can you help me understand the main concepts in this note?",
        timestamp: "2 hours ago"
      },
      {
        id: `${note.id}_chat_2`,
        title: "Summary Request",
        lastMessage: "Please provide a brief summary of the key points.",
        timestamp: "Yesterday"
      },
      {
        id: `${note.id}_chat_3`,
        title: "Questions & Clarifications",
        lastMessage: "I have some questions about the technical details...",
        timestamp: "2 days ago"
      }
    ];
  };

  const noteChatHistory = generateNoteChatHistory(selectedNote);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{chatSidebarStyles}</style>
      
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`
        ${isMobile 
          ? `fixed left-0 top-0 h-full z-50 transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
        }
        ${sidebarOpen ? 'w-64' : 'w-12'}
        bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300
      `}>
        
        {/* When sidebar is CLOSED - ONLY show hamburger button */}
        {!sidebarOpen && (
          <div className="p-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white flex items-center justify-center"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* When sidebar is OPEN - show everything */}
        {sidebarOpen && (
          <>
            {/* Header with hamburger and title */}
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white flex items-center justify-center"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <h2 className="text-white font-medium">AI Assistant</h2>
              </div>
            </div>

            {/* Current Note Display */}
            {selectedNote && (
              <div className="p-3 border-b border-gray-700 bg-gray-800">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Current Note
                </div>
                <div className="text-white text-sm font-medium line-clamp-2">
                  {selectedNote.title || 'Untitled Note'}
                </div>
              </div>
            )}

            {/* New Chat Button */}
            <div className="p-3 border-b border-gray-700">
              <button
                onClick={onNewChat}
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-hidden">
              <div className="p-3 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-700">
                Chat History
              </div>
              <div className="flex-1 overflow-y-auto chat-scroll">
                {noteChatHistory.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {noteChatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all duration-200 group relative
                          ${currentChatId === chat.id 
                            ? 'bg-purple-600 text-white' 
                            : 'hover:bg-gray-800 text-gray-300'
                          }
                        `}
                        onClick={() => onSelectChat(chat.id)}
                        onMouseEnter={() => setHoveredChat(chat.id)}
                        onMouseLeave={() => setHoveredChat(null)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-1.5 rounded-md flex-shrink-0
                            ${currentChatId === chat.id 
                              ? 'bg-purple-500' 
                              : 'bg-gray-700'
                            }
                          `}>
                            <MessageSquare className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-2 mb-1">
                              {chat.title}
                            </div>
                            <div className="text-xs opacity-70">
                              {chat.lastMessage}
                            </div>
                            <div className="text-xs opacity-50 mt-1">
                              {chat.timestamp}
                            </div>
                          </div>
                          
                          {hoveredChat === chat.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat history yet</p>
                    <p className="text-xs opacity-70 mt-1">
                      Start a conversation to see your chat history
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* User Section */}
            {user && (
              <div className="p-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-white text-sm">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;
