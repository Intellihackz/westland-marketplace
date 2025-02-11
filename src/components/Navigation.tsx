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
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="text-xl font-bold hover:opacity-80"
              >
                UniMarket
              </button>
            </div>
            <div className="flex items-center gap-4">
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
                    className="px-4 py-2 rounded-full bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
                  >
                    List Item
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-2 rounded-full bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
} 