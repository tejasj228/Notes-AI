'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import GraphView from '@/components/GraphView';

function GraphShell() {
  const router = useRouter();
  return (
    <div className="min-h-[100dvh] p-4 md:p-6 flex flex-col">
      <div className="mb-4">
        <button className="brutal-btn bg-white text-ink px-3 py-2 text-xs" onClick={() => router.push('/notes')}>
          <ArrowLeft size={16} strokeWidth={2.75} /> Back to notes
        </button>
      </div>
      <div className="flex-1 min-h-0" style={{ height: 'calc(100dvh - 96px)' }}>
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
