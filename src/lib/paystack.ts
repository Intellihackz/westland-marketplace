import { PaystackInitializeResponse, PaystackVerifyResponse } from './types/payment';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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