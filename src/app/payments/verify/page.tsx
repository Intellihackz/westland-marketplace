'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';

export default function PaymentVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      if (!reference) {
        setStatus('error');
        setError('No payment reference found');
        return;
      }

      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          // Redirect to payments page after 3 seconds
          setTimeout(() => {
            router.push('/payments');
          }, 3000);
        } else {
          setStatus('error');
          setError(data.error || 'Failed to verify payment');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setError('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto text-center">
          {status === 'verifying' && (
            <>
              <h1 className="text-2xl font-bold mb-4">Verifying Payment</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Please wait while we verify your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 text-green-500">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your payment has been verified and the funds are now held in escrow.
                You will be redirected to the payments page shortly...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 text-red-500">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Verification Failed</h1>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90"
              >
                Return Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 