"use client"
import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Card, Space, message, DatePicker, Tooltip, Spin, Upload, Alert } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, LinkOutlined, LoadingOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from "@/services/apis/api";
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface AdsImage {
    _id: string;
    imgSrc: string;
    title: string;
    clicked?: number;
    viewed?: number;
    href: string;
    campinStart?: Date;
    active? : boolean
}

interface CreateAdsDto {
    ads: AdsImage[];
    clicked?: number;
    viewed?: number;
}

interface UpdateAdsImageDto extends Partial<AdsImage> {}

interface UpdateAdsDto {
    ads?: UpdateAdsImageDto[];
    clicked?: number;
    viewed?: number;
    active? : boolean
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface GetAdsDto {
    page?: number;
    limit?: number;
    title?: string;
    startDate?: Date;
    endDate?: Date;
    minClicks?: number;
    minViews?: number;
    active? : boolean
}

const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.addEventListener('error', (error) => reject(error));
        reader.readAsDataURL(file);
    });

const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
        return false;
    }
    return true;
};

const AdsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<AdsImage | null>(null);
    const [form] = Form.useForm();
    const [filterForm] = Form.useForm();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const router = useRouter();
    const [pagination, setPagination] = useState<{
        current: number;
        pageSize: number;
        total?: number;
    }>({
        current: 1,
        pageSize: 10
    });
    const [filters, setFilters] = useState<GetAdsDto>({});

    // Fetch Ads Query with filters
    const { data: adsResponse, isLoading, isError, error: queryError } = useQuery({
        queryKey: ['ads', pagination.current, pagination.pageSize, filters],
        queryFn: async () => {
            try {
                // Convert pagination to backend format
                const params: Record<string, any> = {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    title: filters.title || undefined,
                    startDate: filters.startDate?.toISOString() || undefined,
                    endDate: filters.endDate?.toISOString() || undefined,
                    minClicks: filters.minClicks || undefined,
                    minViews: filters.minViews || undefined,
                    activeOnly: false
                };

                // Remove undefined values
                Object.keys(params).forEach(key => {
                    if (params[key] === undefined) {
                        delete params[key];
                    }
                });

                const { data } = await axios.get("/admin/ads/admin", { params });
                
                // Flatten the nested ads structure for the table
                const flattenedData = data.data.flatMap((adDoc: any) => 
                    adDoc.ads.map((ad: any, index: number) => ({
                        _id: adDoc._id,
                        imgSrc: ad.imgSrc,
                        title: ad.title,
                        href: ad.href,
                        campinStart: ad.campinStart,
                        active: ad.active,
                        clicked: ad.clicked || 0,
                        viewed: ad.viewed || 0,
                        imageIndex: index
                    }))
                );

                return {
                    data: flattenedData,
                    pagination: data.pagination
                };
            } catch (error: any) {
                // Don't show error message for "No ads found"
                if (error.response?.status !== 404) {
                    messageApi.error('Failed to fetch ads');
                }
                throw error;
            }
        }
    });

    // Update pagination when response changes
    useEffect(() => {
        if (adsResponse?.pagination) {
            setPagination(prev => ({
                ...prev,
                total: adsResponse.pagination.total
            }));
        }
    }, [adsResponse]);

    const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
        setPagination({
            current: newPagination.current,
            pageSize: newPagination.pageSize,
            total: pagination.total
        });
    };

    const handleFilterSubmit = (values: any) => {
        const newFilters: GetAdsDto = {};
        
        if (values.title?.trim()) {
            newFilters.title = values.title.trim();
        }
        
        if (values.dateRange?.length === 2) {
            newFilters.startDate = values.dateRange[0].toDate();
            newFilters.endDate = values.dateRange[1].toDate();
        }
        
        if (values.minClicks !== undefined && values.minClicks !== null && values.minClicks !== '') {
            newFilters.minClicks = Number(values.minClicks);
        }
        
        if (values.minViews !== undefined && values.minViews !== null && values.minViews !== '') {
            newFilters.minViews = Number(values.minViews);
        }

        setFilters(newFilters);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
    };

    const resetFilters = () => {
        filterForm.resetFields();
        setFilters({});
        setPagination({
            current: 1,
            pageSize: 10,
            total: undefined
        });
    };

    // Upload image mutation
    const uploadImageMutation = useMutation({
        mutationFn: async (file: File) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const { data } = await axios.post('/utils/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return data.url;
            } catch (error) {
                messageApi.error('Failed to upload image');
                throw error;
            }
        }
    });

    // Add Ad Mutation
    const addAdMutation = useMutation({
        mutationFn: async (values: AdsImage) => {
            try {
                const dto: CreateAdsDto = {
                    ads: [values],
                    clicked: 0,
                    viewed: 0
                };
                return await axios.post("/admin/ads", dto);
            } catch (error) {
                messageApi.error('Failed to create ad');
                throw error;
            }
        },
        onSuccess: () => {
            messageApi.success('Ad created successfully');
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            handleModalClose();
        }
    });

    // Update Ad Mutation
    const updateAdMutation = useMutation({
        mutationFn: async (values: UpdateAdsImageDto) => {
            try {
                const dto: UpdateAdsDto = {
                    ads: [values]
                };
                return await axios.patch("/admin/ads", dto);
            } catch (error) {
                messageApi.error('Failed to update ad');
                throw error;
            }
        },
        onSuccess: () => {
            messageApi.success('Ad updated successfully');
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            handleModalClose();
        }
    });

    // Delete Ad Mutation
    const deleteAdMutation = useMutation({
        mutationFn: async (adId: string) => {
            return await axios.delete(`/admin/ads/${adId}`);
        },
        onSuccess: () => {
            messageApi.success('Ad deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['ads'] });
        },
        onError: (error) => {
            console.error('Delete error:', error);
            messageApi.error('Failed to delete ad');
        }
    });

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingAd(null);
        form.resetFields();
        setFileList([]);
    };

    useEffect(() => {
        if (editingAd && isModalOpen) {
            // Set up file list for the Upload component when editing
            if (editingAd.imgSrc) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'image.png',
                        status: 'done',
                        url: editingAd.imgSrc,
                    },
                ]);
            }
            
            // Set form values
            form.setFieldsValue({
                ...editingAd,
                campinStart: editingAd.campinStart ? dayjs(editingAd.campinStart) : undefined,
            });
        }
    }, [editingAd, isModalOpen, form]);

    const handleSubmit = async (values: any) => {
        try {
            setSubmitLoading(true);
            const finalValues = { ...values };

            // Handle image uploads
            if (fileList.length > 0) {
                // Only use the first image
                const file = fileList[0];
                if (file.originFileObj) {
                    finalValues.imgSrc = await uploadImageMutation.mutateAsync(file.originFileObj);
                } else {
                    finalValues.imgSrc = file.url; // For existing image
                }
            } else if (editingAd) {
                finalValues.imgSrc = editingAd.imgSrc;
            } else {
                messageApi.error('Please upload an image');
                setSubmitLoading(false);
                return;
            }

            // Convert date to ISO string
            if (finalValues.campinStart) {
                finalValues.campinStart = finalValues.campinStart.toISOString();
            }

            if (editingAd) {
                await updateAdMutation.mutateAsync(finalValues);
            } else {
                await addAdMutation.mutateAsync(finalValues);
            }
        } catch (error) {
            console.error('Error processing form:', error);
            messageApi.error('Failed to save advertisement');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const uploadButton = (
        <div>
            {uploading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    const handleDelete = async (adId: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this ad?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete',
            okButtonProps: {
                danger: true,
                loading: deleteAdMutation.status === 'pending'
            },
            cancelText: 'No, cancel',
            onOk: async () => {
                try {
                    setDeletingId(adId);
                    await deleteAdMutation.mutateAsync(adId);
                } catch (error) {
                    // Error is handled by the mutation
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const columns = [
        {
            title: "Image",
            dataIndex: "imgSrc",
            key: "imgSrc",
            width: 200,
            render: (src: string) => {
                if (!src) {
                    return <PictureOutlined style={{ fontSize: 24, color: '#ccc' }} />;
                }
                return (
                    <Tooltip title="Advertisement Image">
                        <img 
                            src={src} 
                            alt="Advertisement" 
                            style={{ 
                                width: 60, 
                                height: 60, 
                                objectFit: 'cover', 
                                borderRadius: 4 
                            }} 
                        />
                    </Tooltip>
                );
            }
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text: string) => (
                <Tooltip title={text}>
                    <div className="truncate max-w-[200px]">{text || '-'}</div>
                </Tooltip>
            )
        },
        {
            title: "Campaign Start",
            dataIndex: "campinStart",
            key: "campinStart",
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
        },
        {
            title: "Performance",
            key: "performance",
            render: (_: any, record: AdsImage) => (
                <Space>
                    <Tooltip title="Views">
                        <span><EyeOutlined /> {record.viewed || 0}</span>
                    </Tooltip>
                    <Tooltip title="Clicks">
                        <span><LinkOutlined /> {record.clicked || 0}</span>
                    </Tooltip>
                </Space>
            )
        },
        {
            title : "Status",
            key : "active",
            dataIndex : "active",
            render : (_: any, record: AdsImage) => record.active ? "Active" : "In-active"
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: AdsImage) => (
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => router.push(`/dashboard/ads/${record._id}`)}
                    />
                    <Button 
                        icon={<DeleteOutlined />} 
                        danger
                        loading={deleteAdMutation.status === 'pending' && deletingId === record._id}
                        onClick={() => handleDelete(record._id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            {contextHolder}
            
            {isError && (queryError as any)?.response?.status !== 404 && (
                <Alert
                    message="Error"
                    description="Failed to load advertisements. Please try again later."
                    type="error"
                    showIcon
                    className="mb-4"
                />
            )}

            <Card
                title="Advertisements Management"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingAd(null);
                            form.resetFields();
                            setFileList([]);
                            setIsModalOpen(true);
                        }}
                    >
                        Create Ad
                    </Button>
                }
            >
                <Form
                    form={filterForm}
                    layout="vertical"
                    className="mb-4"
                    onFinish={handleFilterSubmit}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Form.Item name="title" label="Title">
                            <Input placeholder="Search by title" allowClear />
                        </Form.Item>
                        <Form.Item name="dateRange" label="Campaign Date Range">
                            <DatePicker.RangePicker 
                                className="w-full" 
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item name="minClicks" label="Min Clicks">
                            <Input type="number" min={0} allowClear />
                        </Form.Item>
                        <Form.Item name="minViews" label="Min Views">
                            <Input type="number" min={0} allowClear />
                        </Form.Item>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={resetFilters}>Reset</Button>
                        <Button type="primary" htmlType="submit">
                            Filter
                        </Button>
                    </div>
                </Form>

                <Table
                    dataSource={adsResponse?.data || []}
                    columns={columns}
                    loading={isLoading}
                    rowKey="_id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: adsResponse?.pagination?.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                    }}
                    onChange={handleTableChange}
                    locale={{
                        emptyText: isError && (queryError as any)?.response?.status === 404 ? (
                            <div className="py-8 text-center">
                                <PictureOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                                <div className="text-gray-500 mb-4">No advertisements found</div>
                                {Object.keys(filters).length > 0 && (
                                    <div>
                                        <div className="text-gray-400 text-sm mb-2">Try adjusting your filters</div>
                                        <Button type="primary" onClick={resetFilters}>
                                            Clear all filters
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <div className="text-gray-500">No data</div>
                            </div>
                        )
                    }}
                />
            </Card>

            <Modal
                title={editingAd ? "Edit Advertisement" : "Create New Advertisement"}
                open={isModalOpen}
                onCancel={handleModalClose}
                onOk={() => form.submit()}
                confirmLoading={submitLoading}
                maskClosable={false}
            >
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    initialValues={editingAd || {}}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please input the title!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="imgSrc"
                        label="Advertisement Image"
                        rules={[{ required: true, message: 'Please upload an image!' }]}
                        valuePropName="fileList"
                        getValueFromEvent={e => e.fileList}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleChange}
                            beforeUpload={beforeUpload}
                            customRequest={({ onSuccess }) => onSuccess?.('ok')}
                            maxCount={1}
                        >
                            {fileList.length >= 1 ? null : uploadButton}
                        </Upload>
                    </Form.Item>
                    <div className="text-gray-500 text-sm mb-4">
                        Image must be less than 2MB and in JPG/PNG format.
                    </div>
                    <Form.Item
                        name="href"
                        label="Link URL"
                        rules={[
                            { required: true, message: 'Please input the link URL!' },
                            { type: 'url', message: 'Please enter a valid URL!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="campinStart"
                        label="Campaign Start Date"
                        rules={[{ required: true, message: 'Please select a start date!' }]}
                    >
                        <DatePicker 
                            className="w-full"  
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdsPage;