'use client';

import { useState } from 'react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAmount: number;
  onWithdraw: (amount: number, bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => Promise<void>;
}

export function WithdrawModal({ isOpen, onClose, availableAmount, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > availableAmount) {
      setError('Amount exceeds available balance');
      return;
    }

    if (!accountName || !accountNumber || !bankName) {
      setError('Please fill in all bank details');
      return;
    }

    try {
      setLoading(true);
      await onWithdraw(amount, {
        accountName,
        accountNumber,
        bankName
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative z-50 w-full max-w-md bg-background rounded-lg border shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Withdraw Funds</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Available Balance: ₦{availableAmount.toLocaleString()}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Enter bank name"
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 