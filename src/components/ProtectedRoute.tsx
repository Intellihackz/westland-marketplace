'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!loading) {
      if (!user) {
        // Add a small delay to ensure the auth state is stable
        timeoutId = setTimeout(() => {
          router.push('/sign-in');
        }, 100);
      } else {
        setHasChecked(true);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // If not authenticated, render nothing (will redirect in useEffect)
  if (!user) {
    return null;
  }

  // If authenticated, render children
  return <>{children}</>;
} 