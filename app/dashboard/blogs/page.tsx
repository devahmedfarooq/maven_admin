"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, message, Upload, Spin, Card, Row, Col, Statistic } from "antd";
import { UploadOutlined } from "@ant-design/icons";


import axios from "axios";
import Link from "next/link";
import SlateEditor from "@/components/ui/SlateEditor";

const fetchBlogs = async () => {
  const { data } = await axios.get("http://localhost:3000/blogs");
  return data;
};

const createBlog = async (blogData) => {
  const { data } = await axios.post("http://localhost:3000/blogs", blogData);
  return data;
};

const uploadImage = async (file) => {
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
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      if (file) {
        setUploading(true);
        const imageUrl = await uploadImage(file);
        setUploading(false);
        values.img = imageUrl;
      }
      return createBlog(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["blogs"]);
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

  const handleCreate = (values) => {
    mutation.mutate(values);
  };

  const beforeUpload = (file) => {
    setFile(file);
    setFileList([{ uid: file.uid, name: file.name, status: "done" }]);
    return false;
  };

  return (
    <div style={{ padding: 20, display:"flex", flexDirection : "column", gap : 12 }}>

      <Card>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic title="Total Blogs" value={blogs?.length || 0} />
          </Col>
          <Col span={16}>
            {blogs?.length > 0 && <Statistic title="Latest Blog" value={blogs[0].title} />}
          </Col>
        </Row>
      </Card>

    <div>
    <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: 16 }}>
        Create Blog
      </Button>
    </div>

      <Table
        dataSource={blogs}
        loading={isLoading}
        rowKey="_id"
        columns={[
          { title: "Title", dataIndex: "title", key: "title" },
          { title: "About", dataIndex: "about", key: "about" },
          { title: "Edited/Created", dataIndex: "updatedAt", key: "updatedAt" },
          { title: "Action", dataIndex: "_id", key: "_id", render: (_id) => <Link href={`/dashboard/blogs/${_id}`}>More Details</Link> },
/*           { title: "Image", dataIndex: "img", key: "img", render: (img) => img ? <Card> <img src={img} alt="blog"  /> </Card> : "No Image" }
 */        ]}
      />

      <Modal
        title="Create Blog"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={mutation.isLoading}

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
