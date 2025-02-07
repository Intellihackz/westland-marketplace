'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Listing } from '@/lib/types/listing';
import { Navigation } from '@/components/Navigation';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { BuyNowModal } from '@/components/BuyNowModal';
import { EditListingModal } from '@/components/EditListingModal';

export default function ListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch listing');
      }
      const data = await res.json();
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchListing();
  }, [params.id, fetchListing]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center flex-1 h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center flex-1 h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'Listing not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === listing.seller._id;
  const isSold = listing.status === 'sold';

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={listing.images[currentImageIndex]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index
                        ? 'border-foreground'
                        : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listing Details */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold">{listing.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  listing.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : listing.status === 'sold'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
              <p className="text-2xl font-semibold mt-2">₦{listing.price.toLocaleString()}</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-secondary px-3 py-1 rounded-full text-sm">
                {listing.category}
              </div>
              <div className="bg-secondary px-3 py-1 rounded-full text-sm">
                {listing.condition}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {listing.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">Seller</h2>
              <p className="text-muted-foreground">{listing.seller.name}</p>
              
              {user ? (
                isOwner ? (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full px-4 py-2 rounded-lg border border-input hover:bg-secondary"
                    >
                      Edit Listing
                    </button>
                    {listing.status === 'active' && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to mark this as sold?')) {
                            await fetch(`/api/listings/${listing._id}/status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'sold' }),
                            });
                            fetchListing();
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                      >
                        Mark as Sold
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {listing.status === 'active' && (
                      <>
                        <button
                          onClick={() => setIsBuyModalOpen(true)}
                          className="w-full px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={() => setIsContactModalOpen(true)}
                          className="w-full px-4 py-2 rounded-lg border border-input hover:bg-secondary"
                        >
                          Contact Seller
                        </button>
                      </>
                    )}
                  </div>
                )
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="w-full mt-4 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                >
                  Sign in to Buy or Contact Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditListingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        listing={listing}
      />
      <ContactSellerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        listing={listing}
      />
      <BuyNowModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        listing={listing}
        onSuccess={fetchListing}
      />
    </div>
  );
} 