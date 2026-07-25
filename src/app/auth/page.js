'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

// Auth relies on Firebase (browser-only), so render it client-side only.
const AuthPage = dynamic(() => import('@/components/AuthPage'), { ssr: false });

export default function AuthRoute() {
  const router = useRouter();
  const { isAuthenticated, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/notes');
  }, [loading, isAuthenticated, router]);

  const handleAuthSuccess = (userData, token) => {
    login(userData, token);
    router.replace('/notes');
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} onBackHome={() => router.push('/')} />;
}
