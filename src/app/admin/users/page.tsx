'use client';

import { useEffect, useState } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  listings?: number;
  purchases?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${currentPage}&limit=${usersPerPage}`);
      const data = await res.json();
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 p-4 border-t">
              {Array(5).fill(null).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search users..."
            className="px-4 py-2 rounded-lg border"
          />
          <select className="px-4 py-2 rounded-lg border bg-background">
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="user">Regular Users</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Listings</div>
          <div>Joined</div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {users.map((user) => (
            <div key={user._id} className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/50">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground">{user.email}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary'
                }`}>
                  {user.role}
                </span>
              </div>
              <div>{user.listings || 0} listings</div>
              <div className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
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