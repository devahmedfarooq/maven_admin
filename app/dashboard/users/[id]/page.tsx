"use client";

import { useUser, useUpdateUser, useDeleteUser } from "@/services/apis/user";
import { useParams,useRouter } from "next/navigation";
import { Card, Avatar, Descriptions, Spin, Alert, Space, Button, Input, Upload, message, Modal, DatePicker, Select } from "antd";
import '@ant-design/v5-patch-for-react-19';
import { useEffect, useState } from "react";
import { UploadOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "@/services/apis/api";


export default function UserPage() {
    const params = useParams();
    const id = params?.id?.toString(); // Convert to string safely
    const { data: user, isError, isPending, refetch } = useUser(id as string);
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();
    const router = useRouter(); 
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user || {});

    useEffect(() => {
        if (id) refetch(); // Refetch data when user ID changes
    }, [id, refetch]);

    useEffect(() => {
        if (user) setFormData(user);
    }, [user]);

    const handleEdit = () => setIsEditing(true);

    const handleSave = async () => {
        updateUserMutation.mutate(
            { id, data: formData },
            {
                onSuccess: () => {
                    message.success("User details updated successfully!");
                    setIsEditing(false);
                    refetch();
                },
                onError: () => {
                    message.error("Failed to update user details");
                },
            }
        );
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Are you sure you want to delete this user?",
            content: "This action cannot be undone!",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: () => {
                deleteUserMutation.mutate(id, {
                    onSuccess: () => {
                        message.success("User deleted successfully");
                        // Redirect or handle UI after deletion
                        router.push("/dashboard/users"); // Redirect after success
                    },
                    onError: () => {
                        message.error("Failed to delete user");
                    },
                });
            },
        });
    };

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (file: File, setFormData: Function) => {
        try {
            setLoading(true)
            const formData = new FormData();
            formData.append("file", file);

            // Upload image to backend API
            const response = await api.post("/utils/image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data?.secure_url) {
                message.success("Image uploaded successfully");

                // Update the formData state with the new image URL
                setFormData((prev: any) => ({ ...prev, image: response.data.secure_url }));
            } else {
                message.error("Failed to upload image");
            }
            setLoading(false)
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Image upload failed. Please try again.");
        }
    };

    const handleUploadChange = (info: any) => {
        const file = info.file; // Get the actual file
        if (file) {
            handleImageUpload(file, setFormData);
        }
    };
    if (!id) return <Alert message="User ID not provided in URL" type="warning" showIcon />;

    if (isPending )
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large" />
            </div>
        );

    if (isError) return <Alert message="Failed to load user data" type="error" showIcon />;

    return (
        <div className="p-6 bg-gray-50 min-h-screen flex justify-center">
            <Card className="w-full max-w-2xl shadow-md rounded-lg p-6 bg-white">
                <Space direction="vertical" size="large" className="w-full">
                    {/* Profile Image with Upload */}
                    <div className="flex justify-center">
                        <Avatar size={100} src={formData?.image} />
                    </div>

                    {isEditing && !loading && (
                        <div className="flex justify-center">
                            <Upload showUploadList={false} beforeUpload={() => false} onChange={handleUploadChange}>
                                <Button icon={<UploadOutlined />}>Upload New Image</Button>
                            </Upload>
                        </div>
                    )}

                    {
                        isEditing && loading && (
                            <div className="flex justify-center">
                                <Spin size="large" />
                            </div>
                        )
                    }

                    {/* User Details */}
                    <Descriptions title="User Details" bordered column={1} size="middle">
                        {/* {["name", "email", "phone", "role", "gender", "dateOfBirth", "address"].map((field) => (
                            <Descriptions.Item label={field.charAt(0).toUpperCase() + field.slice(1)} key={field}>
                                {isEditing ? (
                                    <Input
                                        value={formData[field] || ""}
                                        onChange={(e) => handleInputChange(field, e.target.value)}
                                    />
                                ) : (
                                    formData[field] || "N/A"
                                )}
                            </Descriptions.Item>
                        ))} */}

                        <Descriptions.Item label="Name">
                            {isEditing ? (
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                />
                            ) : (
                                formData.name || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Email">
                            {isEditing ? (
                                <Input
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                />
                            ) : (
                                formData.email || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Phone">
                            {isEditing ? (
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                />
                            ) : (
                                formData.phone || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Role">
                            {isEditing ? (
                                <Select
                                    value={formData.role}
                                    onChange={(value) => handleInputChange("role", value)}
                                    style={{ width: "100%" }}
                                    options={[
                                        { value: "user", label: "User" },
                                        { value: "admin", label: "Admin" },
                                    ]}
                                />
                            ) : (
                                formData.role || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Gender">
                            {isEditing ? (
                                <Select
                                    value={formData.gender}
                                    onChange={(value) => handleInputChange("gender", value)}
                                    style={{ width: "100%" }}
                                    options={[
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                        { value: "other", label: "Other" },
                                    ]}
                                />
                            ) : (
                                formData.gender || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Date of Birth">
                            {isEditing ? (
                                <DatePicker
                                    value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                                    onChange={(date) => handleInputChange("dateOfBirth", date?.toISOString() || null)}
                                    format="YYYY-MM-DD"
                                    style={{ width: "100%" }}
                                />
                            ) : (
                                formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Address">
                            {isEditing ? (
                                <Input
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                />
                            ) : (
                                formData.address || "N/A"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="OTP Verified">
                            {formData?.otp?.verified ? "✅ Yes" : "❌ No"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Created At">
                            {new Date(formData?.createdAt).toLocaleString()}
                        </Descriptions.Item>

                        <Descriptions.Item label="Updated At">
                            {formData?.updatedAt ? new Date(formData.updatedAt).toLocaleString() : "N/A"}
                        </Descriptions.Item>
                    </Descriptions>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        {isEditing ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    loading={updateUserMutation.isPending || loading}
                                >
                                    Save
                                </Button>
                                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                            </>
                        ) : (
                            <>
                                <Button icon={<EditOutlined />} onClick={handleEdit}>
                                    Edit
                                </Button>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDelete}
                                    loading={deleteUserMutation.isPending}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </Space>
            </Card>
        </div>
    );
}
