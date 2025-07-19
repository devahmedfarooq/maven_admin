// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ErrorResponse {
  message: string;
  status: number;
  error?: string;
}

// Common Types
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Timestamp {
  createdAt: string;
  updatedAt?: string;
}

// Message Types
export interface MessageInstance {
  success: (content: string) => void;
  error: (content: string) => void;
  warning: (content: string) => void;
  info: (content: string) => void;
}

// Form Types
export interface FormInstance<T = any> {
  setFieldsValue: (values: Partial<T>) => void;
  getFieldsValue: () => T;
  resetFields: () => void;
  validateFields: () => Promise<T>;
  setFieldValue: (name: string, value: any) => void;
}

// Upload Types
export interface UploadChangeParam {
  file: File;
  fileList: UploadFile[];
}

export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  url?: string;
  response?: any;
} 