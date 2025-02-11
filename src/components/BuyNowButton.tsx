'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Listing } from '@/lib/types/listing';

interface BuyNowButtonProps {
  listing: Listing;
  className?: string;
}

export function BuyNowButton({ listing, className = '' }: BuyNowButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
        disabled={loading}
      >
        Buy Now
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="relative bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Confirm Purchase</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
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
                <h3 className="font-medium">{listing.title}</h3>
                <p className="text-2xl font-bold">₦{listing.price.toLocaleString()}</p>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-medium">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Your payment will be held in escrow</li>
                  <li>The seller will be notified to proceed with the sale</li>
                  <li>Once you receive and verify the item, you can release the payment</li>
                  <li>If there's any issue, you can request a refund</li>
                </ol>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay ₦${listing.price.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 