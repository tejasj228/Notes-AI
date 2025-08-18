import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, User, Bot, GripVertical, Menu, ImagePlus } from 'lucide-react';
import { resizeImage, insertImageAtCaret } from '../utils/helpers';
import { aiAPI } from '../api/ai';
import ChatSidebar from './ChatSidebar';

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Hide scrollbars for webkit browsers and handle mobile viewport
const chatInputStyles = `
  .chat-input::-webkit-scrollbar {
    display: none;
  }
  
  /* Make images in note editor draggable */
  .note-content-editable img {
    cursor: grab;
    transition: opacity 0.2s ease;
  }
  
  .note-content-editable img:active {
    cursor: grabbing;
  }
  
  .note-content-editable img:hover {
    opacity: 0.8;
  }
  
  /* Handle mobile viewport height changes */
  @supports (height: 100dvh) {
    .mobile-vh {
      height: 100dvh !important;
      min-height: 100dvh !important;
    }
    
    .chat-container-mobile {
      height: 100dvh !important;
      max-height: 100dvh !important;
    }
  }
  
  /* Support for older browsers */
  @supports not (height: 100dvh) {
    .mobile-vh {
      height: 100vh !important;
      min-height: 100vh !important;
    }
    
    .chat-container-mobile {
      height: 100vh !important;
      max-height: 100vh !important;
    }
  }
  
  /* Mobile safe area handling with proper viewport consideration */
  @supports (padding: env(safe-area-inset-bottom)) {
    .mobile-input-safe {
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px) !important;
    }
  }
  
  /* Fallback for browsers without safe-area support */
  @supports not (padding: env(safe-area-inset-bottom)) {
    .mobile-input-safe {
      padding-bottom: 16px !important;
    }
  }
  
  /* Ensure input is always visible on mobile */
  .mobile-chat-input {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 40 !important;
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
  const [selectedImages, setSelectedImages] = useState([]); // Store selected images for the message
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);
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
  const [isChatLoading, setIsChatLoading] = useState(false); // Loading state for chat history
  const [isSessionLoading, setIsSessionLoading] = useState(false); // Loading state for individual session
  const [loadedSessions, setLoadedSessions] = useState(new Map()); // Cache loaded sessions
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track if mobile view - initialized correctly
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight); // Track viewport height
  const [initializedNotes, setInitializedNotes] = useState(new Set()); // Track which notes have been initialized
  const [isDragOverChat, setIsDragOverChat] = useState(false); // Track when dragging over chat area
  
  const messagesEndRef = useRef(null);
  const noteEditorRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  // Set up drag events for images in note editor
  useEffect(() => {
    if (noteEditorRef.current) {
      const images = noteEditorRef.current.querySelectorAll('img');
      images.forEach(img => {
        img.draggable = true;
        img.style.cursor = 'grab';
      });
    }
  }, [noteContent]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session for the selected note
  useEffect(() => {
    console.log('Chat initialization useEffect triggered. selectedNote:', {
      id: selectedNote?.id,
      _id: selectedNote?._id,
      title: selectedNote?.title
    });
    if (selectedNote) {
      const noteId = selectedNote._id || selectedNote.id;
      
      // Clear cache when switching notes to free memory
      setLoadedSessions(new Map());
      
      // Load chat history from backend
      loadChatHistory(noteId);
    }
  }, [selectedNote?.id, selectedNote?._id]); // Watch both possible ID fields

  // Load chat history from backend
  const loadChatHistory = async (noteId) => {
    setIsChatLoading(true);
    try {
      // First, load all chat sessions for this note
      const response = await aiAPI.getChatHistory(noteId);
      if (response.success && response.data.sessions && response.data.sessions.length > 0) {
        // Convert backend sessions to frontend format
        const sessions = response.data.sessions.map(session => ({
          id: session.sessionId,
          title: session.firstMessage.length > 30 
            ? session.firstMessage.substring(0, 30) + "..." 
            : session.firstMessage,
          preview: session.lastMessage.substring(0, 100) + (session.lastMessage.length > 100 ? "..." : ""),
          timestamp: new Date(session.updatedAt).toLocaleDateString(),
          noteId: noteId,
          noteTitle: selectedNote?.title,
          messageCount: session.messageCount,
          hasImages: session.hasImages,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }));
        
        // Sort sessions by most recent first
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        
        setChatHistory(sessions);
        
        // Always start with a new chat when opening a note
        await handleNewChat();
      } else {
        // No existing chats, create a new session
        setChatHistory([]);
        await handleNewChat();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to creating a new chat
      setChatHistory([]);
      await handleNewChat();
    } finally {
      setIsChatLoading(false);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (noteId, sessionId) => {
    try {
      // Check if we already have this session cached
      const cacheKey = `${noteId}_${sessionId}`;
      if (loadedSessions.has(cacheKey)) {
        console.log('Loading session from cache:', sessionId);
        setMessages(loadedSessions.get(cacheKey));
        return;
      }

      console.log('Loading session from API:', sessionId);
      const response = await aiAPI.getChatHistory(noteId, { sessionId });
      if (response.success && response.data.messages) {
        const messages = response.data.messages.map(msg => ({
          id: msg._id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.createdAt,
          images: msg.metadata?.images ? msg.metadata.images.map(img => ({
            ...img,
            dataUrl: `data:${img.mimeType};base64,${img.base64}`
          })) : []
        }));
        
        // Cache the messages
        setLoadedSessions(prev => new Map(prev.set(cacheKey, messages)));
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    }
  };

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
      
      // Only update if content is different and user is not actively typing
      const timeSinceLastTyping = Date.now() - lastTypingTime;
      const isUserTyping = timeSinceLastTyping < 1000; // 1 second threshold
      
      if (currentContent !== expectedContent && !isUserTyping) {
        noteEditorRef.current.innerHTML = expectedContent;
      }
    }
  }, [selectedNote?.content, panelWidth, isMobile, lastTypingTime]); // Trigger when panel visibility changes

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

  // Debounced save function to prevent excessive API calls
  const debouncedSave = useCallback(
    debounce((noteId, content) => {
      if (onUpdateNote) {
        onUpdateNote(noteId, 'content', content);
      }
    }, 500),
    [onUpdateNote]
  );

  // Handle note content changes and save them
  const handleNoteContentChange = (newContent) => {
    const now = Date.now();
    setLastTypingTime(now);
    
    // Only update if content actually changed to prevent cursor jumping
    if (newContent !== noteContent) {
      setNoteContent(newContent);
      
      // Use debounced save to avoid excessive API calls
      if (selectedNote) {
        debouncedSave(selectedNote._id, newContent);
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

  // Handle image upload for AI chat
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Convert files to base64 for preview and sending
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file: file,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: e.target.result,
              base64: e.target.result.split(',')[1] // Remove data:image/...;base64, prefix
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);
      setSelectedImages(prev => [...prev, ...images]);
    };
    input.click();
  };

  // Remove selected image
  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop from note editor to chat
  const handleDragStart = (e) => {
    // Check if dragging an image from the note editor
    if (e.target.tagName === 'IMG') {
      e.dataTransfer.setData('text/plain', e.target.src);
      e.dataTransfer.setData('image/src', e.target.src);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverChat(true);
  };

  const handleDragLeave = (e) => {
    // Only hide drag indicator if leaving the chat input area entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverChat(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOverChat(false);

    // Handle image drops from note editor
    const imageSrc = e.dataTransfer.getData('image/src');
    if (imageSrc) {
      // Convert the image src to blob and then to base64
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            name: 'Dragged Image',
            size: blob.size,
            type: blob.type,
            dataUrl: e.target.result,
            base64: e.target.result.split(',')[1]
          };
          setSelectedImages(prev => [...prev, imageData]);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error processing dragged image:', error);
      }
    }

    // Handle file drops from outside the app
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result,
                base64: e.target.result.split(',')[1]
              });
            };
            reader.readAsDataURL(file);
          });
        });

        const images = await Promise.all(imagePromises);
        setSelectedImages(prev => [...prev, ...images]);
      }
    }
  };

  // Send message to backend AI API
  const sendMessage = async () => {
    if ((!inputMessage.trim() && selectedImages.length === 0) || !selectedNote || !currentChatId) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      images: selectedImages.map(img => ({
        name: img.name,
        dataUrl: img.dataUrl,
        base64: img.base64,
        mimeType: img.type
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedImages([]); // Clear selected images after sending
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
      // Use backend AI API instead of direct Gemini call
      const messageData = {
        message: inputMessage,
        sessionId: currentChatId,
        images: selectedImages.map(img => ({
          name: img.name,
          base64: img.base64,
          mimeType: img.type
        }))
      };
      
      const response = await aiAPI.sendMessage(selectedNote._id || selectedNote.id, messageData);
      
      if (response.success) {
        const aiResponse = response.data.aiMessage.content;
        
        // Start typing animation
        await typeMessage(aiResponse, aiMessageId);
        
        // Update chat session metadata
        setTimeout(() => updateChatSession(), 100);
      } else {
        throw new Error(response.message || 'AI request failed');
      }
      
    } catch (error) {
      console.error('Error calling AI API:', error);
      let errorMessage = 'Sorry, I encountered an error. ';
      
      if (error.response?.status === 401) {
        errorMessage += 'Please log in again.';
      } else if (error.response?.status === 503) {
        errorMessage += 'AI service is temporarily unavailable.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      await typeMessage(errorMessage, aiMessageId);
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
    
    const noteId = selectedNote._id || selectedNote.id;
    console.log('handleNewChat called for note:', noteId, 'isManual:', isManual);
    
    const newChatId = `${noteId}_${Date.now()}`;
    
    setCurrentChatId(newChatId);
    setMessages([]); // Start with empty messages for new chat
    setInputMessage('');
    setIsTyping(false);
    
    // Create new chat session
    const newChatSession = {
      id: newChatId,
      title: `New Chat - ${selectedNote.title}`,
      preview: "No messages yet...",
      timestamp: "Just now",
      noteId: noteId,
      noteTitle: selectedNote.title,
      messageCount: 0,
      hasImages: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('New chat session created:', newChatSession);
    
    // Add new session to the top of chat history (only once)
    setChatHistory(prev => [newChatSession, ...prev]);
    setSidebarOpen(true);
    
    // Mark as initialized if manual
    if (isManual) {
      setInitializedNotes(prev => new Set([...prev, noteId]));
    }
  };

  const handleSelectChat = async (chat) => {
    if (!chat || !selectedNote) return;
    
    console.log('Selecting chat:', chat.id, 'for note:', selectedNote._id || selectedNote.id);
    setCurrentChatId(chat.id);
    
    // Clear current messages and show loading
    setMessages([]);
    setIsSessionLoading(true);
    
    try {
      // Load messages for this session from backend
      const noteId = selectedNote._id || selectedNote.id;
      await loadSessionMessages(noteId, chat.id);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setMessages([]);
    } finally {
      setIsSessionLoading(false);
    }
    
    setInputMessage('');
    setIsTyping(false);
  };

  const handleDeleteChat = async (chatId) => {
    if (!selectedNote) return;
    
    try {
      console.log('Deleting chat:', chatId);
      
      const noteId = selectedNote._id || selectedNote.id;
      // Delete from backend - send sessionId as a parameter
      await aiAPI.deleteChatHistory(noteId, { sessionId: chatId });
      
      // Remove from current chat history
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // If it's the current chat, create a new one
      if (chatId === currentChatId) {
        console.log('Deleted chat was current, creating new chat');
        await handleNewChat(true);
      }
      
      console.log('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Show error message to user
      alert('Failed to delete chat. Please try again.');
    }
  };

  // Update chat session metadata after new messages
  const updateChatSession = async () => {
    if (!currentChatId || !selectedNote || messages.length <= 1) return;
    
    // Update the cache with new messages
    const noteId = selectedNote._id || selectedNote.id;
    const cacheKey = `${noteId}_${currentChatId}`;
    setLoadedSessions(prev => new Map(prev.set(cacheKey, messages)));
    
    // Update the chat session in the frontend state
    setChatHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const userMessages = messages.filter(m => m.type === 'user');
        const title = userMessages.length > 0 
          ? (userMessages[0].content.length > 50 
            ? `${userMessages[0].content.substring(0, 50)}...`
            : userMessages[0].content)
          : chat.title;
        
        const lastMessage = messages[messages.length - 1];
        const preview = lastMessage 
          ? (lastMessage.content.length > 100 
            ? lastMessage.content.substring(0, 100) + "..."
            : lastMessage.content)
          : chat.preview;
        
        return {
          ...chat,
          title,
          preview,
          messageCount: messages.length,
          hasImages: messages.some(m => m.images && m.images.length > 0),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  };

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
        isChatLoading={isChatLoading}
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
                onDragStart={handleDragStart}
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
                    paddingBottom: isMobile ? '140px' : '80px' // Extra padding on mobile for fixed input
                  }}
                >
                  {isChatLoading ? (
                    // Chat history loading state
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                        <p className="text-gray-400">Loading chat history...</p>
                      </div>
                    </div>
                  ) : isSessionLoading ? (
                    // Individual session loading state
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                        <p className="text-gray-400">Loading conversation...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    // Empty state
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <div className="text-center">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-gray-400 mb-2">Start a conversation</p>
                        <p className="text-gray-500 text-sm">Ask me anything about your note!</p>
                      </div>
                    </div>
                  ) : (
                    // Messages
                    <>
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
                          <div>
                            {/* Display images if present */}
                            {message.images && message.images.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {message.images.map((image, index) => (
                                  <img
                                    key={index}
                                    src={image.dataUrl}
                                    alt={image.name || 'Uploaded image'}
                                    className="max-w-full max-h-48 rounded-lg cursor-pointer"
                                    onClick={() => setImagePopup({ open: true, src: image.dataUrl })}
                                  />
                                ))}
                              </div>
                            )}
                            {/* Display text content */}
                            {message.content && (
                              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                            )}
                          </div>
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
                    </>
                  )}
            </div>

            {/* Floating Message Input - Better Mobile Positioning */}
            <div 
              className={isMobile 
                ? "mobile-chat-input p-4 mobile-input-safe" 
                : "absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6"
              }
              style={isMobile ? {
                background: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              } : {}}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag and Drop Indicator */}
              {isDragOverChat && (
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-purple-500 bg-purple-500/10 flex items-center justify-center pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus size={24} className="text-purple-400" />
                    <div className="text-purple-300 text-sm font-medium">
                      Drop image here to add to chat
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <div className="mb-3 p-3 rounded-xl" style={{
                  background: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div className="flex flex-wrap gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.dataUrl}
                          alt={image.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeSelectedImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div 
                className="relative flex items-center"
                style={{ height: '56px' }}
              >
                <textarea
                  ref={chatInputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your note..."
                  className="w-full h-full pl-14 pr-14 py-4 border rounded-2xl resize-none outline-none text-gray-200 placeholder-gray-400 shadow-2xl chat-input"
                  style={{
                    background: isDragOverChat 
                      ? 'rgba(139, 92, 246, 0.1)' 
                      : 'rgba(30, 30, 30, 0.95)',
                    borderColor: isDragOverChat 
                      ? '#8b5cf6' 
                      : 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    minHeight: '56px',
                    maxHeight: '56px',
                    overflow: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={e => {
                    if (!isDragOverChat) {
                      e.target.style.borderColor = '#8b5cf6';
                      e.target.style.background = 'rgba(40, 40, 40, 0.95)';
                    }
                  }}
                  onBlur={e => {
                    if (!isDragOverChat) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(30, 30, 30, 0.95)';
                    }
                  }}
                />
                {/* Image Upload Button */}
                <button
                  onClick={handleImageUpload}
                  className="absolute left-3 p-2 rounded-xl transition-all duration-300 hover:bg-white/20"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none'
                  }}
                  title="Upload image"
                >
                  <ImagePlus size={16} className="text-gray-300" />
                </button>
                
                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && selectedImages.length === 0) || isTyping}
                  className="absolute right-3 p-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: (inputMessage.trim() || selectedImages.length > 0) && !isTyping
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
          className="fixed inset-0 flex items-center justify-center z-45 p-5"
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