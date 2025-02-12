import { PaystackInitializeResponse, PaystackVerifyResponse } from './types/payment';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

export async function initializeTransaction(
  email: string,
  amount: number,
  reference: string,
  metadata: any = {}
): Promise<PaystackInitializeResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to initialize transaction');
  }

  return response.json();
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to verify transaction');
  }

  return response.json();
}

export async function refundTransaction(
  reference: string,
  amount?: number
): Promise<any> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: reference,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to kobo if amount is provided
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create refund');
  }

  return response.json();
}

export async function initiateTransaction(
  email: string,
  amount: number,
  reference: string,
  metadata?: any
): Promise<PaystackResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to initialize transaction');
  }

  return response.json();
}

export async function initiateTransfer(
  amount: number,
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  },
  reference: string
): Promise<PaystackResponse> {
  // First, get the bank code
  const banksResponse = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!banksResponse.ok) {
    throw new Error('Failed to fetch bank list');
  }

  const banks = await banksResponse.json();
  const bank = banks.data.find(
    (b: any) => b.name.toLowerCase() === bankDetails.bankName.toLowerCase()
  );

  if (!bank) {
    throw new Error('Invalid bank name');
  }

  // Create transfer recipient
  const recipientResponse = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name: bankDetails.accountName,
      account_number: bankDetails.accountNumber,
      bank_code: bank.code,
      currency: 'NGN',
    }),
  });

  if (!recipientResponse.ok) {
    throw new Error('Failed to create transfer recipient');
  }

  const recipient = await recipientResponse.json();

  // Initiate transfer
  const transferResponse = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: recipient.data.recipient_code,
      reason: `Withdrawal - ${reference}`,
      reference,
    }),
  });

  if (!transferResponse.ok) {
    throw new Error('Failed to initiate transfer');
  }

  return transferResponse.json();
} 