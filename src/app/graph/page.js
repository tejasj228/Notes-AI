'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import GraphView from '@/components/GraphView';
import ThemeToggle from '@/components/ThemeToggle';

function GraphShell() {
  const router = useRouter();
  return (
    /* Exactly one viewport tall, so the canvas fills everything left over
       instead of leaving dead space under the graph. */
    <div className="h-[100dvh] p-4 md:p-6 flex flex-col overflow-hidden">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <button className="brutal-btn bg-card text-ink px-3 py-2 text-xs" onClick={() => router.push('/notes')}>
          <ArrowLeft size={16} strokeWidth={2.75} /> Back to notes
        </button>
        <ThemeToggle />
      </div>
      <div className="flex-1 min-h-0">
        <GraphView />
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <RequireAuth>
      <GraphShell />
    </RequireAuth>
  );
}
