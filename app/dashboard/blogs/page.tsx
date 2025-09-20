"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, message, Upload, Spin, Card, Row, Col, Statistic, Radio, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";

import axios from "axios";
import Link from "next/link";
import SlateEditor from "@/components/ui/SlateEditor";

interface BlogData {
  title: string;
  subtitle?: string;
  about?: string;
  description?: string;
  img?: string;
  isGlobal?: boolean;
  location?: string;
}

const fetchBlogs = async () => {
  const { data } = await axios.get("http://localhost:3000/blogs");
  return data;
};

const createBlog = async (blogData: BlogData) => {
  const { data } = await axios.post("http://localhost:3000/blogs", blogData);
  return data;
};

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axios.post("http://localhost:3000/utils/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.secure_url;
};

export default function BlogsPage() {
  const queryClient = useQueryClient();
  const { data: blogs, isLoading } = useQuery({ queryKey: ["blogs"], queryFn: fetchBlogs });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<BlogData>();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Filter blogs based on location filter
  const filteredBlogs = blogs?.filter((blog: any) => {
    if (locationFilter === "all") return true;
    if (locationFilter === "global") return !blog.location;
    return blog.location === locationFilter;
  }) || [];

  const mutation = useMutation({
    mutationFn: async (values: BlogData) => {
      if (file) {
        setUploading(true);
        const imageUrl = await uploadImage(file);
        setUploading(false);
        values.img = imageUrl;
      }
      return createBlog(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      message.success("Blog created successfully!");
      setIsModalOpen(false);
      form.resetFields();
      setFile(null);
      setFileList([]);
    },
    onError: () => {
      message.error("Failed to create blog");
      setUploading(false);
    },
  });

  const handleCreate = (values: BlogData) => {
    mutation.mutate(values);
  };

  const beforeUpload = (file: File) => {
    setFile(file);
    setFileList([{ uid: Date.now().toString(), name: file.name, status: "done" }]);
    return false;
  };

  return (
    <div style={{ padding: 20, display:"flex", flexDirection : "column", gap : 12 }}>

      <Card>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic title="Total Blogs" value={blogs?.length || 0} />
          </Col>
          <Col span={8}>
            <Statistic title="Global Blogs" value={blogs?.filter((b: any) => !b.location).length || 0} />
          </Col>
          <Col span={8}>
            <Statistic title="Location Specific" value={blogs?.filter((b: any) => b.location).length || 0} />
          </Col>
        </Row>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Create Blog
        </Button>
        
        <Select
          value={locationFilter}
          onChange={setLocationFilter}
          style={{ width: 200 }}
          placeholder="Filter by location"
        >
          <Select.Option value="all">All Blogs</Select.Option>
          <Select.Option value="global">Global Only</Select.Option>
          <Select.Option value="islamabad">Islamabad Only</Select.Option>
          <Select.Option value="mirpur">Mirpur Only</Select.Option>
        </Select>
      </div>

      <Table
        dataSource={filteredBlogs}
        loading={isLoading}
        rowKey="_id"
        columns={[
          { title: "Title", dataIndex: "title", key: "title" },
          { title: "About", dataIndex: "about", key: "about" },
          { title: "Type", key: "type", render: (_, record: any) => (
            record.location ? `${record.location.charAt(0).toUpperCase() + record.location.slice(1)} Specific` : "Global"
          )},
          { title: "Edited/Created", dataIndex: "updatedAt", key: "updatedAt" },
          { title: "Action", dataIndex: "_id", key: "_id", render: (_id) => <Link href={`/dashboard/blogs/${_id}`}>More Details</Link> },
        ]}
      />

      <Modal
        title="Create Blog"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={mutation.isPending}
      >

        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="Subtitle">
            <Input />
          </Form.Item>
          <Form.Item name="about" label="About">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" >
          <Input.TextArea />
          </Form.Item>
          <Form.Item name="isGlobal" label="Blog Type" initialValue={true}>
            <Radio.Group>
              <Radio value={true}>Global (Show on all locations)</Radio>
              <Radio value={false}>Location Specific</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item 
            name="location" 
            label="Location" 
            dependencies={['isGlobal']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('isGlobal') === false && !value) {
                    return Promise.reject(new Error('Please select a location for location-specific blogs'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select 
              placeholder="Select location" 
              disabled={form.getFieldValue('isGlobal') === true}
            >
              <Select.Option value="islamabad">Islamabad</Select.Option>
              <Select.Option value="mirpur">Mirpur</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Upload Image">
            <Upload beforeUpload={beforeUpload} fileList={fileList} showUploadList={{ showRemoveIcon: false }}>
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
            {uploading && <Spin style={{ marginLeft: 10 }} />}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
