export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  tags: string[];
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'sold' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateListingInput = Omit<Listing, '_id' | 'seller' | 'status' | 'createdAt' | 'updatedAt'>; 