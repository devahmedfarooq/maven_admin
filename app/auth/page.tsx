'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, Card, message, Spin } from 'antd';
import { useMutation } from '@tanstack/react-query';
import axios from '@/services/apis/api';

const { Title } = Typography;

const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: (values: { email: string; password: string }) => axios.post('/auth/login', values),
        onSuccess: (response) => {
            const data = response.data.token;
            if (data) {
                console.log("token", data.token)
                localStorage.setItem('authToken', data.token);
                message.success(response.data.message || 'Login successful!');
                setLoading(true);
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                message.error('No token received');
            }
        },
        onError: (error) => {
            if (error.response?.status === 404) {
                message.error('Endpoint not found (404)');
            } else {
                message.error(error.response?.data?.message || 'Something went wrong');
            }
        },
    });

    const onFinish = async (values: { email: string; password: string }) => {
        loginMutation.mutate(values);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            {loading ? (
                <Spin size="large" />
            ) : (
                <Card className="w-96 shadow-lg p-6">
                    <Title level={3} className="text-center">
                        MAVEN APP ADMIN PANEL - Login
                    </Title>
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                            <Input placeholder="Enter your email" />
                        </Form.Item>
                        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                            <Input.Password placeholder="Enter your password" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loginMutation.isLoading} block>
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default AuthPage;