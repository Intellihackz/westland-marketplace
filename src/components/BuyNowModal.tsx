'use client';

import { useState } from 'react';
import { Listing } from '@/lib/types/listing';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess: () => void;
}

export function BuyNowModal({ isOpen, onClose, listing, onSuccess }: BuyNowModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listing._id}/purchase`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to purchase item');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Confirm Purchase</h2>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-medium mb-2">{listing.title}</h3>
          <p className="text-xl font-semibold">₦{listing.price.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            By clicking "Buy Now", you agree to purchase this item and to contact the seller
            to arrange payment and delivery details.
          </p>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 