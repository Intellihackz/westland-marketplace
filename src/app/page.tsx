'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useEffect, useState } from "react";
import { Listing } from "@/lib/types/listing";

const categories = [
  'Textbooks',
  'Electronics',
  'Furniture',
  'Notes',
  'Clothing',
  'Sports',
  'Food',
  'Other'
] as const;

export default function Home() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async () => {
    try {
      let url = '/api/listings?limit=8';
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setListings(data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-6">
          <h2 className="text-4xl font-bold mb-1 text-primary">
            Westland University Marketplace
          </h2>
          <p className="text-muted-foreground mb-4">
            Buy and sell with your fellow Westland students
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <form onSubmit={handleSearch} className="flex gap-4 justify-center w-full max-w-md">
              <input
                type="search"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-full border border-input w-full"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-primary text-background hover:bg-primary/90"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="mb-8">
          <h3 className="text-3xl font-semibold mb-4">Browse Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  if (selectedCategory === category) {
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(category);
                  }
                }}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-primary text-background hover:bg-primary/90'
                    : 'bg-card hover:border-foreground/20'
                }`}
              >
                <p className="text-center font-medium">{category}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Listings */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold">
              {selectedCategory ? `${selectedCategory} Listings` : 'Recent Listings'}
            </h3>
            <button
              onClick={() => router.push('/listings')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
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

          {!loading && listings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No listings found</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="hidden lg:block border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-muted-foreground">
            © 2024 Westplace - Westland University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
