'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Listing } from '@/lib/types/listing';
import { UserProfile } from '@/lib/types/user';
import { EditProfileModal } from '@/components/EditProfileModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch if user is logged in
        if (!user?._id) {
          setLoading(false);
          return;
        }

        const [profileRes, listingsRes] = await Promise.all([
          fetch(`/api/users/${user._id}`),
          fetch('/api/listings/my-listings')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setActiveListings(listingsData.listings.filter((l: Listing) => l.status === 'active'));
          setSoldListings(listingsData.listings.filter((l: Listing) => l.status === 'sold'));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  if (!user || !profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Sign in Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your profile</p>
            <button
              onClick={() => router.push('/sign-in')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign In
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
          <div className="flex items-center gap-6">
            {profile.avatar ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-4xl">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              {profile.phone && (
                <p className="text-gray-600 dark:text-gray-400">{profile.phone}</p>
              )}
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit Profile
            </button>
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">{profile.bio}</p>
          )}
        </div>

        {/* Listings */}
        <div className="space-y-8">
          {/* Active Listings */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Active Listings</h2>
            {activeListings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No active listings</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activeListings.map((listing) => (
                  <button
                    key={listing._id}
                    onClick={() => router.push(`/listings/${listing._id}`)}
                    className="rounded-lg border bg-white dark:bg-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
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
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="font-bold">₦{listing.price.toLocaleString()}</p>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Sold Listings */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Sold Listings</h2>
            {soldListings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No sold listings</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {soldListings.map((listing) => (
                  <button
                    key={listing._id}
                    onClick={() => router.push(`/listings/${listing._id}`)}
                    className="rounded-lg border bg-white dark:bg-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left opacity-75"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">Sold</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium mb-2 line-clamp-1">{listing.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="font-bold">₦{listing.price.toLocaleString()}</p>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={profile}
      />
    </div>
  );
} 