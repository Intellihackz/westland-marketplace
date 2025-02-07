export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Session {
  user: User;
} 