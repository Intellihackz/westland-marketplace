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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold">Browse Listings</h1>
            
            {/* View Toggle */}
            <div className="hidden sm:flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${
                  viewMode === 'grid'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                }`}
                aria-label="Grid view"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${
                  viewMode === 'list'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                }`}
                aria-label="List view"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input
                  type="search"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 sm:py-2 rounded-lg border border-input"
                />
                <button
                  type="submit"
                  className="px-6 py-3 sm:py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                >
                  <span className="sm:hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <span className="hidden sm:block">Search</span>
                </button>
              </form>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg border border-input hover:bg-secondary flex items-center justify-center gap-2 sm:gap-0"
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
                <span className="sm:hidden">Filters</span>
                {/* Active filters indicator */}
                {(selectedCategory !== 'All' || 
                  selectedCondition !== 'All' || 
                  selectedPriceRange !== 0 || 
                  sortBy !== 'newest') && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Filters Panel - Full screen on mobile */}
            {showFilters && (
              <div className="fixed sm:absolute inset-0 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-72 bg-background sm:border sm:rounded-lg sm:shadow-lg z-50">
                <div className="flex sm:hidden items-center justify-between p-4 border-b sticky top-0 bg-background">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 -m-2 hover:text-muted-foreground"
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
                
                <div className="p-4 space-y-4 max-h-[calc(100vh-4rem)] sm:max-h-[unset] overflow-y-auto">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
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
                      className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
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
                      className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
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
                      className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedCondition('All');
                        setSelectedPriceRange(0);
                        setSortBy('newest');
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-3 sm:py-2 rounded-lg border border-input hover:bg-secondary text-sm"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full px-4 py-3 sm:py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm sm:hidden"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listings */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-lg aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-lg h-32" />
              ))}
            </div>
          )
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <a
                    key={listing._id}
                    href={`/listings/${listing._id}`}
                    className="group relative bg-background rounded-lg border overflow-hidden hover:border-foreground/20 transition-colors flex flex-col h-full"
                  >
                    <div className="aspect-square relative bg-muted">
                      {listing.images?.[0] && (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-medium line-clamp-1 group-hover:text-foreground/80 mb-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <p className="text-lg font-bold text-primary">
                          ₦{listing.price.toLocaleString()}
                        </p>
                        <span className="text-xs px-2 py-1 bg-secondary/50 rounded-full">
                          {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <a
                    key={listing._id}
                    href={`/listings/${listing._id}`}
                    className="group flex gap-4 bg-background rounded-lg border overflow-hidden hover:border-foreground/20 transition-colors p-4"
                  >
                    <div className="relative w-32 h-32 bg-muted rounded-lg flex-shrink-0">
                      {listing.images?.[0] && (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 8rem, 8rem"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium line-clamp-1 group-hover:text-foreground/80">
                            {listing.title}
                          </h3>
                          <p className="text-xl font-bold mt-1">
                            ₦{listing.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-muted-foreground line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {listing.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-secondary rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 pt-4 border-t">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border hover:bg-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border hover:bg-secondary disabled:opacity-50"
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