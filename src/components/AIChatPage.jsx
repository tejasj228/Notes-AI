'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, GripVertical, Menu, ImagePlus, ArrowLeft, Square } from 'lucide-react';
import { resizeImage, insertImageAtCaret } from '@/utils/helpers';
import { aiAPI } from '@/api/ai';
import ChatSidebar from './ChatSidebar';

const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Minimal markdown → HTML for AI bubbles
const parseMarkdown = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
  return html;
};

const AIChatPage = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
  selectedNote,
  onUpdateNote,
  onBackToNotes,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);
  const [noteContent, setNoteContent] = useState(selectedNote?.content || '');
  const [panelWidth, setPanelWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePopup, setImagePopup] = useState({ open: false, src: '' });
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [loadedSessions, setLoadedSessions] = useState(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOverChat, setIsDragOverChat] = useState(false);

  const messagesEndRef = useRef(null);
  const noteEditorRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const stopRef = useRef(false);

  // ------- effects -------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedNote) {
      const noteId = selectedNote._id || selectedNote.id;
      setLoadedSessions(new Map());
      loadChatHistory(noteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id, selectedNote?._id]);

  useEffect(() => {
    if (selectedNote) {
      const newContent = selectedNote.content || '';
      if (noteContent !== newContent) setNoteContent(newContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id, selectedNote?.content]);

  useEffect(() => {
    if (noteEditorRef.current && selectedNote && (!isMobile || panelWidth >= 15)) {
      const currentContent = noteEditorRef.current.innerHTML;
      const expectedContent = selectedNote.content || '';
      const isUserTyping = Date.now() - lastTypingTime < 1000;
      if (currentContent !== expectedContent && !isUserTyping) {
        noteEditorRef.current.innerHTML = expectedContent;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.content, panelWidth, isMobile, lastTypingTime]);

  useEffect(() => {
    function handleImageClick(e) {
      if (e.target.tagName === 'IMG') setImagePopup({ open: true, src: e.target.src });
    }
    const editor = noteEditorRef.current;
    if (editor) editor.addEventListener('click', handleImageClick);
    return () => editor && editor.removeEventListener('click', handleImageClick);
  }, [selectedNote]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // panel resize
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let size;
      if (isMobile) {
        const containerHeight = window.innerHeight - 120;
        const mouseY = e.clientY || (e.touches && e.touches[0].clientY);
        size = ((mouseY - 120) / containerHeight) * 100;
      } else {
        const mouseX = e.clientX || (e.touches && e.touches[0].clientX);
        size = (mouseX / window.innerWidth) * 100;
      }
      if (size >= 5 && size <= 95) setPanelWidth(size);
    };
    const stop = () => setIsDragging(false);
    const touchMove = (e) => {
      e.preventDefault();
      handleMouseMove(e);
    };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stop);
      document.addEventListener('touchmove', touchMove, { passive: false });
      document.addEventListener('touchend', stop);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', stop);
    };
  }, [isDragging, isMobile]);

  // ------- chat data -------
  const loadChatHistory = async (noteId) => {
    setIsChatLoading(true);
    try {
      const response = await aiAPI.getChatHistory(noteId);
      if (response.success && response.data.sessions?.length > 0) {
        const sessions = response.data.sessions.map((s) => ({
          id: s.sessionId,
          title: s.firstMessage.length > 30 ? s.firstMessage.substring(0, 30) + '…' : s.firstMessage,
          preview: s.lastMessage.substring(0, 100) + (s.lastMessage.length > 100 ? '…' : ''),
          timestamp: new Date(s.updatedAt).toLocaleDateString(),
          noteId,
          noteTitle: selectedNote?.title,
          messageCount: s.messageCount,
          hasImages: s.hasImages,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        setChatHistory(sessions);
      } else {
        setChatHistory([]);
      }
      handleNewChat();
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
      handleNewChat();
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadSessionMessages = async (noteId, sessionId) => {
    try {
      const cacheKey = `${noteId}_${sessionId}`;
      if (loadedSessions.has(cacheKey)) {
        setMessages(loadedSessions.get(cacheKey));
        return;
      }
      const response = await aiAPI.getChatHistory(noteId, { sessionId });
      if (response.success && response.data.messages) {
        const msgs = response.data.messages.map((msg) => ({
          id: msg._id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.createdAt,
          images: msg.metadata?.images
            ? msg.metadata.images.map((img) => ({ ...img, dataUrl: `data:${img.mimeType};base64,${img.base64}` }))
            : [],
        }));
        setLoadedSessions((prev) => new Map(prev.set(cacheKey, msgs)));
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    }
  };

  const debouncedSave = useCallback(
    debounce((noteId, content) => onUpdateNote && onUpdateNote(noteId, 'content', content), 500),
    [onUpdateNote]
  );

  const handleNoteContentChange = (newContent) => {
    setLastTypingTime(Date.now());
    if (newContent !== noteContent) {
      setNoteContent(newContent);
      if (selectedNote) debouncedSave(selectedNote._id, newContent);
    }
  };

  const handleNoteImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resizedDataUrl = await resizeImage(file);
      if (noteEditorRef.current) {
        insertImageAtCaret(noteEditorRef, resizedDataUrl);
        handleNoteContentChange(noteEditorRef.current.innerHTML);
      }
    };
    input.click();
  };

  // typing animation
  const typeMessage = async (content, messageId) => {
    const words = content.split(' ');
    let currentText = '';
    stopRef.current = false;
    for (let i = 0; i < words.length; i++) {
      if (stopRef.current) break;
      currentText += (i > 0 ? ' ' : '') + words[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: currentText + (i < words.length - 1 ? '▋' : '') } : msg
        )
      );
      await new Promise((r) => setTimeout(r, Math.random() * 60 + 30));
    }
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)));
    setIsTyping(false);
  };

  const stopTyping = () => {
    stopRef.current = true;
    setIsTyping(false);
  };

  // image handling
  const fileToImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
          base64: e.target.result.split(',')[1],
        });
      reader.readAsDataURL(file);
    });

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const images = await Promise.all(files.map(fileToImage));
      setSelectedImages((prev) => [...prev, ...images]);
    };
    input.click();
  };

  const removeSelectedImage = (index) => setSelectedImages((prev) => prev.filter((_, i) => i !== index));

  const handleDragStart = (e) => {
    if (e.target.tagName === 'IMG') {
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
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverChat(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOverChat(false);
    const imageSrc = e.dataTransfer.getData('image/src');
    if (imageSrc) {
      try {
        const blob = await (await fetch(imageSrc)).blob();
        const reader = new FileReader();
        reader.onload = (ev) =>
          setSelectedImages((prev) => [
            ...prev,
            { name: 'Dragged Image', size: blob.size, type: blob.type, dataUrl: ev.target.result, base64: ev.target.result.split(',')[1] },
          ]);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(err);
      }
    }
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      const images = await Promise.all(files.map(fileToImage));
      setSelectedImages((prev) => [...prev, ...images]);
    }
  };

  // send
  const sendMessage = async () => {
    if ((!inputMessage.trim() && selectedImages.length === 0) || !selectedNote || !currentChatId) return;
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      images: selectedImages.map((img) => ({ name: img.name, dataUrl: img.dataUrl, base64: img.base64, mimeType: img.type })),
    };
    setMessages((prev) => [...prev, userMessage]);
    const outgoing = inputMessage;
    const outgoingImages = selectedImages;
    setInputMessage('');
    setSelectedImages([]);
    setIsTyping(true);

    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: aiMessageId, type: 'ai', content: '' }]);

    try {
      const response = await aiAPI.sendMessage(selectedNote._id || selectedNote.id, {
        message: outgoing,
        sessionId: currentChatId,
        images: outgoingImages.map((img) => ({ name: img.name, base64: img.base64, mimeType: img.type })),
      });
      if (response.success) {
        await typeMessage(response.data.aiMessage.content, aiMessageId);
        setTimeout(() => updateChatSession(), 100);
      } else {
        throw new Error(response.message || 'AI request failed');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      let msg = 'Sorry, I hit an error. ';
      if (error.response?.status === 401) msg += 'Please log in again.';
      else if (error.response?.status === 503) msg += 'AI service is temporarily unavailable.';
      else msg += error.message || 'Please try again.';
      await typeMessage(msg, aiMessageId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = (isManual = false) => {
    if (!selectedNote) return;
    const noteId = selectedNote._id || selectedNote.id;
    const newChatId = `${noteId}_${Date.now()}`;
    setCurrentChatId(newChatId);
    setMessages([]);
    setInputMessage('');
    setIsTyping(false);
    setChatHistory((prev) => [
      {
        id: newChatId,
        title: `New chat · ${selectedNote.title}`,
        preview: 'No messages yet…',
        timestamp: 'Just now',
        noteId,
        noteTitle: selectedNote.title,
        messageCount: 0,
        hasImages: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...prev,
    ]);
    setSidebarOpen(true);
  };

  const handleSelectChat = async (chat) => {
    if (!chat || !selectedNote) return;
    setCurrentChatId(chat.id);
    setMessages([]);
    setIsSessionLoading(true);
    try {
      await loadSessionMessages(selectedNote._id || selectedNote.id, chat.id);
    } finally {
      setIsSessionLoading(false);
    }
    setInputMessage('');
    setIsTyping(false);
  };

  const handleDeleteChat = async (chatId) => {
    if (!selectedNote) return;
    try {
      await aiAPI.deleteChatHistory(selectedNote._id || selectedNote.id, { sessionId: chatId });
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
      if (chatId === currentChatId) handleNewChat(true);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const updateChatSession = async () => {
    if (!currentChatId || !selectedNote || messages.length <= 1) return;
    const noteId = selectedNote._id || selectedNote.id;
    const cacheKey = `${noteId}_${currentChatId}`;
    setLoadedSessions((prev) => new Map(prev.set(cacheKey, messages)));
    setChatHistory((prev) =>
      prev.map((chat) => {
        if (chat.id !== currentChatId) return chat;
        const userMessages = messages.filter((m) => m.type === 'user');
        const title =
          userMessages.length > 0
            ? userMessages[0].content.length > 50
              ? userMessages[0].content.substring(0, 50) + '…'
              : userMessages[0].content
            : chat.title;
        const last = messages[messages.length - 1];
        const preview = last
          ? last.content.length > 100
            ? last.content.substring(0, 100) + '…'
            : last.content
          : chat.preview;
        return {
          ...chat,
          title,
          preview,
          messageCount: messages.length,
          hasImages: messages.some((m) => m.images && m.images.length > 0),
          updatedAt: new Date(),
        };
      })
    );
  };

  const latestAiId = messages.filter((m) => m.type === 'ai').reduce((max, m) => Math.max(max, m.id), -Infinity);

  // ------- render -------
  return (
    <div className="relative h-[100dvh] flex overflow-hidden bg-paper">
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

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between p-3 border-b-3 border-ink bg-paper">
            <button onClick={() => setSidebarOpen(true)} className="brutal-btn bg-card text-ink p-2">
              <Menu size={18} strokeWidth={2.75} />
            </button>
            <span className="font-display font-extrabold">AI ASSISTANT</span>
            <div className="w-9" />
          </div>
        )}

        <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} min-h-0`}>
          {/* Note panel */}
          <div
            className="flex flex-col bg-paper-2 border-ink min-h-0"
            style={{
              width: isMobile ? '100%' : `${panelWidth}%`,
              height: isMobile ? `${panelWidth}%` : '100%',
              borderRightWidth: isMobile ? 0 : 3,
              borderBottomWidth: isMobile ? 3 : 0,
            }}
          >
            {isMobile && panelWidth < 15 ? (
              <div className="flex-1 flex items-center justify-center font-mono text-xs text-ink/60">
                Note (collapsed)
              </div>
            ) : (
              <>
                <div className="p-4 border-b-3 border-ink">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={onBackToNotes} className="brutal-btn bg-card text-ink p-1.5" title="Back to notes">
                      <ArrowLeft size={18} strokeWidth={2.75} />
                    </button>
                    <h1 className="font-display font-extrabold text-lg md:text-xl flex-1 truncate">
                      {selectedNote?.title || 'No note selected'}
                    </h1>
                  </div>
                  {selectedNote?.keywords?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedNote.keywords.map((k, i) => (
                        <span key={i} className="border-2 border-ink bg-card px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col min-h-0 p-4">
                  <div
                    ref={noteEditorRef}
                    className="note-content-editable flex-1 border-3 border-ink bg-white p-3 text-sm leading-relaxed overflow-y-auto outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleNoteContentChange(e.currentTarget.innerHTML)}
                    onDragStart={handleDragStart}
                    style={{ color: '#141210', minHeight: '160px' }}
                  />
                  <div className="flex justify-end pt-3">
                    <button className="brutal-btn bg-note-teal text-ink-fixed px-3 py-2 text-xs" onClick={handleNoteImageUpload}>
                      <ImagePlus size={16} strokeWidth={2.5} /> Add image
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Resize handle */}
          <div
            className={`flex items-center justify-center bg-brand ${isMobile ? 'h-2 cursor-row-resize' : 'w-2 cursor-col-resize'}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{ borderLeft: isMobile ? 'none' : '3px solid #141210', borderRight: isMobile ? 'none' : '3px solid #141210', borderTop: isMobile ? '3px solid #141210' : 'none', borderBottom: isMobile ? '3px solid #141210' : 'none' }}
          >
            <GripVertical size={14} className={`text-white ${isMobile ? 'rotate-90' : ''}`} strokeWidth={2.75} />
          </div>

          {/* Chat panel */}
          <div
            className="flex-1 flex flex-col relative min-h-0 bg-paper"
            style={{ height: isMobile ? `${100 - panelWidth}%` : '100%' }}
          >
            {isMobile && 100 - panelWidth < 15 ? (
              <div className="flex-1 flex items-center justify-center font-mono text-xs text-ink/60">
                Chat (collapsed)
              </div>
            ) : (
              <>
                {!isMobile && (
                  <div className="flex items-center gap-3 p-4 border-b-3 border-ink">
                    <div className="w-9 h-9 border-3 border-ink bg-brand text-white flex items-center justify-center">
                      <Bot size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-lg leading-none">AI Assistant</h2>
                      <p className="brutal-eyebrow text-ink/60 mt-1">Ready to riff on your note</p>
                    </div>
                  </div>
                )}

                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ paddingBottom: isMobile ? '150px' : '90px' }}
                >
                  {isChatLoading || isSessionLoading ? (
                    <div className="flex items-center justify-center h-full min-h-[240px]">
                      <div className="text-center">
                        <div className="inline-block w-8 h-8 border-3 border-ink border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="font-mono text-sm">{isChatLoading ? 'Loading chats…' : 'Loading conversation…'}</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[240px]">
                      <div className="text-center border-3 border-ink bg-card shadow-brutal px-6 py-8 rotate-[-1deg]">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="font-display font-extrabold text-lg">Start a conversation</p>
                        <p className="text-sm text-ink/70 mt-1">Ask me anything about your note.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'ai' && (
                            <div className="w-7 h-7 border-3 border-ink bg-brand text-white flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot size={13} strokeWidth={2.5} />
                            </div>
                          )}
                          <div
                            className={`max-w-[78%] px-3 py-2 border-3 border-ink text-sm leading-relaxed ${
                              message.type === 'user' ? 'bg-brand text-white shadow-brutal-sm' : 'bg-card text-ink shadow-brutal-sm'
                            }`}
                          >
                            {isTyping && message.type === 'ai' && !message.content && message.id === latestAiId ? (
                              <span className="font-mono text-ink/60">Thinking…</span>
                            ) : message.type === 'ai' ? (
                              <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
                            ) : (
                              <div>
                                {message.images?.length > 0 && (
                                  <div className={`mb-2 ${message.images.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                                    {message.images.map((image, index) => (
                                      <img
                                        key={index}
                                        src={image.dataUrl}
                                        alt={image.name || 'image'}
                                        className="border-2 border-ink cursor-pointer w-full max-h-40 object-cover"
                                        onClick={() => setImagePopup({ open: true, src: image.dataUrl })}
                                      />
                                    ))}
                                  </div>
                                )}
                                {message.content && <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>}
                              </div>
                            )}
                          </div>
                          {message.type === 'user' && (
                            <div className="w-7 h-7 border-3 border-ink bg-note-yellow flex items-center justify-center flex-shrink-0 mt-1">
                              <User size={13} strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div
                  className={isMobile ? 'fixed bottom-0 left-0 right-0 p-3 bg-paper border-t-3 border-ink z-40' : 'absolute bottom-4 left-4 right-4'}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragOverChat && (
                    <div className="absolute inset-0 border-3 border-dashed border-brand bg-brand/10 flex items-center justify-center pointer-events-none z-10">
                      <div className="flex flex-col items-center gap-1 font-mono text-xs font-bold text-brand-ink">
                        <ImagePlus size={22} strokeWidth={2.5} />
                        Drop image into chat
                      </div>
                    </div>
                  )}

                  {selectedImages.length > 0 && (
                    <div className="mb-2 p-2 border-3 border-ink bg-card flex flex-wrap gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={image.dataUrl} alt={image.name} className="w-12 h-12 object-cover border-2 border-ink" />
                          <button
                            onClick={() => removeSelectedImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 border-2 border-ink bg-note-red text-ink-fixed text-xs font-bold flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative flex items-center">
                    <button
                      onClick={handleImageUpload}
                      className="absolute left-2 z-10 border-2 border-ink bg-note-teal p-1.5 hover:bg-ink-fixed hover:text-white transition-colors"
                      title="Upload image"
                    >
                      <ImagePlus size={16} strokeWidth={2.5} />
                    </button>
                    <textarea
                      ref={chatInputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask anything about your note…"
                      rows={1}
                      className="brutal-input no-scrollbar w-full pl-12 pr-12 py-3 text-sm shadow-brutal resize-none"
                      style={{ minHeight: '52px', maxHeight: '52px', overflow: 'hidden' }}
                    />
                    <button
                      onClick={isTyping ? stopTyping : sendMessage}
                      disabled={!isTyping && !inputMessage.trim() && selectedImages.length === 0}
                      className="absolute right-2 z-10 border-2 border-ink bg-brand text-white p-1.5 hover:bg-brand-ink transition-colors disabled:opacity-50"
                      title={isTyping ? 'Stop' : 'Send'}
                    >
                      {isTyping ? <Square size={16} strokeWidth={2.5} fill="currentColor" /> : <Send size={16} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image popup */}
      {imagePopup.open && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/70" onClick={() => setImagePopup({ open: false, src: '' })}>
          <div className="bg-paper border-3 border-ink shadow-brutal-xl flex flex-col max-w-[95vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2 p-3 border-b-3 border-ink">
              <a
                href={imagePopup.src}
                download={`note-image-${Date.now()}.jpg`}
                className="brutal-btn bg-note-green text-ink-fixed p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <button className="brutal-btn bg-card text-ink p-2" onClick={() => setImagePopup({ open: false, src: '' })}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.75" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto">
              <img src={imagePopup.src} alt="Preview" className="border-3 border-ink" style={{ maxWidth: '86vw', maxHeight: '74vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatPage;
