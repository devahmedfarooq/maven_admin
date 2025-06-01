"use client"
import { useEffect, useState } from "react";
import { Form, Input, Card, Space, message, DatePicker, Upload, Alert, Button, Skeleton, Switch } from "antd";
import { PlusOutlined, LoadingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from "@/services/apis/api";
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';
import { useRouter, useParams } from 'next/navigation';

interface AdsImage {
    imgSrc: string;
    title: string;
    clicked?: number;
    viewed?: number;
    href: string;
    campinStart?: Date;
    active?: boolean;
}

interface UpdateAdsImageDto extends Partial<AdsImage> {}

interface UpdateAdsDto {
    ads?: UpdateAdsImageDto[];
    clicked?: number;
    viewed?: number;
}

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

const EditAdPage = () => {
    const params = useParams();
    const id = params.id as string;
    const [form] = Form.useForm();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Fetch Ad Query
    const { data: ad, isLoading, isError, error } = useQuery({
        queryKey: ['ad', id],
        queryFn: async () => {
            try {
                const { data } = await axios.get(`/admin/ads/${id}`);
                return {
                    ...data,
                    imgSrc: data.ads?.[0]?.imgSrc || '',
                    title: data.ads?.[0]?.title || '',
                    href: data.ads?.[0]?.href || '',
                    campinStart: data.ads?.[0]?.campinStart || null,
                    clicked: data.clicked || 0,
                    viewed: data.viewed || 0,
                    active: data.ads?.[0]?.active || false,
                };
            } catch (error) {
                throw error;
            }
        },
        enabled: !!id
    });

    // Show error message when query fails
    useEffect(() => {
        if (isError) {
            messageApi.error('Failed to fetch ad');
        }
    }, [isError, messageApi]);

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
                throw error;
            }
        },
        onError: () => {
            messageApi.error('Failed to upload image');
        }
    });

    // Update Ad Mutation
    const updateAdMutation = useMutation({
        mutationFn: async (values: UpdateAdsImageDto) => {
            try {
                // Structure the DTO according to backend expectations
                const dto: UpdateAdsDto = {
                    ads: [{
                        imgSrc: values.imgSrc,
                        title: values.title,
                        href: values.href,
                        campinStart: values.campinStart 
                            ? (values.campinStart instanceof Date 
                                ? values.campinStart 
                                : new Date(values.campinStart))
                            : undefined,
                        active: values.active,
                    }],
                    clicked: values.clicked,
                    viewed: values.viewed
                };

                return await axios.patch(`/admin/ads/${id}`, dto);
            } catch (error) {
                throw error;
            }
        },
        onSuccess: () => {
            messageApi.success('Ad updated successfully');
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            router.push('/dashboard/ads');
        },
        onError: (error) => {
            console.error('Update error:', error);
            messageApi.error('Failed to update ad');
        }
    });

    useEffect(() => {
        if (ad) {
            // Set up file list for the Upload component
            if (ad.imgSrc) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'image.png',
                        status: 'done',
                        url: ad.imgSrc,
                    },
                ]);
            }
            
            // Set form values
            form.setFieldsValue({
                ...ad,
                campinStart: ad.campinStart ? dayjs(ad.campinStart) : undefined,
                active: ad.active || false,
            });
        }
    }, [ad, form]);

    const handleSubmit = async (values: any) => {
        try {
            setSubmitLoading(true);
            const finalValues = { ...values };

            // Handle image uploads
            if (fileList.length > 0) {
                const file = fileList[0];
                if (file.originFileObj) {
                    finalValues.imgSrc = await uploadImageMutation.mutateAsync(file.originFileObj);
                } else {
                    finalValues.imgSrc = file.url;
                }
            } else {
                messageApi.error('Please upload an image');
                setSubmitLoading(false);
                return;
            }

            // Convert date to proper Date object
            if (finalValues.campinStart) {
                finalValues.campinStart = finalValues.campinStart.toDate();
            }

            // Ensure active is included
            finalValues.active = finalValues.active || false;

            await updateAdMutation.mutateAsync(finalValues);
        } catch (error) {
            console.error('Error processing form:', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton active />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <Alert
                    message="Error"
                    description="Failed to load advertisement. Please try again later."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            {contextHolder}
            
            <Card
                title={
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => router.push('/dashboard/ads')}
                        />
                        Edit Advertisement
                    </Space>
                }
            >
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    className="max-w-2xl"
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
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                            beforeUpload={beforeUpload}
                            customRequest={({ onSuccess }) => onSuccess?.('ok')}
                            maxCount={1}
                        >
                            {fileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

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

                    <Form.Item
                        name="active"
                        label="Active Status"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                loading={submitLoading}
                            >
                                Save Changes
                            </Button>
                            <Button onClick={() => router.push('/dashboard/ads')}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default EditAdPage;