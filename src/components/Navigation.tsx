'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/hooks/useAuth";
import { CreateListingModal } from './CreateListingModal';

export function Navigation() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="text-xl font-bold hover:opacity-80"
              >
                UniMarket
              </button>
            </div>

            {/* Desktop Navigation */}
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
                    className="px-4 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  >
                    List Item
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 -m-2 inline-flex items-center justify-center rounded-md hover:bg-secondary"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t">
            <div className="space-y-1 px-4 pb-3 pt-2">
              {loading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : user ? (
                <>
                  <button
                    onClick={() => router.push('/messages')}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[1.25rem]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => router.push('/payments')}
                    className="w-full px-4 py-3 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-4 py-3 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    Profile
                  </button>
                  <button 
                    onClick={async () => {
                      await logout();
                      router.push('/');
                    }}
                    className="w-full px-4 py-3 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    Sign Out
                  </button>
                  <button 
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-colors text-left"
                  >
                    List Item
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="w-full px-4 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-colors text-left"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
} 