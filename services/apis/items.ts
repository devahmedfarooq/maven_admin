import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "./api";
 // Adjust this based on your backend route

// Fetch Items Hook
export const useItems = (page = 1, limit = 10, filters = {}) => {
    return useQuery({
        queryKey: ["items", page, limit, filters],
        queryFn: async () => {
            const { data } = await axios.get(`/items`, {
                params: { page, limit, ...filters },
            });
            return data;
        },
        keepPreviousData: true,
      //  refetchInterval : 5
    });
};

// Create Item Hook


export function useCreateItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newItem) => {
            const response = await axios.post("/items", newItem);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] }); // Refresh the list
        },
    });
}

