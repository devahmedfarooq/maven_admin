// State Management Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Event Handler Types
export type InputChangeHandler = (key: string, value: string) => void;
export type SelectChangeHandler = (value: string | number) => void;
export type DateChangeHandler = (date: Date | null) => void;
export type UploadChangeHandler = (info: any) => void;
export type FormSubmitHandler<T> = (values: T) => void;

// Table Types
export interface TableColumn<T = any> {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: { text: string; value: string }[];
  onFilter?: (value: string, record: T) => boolean;
  width?: number | string;
  fixed?: 'left' | 'right';
}

export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger: boolean;
  showQuickJumper: boolean;
  showTotal: (total: number, range: [number, number]) => string;
}

// Filter Types
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// Notification Types
export interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  createdAt: string;
  read?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  adsStats: {
    totalAds: number;
    totalClicked: number;
    totalViewed: number;
  };
  userStats: {
    totalUsers: number;
    subscribedUsers: number;
    unsubscribedUsers: number;
  };
  totalBookings: number;
  totalItems: number;
  notifications: Notification[];
  adsViews: Array<{ name: string; views: number; clicks: number }>;
  userGrowth: Array<{ name: string; users: number }>;
  subscriptionTrend: Array<{ name: string; subscribed: number; unsubscribed: number }>;
}

// Chart Types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: ChartData[];
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
}

// Validation Types
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: any) => boolean | Promise<boolean>;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
} 