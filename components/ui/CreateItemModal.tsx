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
const { Title } = Typography;

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
      form.setFieldsValue({
        title: initialData.title,
        subtitle: initialData.subtitle,
        about: initialData.about,
        type: initialData.type,
        subType: initialData.subType,
        location: initialData.location,
        price: initialData.price || [],
      })

      // If there's a type, load its subcategories
      if (initialData.type) {
        setSelectedCategory(initialData.type)
        const category = categories.find((cat) => cat._id === initialData.type)
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
      for (const file of fileList) {
        if (file.originFileObj) {
          const formData = new FormData()
          formData.append("file", file.originFileObj)
          const uploadResponse = await backendAPI.post("/utils/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          uploadedUrls.push(uploadResponse.data.secure_url)
        } else if (file.url) {
          uploadedUrls.push(file.url)
        }
      }

      const itemData: CreateItemData = {
        ...values,
        imgs: uploadedUrls,
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
      message.error("Failed to save item")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadChange = (info: any) => {
    setFileList(info.fileList)
  }

  const handleRemoveFile = (file: UploadFile) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid)
    setFileList(newFileList)
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
          price: [{ cost: 0, type: "" }],
          keyvalue: [{ key: "", value: "", type: "" }],
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

        <Form.List name="keyvalue">
          {(fields, { add, remove }) => (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Additional Details</label>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  size="small"
                >
                  Add Detail
                </Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex", marginBottom: 8 }}>
                  <Form.Item
                    {...restField}
                    name={[name, "key"]}
                    rules={[{ required: true, message: "Missing key" }]}
                  >
                    <Input placeholder="Key" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "value"]}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "type"]}
                    rules={[{ required: true, message: "Missing type" }]}
                  >
                    <Input placeholder="Type" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <Form.Item label="Images">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            onRemove={handleRemoveFile}
            beforeUpload={() => false}
            multiple
          >
            {fileList.length >= 8 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
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
