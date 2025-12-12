export type UserRole = 'tenant' | 'landlord' | 'admin';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  verified: boolean;
  nrcNumber?: string;
  tpin?: string;
  kycDocuments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}