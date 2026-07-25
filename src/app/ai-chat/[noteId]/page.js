'use client';

import RequireAuth from '@/components/RequireAuth';
import AIChatShell from '@/components/AIChatShell';

export default function AIChatRoute() {
  return (
    <RequireAuth>
      <AIChatShell />
    </RequireAuth>
  );
}
