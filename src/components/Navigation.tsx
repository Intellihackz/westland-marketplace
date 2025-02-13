'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/lib/hooks/useAuth";
import { CreateListingModal } from './CreateListingModal';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          const totalUnread = data.conversations.reduce(
            (sum: number, conv: { unreadCount: number }) => sum + conv.unreadCount,
            0
          );
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    // Poll for new messages every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* Desktop Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="text-xl font-bold hover:opacity-80 text-primary flex items-center gap-2"
              >
                <img src="/logo.jpg" alt="Westland University" className="h-8 w-8" />
                Westplace
              </button>
            </div>

            {/* Desktop Navigation - Hidden on Mobile */}
            <nav className="hidden sm:flex items-center gap-2">
              {loading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded-full" />
              ) : user ? (
                <>
                  <button
                    onClick={() => router.push('/messages')}
                    className="px-4 py-2 rounded-full border border-foreground/10 hover:bg-secondary transition-colors relative"
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[1.25rem]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => router.push('/payments')}
                    className="px-4 py-2 rounded-full border border-foreground/10 hover:bg-secondary transition-colors"
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-4 py-2 rounded-full border border-foreground/10 hover:bg-secondary transition-colors"
                  >
                    Profile
                  </button>
                  <button 
                    onClick={async () => {
                      await logout();
                      router.push('/');
                    }}
                    className="px-4 py-2 rounded-full border border-foreground/10 hover:bg-secondary transition-colors"
                  >
                    Sign Out
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary/90 transition-colors"
                  >
                    List Item
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Sign In Button (in nav bar) */}
            {!user && !loading && (
              <div className="sm:hidden">
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-2 rounded-full bg-primary text-background hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Only shown when user is signed in */}
      {user && (
        <>
          <div className="sm:hidden h-[80px]" /> {/* Spacer div to prevent content from going under navigation */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-bottom">
            <div className="grid grid-cols-5 h-16">
              <button
                onClick={() => router.push('/')}
                className={`flex flex-col items-center justify-center gap-1 ${
                  pathname === '/' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs">Home</span>
              </button>

              <button
                onClick={() => router.push('/messages')}
                className={`flex flex-col items-center justify-center gap-1 relative ${
                  pathname === '/messages' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-xs">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-6 bg-blue-500 text-white text-xs font-medium px-1.5 rounded-full min-w-[1.25rem]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 bg-primary text-background rounded-full flex items-center justify-center -mt-6 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs mt-1">List</span>
              </button>

              <button
                onClick={() => router.push('/payments')}
                className={`flex flex-col items-center justify-center gap-1 ${
                  pathname === '/payments' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">Payments</span>
              </button>

              <button
                onClick={() => router.push('/profile')}
                className={`flex flex-col items-center justify-center gap-1 ${
                  pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs">Profile</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
} 