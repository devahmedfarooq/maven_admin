"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  Spin,
  Typography,
  Input,
  Button,
  Upload,
  message,
  Alert,
  Modal,
  Row,
  Col,
  Divider,
  Space,
  Select,
} from "antd"
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import axios from "@/services/apis/api"
import type { RcFile } from "antd/es/upload"

const { Title, Paragraph, Text } = Typography

// Define proper TypeScript interfaces
interface Category {
  name: string
  hasSubType: boolean
  subName: string[]
  _id: string
}

interface PriceItem {
  cost: number
  type: string
  isActive?: boolean
  minQuantity?: number
  maxQuantity?: number
  description?: string
  currency?: string
}

interface Review {
  name: string
  rating: number
  img: string
}

interface Item {
  _id: string
  title: string
  subtitle?: string
  type?: Category | string
  subType?: string
  location?: string
  about?: string
  imgs: string[]
  price: PriceItem[]
  reviews?: Review[]
}

export default function EditableItemPage() {
  const router = useRouter()
  const { id } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [originalItem, setOriginalItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fileList, setFileList] = useState<RcFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await axios.get<Category[]>("/category")
        setCategories(data)
      } catch (error: any) {
        console.log(`Error Fetching Categories: ${error.message}`)
      }
    }
    fetchCategories()
  }, [])

  const fetchItem = async () => {
    try {
      const response = await axios.get<Item>(`/items/${id}`)
      setItem(response.data)
      setOriginalItem(response.data)
    } catch (err: any) {
      setError("Failed to load item")
    } finally {
      setLoading(false)
    }
  }
  // Fetch item data
  useEffect(() => {
    if (!id) return
    fetchItem()
  }, [id, saving])

  // Handle field changes
  const handleChange = (key: keyof Item, value: any) => {
    if (!item) return
    // Special handling for type changes
    if (key === "type" && value !== (item.type as any)?._id) {
      // Find the selected category
      const selectedCategory = categories.find((cat) => cat._id === value)

      // If changing type and the new type doesn't support subtypes or has different subtypes,
      // reset the subType field
      if (
        !selectedCategory?.hasSubType ||
        (typeof item.type === "object" &&
          item.type.hasSubType &&
          !selectedCategory.subName.includes(item.subType || ""))
      ) {
        setItem((prev) =>
          prev
            ? { ...prev, [key]: value, subType: selectedCategory?.hasSubType ? selectedCategory.subName[0] : "" }
            : null,
        )
        return
      }
    }
    setItem((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  // Handle price changes
  const handlePriceChange = (index: number, key: keyof PriceItem, value: any) => {
    if (!item) return
    const updatedPrices = [...item.price]
    ;(updatedPrices[index] as any)[key] = value
    setItem((prev) => (prev ? { ...prev, price: updatedPrices } : null))
  }

  // Add new price
  const addPrice = () => {
    if (!item) return
    setItem((prev) => (prev ? { 
      ...prev, 
      price: [...prev.price, { 
        cost: 0, 
        type: "", 
        isActive: true, 
        minQuantity: 1, 
        currency: "PKR" 
      }] 
    } : null))
  }

  // Remove price
  const removePrice = (index: number) => {
    if (!item) return
    const updatedPrices = [...item.price]
    updatedPrices.splice(index, 1)
    setItem((prev) => (prev ? { ...prev, price: updatedPrices } : null))
  }

  // Save changes
  const handleSave = async () => {
    if (!item || !originalItem) return
    setSaving(true)

    try {
      // Upload all images and get URLs
      const imgs = await Promise.all(
        fileList.map(async (file, index) => {
          try {
            const formData = new FormData()
            formData.append("file", file)
            
            message.loading({ content: `Uploading ${file.name}...`, key: `upload-${index}` })
            
            const response = await axios.post("/utils/image", formData, {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 30000, // 30 second timeout
            })
            
            if (response.data?.secure_url) {
              message.success({ content: `${file.name} uploaded successfully`, key: `upload-${index}` })
              return response.data.secure_url
            } else {
              throw new Error('Upload response missing secure_url')
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error)
            message.error({ content: `Failed to upload ${file.name}`, key: `upload-${index}` })
            throw new Error(`Failed to upload ${file.name}`)
          }
        }),
      )

      // Extract type value properly - ensure it's a string (category ID)
      const typeValue = typeof item.type === 'object' && item.type 
        ? item.type._id 
        : item.type;

      // Process the data to match backend expectations
      const updateData = {
        ...item,
        type: typeValue, // Ensure type is a string
        imgs: [...item.imgs, ...imgs], // Use current item.imgs state instead of originalItem.imgs
        // Ensure price has proper structure
        price: item.price.map(price => ({
          cost: price.cost || 0,
          type: price.type || "",
          isActive: price.isActive !== undefined ? price.isActive : true,
          minQuantity: price.minQuantity || 1,
          maxQuantity: price.maxQuantity,
          description: price.description,
          currency: price.currency || "PKR"
        }))
      }

      // Update item with new data including images
      const response = await axios.patch(`/items/${id}`, updateData)

      message.success("Item updated successfully!")
      setOriginalItem(response.data)
      setItem(response.data)
      setFileList([])
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      message.error("Failed to update item. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Cancel editing
  const handleCancel = () => {
    setItem(originalItem)
    setFileList([])
    setIsEditing(false)
  }

  // Delete item
  const handleDelete = () => {
    Modal.confirm({
      title: "Are you sure you want to delete this item?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`/items/${id}`)
          message.success("Item deleted successfully.")
          router.push("/items")
        } catch (err) {
          message.error("Failed to delete item.")
        }
      },
    })
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    if (!item) return
    
    Modal.confirm({
      title: 'Remove Image',
      content: 'Are you sure you want to remove this image? This action cannot be undone.',
      okText: 'Remove',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: () => {
        const updatedImgs = item.imgs.filter((_, i) => i !== index);
        setItem((prev) => (prev ? { ...prev, imgs: updatedImgs } : null));
        message.success('Image removed successfully');
      }
    });
  }

  // Remove review
  const handleRemoveReview = (index: number) => {
    if (!item || !item.reviews) return
    const updatedReviews = item.reviews.filter((_, i) => i !== index)
    setItem((prev) => (prev ? { ...prev, reviews: updatedReviews } : null))
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )

  if (error) return <Alert message={error} type="error" showIcon />
  if (!item) return <Alert message="Item not found" type="error" showIcon />

  return (
    <Card style={{ maxWidth: 900, margin: "20px auto", padding: "20px", borderRadius: "10px" }}>
      {/* Header with title and action buttons */}
      <Space style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <Title level={3} style={{ margin: 0 }}>
          {isEditing ? (
            <Input
              value={item.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Item Title"
            />
          ) : (
            item.title
          )}
        </Title>
        <Space>
          <Button
            type="primary"
            icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            loading={saving}
          >
            {isEditing ? "Save" : "Edit"}
          </Button>
          <Button
            danger
            icon={isEditing ? <CloseOutlined /> : <DeleteOutlined />}
            onClick={isEditing ? handleCancel : handleDelete}
          >
            {isEditing ? "Cancel" : "Delete"}
          </Button>
        </Space>
      </Space>

      <Divider />

      {/* Basic information */}
      <Row gutter={16}>
        <Col span={12}>
          <Paragraph>
            <strong>Subtitle:</strong>{" "}
            {isEditing ? (
              <Input
                value={item.subtitle || ""}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Subtitle"
              />
            ) : (
              item.subtitle || "N/A"
            )}
          </Paragraph>
          <Paragraph>
            <strong>Type:</strong>{" "}
            {isEditing ? (
              <Select
                value={typeof item.type === "object" ? item.type._id : item.type}
                onChange={(value) => handleChange("type", value)}
                style={{ width: "100%" }}
                placeholder="Select type"
                disabled={categories.length === 0}
              >
                {categories.length === 0 && <Select.Option value="">None</Select.Option>}
                {categories.map((category) => (
                  <Select.Option key={category._id} value={category._id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            ) : typeof item.type === "object" ? (
              item.type.name
            ) : (
              item.type || "N/A"
            )}
          </Paragraph>
          <Paragraph>
            <strong>SubType:</strong>{" "}
            {isEditing && typeof item.type === "object" && item.type.hasSubType ? (
              <Select
                value={item.subType || ""}
                onChange={(value) => handleChange("subType", value)}
                style={{ width: "100%" }}
                placeholder="Select subtype"
                disabled={!item.type || typeof item.type !== "object" || !item.type.hasSubType}
              >
                {typeof item.type === "object" &&
                  item.type.subName &&
                  item.type.subName.map((subName) => (
                    <Select.Option key={subName} value={subName}>
                      {subName}
                    </Select.Option>
                  ))}
              </Select>
            ) : (
              item.subType || "N/A"
            )}
          </Paragraph>
        </Col>
        <Col span={12}>
          <Paragraph>
            <strong>Location:</strong>{" "}
            {isEditing ? (
              <Select
                value={item.location}
                onChange={(value) => handleChange("location", value)}
                style={{ width: "100%" }}
                placeholder="Select location"
              >
                <Select.Option value="mirpur">Mirpur</Select.Option>
                <Select.Option value="islamabad">Islamabad</Select.Option>
              </Select>
            ) : item.location ? (
              item.location.charAt(0).toUpperCase() + item.location.slice(1)
            ) : (
              "N/A"
            )}
          </Paragraph>
          <Paragraph>
            <strong>About:</strong>{" "}
            {isEditing ? (
              <Input.TextArea
                value={item.about || ""}
                onChange={(e) => handleChange("about", e.target.value)}
                style={{ width: "100%" }}
                placeholder="About this item"
                rows={3}
              />
            ) : item.about ? (
              item.about
            ) : (
              "N/A"
            )}
          </Paragraph>
        </Col>
      </Row>

      {/* Images section */}
      <Title level={4}>Images</Title>
      <Card style={{ background: "#ffffff", padding: "15px", borderRadius: "10px", border: "1px solid #ddd" }}>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            {item.imgs.length} image(s) uploaded. {isEditing && "Click the X button to remove images."}
          </Text>
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
          <Row gutter={[16, 16]} justify="start">
            {item.imgs.length > 0 ? (
              item.imgs.map((img, index) => (
                <Col key={index} xs={12} sm={8} md={6} lg={4}>
                  <div style={{ position: "relative", textAlign: "center" }}>
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Item image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // Open image in new tab for preview
                        window.open(img, '_blank');
                      }}
                    />
                    {isEditing && (
                      <Button
                        type="default"
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{ 
                          position: "absolute", 
                          top: 5, 
                          right: 5, 
                          background: "white",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          border: "1px solid #d9d9d9"
                        }}
                        onClick={() => handleRemoveImage(index)}
                        title="Remove image"
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

      {/* Image upload */}
      {isEditing && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">
              Upload new images. Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB per image.
            </Text>
          </div>
          <Upload
            listType="picture"
            fileList={fileList.map((file, index) => ({
              uid: `-${index}`,
              name: file.name,
              status: "done",
              url: URL.createObjectURL(file),
            }))}
            onRemove={(file) => {
              const index = fileList.findIndex((f) => f.uid === file.uid)
              if (index !== -1) {
                const newFileList = [...fileList]
                newFileList.splice(index, 1)
                setFileList(newFileList)
                message.success('Image removed from upload queue');
              }
            }}
            beforeUpload={(file) => {
              const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
              
              if (!isImage) {
                message.error('You can only upload image files!');
                return false;
              }
              
              if (!isValidSize) {
                message.error('Image must be smaller than 5MB!');
                return false;
              }
              
              setFileList((prev) => [...prev, file])
              message.success(`${file.name} added to upload queue`);
              return false;
            }}
            accept="image/*"
            multiple
          >
            <Button icon={<UploadOutlined />} style={{ marginTop: "12px" }}>
              Upload Image
            </Button>
          </Upload>
          {fileList.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {fileList.length} new image(s) ready to upload
              </Text>
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* Prices section */}
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
                min={0}
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
                placeholder="Price type"
              />
            ) : (
              p.type
            )}
            {isEditing && (
              <>
                <strong>Active:</strong>
                <Select
                  value={p.isActive}
                  onChange={(value) => handlePriceChange(index, "isActive", value)}
                  style={{ width: "80px" }}
                >
                  <Select.Option value={true}>Yes</Select.Option>
                  <Select.Option value={false}>No</Select.Option>
                </Select>
                <strong>Min Qty:</strong>
                <Input
                  type="number"
                  value={p.minQuantity}
                  onChange={(e) => handlePriceChange(index, "minQuantity", Number(e.target.value))}
                  style={{ width: "80px" }}
                  min={1}
                />
                <Button danger icon={<DeleteOutlined />} onClick={() => removePrice(index)} />
              </>
            )}
          </Space>
        </Paragraph>
      ))}
      {isEditing && (
        <Button icon={<PlusOutlined />} onClick={addPrice}>
          Add Price
        </Button>
      )}

      <Divider />

      {/* Reviews section */}
      <Title level={4}>Reviews</Title>
      <Card style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px" }}>
        {item.reviews && item.reviews.length > 0 ? (
          item.reviews.map((review, index) => (
            <Row key={index} gutter={16} align="middle" style={{ marginBottom: "10px" }}>
              <Col span={4}>
                <img
                  src={review.img || "/placeholder.svg"}
                  alt={review.name}
                  style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                />
              </Col>
              <Col span={14}>
                <Paragraph>
                  <strong>{review.name}</strong>
                </Paragraph>
                <Paragraph>Rating: {review.rating} ⭐</Paragraph>
              </Col>
              <Col span={6}>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!isEditing}
                  onClick={() => handleRemoveReview(index)}
                />
              </Col>
            </Row>
          ))
        ) : (
          <Text type="secondary">No reviews available.</Text>
        )}
      </Card>
    </Card>
  )
}
