'use client';

import RequireAuth from '@/components/RequireAuth';
import NotesShell from '@/components/NotesShell';

export default function TrashPage() {
  return (
    <RequireAuth>
      <NotesShell page="trash" />
    </RequireAuth>
  );
}
