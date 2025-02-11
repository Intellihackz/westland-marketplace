'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { Listing } from '@/lib/types/listing';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high';

const categories = [
  'All',
  'Textbooks',
  'Electronics',
  'Furniture',
  'Notes',
  'Clothing',
  'Sports',
  'Other'
] as const;

const conditions = [
  'All',
  'new',
  'like-new',
  'good',
  'fair',
  'poor'
] as const;

const priceRanges = [
  { label: 'All', min: undefined, max: undefined },
  { label: 'Under ₦5,000', min: 0, max: 5000 },
  { label: '₦5,000 - ₦10,000', min: 5000, max: 10000 },
  { label: '₦10,000 - ₦20,000', min: 10000, max: 20000 },
  { label: '₦20,000 - ₦50,000', min: 20000, max: 50000 },
  { label: 'Over ₦50,000', min: 50000, max: undefined },
];

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalListings, setTotalListings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 12;

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/listings?page=${currentPage}&limit=${itemsPerPage}`;

      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      if (selectedCategory !== 'All') {
        url += `&category=${selectedCategory}`;
      }
      if (selectedCondition !== 'All') {
        url += `&condition=${selectedCondition}`;
      }
      if (selectedPriceRange > 0) {
        const range = priceRanges[selectedPriceRange];
        if (range.min !== undefined) url += `&minPrice=${range.min}`;
        if (range.max !== undefined) url += `&maxPrice=${range.max}`;
      }
      url += `&sort=${sortBy}`;

      const res = await fetch(url);
      const data = await res.json();
      setListings(data.listings);
      setTotalListings(data.total);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedCondition, selectedPriceRange, sortBy, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [currentPage, selectedCategory, selectedCondition, selectedPriceRange, sortBy, searchQuery, fetchListings]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchListings();
  };

  const totalPages = Math.ceil(totalListings / itemsPerPage);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6">Browse Listings</h1>

          <div className="relative">
            {/* Search and Filter Bar */}
            <div className="flex gap-2">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input
                  type="search"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-input"
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                >
                  Search
                </button>
              </form>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 rounded-lg border border-input hover:bg-secondary relative"
                aria-label="Toggle filters"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {/* Active filters indicator */}
                {(selectedCategory !== 'All' || 
                  selectedCondition !== 'All' || 
                  selectedPriceRange !== 0 || 
                  sortBy !== 'newest') && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Filters Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-background border rounded-lg shadow-lg z-10 space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Condition</label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => {
                      setSelectedCondition(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2"
                  >
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition === 'All' ? 'All' : condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <select
                    value={selectedPriceRange}
                    onChange={(e) => {
                      setSelectedPriceRange(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2"
                  >
                    {priceRanges.map((range, index) => (
                      <option key={range.label} value={index}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortOption);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setSelectedPriceRange(0);
                    setSortBy('newest');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-input hover:bg-secondary text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Active Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCategory !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm flex items-center gap-1">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="ml-1 hover:text-foreground/80"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCondition !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm flex items-center gap-1">
                Condition: {selectedCondition}
                <button
                  onClick={() => setSelectedCondition('All')}
                  className="ml-1 hover:text-foreground/80"
                >
                  ×
                </button>
              </span>
            )}
            {selectedPriceRange !== 0 && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm flex items-center gap-1">
                Price: {priceRanges[selectedPriceRange].label}
                <button
                  onClick={() => setSelectedPriceRange(0)}
                  className="ml-1 hover:text-foreground/80"
                >
                  ×
                </button>
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm flex items-center gap-1">
                Sort: {sortBy.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                <button
                  onClick={() => setSortBy('newest')}
                  className="ml-1 hover:text-foreground/80"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {totalListings} {totalListings === 1 ? 'listing' : 'listings'} found
          </p>
        </div>

        {/* Listings Grid */}
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
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCondition('All');
                setSelectedPriceRange(0);
                setSortBy('newest');
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
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
                    {listing.status !== 'active' && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </div>
                    )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-input hover:bg-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-foreground text-background'
                          : 'border border-input hover:bg-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-input hover:bg-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
} 