"use client"

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Space,
  message,
  InputNumber,
  Divider,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useCreateItem, useUpdateItem } from "@/services/apis/items";
import backendAPI from "@/services/apis/api";
import type { UploadFile } from "antd/es/upload/interface";
import { Item, CreateItemData } from "@/types/item.types";
import { Category as CategoryType } from "@/types/category.types";
import { UploadChangeParam } from "@/types/api.types";
import { PricingManager } from "./PricingManager";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface CreateItemModalProps {
  visible: boolean
  onClose: () => void
  onItemSaved?: () => void
  onItemCreated?: () => void
  initialData?: Item | null
  mode?: "create" | "edit"
  setIsModalVisible: (visible: boolean) => void
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  visible,
  onClose,
  onItemSaved,
  onItemCreated,
  initialData = null,
  mode = "create",
  setIsModalVisible,
}) => {
  const [form] = Form.useForm<CreateItemData>()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()

  const [categories, setCategories] = useState<CategoryType[]>([])

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false)

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    form.setFieldsValue({ subType: undefined })

    // Find the selected category to get its subcategories
    const category = categories.find((cat) => cat._id === categoryId)
    if (category && category.hasSubType) {
      setSubcategories(category.subName || [])
    } else {
      setSubcategories([])
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error("Category name cannot be empty")
      return
    }

    try {
      const response = await backendAPI.post("/category", {
        category: {
          name: newCategoryName,
          hasSubType: false,
        },
      })

      if (response.data) {
        message.success("Category created successfully")
        // Make sure we're using the correct ID from the response
        const newCategory = response.data
        setCategories([...categories, newCategory])
        form.setFieldsValue({ type: newCategory._id })
        setSelectedCategory(newCategory._id)
        setNewCategoryName("")
        setShowNewCategoryInput(false)
      }
    } catch (error) {
      console.error("Error creating category:", error)
      message.error("Failed to create category")
    }
  }

  const handleCreateSubcategory = async () => {
    if (!selectedCategory) {
      message.error("Please select a category first")
      return
    }

    if (!newSubcategoryName.trim()) {
      message.error("Subcategory name cannot be empty")
      return
    }

    try {
      const response = await backendAPI.post("/category/sub", {
        category: {
          name: categories.find((cat) => cat._id === selectedCategory)?.name,
          subName: [newSubcategoryName],
        },
      })

      if (response.data) {
        message.success("Subcategory created successfully")

        // Update the categories list with the new subcategory
        const updatedCategories = categories.map((cat) => {
          if (cat._id === selectedCategory) {
            return {
              ...cat,
              hasSubType: true,
              subName: [...(cat.subName || []), newSubcategoryName],
            }
          }
          return cat
        })

        setCategories(updatedCategories)
        setSubcategories([...subcategories, newSubcategoryName])
        form.setFieldsValue({ subType: newSubcategoryName })
        setNewSubcategoryName("")
        setShowNewSubcategoryInput(false)
      }
    } catch (error) {
      console.error("Error creating subcategory:", error)
      message.error("Failed to create subcategory")
    }
  }

  useEffect(() => {
    if (visible && initialData && mode === "edit") {
      // Handle type field properly - extract category ID if it's an object
      const typeValue = typeof initialData.type === 'object' && initialData.type 
        ? initialData.type._id 
        : initialData.type;

      form.setFieldsValue({
        title: initialData.title,
        subtitle: initialData.subtitle,
        about: initialData.about,
        type: typeValue,
        subType: initialData.subType,
        location: initialData.location,
        price: initialData.price || [],
      })

      // If there's a type, load its subcategories
      if (typeValue) {
        setSelectedCategory(typeValue)
        const category = categories.find((cat) => cat._id === typeValue)
        if (category && category.hasSubType) {
          setSubcategories(category.subName || [])
        }
      }

      // If there are images, prepare them for display
      if (initialData.imgs && initialData.imgs.length > 0) {
        const files = initialData.imgs.map((url, index) => ({
          uid: `-${index}`,
          name: `image-${index}.jpg`,
          status: "done" as const,
          url,
        }))
        setFileList(files)
      }
    } else if (visible && mode === "create") {
      form.resetFields()
      setFileList([])
      setSelectedCategory(null)
      setSubcategories([])
    }
  }, [visible, initialData, mode, form, categories])

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await backendAPI.get("/category")
        setCategories(data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        message.error("Failed to fetch categories")
      }
    }

    if (visible) {
      fetchCategories()
    }
  }, [visible])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // Handle file uploads if any
      const uploadedUrls: string[] = []
      
      if (fileList.length > 0) {
        message.loading({ content: 'Uploading images...', key: 'upload' })
        
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i]
          
          if (file.originFileObj) {
            try {
              const formData = new FormData()
              formData.append("file", file.originFileObj)
              
              const uploadResponse = await backendAPI.post("/utils/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000, // 30 second timeout
              })
              
              if (uploadResponse.data?.secure_url) {
                uploadedUrls.push(uploadResponse.data.secure_url)
                message.success({ content: `${file.name} uploaded successfully`, key: 'upload' })
              } else {
                throw new Error('Upload response missing secure_url')
              }
            } catch (error) {
              console.error(`Error uploading ${file.name}:`, error)
              message.error({ content: `Failed to upload ${file.name}`, key: 'upload' })
              throw new Error(`Failed to upload ${file.name}`)
            }
          } else if (file.url) {
            uploadedUrls.push(file.url)
          }
        }
        
        message.success({ content: 'All images uploaded successfully', key: 'upload' })
      }

      // Ensure price array has proper structure
      const processedPrices = values.price?.map(price => ({
        cost: price.cost || 0,
        type: price.type || "",
        isActive: price.isActive !== undefined ? price.isActive : true,
        minQuantity: price.minQuantity || 1,
        maxQuantity: price.maxQuantity,
        description: price.description,
        currency: price.currency || "PKR"
      })) || []

      const itemData: CreateItemData = {
        ...values,
        imgs: uploadedUrls,
        price: processedPrices,
      }

      if (mode === "create") {
        await createItemMutation.mutateAsync(itemData)
        message.success("Item created successfully!")
        onItemCreated?.()
      } else if (initialData?._id) {
        await updateItemMutation.mutateAsync({
          id: initialData._id,
          data: itemData,
        })
        message.success("Item updated successfully!")
        onItemSaved?.()
      }

      setIsModalVisible(false)
      form.resetFields()
      setFileList([])
      setSelectedCategory(null)
    } catch (error) {
      console.error("Error saving item:", error)
      message.error("Failed to save item. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadChange = (info: any) => {
    const { fileList: newFileList } = info;
    
    // Validate file types and sizes
    const validFiles = newFileList.filter((file: any) => {
      const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const isValidSize = file.size && file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isImage) {
        message.error(`${file.name} is not a valid image file`);
        return false;
      }
      
      if (!isValidSize) {
        message.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      
      return true;
    });
    
    setFileList(validFiles);
  }

  const handleRemoveFile = (file: UploadFile) => {
    Modal.confirm({
      title: 'Remove Image',
      content: 'Are you sure you want to remove this image?',
      okText: 'Remove',
      cancelText: 'Cancel',
      onOk: () => {
        const newFileList = fileList.filter((f) => f.uid !== file.uid);
        setFileList(newFileList);
        message.success('Image removed successfully');
      }
    });
  }

  const beforeUpload = (file: any) => {
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
    
    return false; // Prevent auto upload
  }

  return (
    <Modal
      title={mode === "create" ? "Create New Item" : "Edit Item"}
      open={visible}
      onCancel={() => {
        setIsModalVisible(false)
        setSelectedCategory(null)
      }}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          price: [{ cost: 0, type: "", isActive: true, minQuantity: 1, currency: "PKR" }],
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter title" }]}
          >
            <Input placeholder="Enter item title" />
          </Form.Item>

          <Form.Item name="subtitle" label="Subtitle">
            <Input placeholder="Enter subtitle" />
          </Form.Item>
        </div>

        <Form.Item name="about" label="Description">
          <Input.TextArea rows={3} placeholder="Enter description" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="type" label="Category">
            <Select
              placeholder="Select category"
              onChange={handleCategoryChange}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ padding: "0 8px 4px" }}>
                    {showNewCategoryInput ? (
                      <Space>
                        <Input
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Button
                          type="text"
                          size="small"
                          onClick={handleCreateCategory}
                        >
                          Add
                        </Button>
                        <Button
                          type="text"
                          size="small"
                          onClick={() => setShowNewCategoryInput(false)}
                        >
                          Cancel
                        </Button>
                      </Space>
                    ) : (
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => setShowNewCategoryInput(true)}
                      >
                        Add Category
                      </Button>
                    )}
                  </div>
                </div>
              )}
            >
              {categories.map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="subType" label="Subcategory">
            <Select
              placeholder="Select subcategory"
              disabled={!selectedCategory}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  {selectedCategory && (
                    <>
                      <Divider style={{ margin: "8px 0" }} />
                      <div style={{ padding: "0 8px 4px" }}>
                        {showNewSubcategoryInput ? (
                          <Space>
                            <Input
                              placeholder="Subcategory name"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                            />
                            <Button
                              type="text"
                              size="small"
                              onClick={handleCreateSubcategory}
                            >
                              Add
                            </Button>
                            <Button
                              type="text"
                              size="small"
                              onClick={() => setShowNewSubcategoryInput(false)}
                            >
                              Cancel
                            </Button>
                          </Space>
                        ) : (
                          <Button
                            type="text"
                            icon={<PlusOutlined />}
                            onClick={() => setShowNewSubcategoryInput(true)}
                          >
                            Add Subcategory
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            >
              {subcategories.map((sub) => (
                <Option key={sub} value={sub}>
                  {sub}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="location" label="Location">
          <Input placeholder="Enter location" />
        </Form.Item>

        <Form.Item name="price" label="Pricing">
          <PricingManager />
        </Form.Item>

        <Form.Item label="Images">
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">
              Upload up to 8 images. Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB per image.
            </Text>
          </div>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            onRemove={handleRemoveFile}
            beforeUpload={beforeUpload}
            multiple
            accept="image/*"
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
              showDownloadIcon: false,
            }}
          >
            {fileList.length >= 8 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
          {fileList.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {fileList.length} image(s) selected
              </Text>
            </div>
          )}
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === "create" ? "Create" : "Update"}
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateItemModal
