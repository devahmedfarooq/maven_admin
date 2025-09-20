import { BaseEntity } from './api.types';

export interface Booking extends BaseEntity {
  userId: string;
  itemId: string;
  itemName: string;
  itemType: string;
  itemImage?: string;
  bookingDate: string;
  startDate: string;
  endDate?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  appointment?: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  };
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  specialRequests?: string;
  notes?: string;
}

export interface BookingFormData {
  userId: string;
  itemId: string;
  bookingDate: string;
  startDate: string;
  endDate?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  specialRequests?: string;
  notes?: string;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  itemType?: string;
  startDate?: string;
  endDate?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

export interface CreateBookingData {
  userId?: string;
  itemId?: string;
  bookingDate?: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  appointment?: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  };
  summary?: {
    items: { name: string; cost: number; amount: number; id: string; img: string }[];
    subtotal: number;
    gst: number;
    total: number;
  };
  personalInfo?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  customerDetails?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  specialRequests?: string;
  notes?: string;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  specialRequests?: string;
  notes?: string;
} 