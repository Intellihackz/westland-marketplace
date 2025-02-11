'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Listing } from '@/lib/types/listing';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, [query]);

  const fetchListings = async () => {
    try {
      const res = await fetch(`/api/listings?query=${encodeURIComponent(query || '')}`);
      const data = await res.json();
      setListings(data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {query ? `Search results for "${query}"` : 'All Listings'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {listings.length} {listings.length === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="rounded-lg border bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-muted"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchListings()}
              className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background"
            >
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <button
                key={listing._id}
                onClick={() => router.push(`/listings/${listing._id}`)}
                className="rounded-lg border bg-card overflow-hidden hover:border-foreground/20 transition-colors text-left"
              >
                <div className="aspect-square relative">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-medium mb-2 line-clamp-1">{listing.title}</h4>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold">₦{listing.price.toLocaleString()}</p>
                    <span className="text-sm text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
} 