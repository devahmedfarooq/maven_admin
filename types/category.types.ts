import { BaseEntity } from './api.types';

export interface Category extends BaseEntity {
  name: string;
  hasSubType: boolean;
  subName?: string[];
  description?: string;
  icon?: string;
  active?: boolean;
  featured?: boolean;
  itemCount?: number;
}

export interface CategoryFormData {
  name: string;
  hasSubType: boolean;
  subName?: string[];
  description?: string;
  icon?: string;
  active?: boolean;
  featured?: boolean;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  hasSubType?: boolean;
  active?: boolean;
  featured?: boolean;
}

export interface CreateCategoryData {
  category: {
    name: string;
    hasSubType: boolean;
    subName?: string[];
    description?: string;
    icon?: string;
    active?: boolean;
    featured?: boolean;
  };
}

export interface CreateSubCategoryData {
  category: {
    name: string;
    subName: string[];
  };
}

export interface UpdateCategoryData {
  name?: string;
  hasSubType?: boolean;
  subName?: string[];
  description?: string;
  icon?: string;
  active?: boolean;
  featured?: boolean;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  featuredCategories: number;
  categoriesWithSubTypes: number;
  averageItemsPerCategory: number;
} 