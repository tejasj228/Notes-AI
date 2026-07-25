'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AIChatPage from './AIChatPage';
import { useNotesData } from '@/hooks/useNotesData';
import { useAuth } from '@/context/AuthProvider';

const AIChatShell = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.noteId;
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { notes, trashedNotes, updateNote, loading } = useNotesData();

  const allNotes = [...notes, ...trashedNotes];
  const selectedNote = allNotes.find((note) => {
    if (!note) return false;
    const idStr = note._id || note.id;
    const slug = note.title ? note.title.toLowerCase().replace(/\s+/g, '-') : '';
    return (idStr && idStr.toString() === noteId) || (slug && slug === noteId);
  });

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-3 border-ink border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-mono text-sm uppercase tracking-widest">Loading note</p>
        </div>
      </div>
    );
  }

  return (
    <AIChatPage
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      user={user}
      onLogout={logout}
      selectedNote={selectedNote}
      onUpdateNote={updateNote}
      onBackToNotes={() => router.push('/notes')}
    />
  );
};

export default AIChatShell;
