'use client';

import RequireAuth from '@/components/RequireAuth';
import NotesShell from '@/components/NotesShell';

export default function FolderPage() {
  return (
    <RequireAuth>
      <NotesShell page="folder" />
    </RequireAuth>
  );
}
