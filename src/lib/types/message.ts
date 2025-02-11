export interface Message {
  _id: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  _id: string;
  listingId: string;
  listing: {
    _id: string;
    title: string;
    image: string;
    price: number;
    status: 'active' | 'sold';
  };
  participants: {
    _id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
} 