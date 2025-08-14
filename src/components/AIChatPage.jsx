import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, GripVertical, Menu } from 'lucide-react';
import { resizeImage, insertImageAtCaret } from '../utils/helpers';
import ChatSidebar from './ChatSidebar';

// Hide scrollbars for webkit browsers and handle mobile viewport
const chatInputStyles = `
  .chat-input::-webkit-scrollbar {
    display: none;
  }
  
  /* Handle mobile viewport height changes */
  @supports (height: 100dvh) {
    .mobile-vh {
      height: 100dvh !important;
      min-height: 100dvh !important;
    }
  }
  
  /* Support for older browsers */
  @supports not (height: 100dvh) {
    .mobile-vh {
      height: 100vh !important;
      min-height: 100vh !important;
    }
  }
  
  /* Mobile safe area handling - simplified */
  @supports (padding: env(safe-area-inset-bottom)) {
    .mobile-input-safe {
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    }
  }
`;

// Simple markdown parser function
const parseMarkdown = (text) => {
  if (!text) return '';
  
  let html = text
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic text: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    
    // Code blocks: ```code```
    .replace(/```([^`]+)```/g, '<pre style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin: 8px 0; overflow-x: auto;"><code style="font-family: monospace;">$1</code></pre>')
    
    // Line breaks
    .replace(/\n/g, '<br>')
    
    // Unordered lists: - item or * item
    .replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>')
    
    // Ordered lists: 1. item
    .replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    
    // Headers: # Header
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.1em; font-weight: 600; margin: 12px 0 8px 0; color: #e2e8f0;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.25em; font-weight: 600; margin: 16px 0 8px 0; color: #e2e8f0;">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5em; font-weight: 600; margin: 16px 0 8px 0; color: #e2e8f0;">$1</h1>');
  
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    return `<ul style="margin: 8px 0; padding-left: 20px;">${match}</ul>`;
  });
  
  return html;
};

const AIChatPage = ({ 
  sidebarOpen, 
  setSidebarOpen,
  folders,
  user,
  onSwitchToNotes,
  onSwitchToTrash,
  onOpenFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onLogout,
  selectedNote, // The note passed from NotesApp
  onUpdateNote, // Add this prop to update note content
  onBackToNotes // Router navigation function
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello! I can help you analyze, improve, or work with your note "${selectedNote?.title || 'your content'}". What would you like to do?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [noteContent, setNoteContent] = useState(selectedNote?.content || '');
  const [panelWidth, setPanelWidth] = useState(() => {
    // Set initial panel width based on screen size
    const isMobileScreen = window.innerWidth < 768;
    return isMobileScreen ? 45 : 40; // Mobile gets 45% for notes, desktop gets 40%
  }); // Will be adjusted based on screen size
  const [isDragging, setIsDragging] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' }); // Add image popup state
  const [currentChatId, setCurrentChatId] = useState(null); // Track current chat
  const [chatSessions, setChatSessions] = useState({}); // Store all chat sessions by note ID
  const [chatHistory, setChatHistory] = useState([]); // Store chat history for current note
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track if mobile view - initialized correctly
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight); // Track viewport height
  const [isUpdatingMessages, setIsUpdatingMessages] = useState(false); // Track when messages are being updated via chat
  const [initializedNotes, setInitializedNotes] = useState(new Set()); // Track which notes have been initialized
  
  const messagesEndRef = useRef(null);
  const noteEditorRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session for the selected note
  useEffect(() => {
    console.log('Chat initialization useEffect triggered for note ID:', selectedNote?.id);
    if (selectedNote) {
      const noteId = selectedNote.id;
      const existingSessions = chatSessions[noteId] || [];
      
      // Load chat history for this note (sorted by creation date, newest first)
      const sortedSessions = existingSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChatHistory(sortedSessions);
      
      // Only create a new chat if:
      // 1. We haven't initialized this note before, AND
      // 2. There are no existing sessions for this note
      if (!initializedNotes.has(noteId) && existingSessions.length === 0) {
        console.log('Creating initial chat for new note');
        setInitializedNotes(prev => new Set([...prev, noteId]));
        handleNewChat();
      } else if (existingSessions.length > 0 && !currentChatId) {
        console.log('Setting current chat to most recent session');
        setCurrentChatId(sortedSessions[0].id);
        setMessages(sortedSessions[0].messages || []);
      } else {
        console.log('Note already initialized or has existing sessions');
      }
    }
  }, [selectedNote?.id]); // Only depend on note ID, not the entire note object

  // Set note content when selectedNote changes
  useEffect(() => {
    if (selectedNote) {
      const newContent = selectedNote.content || '';
      
      if (noteContent !== newContent) {
        setNoteContent(newContent);
      }
    }
  }, [selectedNote?.id, selectedNote?.content]); // More specific dependencies

  // Ensure content is set when noteEditorRef becomes available or panel width changes
  useEffect(() => {
    if (noteEditorRef.current && selectedNote && (!isMobile || panelWidth >= 15)) {
      const currentContent = noteEditorRef.current.innerHTML;
      const expectedContent = selectedNote.content || '';
      
      // Only update if content is different to avoid cursor jumping
      if (currentContent !== expectedContent) {
        noteEditorRef.current.innerHTML = expectedContent;
      }
    }
  }, [selectedNote?.content, panelWidth, isMobile]); // Trigger when panel visibility changes

  // Handle image clicks - ENABLE POPUP
  useEffect(() => {
    function handleImageClick(e) {
      if (e.target.tagName === 'IMG') {
        setImagePopup({ open: true, src: e.target.src });
      }
    }

    const editor = noteEditorRef.current;
    if (editor) {
      editor.addEventListener('click', handleImageClick);
    }

    return () => {
      if (editor && editor.removeEventListener) {
        editor.removeEventListener('click', handleImageClick);
      }
    };
  }, [selectedNote]);

  // Helper function to save and restore cursor position
  const saveCursorPosition = (element) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return 0;
  };

  const restoreCursorPosition = (element, position) => {
    const selection = window.getSelection();
    const range = document.createRange();
    let currentPos = 0;
    let walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const textLength = node.textContent.length;
      if (currentPos + textLength >= position) {
        range.setStart(node, position - currentPos);
        range.setEnd(node, position - currentPos);
        break;
      }
      currentPos += textLength;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Handle note content changes and save them
  const handleNoteContentChange = (newContent) => {
    // Only update if content actually changed to prevent cursor jumping
    if (newContent !== noteContent) {
      setNoteContent(newContent);
      // Save changes back to the main notes data
      if (selectedNote && onUpdateNote) {
        onUpdateNote(selectedNote.id, 'content', newContent);
      }
    }
  };

  // Add mobile detection and viewport height tracking
  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      setViewportHeight(window.innerHeight);
      
      // Set appropriate initial panel size based on screen type
      if (isMobileScreen && panelWidth === 40) {
        // For mobile, start with 45% for note area (giving 55% to chat)
        setPanelWidth(45);
      } else if (!isMobileScreen && panelWidth === 45) {
        // For desktop, use 40% width split
        setPanelWidth(40);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [panelWidth]);

  // Handle panel resize for responsive layout
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      let newPanelSize;
      
      if (isMobile) {
        // Mobile: vertical resize (adjust height percentage)
        const containerHeight = window.innerHeight - 120; // Account for headers
        const mouseY = e.clientY || (e.touches && e.touches[0].clientY);
        newPanelSize = ((mouseY - 120) / containerHeight) * 100; // 120px for headers
        
        // Allow full range: 5% to 95% (if goes beyond, just show one area)
        if (newPanelSize >= 5 && newPanelSize <= 95) {
          setPanelWidth(newPanelSize);
        }
      } else {
        // Desktop: horizontal resize (adjust width percentage)
        const mouseX = e.clientX || (e.touches && e.touches[0].clientX);
        newPanelSize = (mouseX / window.innerWidth) * 100;
        
        // Allow full range: 5% to 95% (if goes beyond, just show one area)
        if (newPanelSize >= 5 && newPanelSize <= 95) {
          setPanelWidth(newPanelSize);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      handleMouseMove(e);
    };

    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events for mobile
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  // Handle image insertion for notes editor
  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      insertImageAtCaret(noteEditorRef, resizedDataUrl);
      const newContent = noteEditorRef.current.innerHTML;
      handleNoteContentChange(newContent);
    };
    input.click();
  };

  // Typing animation for AI responses with stop functionality
  const typeMessage = async (content, messageId) => {
    const words = content.split(' ');
    let currentText = '';
    let shouldContinue = true;
    
    // Create a ref to track if we should stop typing
    const checkShouldStop = () => {
      return shouldContinue;
    };
    
    // Store the stop function for this specific message
    window.currentStopFunction = () => {
      shouldContinue = false;
    };
    
    for (let i = 0; i < words.length; i++) {
      // Check if typing was stopped
      if (!checkShouldStop()) {
        break;
      }
      
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentText + (i < words.length - 1 ? '▋' : '') }
          : msg
      ));
      
      // Random delay between 50-150ms for natural typing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }
    
    // Clean up
    window.currentStopFunction = null;
    setIsTyping(false);
  };

  // Stop typing function
  const stopTyping = () => {
    if (window.currentStopFunction) {
      window.currentStopFunction();
    }
    setIsTyping(false);
  };

  // Send message to Gemini API
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Create AI message placeholder
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: ''
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      // Debug: Check if API key exists
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      console.log('API Key status:', apiKey ? 'Found' : 'Missing');
      console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');
      
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please check your .env file.');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Context: I'm working with a note titled "${selectedNote?.title || 'Untitled'}" with the following content:\n\n${noteContent}\n\nUser question: ${inputMessage}`
            }]
          }]
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t process that request.';
      
      // Start typing animation
      await typeMessage(aiResponse, aiMessageId);
      
      // Now that the conversation is complete, update chat history
      setIsUpdatingMessages(true);
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      await typeMessage(`Error: ${error.message}`, aiMessageId);
      
      // Update chat history even for errors
      setIsUpdatingMessages(true);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle send message button click
  const handleSendMessage = () => {
    sendMessage();
  };

  // ORIGINAL: Handle back navigation
  const handleBackToNotes = () => {
    if (onBackToNotes) {
      onBackToNotes(); // Use router navigation
    }
  };

  // Chat history handlers
  const handleNewChat = (isManual = false) => {
    if (!selectedNote) return;
    
    console.log('handleNewChat called for note:', selectedNote.id, 'isManual:', isManual);
    
    const newChatId = `${selectedNote.id}_${Date.now()}`;
    const initialMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hello! I can help you analyze, improve, or work with your note "${selectedNote.title}". What would you like to do?`
    };
    
    setCurrentChatId(newChatId);
    setMessages([initialMessage]);
    setInputMessage('');
    setIsTyping(false);
    
    // Create new chat session
    const newChatSession = {
      id: newChatId,
      title: `New Chat - ${selectedNote.title}`,
      preview: "Starting a new conversation...",
      timestamp: "Just now",
      noteId: selectedNote.id,
      noteTitle: selectedNote.title,
      messages: [initialMessage],
      createdAt: new Date()
    };
    
    // Update chat sessions
    setChatSessions(prev => ({
      ...prev,
      [selectedNote.id]: [newChatSession, ...(prev[selectedNote.id] || [])]
    }));
    
    // Update chat history for current note
    setChatHistory(prev => [newChatSession, ...prev]);
    setSidebarOpen(true);
    
    // Mark as initialized if manual
    if (isManual) {
      setInitializedNotes(prev => new Set([...prev, selectedNote.id]));
    }
  };

  const handleSelectChat = (chat) => {
    if (!chat || !selectedNote) return;
    
    setCurrentChatId(chat.id);
    
    // Load messages for this chat (in a real app, this would come from storage)
    // For now, create a mock conversation
    const mockMessages = [
      {
        id: 1,
        type: 'ai',
        content: `Hello! I can help you analyze, improve, or work with your note "${selectedNote.title}". What would you like to do?`
      },
      {
        id: 2,
        type: 'user',
        content: "Can you help me improve this content?"
      },
      {
        id: 3,
        type: 'ai',
        content: chat.preview
      }
    ];
    
    setMessages(chat.messages || mockMessages);
    setInputMessage('');
    setIsTyping(false);
  };

  const handleDeleteChat = (chatId) => {
    if (!selectedNote) return;
    
    const noteId = selectedNote.id;
    
    // Remove from chat sessions
    setChatSessions(prev => ({
      ...prev,
      [noteId]: (prev[noteId] || []).filter(chat => chat.id !== chatId)
    }));
    
    // Remove from current chat history
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    
    // If it's the current chat, start a new one
    if (chatId === currentChatId) {
      handleNewChat(true);
    }
  };

  // Manual function to update chat history after conversation
  const updateChatHistory = (messagesToSave) => {
    if (!currentChatId || !selectedNote || !messagesToSave || messagesToSave.length <= 1) return;
    
    const noteId = selectedNote.id;
    
    // Update the current chat session with new messages
    setChatSessions(prev => {
      const noteSessions = prev[noteId] || [];
      const updatedSessions = noteSessions.map(session => {
        if (session.id === currentChatId) {
          // Generate title from first user message or keep existing
          const userMessages = messagesToSave.filter(m => m.type === 'user');
          const title = userMessages.length > 0 
            ? `${userMessages[0].content.substring(0, 50)}...`
            : session.title;
          
          const preview = messagesToSave.length > 1 
            ? messagesToSave[messagesToSave.length - 1].content.substring(0, 100) + "..."
            : session.preview;
          
          return {
            ...session,
            title,
            preview,
            messages: [...messagesToSave],
            timestamp: "Just now"
          };
        }
        return session;
      });
      
      return {
        ...prev,
        [noteId]: updatedSessions
      };
    });
    
    // Update chat history
    setChatHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const userMessages = messagesToSave.filter(m => m.type === 'user');
        const title = userMessages.length > 0 
          ? `${userMessages[0].content.substring(0, 50)}...`
          : chat.title;
        
        const preview = messagesToSave.length > 1 
          ? messagesToSave[messagesToSave.length - 1].content.substring(0, 100) + "..."
          : chat.preview;
        
        return {
          ...chat,
          title,
          preview,
          messages: [...messagesToSave],
          timestamp: "Just now"
        };
      }
      return chat;
    }));
  };

  // Update chat session when messages change (only for actual chat interactions)
  useEffect(() => {
    // Only update if we have a flag indicating this is a chat interaction
    if (isUpdatingMessages) {
      // Get current messages state when the flag is triggered
      setMessages(currentMessages => {
        updateChatHistory(currentMessages);
        return currentMessages; // Return same messages, no change
      });
      // Reset the flag after updating
      setIsUpdatingMessages(false);
    }
  }, [isUpdatingMessages]); // Only depend on the flag, not messages

  return (
    <>
      <style>{chatInputStyles}</style>
      <div className="relative" style={{ 
        background: '#1a1a1a',
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height for mobile
        height: '100vh',
        height: '100dvh' // Dynamic viewport height as primary
      }}>
      {/* Mobile Overlay for Sidebar */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ChatSidebar with responsive behavior */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={onLogout}
        onNewChat={() => handleNewChat(true)}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        chatHistory={chatHistory}
        selectedNote={selectedNote}
        onBackToNotes={onBackToNotes}
      />

      {/* Main Content */}
      <div 
        className={`absolute right-0 top-0 flex flex-col transition-all duration-300`}
        style={{
          height: '100vh',
          height: '100dvh', // Dynamic viewport height for mobile browsers
          left: isMobile ? '0px' : (sidebarOpen ? '256px' : '72px'),
          width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? '256px' : '72px'})`
        }}
      >
        {/* Mobile Header with Hamburger */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={onBackToNotes}
              className="text-lg font-semibold text-gray-200 hover:text-white transition-colors"
            >
              AI Assistant
            </button>
            <div className="w-8"></div>
          </div>
        )}

        {/* Split Container */}
        <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
          {/* Note Panel */}
          <div 
            className="flex flex-col border-b md:border-b-0 md:border-r h-full"
            style={{ 
              background: '#2a2a2a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              width: isMobile ? '100%' : `${panelWidth}%`,
              height: isMobile ? `${panelWidth}%` : '100%', // Use panelWidth for mobile height too
              minHeight: isMobile ? '5%' : 'auto', // Allow very small panels
              maxHeight: isMobile ? '95%' : 'auto'
            }}
          >
            {/* Show collapsed state when notes area is too small */}
            {isMobile && panelWidth < 15 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Notes (Collapsed)</div>
              </div>
            ) : (
              <>
                {/* Note Header */}
                <div className="p-4 md:p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <h1 className="text-lg md:text-xl font-semibold text-gray-200 mb-2">
                    {selectedNote?.title || 'No Note Selected'}
                  </h1>
                  {selectedNote?.keywords && selectedNote.keywords.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedNote.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="inline-block text-gray-300 border rounded-lg px-2 md:px-3 py-1 text-xs"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderColor: '#444'
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note Content Editor */}
            <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 pb-0">
              <div
                ref={noteEditorRef}
                className="note-content-editable flex-1 border rounded-xl p-3 md:p-4 text-sm leading-relaxed overflow-y-auto outline-none"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={e => handleNoteContentChange(e.currentTarget.innerHTML)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#cccccc',
                  minHeight: '200px'
                }}
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
              </>
            )}
          </div>

          {/* Resize Handle - Desktop: vertical, Mobile: horizontal */}
          {!isMobile ? (
            // Desktop vertical resize handle
            <div
              className="w-1 cursor-col-resize flex items-center justify-center transition-all duration-200 group"
              onMouseDown={handleMouseDown}
              style={{ 
                background: isDragging ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                borderLeft: isDragging ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.05)',
                borderRight: isDragging ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.05)'
              }}
              onMouseEnter={e => {
                if (!isDragging) {
                  e.target.style.background = '#8b5cf6';
                  e.target.style.borderLeft = '1px solid #8b5cf6';
                  e.target.style.borderRight = '1px solid #8b5cf6';
                }
              }}
              onMouseLeave={e => {
                if (!isDragging) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderLeft = '1px solid rgba(255, 255, 255, 0.05)';
                  e.target.style.borderRight = '1px solid rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <GripVertical size={16} className="text-gray-400 group-hover:text-white transition-colors duration-200" />
            </div>
          ) : (
            // Mobile horizontal resize handle
            <div
              className="h-2 cursor-row-resize flex items-center justify-center transition-all duration-200 group relative touch-manipulation"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{ 
                background: isDragging ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)',
                borderTop: isDragging ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: isDragging ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                minHeight: '8px'
              }}
              onMouseEnter={e => {
                if (!isDragging) {
                  e.target.style.background = '#8b5cf6';
                  e.target.style.borderTop = '1px solid #8b5cf6';
                  e.target.style.borderBottom = '1px solid #8b5cf6';
                }
              }}
              onMouseLeave={e => {
                if (!isDragging) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              <div className="rotate-90 p-1">
                <GripVertical size={14} className="text-gray-400 group-hover:text-white transition-colors duration-200" />
              </div>
            </div>
          )}

          {/* Chat Panel */}
          <div 
            className="flex-1 flex flex-col relative"
            style={{ 
              background: '#1a1a1a',
              height: isMobile ? `${100 - panelWidth}%` : '100%',
              minHeight: isMobile ? '5%' : 'auto' // Allow very small panels
            }}
          >
            {/* Show collapsed state when chat area is too small */}
            {isMobile && (100 - panelWidth) < 15 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500 text-sm">AI Assistant (Collapsed)</div>
              </div>
            ) : (
              <>
                {/* Chat Header - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex p-6 border-b items-center gap-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-200">AI Assistant</h2>
                      <p className="text-sm text-gray-400">Ready to help with your note</p>
                    </div>
                  </div>
                )}

                {/* Messages Container */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                  style={{ 
                    paddingBottom: '80px' // Reduced padding for better mobile experience
                  }}
                >
                  {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      {isTyping && message.id === Math.max(...messages.filter(m => m.type === 'ai').map(m => m.id)) ? (
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ 
                            animationDelay: '0ms',
                            animationDuration: '1.4s'
                          }}></div>
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ 
                            animationDelay: '0.2s',
                            animationDuration: '1.4s'
                          }}></div>
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ 
                            animationDelay: '0.4s',
                            animationDuration: '1.4s'
                          }}></div>
                        </div>
                      ) : (
                        <Bot size={14} className="text-white" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                    style={{
                      borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                    }}
                  >
                    <div className="text-sm leading-relaxed">
                      {isTyping && message.type === 'ai' && !message.content && message.id === Math.max(...messages.filter(m => m.type === 'ai').map(m => m.id)) ? (
                        <span className="text-gray-400">Thinking...</span>
                      ) : (
                        message.type === 'ai' ? (
                          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                        )
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Message Input - Better Mobile Positioning */}
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6" style={{
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : '0px'
            }}>
              <div 
                className="relative flex items-center"
                style={{ height: '56px' }}
              >
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your note..."
                  className="w-full h-full p-4 pr-14 border rounded-2xl resize-none outline-none text-gray-200 placeholder-gray-400 shadow-2xl chat-input"
                  style={{
                    background: 'rgba(30, 30, 30, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    minHeight: '56px',
                    maxHeight: '56px',
                    overflow: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.background = 'rgba(40, 40, 40, 0.95)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.background = 'rgba(30, 30, 30, 0.95)';
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-3 p-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: inputMessage.trim() && !isTyping
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none'
                  }}
                >
                  {isTyping ? (
                    <svg
                      className="text-white"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ display: 'block' }}
                    >
                      <rect x="6" y="6" width="12" height="12" rx="3" />
                    </svg>
                  ) : (
                    <Send size={16} className="text-white" />
                  )}
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Popup */}
      {imagePopup.open && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-5"
          style={{ 
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)' 
          }}
          onClick={() => setImagePopup({ open: false, src: '' })}
        >
          <div 
            className="rounded-2xl border relative flex flex-col"
            style={{ 
              background: '#2a2a2a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              maxWidth: '95vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 0
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-end w-full" style={{padding: 24, paddingBottom: 0}}>
              <a
                href={imagePopup.src}
                download={`note-image-${Date.now()}.jpg`}
                className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                title="Download"
                onClick={e => e.stopPropagation()}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <button
                className="border-none rounded-lg p-2 text-gray-200 cursor-pointer transition-all duration-300 ml-2"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => setImagePopup({ open: false, src: '' })}
                title="Close"
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="flex justify-center items-center w-full h-full" style={{ minHeight: '40vh', padding: 24 }}>
              <img 
                src={imagePopup.src} 
                alt="Preview" 
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  borderRadius: '16px',
                  background: '#181818'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AIChatPage;