import { BaseEntity } from './api.types';

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  image?: string;
  subscribed?: boolean;
  otp?: {
    verified: boolean;
    code?: string;
  };
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  image?: string;
}

export interface UserStats {
  totalUsers: number;
  subscribedUsers: number;
  unsubscribedUsers: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  subscribed?: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin';
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  image?: string;
} 