"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Descriptions, Spin, Typography, Alert, Row, Col, Button, Select } from "antd";
import api from "@/services/apis/api";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const { Title, Text } = Typography;

const fetchBookingById = async (id: string) => {
  try {
    const response = await api.get(`/booking/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("Booking not found.");
    }
    throw new Error("Failed to fetch booking.");
  }
};


const deleteBookingById = async (id: string, router: AppRouterInstance) => {
  try {
    const response = await api.delete(`/booking/${id}`)
    router.replace(`/dashboard/bookings`)
  } catch (error) {
    console.log(error)
  }
}

const updateBookingById = async (id: string, status: string) => {
  try {
    const response = await api.patch(`/booking/${id}`, {
      status
    })

  } catch (error) {
    console.log(error)

  }
}
export default function BookingDetailsPage() {
  const { id }: { id: string } = useParams(); // Get ID from URL
  const router = useRouter()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id as string),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Loading state
  if (isLoading) return <Spin size="large" className="flex justify-center my-10" />;

  // Error state
  if (isError || !data) {
    return (
      <Alert
        message="Error"
        description={error?.message || "Failed to load booking details."}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card>
      <Row justify={"space-between"}>
        <Col span={8}><Title level={2}>Booking Details</Title></Col>
        <Col span={8} >
          <Button color="danger" onClick={() => deleteBookingById(id!, router)} variant="solid">
            Delete
          </Button>
          <Select onChange={(e) => updateBookingById(id!, e)} style={{ margin: "0 4px" }} defaultValue={data.status}>
            <Select.Option value="pending">
              Pending
            </Select.Option>
            <Select.Option value="contacted">
              Contacted
            </Select.Option>
            <Select.Option value="declinded">
              Declinded
            </Select.Option>
            <Select.Option value="confirmed">
              Confirmed
            </Select.Option>
          </Select>
        </Col>
      </Row>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{data.personalInfo?.name || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Email">{data.personalInfo?.email || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Phone">{data.personalInfo?.phone || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Address">{data.personalInfo?.address || "N/A"}</Descriptions.Item>

        <Descriptions.Item label="Appointment Date">
          {data.appointment?.date ? new Date(data.appointment.date).toLocaleDateString() : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Appointment Time">{data.appointment?.time || "N/A"}</Descriptions.Item>

        <Descriptions.Item label="Subtotal">Rs {data.summary?.subtotal || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="GST">Rs {data.summary?.gst || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Total">Rs {data.summary?.total || "N/A"}</Descriptions.Item>

        {/*         <Descriptions.Item label="ID Proof (Front)">{data.personalInfo?.idproof?.idCardfront || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="ID Proof (Back)">{data.personalInfo?.idproof?.idCardback || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Passport">{data.personalInfo?.idproof?.passport || "N/A"}</Descriptions.Item>
      */}
       </Descriptions>
    </Card>
  );
}
