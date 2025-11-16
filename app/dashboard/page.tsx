'use client'
import { useState } from "react";
import { Space, Card, Typography, Table, Spin, Row, Col, Statistic, Select, Alert, message, Button } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { BellOutlined, UserOutlined, AppstoreOutlined, ReadOutlined, ShoppingOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Notification {
    _id: string;
    type: string;
    message: string;
    createdAt: string;
}

interface AdsStats {
    totalAds: number;
    totalClicked: number;
    totalViewed: number;
}

interface UserStats {
    totalUsers: number;
    subscribedUsers: number;
    unsubscribedUsers: number;
}

interface DashboardStats {
    adsStats: AdsStats;
    userStats: UserStats;
    totalBookings: number;
    totalItems: number;
    notifications: Notification[];
    adsViews: Array<{ name: string; views: number; clicks: number }>;
    userGrowth: Array<{ name: string; users: number }>;
    subscriptionTrend: Array<{ name: string; subscribed: number; unsubscribed: number }>;
}

// Helper function to format relative time
const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// API configuration
const api = axios.create({
    baseURL:  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// API function
const fetchDashboardData = async () => {
    const { data } = await api.get('/admin/feed');
    return data;
};

// Helper function to transform data
const transformDashboardData = (data: any): DashboardStats => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const last4Months = Array.from({length: 4}, (_, i) => {
        const monthIndex = (currentMonth - (3 - i) + 12) % 12;
        return monthNames[monthIndex];
    });

    return {
        adsStats: data.adsStats,
        userStats: data.userStats,
        totalBookings: data.totalBookings,
        totalItems: data.totalItems,
        notifications: data.notifications.map((notif: { createdAt: string; [key: string]: any }) => ({
            ...notif,
            createdAt: getRelativeTime(new Date(notif.createdAt))
        })),
        adsViews: last4Months.map((month, index) => ({
            name: month,
            views: Math.round(data.adsStats.totalViewed * ((index + 1) / 4)),
            clicks: Math.round(data.adsStats.totalClicked * ((index + 1) / 4))
        })),
        userGrowth: last4Months.map((month, index) => ({
            name: month,
            users: Math.round(data.userStats.totalUsers * ((index + 1) / 4))
        })),
        subscriptionTrend: last4Months.map((month, index) => ({
            name: month,
            subscribed: Math.round(data.userStats.subscribedUsers * ((index + 1) / 4)),
            unsubscribed: Math.round(data.userStats.unsubscribedUsers * ((index + 1) / 4))
        }))
    };
};

export default function Page() {
    const [notificationFilter, setNotificationFilter] = useState("all");
    const [messageApi, contextHolder] = message.useMessage();

    const { 
        data: stats, 
        isLoading, 
        isError, 
        error, 
        refetch,
        isFetching 
    } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            try {
                const data = await fetchDashboardData();
                return transformDashboardData(data);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    messageApi.error(error.response?.data?.message || 'Failed to fetch dashboard data');
                }
                throw error;
            }
        },
        refetchInterval: 30000, // Refetch every 30 seconds
        initialData: {
            adsStats: { totalAds: 0, totalClicked: 0, totalViewed: 0 },
            userStats: { totalUsers: 0, subscribedUsers: 0, unsubscribedUsers: 0 },
            totalBookings: 0,
            totalItems: 0,
            notifications: [],
            adsViews: [],
            userGrowth: [],
            subscriptionTrend: [],
        }
    });

    // Filtered notifications
    const filteredNotifications = stats.notifications

    // Notification table columns
    const notificationColumns = [
        { title: 'Message', dataIndex: 'message', key: 'message' },
        { title: 'Time', dataIndex: 'createdAt', key: 'createdAt' },
    ];

    return (
        <main className="p-6">
            {contextHolder}
            {isError && (
                <Alert
                    message="Error"
                    description="Failed to load dashboard data. Please try again later."
                    type="error"
                    showIcon
                    action={
                        <Space>
                            <Button 
                                onClick={() => refetch()} 
                                icon={<ReloadOutlined />}
                                loading={isFetching}
                            >
                                Retry
                            </Button>
                        </Space>
                    }
                    className="mb-6"
                />
            )}
            
            {isLoading ? (
                <div className="flex justify-center items-center h-screen">
                    <Spin size="large" tip="Loading dashboard data..." />
                </div>
            ) : (
                <Space direction="vertical" size={24} className="flex w-full">
                    <div className="relative">
                        {isFetching && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                <Spin />
                            </div>
                        )}
                        
                        {/* Overview Stats */}
                        <Row gutter={[16, 16]} className="mb-6">
                            <Col span={6}>
                                <Card>
                                    <Statistic title="Total Users" value={stats.userStats.totalUsers} prefix={<UserOutlined />} />
                                </Card>
                            </Col>

                            <Col span={6}>
                                <Card>
                                    <Statistic title="Total Ads" value={stats.adsStats.totalAds} prefix={<AppstoreOutlined />} />
                                </Card>
                            </Col>

                            <Col span={6}>
                                <Card>
                                    <Statistic title="Total Items" value={stats.totalItems} prefix={<ShoppingOutlined />} />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic title="Total Bookings" value={stats.totalBookings} prefix={<CalendarOutlined />} />
                                </Card>
                            </Col>
                        </Row>
                        {/* Charts Section */}
                        <Row gutter={[16, 16]} className="mb-6">
                            <Col span={12}>
                                <Card title="Ads Performance (Views & Clicks)">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={stats.adsViews}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="views" fill="#8884d8" name="Views" />
                                            <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="User Growth">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={stats.userGrowth}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="users" stroke="#8884d8" name="Users" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                      
                        {/* Notifications */}
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card 
                                    title={<><BellOutlined /> Notifications</>} 
                                   /*  extra={
                                        <Select
                                            defaultValue="all"
                                            style={{ width: 150 }}
                                            onChange={(value) => setNotificationFilter(value)}
                                            options={[
                                                { value: "all", label: "All" },
                                                { value: "Ad", label: "Ads" },
                                                { value: "Booking", label: "Bookings" },
                                                { value: "User", label: "Users" },
                                                { value: "Item", label: "Items" },
                                            ]}
                                        />
                                    } */
                                >
                                    <Table 
                                        dataSource={filteredNotifications}
                                        columns={notificationColumns}
                                        pagination={{ pageSize: 5 }}
                                        rowKey="_id"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Space>
            )}
        </main>
    );
}
