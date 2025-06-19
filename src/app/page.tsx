"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

// This page acts as a loading/redirecting gate.
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect based on authentication status
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/signin');
    }
  }, [user, router]);

  // Render a loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}