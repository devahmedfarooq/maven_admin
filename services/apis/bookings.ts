import { type QueryClient, useMutation, useQuery } from "@tanstack/react-query"
import api from "@/services/apis/api"
import type { FormInstance } from "antd"
import { Booking, BookingFilters, CreateBookingData } from '@/types/booking.types'
import { PaginatedResponse, MessageInstance } from '@/types/api.types'

const fetchBookings = async (page: number, limit: number, message: MessageInstance): Promise<PaginatedResponse<Booking>> => {
  try {
    const { data } = await api.get(`/booking?page=${page}&limit=${limit}`)
    if (!data?.data?.length) throw { response: { status: 404 } }
    return data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { data: [], pagination: { total: 0, page, limit: limit, totalPages: 0, hasNextPage: false, hasPrevPage: false } }
    }
    message.error("Error fetching bookings")
    throw new Error("Failed to fetch bookings")
  }
}

const fetchCategories = async (message: MessageInstance): Promise<any[]> => {
  try {
    const { data } = await api.get("/category")
    return data
  } catch (error: any) {
    message.error("Error fetching categories")
    throw new Error("Failed to fetch categories")
  }
}

const fetchItemsByCategory = async (categoryType: string, page: number, limit: number, message: MessageInstance): Promise<PaginatedResponse<any>> => {
  try {
    const { data } = await api.get(`/items?type=${categoryType}&page=${page}&limit=${limit}`)
    if (!data?.items?.length) return { data: [], pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false } }
    return data
  } catch (error: any) {
    message.error(`Error fetching items for category: ${categoryType}`)
    throw new Error(`Failed to fetch items for category: ${categoryType}`)
  }
}

const createBooking = async (newBooking: CreateBookingData): Promise<Booking> => {
  return await api.post("/booking", newBooking)
}

export const useBookings = (currentPage: number, pageSize: number, message: MessageInstance) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", currentPage, pageSize],
    queryFn: () => fetchBookings(currentPage, pageSize, message),
  })

  return {
    data,
    isLoading,
    isError,
  }
}

export const useCategories = (message: MessageInstance) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(message),
  })

  return {
    categories: data,
    isLoadingCategories: isLoading,
    isErrorCategories: isError,
  }
}

export const useItemsByCategory = (categoryType: string | undefined, page: number, limit: number, message: MessageInstance) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["items", categoryType, page, limit],
    queryFn: () => fetchItemsByCategory(categoryType || "", page, limit, message),
    enabled: !!categoryType, // Only run query if categoryType is provided
  })

  return {
    items: data,
    isLoadingItems: isLoading,
    isErrorItems: isError,
  }
}

export const useBookingsMutation = (
  queryClient: QueryClient,
  message: MessageInstance,
  setIsModalOpen: (open: boolean) => void,
  form: FormInstance<CreateBookingData>,
) => {
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      message.success("Booking created successfully!")
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: () => {
      message.error("Failed to create booking.")
    },
  })
}
