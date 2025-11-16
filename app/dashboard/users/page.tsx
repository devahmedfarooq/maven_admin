"use client";

import { useUsers } from "@/services/apis/user";
import { Card, Space, Table, Pagination, Spin, Alert, Button } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import CreateUserModal from "@/components/ui/CreateUserModal";

export default function Page() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { data, isError, isPending, refetch } = useUsers(page, pageSize);

    // Manually refetch when page or pageSize changes
    useEffect(() => {
        refetch();
    }, [page, pageSize]);

    const dataSource = data?.data?.map(user => ({
        key: user._id,
        name: user.name,
        email: user.email,
        image: user.image
    })) || [];

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Profile Image",
            dataIndex: "image",
            key: "image",
            render: (image: string | undefined, record: { name: string }) =>
                image ? (
                    <img className="w-10 h-10 rounded-full border border-gray-300 shadow-sm" src={image} alt={record.name} />
                ) : (
                    <span className="text-gray-400">No Image</span>
                ),
        },
        {
            title: "Details",
            render: ({ key }: { key: string }) => <Link href={`/dashboard/users/${key}`} className="text-blue-500 hover:underline">More Details</Link>,
        },
    ];

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <Space direction="vertical" className="w-full" size="large">
                {/* Stats Cards & Create User Button */}
                <Space size="middle" className="w-full flex flex-wrap justify-start">
                    <Card title="Total Users" className="w-48 text-center">
                        <span className="text-xl font-bold">{data?.pagination?.total || 0}</span>
                    </Card>
                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                        Create User
                    </Button>
                </Space>

                {/* Error Handling */}
                {isError && <Alert message="Error loading users" type="error" showIcon />}

                {/* Table with Loading State */}
                <Spin spinning={isPending}>
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        bordered
                        className="shadow-md rounded-lg overflow-hidden"
                    />
                </Spin>

                {/* Pagination Controls */}
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={data?.pagination?.total || 0}
                    onChange={(newPage, newPageSize) => {
                        setPage(newPage);
                        setPageSize(newPageSize || 10);
                    }}
                    showSizeChanger
                    pageSizeOptions={["2", "5", "10", "20", "50"]}
                    className="flex justify-center mt-4"
                />

                {/* Create User Modal */}
                <CreateUserModal
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    onUserCreated={refetch}
                />
            </Space>
        </div>
    );
}
