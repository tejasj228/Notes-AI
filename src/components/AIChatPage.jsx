import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, GripVertical } from 'lucide-react';
import { FormattingToolbar } from './UI';
import { resizeImage, insertImageAtCaret } from '../utils/helpers';
import Sidebar from './Sidebar';

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
  onUpdateNote // Add this prop to update note content
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
  const [panelWidth, setPanelWidth] = useState(40); // Percentage width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' }); // Add image popup state
  
  const messagesEndRef = useRef(null);
  const noteEditorRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set note content when selectedNote changes
  useEffect(() => {
    if (selectedNote) {
      setNoteContent(selectedNote.content || '');
      if (noteEditorRef.current) {
        noteEditorRef.current.innerHTML = selectedNote.content || '';
      }
    }
  }, [selectedNote]);

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

  // Handle note content changes and save them
  const handleNoteContentChange = (newContent) => {
    setNoteContent(newContent);
    // Save changes back to the main notes data
    if (selectedNote && onUpdateNote) {
      onUpdateNote(selectedNote.id, 'content', newContent);
    }
  };

  // Handle panel resize
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 70) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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

  // Typing animation for AI responses
  const typeMessage = async (content, messageId) => {
    const words = content.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentText + (i < words.length - 1 ? '▋' : '') }
          : msg
      ));
      
      // Random delay between 50-150ms for natural typing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
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
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      await typeMessage(`Error: ${error.message}`, aiMessageId);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#1a1a1a' }}>
      {/* Use the same Sidebar component */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={null} // No page selected in AI mode
        currentFolder={null}
        folders={folders}
        user={user}
        onSwitchToNotes={onSwitchToNotes}
        onSwitchToTrash={onSwitchToTrash}
        onOpenFolder={onOpenFolder}
        onAddFolder={onAddFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onLogout={onLogout}
      />

      {/* Main Content - Fixed positioning to avoid overlap */}
      <div 
        className="flex transition-all duration-300"
        style={{ 
          marginLeft: sidebarOpen ? '256px' : '72px', // 256px = w-64, 72px = w-18
          width: `calc(100vw - ${sidebarOpen ? '256px' : '72px'})`,
          height: '100vh'
        }}
      >
        {/* Left Panel - Note Viewer */}
        <div 
          className="flex flex-col border-r"
          style={{ 
            width: `${panelWidth}%`,
            background: '#2a2a2a',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Note Header */}
          <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h1 className="text-xl font-semibold text-gray-200 mb-2">
              {selectedNote?.title || 'No Note Selected'}
            </h1>
            {selectedNote?.keywords && selectedNote.keywords.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedNote.keywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="inline-block text-gray-300 border rounded-lg px-3 py-1 text-xs"
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
          <div className="flex-1 flex flex-col" style={{ minHeight: 0, padding: '24px 24px 0 24px' }}>
            <div
              ref={noteEditorRef}
              className="note-content-editable flex-1 border rounded-xl p-4 text-sm leading-relaxed overflow-y-auto outline-none"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={e => handleNoteContentChange(e.currentTarget.innerHTML)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#cccccc',
                height: 'calc(100vh - 240px)' // Take remaining height minus header and toolbar
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
            
            {/* Formatting Toolbar with Image Insert */}
            <div className="py-4 flex justify-end items-center gap-3">
              <button
                type="button"
                className="border-none rounded-md p-2 text-gray-300 cursor-pointer transition-all duration-300 flex items-center text-xs"
                title="Insert Image"
                onClick={handleInsertImage}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  height: '32px'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.color = '#cccccc';
                }}
              >
                🖼️ Insert Image
              </button>
              <FormattingToolbar editorRef={noteEditorRef} />
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-600 cursor-col-resize hover:bg-purple-500 transition-colors duration-200 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          style={{ background: isDragging ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)' }}
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col" style={{ background: '#1a1a1a', minHeight: '100vh' }}>
          {/* Chat Header */}
          <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-200">AI Assistant</h2>
              <p className="text-sm text-gray-400">Ready to help with your note</p>
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ 
              height: 'calc(100vh - 200px)' // Fixed height calculation
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    {/* Show thinking dots if this is the last AI message and we're typing, otherwise show bot icon */}
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
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {/* Show "Thinking..." for the last AI message when typing and content is empty */}
                    {isTyping && message.type === 'ai' && !message.content && message.id === Math.max(...messages.filter(m => m.type === 'ai').map(m => m.id)) ? (
                      <span className="text-gray-400">Thinking...</span>
                    ) : (
                      message.content
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

          {/* Message Input */}
          <div className="px-6 pb-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex gap-3 items-end pt-6">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your note..."
                  className="w-full p-4 pr-12 border rounded-2xl resize-none outline-none text-gray-200 placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    minHeight: '56px',
                    maxHeight: '120px'
                  }}
                  rows={1}
                  disabled={isTyping}
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
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: inputMessage.trim() && !isTyping 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={e => {
                  if (inputMessage.trim() && !isTyping) {
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
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
  );
};

export default AIChatPage;