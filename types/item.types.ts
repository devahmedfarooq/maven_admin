import { BaseEntity } from './api.types';

export interface PriceItem {
  cost: number;
  type: string;
  isActive?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  description?: string;
  currency?: string;
}

export interface Review {
  img: string;
  name: string;
  rating: number;
}

export interface Item extends BaseEntity {
  title: string;
  subtitle?: string;
  about?: string;
  type?: string | { _id: string; name: string };
  subType?: string;
  location?: string;
  imgs?: string[];
  price: PriceItem[];
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