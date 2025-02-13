'use client';

import { useEffect, useState } from 'react';

interface Payment {
  _id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  paystackReference: string;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  listing: {
    title: string;
    price: number;
  };
  buyer: {
    name: string;
    email: string;
  };
  seller: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const paymentsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(
        `/api/admin/payments?page=${currentPage}&limit=${paymentsPerPage}&status=${statusFilter}`
      );
      const data = await res.json();
      setPayments(data.payments);
      setTotalPayments(data.total);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Payment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-t">
              {Array(6).fill(null).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalPayments / paymentsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 font-medium">
          <div>Listing</div>
          <div>Amount</div>
          <div>Platform Fee</div>
          <div>Seller</div>
          <div>Buyer</div>
          <div>Status</div>
          <div>Date</div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {payments.map((payment) => (
            <div key={payment._id} className="grid grid-cols-7 gap-4 p-4 hover:bg-muted/50">
              <div className="font-medium truncate">{payment.listing?.title || 'N/A'}</div>
              <div>₦{payment.amount.toLocaleString()}</div>
              <div>₦{payment.platformFee.toLocaleString()}</div>
              <div className="truncate">{payment.seller?.name || 'N/A'}</div>
              <div className="truncate">{payment.buyer?.name || 'N/A'}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status}
                </span>
              </div>
              <div className="text-muted-foreground">
                {new Date(payment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}

          {payments.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No payments found
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

export default PaymentsPage; 