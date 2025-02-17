"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Listing } from "@/lib/types/listing";
import { UserProfile } from "@/lib/types/user";
import { EditProfileModal } from "@/components/EditProfileModal";
import { WithdrawModal } from '@/components/WithdrawModal';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    completedSales: number;
    pendingAmount: number;
    pendingSales: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  const isOwnProfile = user?._id === params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, listingsRes, salesRes] = await Promise.all([
          fetch(`/api/users/${params.id}`),
          fetch(`/api/listings/user/${params.id}`),
          isOwnProfile ? fetch(`/api/users/${params.id}/sales`) : null
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          router.push("/404");
          return;
        }

        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          console.log(listingsData);
          setActiveListings(
            listingsData.listings.filter((l: Listing) => l.status === "active")
          );
          // Only show sold listings on own profile
          if (isOwnProfile) {
            setSoldListings(
              listingsData.listings.filter((l: Listing) => l.status === "sold")
            );
          }
        }

        if (isOwnProfile && salesRes?.ok) {
          const salesData = await salesRes.json();
          setSalesData(salesData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router, isOwnProfile]);

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setProfile(updatedUser);
    if (isOwnProfile) {
      setUser({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: new Date(updatedUser.createdAt),
      });
    }
    setIsEditModalOpen(false);
  };

  const handleWithdraw = async (amount: number, bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => {
    try {
      const response = await fetch(`/api/users/${params.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          bankDetails,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process withdrawal');
      }

      // Refresh sales data
      const salesRes = await fetch(`/api/users/${params.id}/sales`);
      if (salesRes.ok) {
        const newSalesData = await salesRes.json();
        setSalesData(newSalesData);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete listing');
      }

      // Remove the listing from state
      setActiveListings(activeListings.filter(l => l._id !== listingId));
      setDeletingListingId(null);
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-primary">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested profile could not be found.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {profile.avatar ? (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-4xl">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary">{profile.name}</h1>
              {isOwnProfile && (
                <>
                  <p className="text-muted-foreground">
                    {profile.email}
                  </p>
                  {profile.phone && (
                    <p className="text-muted-foreground">
                      {profile.phone}
                    </p>
                  )}
                  {salesData && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-card p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-xl font-bold">₦{salesData.totalSales.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {salesData.completedSales} completed
                        </p>
                        <button
                          onClick={() => setIsWithdrawModalOpen(true)}
                          className="mt-2 w-full px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary/90 rounded-lg"
                        >
                          Withdraw
                        </button>
                      </div>
                      <div className="bg-card p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold">₦{salesData.pendingAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {salesData.pendingSales} in escrow
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isOwnProfile && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg border hover:bg-secondary/10"
                >
                  Edit Profile
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-muted-foreground">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Listings */}
        <div className="space-y-8">
          {/* Active Listings */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {isOwnProfile ? "Active Listings" : `${profile.name}'s Listings`}
            </h2>
            {activeListings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No active listings
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activeListings.map((listing) => (
                  <div key={listing._id} className="bg-card rounded-lg border overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{listing.title}</h3>
                      <p className="text-lg font-bold mb-2">₦{listing.price.toLocaleString()}</p>
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => router.push(`/listings/${listing._id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View Details
                        </button>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            disabled={deletingListingId === listing._id}
                            className="text-sm text-destructive hover:text-destructive/90 disabled:opacity-50"
                          >
                            {deletingListingId === listing._id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sold Listings - Only shown on own profile */}
          {isOwnProfile && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Sold Listings</h2>
              {soldListings.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No sold listings
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {soldListings.map((listing) => (
                    <div key={listing._id} className="bg-card rounded-lg border overflow-hidden opacity-75">
                      <div className="relative aspect-square">
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                          <span className="text-lg font-semibold">SOLD</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{listing.title}</h3>
                        <p className="text-lg font-bold mb-2">₦{listing.price.toLocaleString()}</p>
                        <button
                          onClick={() => router.push(`/listings/${listing._id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {isOwnProfile && (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={profile}
            onUpdate={handleProfileUpdate}
          />
          <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            availableAmount={salesData?.totalSales || 0}
            onWithdraw={handleWithdraw}
          />
        </>
      )}
    </div>
  );
}
