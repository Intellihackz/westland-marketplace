export interface PaystackTransaction {
  reference: string;
  amount: number;
  email: string;
  status: 'pending' | 'success' | 'failed';
  access_code?: string;
  authorization_url?: string;
}

export interface EscrowPayment {
  _id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  paystackReference: string;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    customer: {
      email: string;
      metadata: any;
    };
  };
} 