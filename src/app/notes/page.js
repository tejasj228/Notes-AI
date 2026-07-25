'use client';

import RequireAuth from '@/components/RequireAuth';
import NotesShell from '@/components/NotesShell';

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesShell page="notes" />
    </RequireAuth>
  );
}
