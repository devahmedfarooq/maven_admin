import { BaseEntity } from './api.types';

export interface PriceItem {
  cost: number;
  type: string;
}

export interface KeyValuePair {
  key: string;
  value?: string;
  type: string;
}

export interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Item extends BaseEntity {
  title: string;
  subtitle?: string;
  about?: string;
  type?: string;
  subType?: string;
  location?: string;
  imgs?: string[];
  price: PriceItem[];
  keyvalue?: KeyValuePair[];
  reviews?: Review[];
  rating?: number;
  totalReviews?: number;
  featured?: boolean;
  active?: boolean;
}

export interface ItemFormData {
  title: string;
  subtitle?: string;
  about?: string;
  type?: string;
  subType?: string;
  location?: string;
  imgs?: string[];
  price: PriceItem[];
  keyvalue?: KeyValuePair[];
  featured?: boolean;
  active?: boolean;
}

export interface ItemFilters {
  page?: number;
  limit?: number;
  type?: string;
  subType?: string;
  search?: string;
  featured?: boolean;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}

export interface CreateItemData {
  title: string;
  subtitle?: string;
  about?: string;
  type?: string;
  subType?: string;
  location?: string;
  imgs?: string[];
  price: PriceItem[];
  keyvalue?: KeyValuePair[];
  featured?: boolean;
  active?: boolean;
}

export interface UpdateItemData {
  title?: string;
  subtitle?: string;
  about?: string;
  type?: string;
  subType?: string;
  location?: string;
  imgs?: string[];
  price?: PriceItem[];
  keyvalue?: KeyValuePair[];
  featured?: boolean;
  active?: boolean;
}

export interface ItemStats {
  totalItems: number;
  activeItems: number;
  featuredItems: number;
  itemsByType: Record<string, number>;
  averageRating: number;
} 