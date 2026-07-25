'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '@/components/Landing';
import { useAuth } from '@/context/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/notes');
  }, [loading, isAuthenticated, router]);

  // Signed-in users are bounced to their notes; everyone else sees the landing.
  if (!loading && isAuthenticated) return null;

  return <Landing />;
}
