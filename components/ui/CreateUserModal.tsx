import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useMutation } from "@tanstack/react-query";
import axios from "@/services/apis/api";

interface CreateUserModalProps {
    visible: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

interface FormValues {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export default function CreateUserModal({ visible, onClose, onUserCreated }: CreateUserModalProps) {
    const [form] = Form.useForm<FormValues>();

    const { mutate, isLoading } = useMutation({
        mutationFn: async (values: FormValues) => {
            return axios.post("/auth/register", values)
        },
        mutationKey: ['New User'],
        onSuccess: () => {
            message.success("User created successfully");
            form.resetFields();
            onUserCreated();
            onClose();
        },
        onError: (error) => {
            message.error(error.response?.data?.message || "Failed to create user");
        }
    }
    );

    const handleSubmit = () => {
        form.validateFields()
            .then((values) => {
                mutate(values);
            })
            .catch(() => message.error("Please fix validation errors"));
    };

    return (
        <Modal
            title="Create User"
            open={visible}
            onCancel={onClose}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: "Name is required" }]}
                >
                    <Input placeholder="Enter name" />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, type: "email", message: "Valid email required" }]}
                >
                    <Input placeholder="Enter email" />
                </Form.Item>
                <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: "Phone number is required" }]}
                >
                    <Input placeholder="Enter phone number" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: "Password is required" }]}
                >
                    <Input.Password placeholder="Enter password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading}>
                        Create User
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
