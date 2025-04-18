import api from './api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const getUser = async (page: number, limit: number) => {
    return (await api.get(`/users?page=${page}&limit=${limit}`)).data
}

export const useUsers = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['Get User'],
        queryFn: () => getUser(page, limit)
    })
}

export const useUser = (id: string) => {
    return useQuery({
        queryKey: ["user", id],
        queryFn: async () => {
            const { data } = await api.get(`/users/${id}`);
            return data;
        },
        enabled: !!id, // Prevents execution if ID is not provided
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return api.put(`/users/profile/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
};

export const useDeleteUser = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/users/${id}`);
        },
    });
};
