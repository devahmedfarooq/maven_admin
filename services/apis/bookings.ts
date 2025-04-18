import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import api from '@/services/apis/api'
import { SetStateAction } from "react";
import { FormInstance } from "antd";

const fetchBookings = async (page: number, limit: number, message: any) => {
    try {
        const { data } = await api.get(`/booking?page=${page}&limit=${limit}`);
        if (!data?.data?.length) throw { response: { status: 404 } };
        return data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return { data: [], total: 0 };
        }
        message.error("Error fetching bookings");
        throw new Error("Failed to fetch bookings");
    }
};

const createBooking = async (newBooking: any) => {
    return await api.post("/booking", newBooking);
};


export const useBookings = (currentPage: number, pageSize: number, message: any) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["bookings", currentPage, pageSize],
        queryFn: () => fetchBookings(currentPage, pageSize, message),
        keepPreviousData: true,
    });

    return {
        data, isLoading, isError
    }
}

export const useBookingsMutation = (queryClient: QueryClient, message: any, setIsModalOpen: any, form: FormInstance<any>) => {
    console.log("MUTATION : ",form.getFieldsValue())
    return useMutation({
        mutationFn: createBooking,
        onSuccess: () => {
            queryClient.invalidateQueries(["bookings"]);
            message.success("Booking created successfully!");
            setIsModalOpen(false);
            form.resetFields();
        },
        onError: () => {
            message.error("Failed to create booking.");
        },
    });
}