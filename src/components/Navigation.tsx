'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/hooks/useAuth";
import { CreateListingModal } from './CreateListingModal';

export function Navigation() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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