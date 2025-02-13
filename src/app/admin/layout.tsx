'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

const adminEmails = ['admin@westland.edu', 'zephyrdev@duck.com']; // Add your admin email here

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !adminEmails.includes(user.email))) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || !adminEmails.includes(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') {
      return true;
    }
    return path !== '/admin' && pathname.startsWith(path);
  };

  const NavLink = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const active = isActive(href);
    return (
      <a
        href={href}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors relative ${
          active 
            ? 'bg-primary text-background hover:bg-primary/90' 
            : 'hover:bg-secondary'
        }`}
      >
        {icon}
        {children}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-background rounded-full" />
        )}
      </a>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r hidden md:block">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-lg font-semibold text-primary">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink 
            href="/admin"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            href="/admin/users"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          >
            Users
          </NavLink>
          <NavLink 
            href="/admin/listings"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          >
            Listings
          </NavLink>
          <NavLink 
            href="/admin/payments"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Payments
          </NavLink>
          <NavLink 
            href="/admin/analytics"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            Analytics
          </NavLink>
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background md:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <h1 className="text-lg font-semibold text-primary">Admin Panel</h1>
          <button className="p-2 hover:bg-secondary rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}