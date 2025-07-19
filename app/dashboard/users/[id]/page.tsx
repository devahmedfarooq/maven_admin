"use client";

import { useState, useEffect } from "react"
import { Card, Descriptions, Button, Space, Avatar, Upload, Spin, Alert, Select, DatePicker, Input } from "antd"
import { UploadOutlined, EditOutlined, SaveOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons"
import { useUser, useUpdateUser, useDeleteUser } from "@/services/apis/user"
import { useParams, useRouter } from "next/navigation"
import { message } from "antd"
import api from "@/services/apis/api"
import dayjs from "dayjs"
import { User, UserFormData } from "@/types/user.types"
import { UploadChangeParam } from "@/types/api.types"

export default function UserPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<UserFormData>({
        name: "",
        email: "",
        phone: "",
        role: "user",
        gender: "male",
        dateOfBirth: "",
        address: "",
        image: "",
    })

    const { data: user, isPending, isError } = useUser(id)
    const updateUserMutation = useUpdateUser()
    const deleteUserMutation = useDeleteUser()

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                role: user.role || "user",
                gender: user.gender || "male",
                dateOfBirth: user.dateOfBirth || "",
                address: user.address || "",
                image: user.image || "",
            })
        }
    }, [user])

    const handleEdit = () => setIsEditing(true);

    const handleSave = async () => {
        try {
            setLoading(true)
            await updateUserMutation.mutateAsync({ id, data: formData })
            message.success("User updated successfully!")
            setIsEditing(false)
        } catch (error) {
            console.error("Error updating user:", error)
            message.error("Failed to update user")
        } finally {
            setLoading(false)
        }
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this user?")) {
            deleteUserMutation.mutateAsync(id).then(() => {
                message.success("User deleted successfully!")
                router.push("/dashboard/users")
            }).catch((error) => {
                console.error("Error deleting user:", error)
                message.error("Failed to delete user")
            })
        }
    };

    const handleInputChange = (key: keyof UserFormData, value: string) => {
        setFormData((prev: UserFormData) => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (file: File, setFormData: (updater: (prev: UserFormData) => UserFormData) => void) => {
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
                setFormData((prev: UserFormData) => ({ ...prev, image: response.data.secure_url }));
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

    if (isPending)
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
                                    onChange={(date) => handleInputChange("dateOfBirth", date?.toISOString() || "")}
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
                            {user?.otp?.verified ? "✅ Yes" : "❌ No"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Created At">
                            {new Date(user?.createdAt || "").toLocaleString()}
                        </Descriptions.Item>

                        <Descriptions.Item label="Updated At">
                            {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}
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
                                    loading={loading}
                                >
                                    Save
                                </Button>
                                <Button onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleEdit}
                                >
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
    )
}
