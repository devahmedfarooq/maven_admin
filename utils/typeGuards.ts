import { User } from '@/types/user.types';
import { Booking } from '@/types/booking.types';
import { Item } from '@/types/item.types';
import { Category } from '@/types/category.types';

// Type guards for runtime type checking
export const isUser = (obj: any): obj is User => {
  return obj && 
    typeof obj._id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    ['user', 'admin'].includes(obj.role);
};

export const isBooking = (obj: any): obj is Booking => {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.itemId === 'string' &&
    typeof obj.itemName === 'string' &&
    typeof obj.bookingDate === 'string' &&
    typeof obj.totalAmount === 'number';
};

export const isItem = (obj: any): obj is Item => {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.price) &&
    obj.price.every((p: any) => 
      typeof p.cost === 'number' && 
      typeof p.type === 'string'
    );
};

export const isCategory = (obj: any): obj is Category => {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.hasSubType === 'boolean';
};

// Array type guards
export const isUserArray = (arr: any): arr is User[] => {
  return Array.isArray(arr) && arr.every(isUser);
};

export const isBookingArray = (arr: any): arr is Booking[] => {
  return Array.isArray(arr) && arr.every(isBooking);
};

export const isItemArray = (arr: any): arr is Item[] => {
  return Array.isArray(arr) && arr.every(isItem);
};

export const isCategoryArray = (arr: any): arr is Category[] => {
  return Array.isArray(arr) && arr.every(isCategory);
};

// API response type guards
export const isApiResponse = <T>(obj: any, dataValidator: (data: any) => data is T): obj is { data: T; message?: string; status: number } => {
  return obj &&
    typeof obj === 'object' &&
    dataValidator(obj.data) &&
    (typeof obj.message === 'string' || obj.message === undefined) &&
    typeof obj.status === 'number';
};

export const isPaginatedResponse = <T>(obj: any, dataValidator: (data: any) => data is T): obj is { 
  data: T[]; 
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
} => {
  return obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.data) &&
    obj.data.every(dataValidator) &&
    obj.pagination &&
    typeof obj.pagination.total === 'number' &&
    typeof obj.pagination.page === 'number' &&
    typeof obj.pagination.limit === 'number' &&
    typeof obj.pagination.totalPages === 'number' &&
    typeof obj.pagination.hasNextPage === 'boolean' &&
    typeof obj.pagination.hasPrevPage === 'boolean';
};

// Error type guards
export const isApiError = (error: any): error is { 
  response?: { 
    status: number; 
    data?: { message?: string } 
  }; 
  message?: string 
} => {
  return error &&
    typeof error === 'object' &&
    (error.response || error.message);
};

// Form data validation
export const isValidUserFormData = (data: any): data is {
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  image?: string;
} => {
  return data &&
    typeof data.name === 'string' &&
    typeof data.email === 'string' &&
    (typeof data.phone === 'string' || data.phone === undefined) &&
    ['user', 'admin'].includes(data.role) &&
    (['male', 'female', 'other'].includes(data.gender) || data.gender === undefined) &&
    (typeof data.dateOfBirth === 'string' || data.dateOfBirth === undefined) &&
    (typeof data.address === 'string' || data.address === undefined) &&
    (typeof data.image === 'string' || data.image === undefined);
};

// Utility function to safely access nested properties
export const safeGet = <T>(obj: any, path: string[], defaultValue: T): T => {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  return current as T;
};

// Utility function to validate required fields
export const validateRequiredFields = (obj: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!obj || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missingFields.push(field);
    }
  }
  return missingFields;
}; 