"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext'; 
import LandingPage from '@/components/ui/LandingPage';


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        setShowLanding(true);
      }
    }
  }, [user, loading, router]);

  const handleSignIn = () => {
    router.push('/signin'); 
  };

  const handleGetStarted = () => {
    router.push('/signup'); 
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  
  if (showLanding) {
    return (
      <LandingPage 
        onSignIn={handleSignIn}
        onGetStarted={handleGetStarted}
      />
    );
  }

  return null;
}