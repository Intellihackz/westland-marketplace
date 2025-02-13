'use client';

import { useEffect, useState } from 'react';
import { Listing } from '@/lib/types/listing';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalSales: number;
  activeListings: number;
  pendingPayments: number;
  completedPayments: number;
  totalRevenue: number;
  recentListings: Listing[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          usersRes,
          listingsRes,
          paymentsRes,
          recentListingsRes
        ] = await Promise.all([
          fetch('/api/admin/stats/users'),
          fetch('/api/admin/stats/listings'),
          fetch('/api/admin/stats/payments'),
          fetch('/api/listings?limit=5')
        ]);

        const [
          usersData,
          listingsData,
          paymentsData,
          recentListingsData
        ] = await Promise.all([
          usersRes.json(),
          listingsRes.json(),
          paymentsRes.json(),
          recentListingsRes.json()
        ]);

        setStats({
          totalUsers: usersData.total || 0,
          totalListings: listingsData.total || 0,
          activeListings: listingsData.active || 0,
          totalSales: paymentsData.totalSales || 0,
          pendingPayments: paymentsData.paymentsPending || 0,
          completedPayments: paymentsData.paymentsCompleted || 0,
          totalRevenue: paymentsData.totalRevenue || 0,
          recentListings: recentListingsData.listings || []
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Recent Listings Skeleton */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </div>
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Users</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-2">Active Listings</p>
          <p className="text-2xl font-bold">{stats.activeListings}</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Sales</p>
          <p className="text-2xl font-bold">{stats.totalSales}</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
          <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Listings</h2>
        </div>
        <div className="divide-y">
          {stats.recentListings.map((listing) => (
            <div key={listing._id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Listed by {listing.seller.name} • {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold">₦{listing.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-6">Payment Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-medium">{stats.pendingPayments}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-medium">{stats.completedPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-6">Listing Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="font-medium">{stats.totalListings}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="font-medium">{stats.activeListings}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 