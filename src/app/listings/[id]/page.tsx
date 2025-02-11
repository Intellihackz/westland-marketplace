'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Listing } from '@/lib/types/listing';
import { Navigation } from '@/components/Navigation';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { BuyNowButton } from '@/components/BuyNowButton';
import { EditListingModal } from '@/components/EditListingModal';

export default function ListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to fetch listing');
        }
      } catch (error) {
        console.error('Failed to fetch listing:', error);
        setError('Failed to fetch listing');
      }
    };

    fetchListing();
  }, [params.id]);

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
          <div>
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            <p className="text-3xl font-bold mb-4">₦{listing.price.toLocaleString()}</p>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="font-medium">{listing.category}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Condition</dt>
                  <dd className="font-medium capitalize">{listing.condition}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Listed</dt>
                  <dd className="font-medium">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{listing.status}</dd>
                </div>
              </dl>
            </div>

            {listing.tags.length > 0 && (
              <div className="mb-6">
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
              <button
                onClick={() => router.push(`/users/${listing.seller._id}`)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {listing.seller.name}
              </button>
              
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
                            router.refresh();
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
                        <BuyNowButton
                          listing={listing}
                          className="w-full px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                        />
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
    </div>
  );
} 