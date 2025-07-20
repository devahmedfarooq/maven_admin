import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "./api"
// Type definitions
interface Item {
  _id: string
  title: string
  subtitle?: string
  about?: string
  type?: string | { _id: string; name: string }
  subType?: string
  location?: string
  imgs?: string[]
  price: { 
    cost: number; 
    type: string; 
    isActive?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    description?: string;
    currency?: string;
  }[]
  reviews?: { img: string; name: string; rating: number }[]
}

interface CreateItemData {
  title: string
  subtitle?: string
  about?: string
  type?: string
  subType?: string
  location?: string
  imgs?: string[]
  price: { 
    cost: number; 
    type: string; 
    isActive?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    description?: string;
    currency?: string;
  }[]
}

interface UpdateItemParams {
  id: string
  data: Partial<CreateItemData>
}

// Fetch Items Hook
export const useItems = (page = 1, limit = 10, filters = {}) => {
  return useQuery({
    queryKey: ["items", page, limit, filters],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/items`, {
          params: { page, limit, ...filters },
        })
        return data
      } catch (error) {
        console.error("Error fetching items:", error)
        throw error
      }
    },
  })
}

// Create Item Hook
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newItem: CreateItemData) => {
      try {
        console.log("Creating item with data:", newItem)
        const response = await axios.post("/items", newItem)
        return response.data
      } catch (error: any) {
        console.error("Error creating item:", error.response?.data || error.message)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] }) // Refresh the list
    },
  })
}

// Update item hook
export const useUpdateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateItemParams) => {
      try {
        console.log("Updating item with data:", data)
        const response = await axios.patch(`/items/${id}`, data)
        return response.data
      } catch (error: any) {
        console.error("Error updating item:", error.response?.data || error.message)
        throw error
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch items list and the specific item
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["item", data._id] })
    },
  })
}

// Delete item hook
export const useDeleteItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await axios.delete(`/items/${id}`)
        return response.data
      } catch (error: any) {
        console.error("Error deleting item:", error.response?.data || error.message)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

// Get item hook
export const useGetItem = (id: string) => {
  return useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      try {
        const response = await axios.get(`/items/${id}`)
        return response.data
      } catch (error: any) {
        console.error("Error getting item:", error.response?.data || error.message)
        throw error
      }
    },
    enabled: !!id, // Only run the query if id is provided
  })
}

// Get items list hook
export const useGetItems = (filters = {}) => {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: async () => {
      try {
        const response = await axios.get("/items", { params: filters })
        return response.data
      } catch (error: any) {
        console.error("Error getting items:", error.response?.data || error.message)
        throw error
      }
    },
  })
}
