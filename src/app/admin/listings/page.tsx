'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  platformFee: number;
  sellerAmount: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'sold' | 'pending';
  createdAt: string;
  updatedAt: string;
}

function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const listingsPerPage = 10;

  useEffect(() => {
    fetchListings();
  }, [currentPage, statusFilter, categoryFilter]);

  const fetchListings = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: listingsPerPage.toString(),
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery
      });

      const res = await fetch(`/api/admin/listings?${queryParams}`);
      const data = await res.json();
      setListings(data.listings);
      setTotalListings(data.total);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchListings();
  };

  const getStatusBadgeClass = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50">
            {Array(7).fill(null).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 p-4 border-t">
              {Array(7).fill(null).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalListings / listingsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-background"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="all">All Categories</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Notes">Notes</option>
            <option value="Clothing">Clothing</option>
            <option value="Sports">Sports</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 font-medium">
          <div>Image</div>
          <div>Title</div>
          <div>Price</div>
          <div>Category</div>
          <div>Seller</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {listings.map((listing) => (
            <div key={listing._id} className="grid grid-cols-7 gap-4 p-4 hover:bg-muted/50">
              <div className="relative w-12 h-12">
                {listing.images[0] && (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                )}
              </div>
              <div className="font-medium truncate">{listing.title}</div>
              <div>₦{listing.price.toLocaleString()}</div>
              <div>{listing.category}</div>
              <div className="truncate">{listing.seller.name}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(listing.status)}`}>
                  {listing.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/listings/${listing._id}`)}
                  className="px-2 py-1 text-sm rounded-lg hover:bg-secondary"
                >
                  View
                </button>
                {listing.status === 'active' && (
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to remove this listing?')) {
                        await fetch(`/api/listings/${listing._id}`, {
                          method: 'DELETE'
                        });
                        fetchListings();
                      }
                    }}
                    className="px-2 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {listings.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No listings found
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
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
    </div>
  );
}

export default ListingsPage; 