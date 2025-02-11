'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Payment {
  _id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  paystackReference: string;
  createdAt: string;
  updatedAt: string;
  listing: {
    _id: string;
    title: string;
    image: string;
  };
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments');
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleRelease = async (paymentId: string) => {
    if (!confirm('Are you sure you want to release the funds to the seller? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/payments/${paymentId}/release`, {
        method: 'POST'
      });

      if (res.ok) {
        // Refresh payments list
        const paymentsRes = await fetch('/api/payments');
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.payments);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to release payment');
      }
    } catch (error) {
      console.error('Failed to release payment:', error);
      alert('Failed to release payment');
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/payments/${paymentId}/refund`, {
        method: 'POST'
      });

      if (res.ok) {
        // Refresh payments list
        const paymentsRes = await fetch('/api/payments');
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.payments);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to refund payment');
      }
    } catch (error) {
      console.error('Failed to refund payment:', error);
      alert('Failed to refund payment');
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

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">Payments</h1>
        
        {payments.length === 0 ? (
          <div className="text-center text-gray-500">
            No payments found
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map(payment => {
              const isBuyer = payment.buyer._id === user?._id;
              const canRelease = isBuyer && payment.status === 'held';
              const canRefund = !isBuyer && payment.status === 'held';

              return (
                <div
                  key={payment._id}
                  className="border rounded-lg overflow-hidden bg-card"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={payment.listing.image}
                          alt={payment.listing.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg mb-1">
                          {payment.listing.title}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                            <p className="font-medium">₦{payment.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <p className="font-medium capitalize">{payment.status}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {isBuyer ? 'Seller' : 'Buyer'}
                            </p>
                            <p className="font-medium">
                              {isBuyer ? payment.seller.name : payment.buyer.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {(canRelease || canRefund) && (
                          <div className="mt-6 flex gap-4">
                            {canRelease && (
                              <>
                                <button
                                  onClick={() => handleRelease(payment._id)}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                  Item Received
                                </button>
                                <button
                                  onClick={() => alert('Please contact support if you have not received your item.')}
                                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                  Not Received
                                </button>
                              </>
                            )}
                            {canRefund && (
                              <>
                                <button
                                  onClick={() => handleRelease(payment._id)}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                  Item's Been Delivered
                                </button>
                                <button
                                  onClick={() => handleRefund(payment._id)}
                                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                  Not Delivered
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 