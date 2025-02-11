'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Listing } from '@/lib/types/listing';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
}

export function BuyNowModal({ isOpen, onClose, listing, onSuccess }: BuyNowModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing._id })
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      setError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-background w-full sm:max-w-md rounded-t-lg sm:rounded-lg shadow-lg mx-auto sm:mx-4 safe-bottom">
        <div className="flex flex-col p-6 space-y-6">
          {/* Mobile drag indicator */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2 sm:hidden" />
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Confirm Purchase</h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-muted-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{listing.title}</h3>
              <p className="text-2xl font-bold mt-1">₦{listing.price.toLocaleString()}</p>
            </div>

            <div className="bg-muted p-5 rounded-lg text-sm space-y-3">
              <p className="font-medium text-base">How it works:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li className="leading-relaxed">Your payment will be held in escrow</li>
                <li className="leading-relaxed">The seller will be notified to proceed with the sale</li>
                <li className="leading-relaxed">Once you receive and verify the item, you can release the payment</li>
                <li className="leading-relaxed">If there's any issue, you can request a refund</li>
              </ol>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-3 sm:py-2 rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full px-4 py-3 sm:py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : `Pay ₦${listing.price.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 