"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Spin, Typography, Input, Button, Upload, message, Alert, Modal, Row, Col, Divider, Space, Select } from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "@/services/apis/api";

const { Title, Paragraph, Text } = Typography;

export default function EditableItemPage() {
    const router = useRouter();
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [originalItem, setOriginalItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [fileList, setFileList] = useState([])

    useEffect(() => {
        if (!id) return;
        const fetchItem = async () => {
            try {
                const response = await axios.get(`/items/${id}`);
                setItem(response.data);
                setOriginalItem(response.data);
            } catch (err) {
                setError("Failed to load item");
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    const handleChange = (key, value) => setItem((prev) => ({ ...prev, [key]: value }));

    const handlePriceChange = (index, key, value) => {
        const updatedPrices = [...item.price];
        updatedPrices[index][key] = value;
        setItem((prev) => ({ ...prev, price: updatedPrices }));
    };

    const addPrice = () => setItem((prev) => ({ ...prev, price: [...prev.price, { cost: 0, type: "" }] }));

    const handleKeyValueChange = (index, key, value) => {
        setItem((prev) => {
            const updatedPairs = [...(prev.keyvalue || [])];
            updatedPairs[index][key] = value;
            return { ...prev, keyvalue: updatedPairs };
        });
    };
    const removePrice = (index) => {
        const updatedPrices = [...item.price];
        updatedPrices.splice(index, 1); // Remove the price at the given index
        setItem({ ...item, price: updatedPrices }); // Update state
    };

    const addKeyValuePair = () => {
        setItem((prev) => ({
            ...prev,
            keyvalue: [...(prev.keyvalue || []), { key: "", value: "", type: "text" }],
        }));
    };

    const removeKeyValuePair = (index) => {
        setItem((prev) => ({
            ...prev,
            keyvalue: prev.keyvalue.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        console.log("Item :", item);

        try {
            // Wait for all images to upload and get URLs
            const imgs = await Promise.all(fileList.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                return (await axios.post("/utils/image", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })).data?.secure_url;
            }));




            // Now `imgs` is an array of uploaded image URLs
            const response = await axios.patch(`/items/${id}`, { ...item, imgs: [...originalItem.imgs, ...imgs] });

            console.log(response.data);
            message.success("Item updated successfully!");
            setOriginalItem(item);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            message.error("Failed to update item.");
        } finally {
            setSaving(false);
        }
    };


    const handleCancel = () => {
        setItem(originalItem);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        Modal.confirm({
            title: "Are you sure you want to delete this item?",
            content: "This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await axios.delete(`/items/${id}`);
                    message.success("Item deleted successfully.");
                    router.push("/items");
                } catch (err) {
                    message.error("Failed to delete item.");
                }
            },
        });
    };


    if (loading) return <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
    </div>;
    if (error) return <Alert message={error} type="error" showIcon />;

    return (
        <Card style={{ maxWidth: 900, margin: "20px auto", padding: "20px", borderRadius: "10px" }}>
            <Space style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <Title level={3} style={{ margin: 0 }}>
                    Title: {isEditing ? (
                        <Input value={item.title} onChange={(e) => handleChange("title", e.target.value)} />
                    ) : (
                        item.title
                    )}
                </Title>
                <Space>
                    <Button type="primary" icon={isEditing ? <SaveOutlined /> : <EditOutlined />} onClick={isEditing ? handleSave : () => setIsEditing(true)} loading={saving}>
                        {isEditing ? "Save" : "Edit"}
                    </Button>
                    <Button danger icon={isEditing ? <CloseOutlined /> : <DeleteOutlined />} onClick={isEditing ? handleCancel : handleDelete}>
                        {isEditing ? "Cancel" : "Delete"}
                    </Button>
                </Space>
            </Space>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Paragraph><strong>Subtitle:</strong> {isEditing ? <Input value={item.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} /> : item.subtitle || "N/A"}</Paragraph>
                    <Paragraph>
                        <strong>Type:</strong>{" "}
                        {isEditing ? (
                            <Select
                                value={item.type || undefined}
                                onChange={(value) => handleChange("type", value)}
                                style={{ width: "100%" }}
                            >
                                <Select.Option value="hotel">Hotel</Select.Option>
                                <Select.Option value="service">Service</Select.Option>
                                <Select.Option value="cars">Cars</Select.Option>
                            </Select>
                        ) : (
                            item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "N/A"
                        )}
                    </Paragraph>
                </Col>
                <Col span={12}>
                    <Paragraph>
                        <strong>Location:</strong>{" "}
                        {isEditing ? (
                            <Select
                                value={item.location || undefined}
                                onChange={(value) => handleChange("location", value)}
                                style={{ width: "100%" }}
                            >
                                <Select.Option value="mirpur">Mirpur</Select.Option>
                                <Select.Option value="islamabad">Islamabad</Select.Option>
                            </Select>
                        ) : (
                            item.location ? item.location.charAt(0).toUpperCase() + item.location.slice(1) : "N/A"
                        )}
                    </Paragraph>

                    <Paragraph>
                        <strong>About:</strong>{" "}
                        {isEditing ? (
                            <Input.TextArea
                                value={item.about}
                                onChange={(e) => handleChange("about", e.target.value)}
                                style={{ width: "100%" }}

                            />
                        ) : (
                            item.about ? item.about.charAt(0).toUpperCase() + item.about.slice(1) : "N/A"
                        )}
                    </Paragraph>
                </Col>
            </Row>


            <Title level={4}>Images</Title>
            <Card style={{ background: "#ffffff", padding: "15px", borderRadius: "10px", border: "1px solid #ddd" }}>
                <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
                    <Row gutter={[16, 16]} justify="start">
                        {item.imgs.length ? (
                            item.imgs.map((img, index) => (
                                <Col key={index} xs={12} sm={8} md={6} lg={4}>
                                    <div style={{ position: "relative", textAlign: "center" }}>
                                        <img
                                            src={img}
                                            alt="Item"
                                            style={{
                                                width: "100%",
                                                height: "100px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                border: "1px solid #ddd",
                                            }}
                                        />
                                        {isEditing && (
                                            <Button
                                                type="default"
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                style={{ position: "absolute", top: 5, right: 5, background: "white" }}
                                                onClick={() => {
                                                    const updatedImgs = item.imgs.filter((_, i) => i !== index);
                                                    const updatedFileList = fileList.filter((_, i) => i !== index);
                                                    setItem(prev => ({ ...prev, imgs: updatedImgs }));
                                                    setFileList(updatedFileList);
                                                }}
                                            />
                                        )}
                                    </div>
                                </Col>
                            ))
                        ) : (
                            <Col span={24} style={{ textAlign: "center", padding: "12px" }}>
                                <Text type="secondary">No images uploaded</Text>
                            </Col>
                        )}
                    </Row>
                </div>
            </Card>

            {isEditing && (
                <Upload
                    listType="picture"
                    fileList={fileList}
                    onRemove={(file) => {
                        const updatedImgs = item.imgs.filter(img => img !== file.url);
                        setItem(prev => ({ ...prev, imgs: updatedImgs }));
                        setFileList(prev => prev.filter(f => f.uid !== file.uid));
                    }}
                    beforeUpload={(file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            setItem(prev => ({ ...prev, imgs: [...prev.imgs, e.target.result] }));
                            setFileList(prev => [...prev, file]);
                        };
                        reader.readAsDataURL(file);
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} style={{ marginTop: "12px" }}>Upload Image</Button>
                </Upload>
            )}





            <Divider />
            <Title level={4}>Prices</Title>
            {item.price.map((p, index) => (
                <Paragraph key={index}>
                    <Space>
                        <strong>Cost:</strong>
                        {isEditing ? (
                            <Input
                                type="number"
                                value={p.cost}
                                onChange={(e) => handlePriceChange(index, "cost", Number(e.target.value))}
                                style={{ width: "100px" }}
                            />
                        ) : (
                            `$${p.cost}`
                        )}
                        <strong>Type:</strong>
                        {isEditing ? (
                            <Input
                                value={p.type}
                                onChange={(e) => handlePriceChange(index, "type", e.target.value)}
                                style={{ width: "120px" }}
                            />
                        ) : (
                            p.type
                        )}
                        {isEditing && (
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removePrice(index)}
                            />
                        )}
                    </Space>
                </Paragraph>
            ))}
            {isEditing && <Button icon={<PlusOutlined />} onClick={addPrice}>Add Price</Button>}




            <Title level={4}>Custom Attributes</Title>
            <Card style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px" }}>
                {item.keyvalue?.length > 0 ? (
                    item.keyvalue.map((pair, index) => (
                        <Row key={index} gutter={16} align="middle" style={{ marginBottom: "10px" }}>
                            <Col span={6}>
                                <Input
                                    placeholder="Key"
                                    value={pair.key}
                                    onChange={(e) => handleKeyValueChange(index, "key", e.target.value)}
                                    allowClear
                                    disabled={!isEditing}
                                />
                            </Col>
                            <Col span={6}>
                                <Select
                                    value={pair.type}
                                    onChange={(value) => handleKeyValueChange(index, "type", value)}
                                    style={{ width: "100%" }}
                                    disabled={!isEditing}
                                >
                                    <Select.Option value="text">Text</Select.Option>
                                    <Select.Option value="number">Number</Select.Option>
                                    <Select.Option value="select">Select</Select.Option>
                                    <Select.Option value="checkbox">Checkbox</Select.Option>
                                    <Select.Option value="date">Date</Select.Option>
                                    <Select.Option value="time">Time</Select.Option>
                                    <Select.Option value="datetime">Date & Time</Select.Option>
                                    <Select.Option value="textarea">Text Area</Select.Option>
                                </Select>
                            </Col>
                            <Col span={3}>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeKeyValuePair(index)}
                                    disabled={!isEditing}
                                />
                            </Col>
                        </Row>
                    ))
                ) : (
                    <Text type="secondary">No custom attributes added yet.</Text>
                )}
            </Card>
            {isEditing && (
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addKeyValuePair}
                    style={{ marginTop: "10px", width: "100%" }}
                >
                    Add Custom Attribute
                </Button>
            )}


            <Divider />
            <Title level={4}>Reviews</Title>
            <Card style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px" }}>
                {Array.isArray(item?.reviews) && item.reviews.length > 0 ? (
                    item.reviews.map((review, index) => (
                        <Row key={index} gutter={16} align="middle" style={{ marginBottom: "10px" }}>
                            <Col span={4}>
                                <img
                                    src={review.img}
                                    alt={review.name}
                                    style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                                />
                            </Col>
                            <Col span={14}>
                                <Paragraph><strong>{review.name}</strong></Paragraph>
                                <Paragraph>Rating: {review.rating} ⭐</Paragraph>
                            </Col>
                            <Col span={6}>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={!isEditing}
                                    onClick={() => {
                                        const updatedReviews = item.reviews.filter((_, i) => i !== index);
                                        setItem(prev => ({ ...prev, reviews: updatedReviews }));
                                    }}
                                />
                            </Col>
                        </Row>
                    ))
                ) : (
                    <Text type="secondary">No reviews available.</Text>
                )}
            </Card>




        </Card>
    );
}
