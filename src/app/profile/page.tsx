'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function ProfileRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      router.replace(`/users/${user._id}`);
    } else {
      router.replace('/sign-in');
    }
  }, [user, router]);

  return null;
} 