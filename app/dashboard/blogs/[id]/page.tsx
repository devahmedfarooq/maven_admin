"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Form, Input, message, Spin, Modal, Card, Typography, Space } from "antd";
import axios from "axios";

const { Title, Paragraph } = Typography;

const fetchBlog = async (id) => {
  const { data } = await axios.get(`http://localhost:3000/blogs/${id}`);
  return data;
};

const updateBlog = async ({ id, values }) => {
  const { data } = await axios.put(`http://localhost:3000/blogs/${id}`, values);
  return data;
};

const deleteBlog = async (id) => {
  await axios.delete(`http://localhost:3000/blogs/${id}`);
};

export default function BlogPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (values) => updateBlog({ id, values }),
    onSuccess: () => {
      message.success("Blog updated successfully!");
      setIsEditing(false);
    },
    onError: () => {
      message.error("Failed to update blog");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBlog(id),
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
            <Button type="primary" htmlType="submit" loading={updateMutation.isLoading}>
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
        </Card>
      )}
    </div>
  );
}