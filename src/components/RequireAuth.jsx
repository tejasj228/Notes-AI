'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const FullScreenLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block w-10 h-10 border-3 border-ink border-t-transparent rounded-full animate-spin mb-3" />
      <p className="font-mono text-sm uppercase tracking-widest">Loading</p>
    </div>
  </div>
);

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/auth');
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return <FullScreenLoader />;
  return children;
};

export default RequireAuth;
