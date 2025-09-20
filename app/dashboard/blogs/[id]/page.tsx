"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Form, Input, message, Spin, Modal, Card, Typography, Space, Radio, Select } from "antd";
import axios from "axios";

const { Title, Paragraph } = Typography;

interface BlogData {
  title: string;
  subtitle?: string;
  about?: string;
  description?: string;
  img?: string;
  isGlobal?: boolean;
  location?: string;
}

const fetchBlog = async (id: string) => {
  const { data } = await axios.get(`http://localhost:3000/blogs/${id}`);
  return data;
};

const updateBlog = async ({ id, values }: { id: string; values: BlogData }) => {
  const { data } = await axios.put(`http://localhost:3000/blogs/${id}`, values);
  return data;
};

const deleteBlog = async (id: string) => {
  await axios.delete(`http://localhost:3000/blogs/${id}`);
};

export default function BlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<BlogData>();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (values: BlogData) => updateBlog({ id: id!, values }),
    onSuccess: () => {
      message.success("Blog updated successfully!");
      setIsEditing(false);
    },
    onError: () => {
      message.error("Failed to update blog");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBlog(id!),
    onSuccess: () => {
      message.success("Blog deleted successfully!");
      router.push("/");
    },
    onError: () => {
      message.error("Failed to delete blog");
    },
  });

  useEffect(() => {
    if (blog) {
      form.setFieldsValue(blog);
    }
  }, [blog, form]);

  if (isLoading) return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <Space style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Button type="primary" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel Edit" : "Edit Blog"}
        </Button>
        <Button type="primary" danger onClick={() => {
          Modal.confirm({
            title: "Are you sure?",
            content: "This action cannot be undone.",
            onOk: () => deleteMutation.mutate(),
          });
        }}>
          Delete Blog
        </Button>
      </Space>
      {isEditing ? (
        <Card>
          <Form form={form} layout="vertical" onFinish={updateMutation.mutate}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="subtitle" label="Subtitle">
              <Input />
            </Form.Item>
            <Form.Item name="about" label="About">
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="isGlobal" label="Blog Type">
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
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </Form>
        </Card>
      ) : (
        <Card cover={blog?.img && <img src={blog.img} alt="blog" style={{ maxHeight: 400, objectFit: "cover" }} />}> 
          <Title level={1}>{blog?.title}</Title>
          <Title level={3} type="secondary">{blog?.subtitle}</Title>
          <Paragraph><strong>About:</strong> {blog?.about}</Paragraph>
          <Paragraph>{blog?.description}</Paragraph>
          <Paragraph><strong>Type:</strong> {blog?.location ? `${blog.location.charAt(0).toUpperCase() + blog.location.slice(1)} Specific` : "Global"}</Paragraph>
          {blog?.location && <Paragraph><strong>Location:</strong> {blog.location.charAt(0).toUpperCase() + blog.location.slice(1)}</Paragraph>}
        </Card>
      )}
    </div>
  );
}