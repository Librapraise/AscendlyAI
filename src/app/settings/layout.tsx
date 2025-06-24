"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/ui/TopNav';
import { useAuth } from '@/app/context/AuthContext'; 
import Sidebar from '@/components/ui/Sidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/signin');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={signOut} 
        user={user}
      />
      <div className="flex-1 flex flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}