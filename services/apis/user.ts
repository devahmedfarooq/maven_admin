import api from './api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, UserFormData, UpdateUserData, UserFilters } from '@/types/user.types'
import { PaginatedResponse, MessageInstance } from '@/types/api.types'

const getUser = async (page: number, limit: number): Promise<PaginatedResponse<User>> => {
    return (await api.get(`/users?page=${page}&limit=${limit}`)).data
}

export const useUsers = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['Get User', page, limit],
        queryFn: () => getUser(page, limit)
    })
}

export const useUser = (id: string) => {
    return useQuery({
        queryKey: ["user", id],
        queryFn: async (): Promise<User> => {
            const { data } = await api.get(`/users/${id}`);
            return data;
        },
        enabled: !!id, // Prevents execution if ID is not provided
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }): Promise<User> => {
            return api.put(`/users/profile/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string): Promise<{ message: string }> => {
            return api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["Get User"] });
        },
    });
};
