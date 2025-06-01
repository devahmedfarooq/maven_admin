"use client"

import type React from "react"

import { Modal, Form, Input, Button, InputNumber, Select, Space, Upload, message, Divider } from "antd"
import { useCreateItem, useUpdateItem } from "@/services/apis/items"
import { useEffect, useState } from "react"
import backendAPI from "@/services/apis/api"
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import type { UploadFile } from "antd/es/upload/interface"

interface ItemData {
  _id?: string
  title: string
  subtitle?: string
  about?: string
  type?: string
  subType?: string
  location?: string
  imgs?: string[]
  price: PriceItem[]
  keyvalue?: { key: string; value?: string; type: string }[]
}

interface PriceItem {
  cost: number
  type: string
}

interface CreateItemModalProps {
  visible: boolean
  onClose: () => void
  onItemSaved?: () => void
  onItemCreated?: () => void
  initialData?: ItemData | null
  mode?: "create" | "edit"
  setIsModalVisible: (visible: boolean) => void
}

const { Option } = Select

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  visible,
  onClose,
  onItemSaved,
  onItemCreated,
  initialData = null,
  mode = "create",
  setIsModalVisible,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()

  const [categories, setCategories] = useState<any[]>([])

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
          status: "done",
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
        setCategories([])
      }
    }

    if (visible) {
      fetchCategories()
    }
  }, [visible])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // Validate form fields
      const values = await form.validateFields()
      
      // Initialize price array if it doesn't exist
      if (!values.price) {
        values.price = []
      }
      
      // Ensure each price item has the correct structure
      const formattedPrices = values.price.map(item => ({
        cost: Number(item.cost || 0),
        type: item.type || "Standard"
      }))

      // Ensure required fields exist before sending
      const formattedValues = {
        title: values.title,
        subtitle: values.subtitle || "",
        about: values.about || "",
        type: values.type,
        subType: values.subType || "",
        location: values.location || "",
        price: formattedPrices,
        imgs: [] // Will be populated below
      }

      // Handle file uploads if there are new files
      const newFiles = fileList.filter((file) => file.originFileObj)
      let uploadedImageUrls: string[] = []

      if (newFiles?.length > 0) {
        uploadedImageUrls = await Promise.all(
          newFiles.map(async (file) => {
            if (!file.originFileObj) return ""

            const formData = new FormData()
            formData.append("file", file.originFileObj)

            try {
              const response = await backendAPI.post("/utils/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              })
              return response.data?.secure_url || ""
            } catch (error) {
              console.error("Image upload failed:", error)
              return ""
            }
          }),
        )
      }

      // Get existing image URLs that weren't removed
      const existingImageUrls = fileList.filter((file) => file.url && !file.originFileObj).map((file) => file.url || "")

      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls.filter((url) => url)]

      // Add images to the formatted values
      formattedValues.imgs = allImageUrls

      console.log("Submitting item with values:", formattedValues)

      if (mode === "create") {
        await createItemMutation.mutateAsync(formattedValues)
        message.success("Item created successfully!")
        if (onItemCreated) onItemCreated()
      } else if (mode === "edit" && initialData?._id) {
        await updateItemMutation.mutateAsync({ id: initialData._id, data: formattedValues })
        message.success("Item updated successfully!")
        if (onItemSaved) onItemSaved()
      }

      onClose()
      form.resetFields()
      setFileList([])
    } catch (error) {
      console.error("Form validation or API call failed:", error)
      
      // Show more specific error messages
      if (error.errorFields) {
        const fieldErrors = error.errorFields.map(field => `${field.name.join('.')}: ${field.errors.join(', ')}`);
        message.error(`Please fix the following errors: ${fieldErrors.join('; ')}`);
      } else if (error.response?.data?.message) {
        message.error(`API Error: ${error.response.data.message}`);
      } else {
        message.error("Failed to save item. Please check your form inputs.")
      }
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    listType: "picture-card",
    fileList: fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    },
    onPreview: async (file: UploadFile) => {
      let src = file.url as string

      if (!src) {
        src = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.readAsDataURL(file.originFileObj as File)

          reader.onload = () => resolve(reader.result as string)
        })
      }

      const image = new Image()
      image.src = src
      const imgWindow = window.open(src)

      if (imgWindow) {
        imgWindow.document.write(image.outerHTML)
      }
    },
    beforeUpload: () => false,
  }

  return (
    <Modal
      open={visible} // Changed from 'visible' to 'open' for newer Ant Design versions
      title={mode === "create" ? "Create Item" : "Edit Item"}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {mode === "create" ? "Create" : "Save"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="subtitle" label="Subtitle">
          <Input />
        </Form.Item>
        <Form.Item name="about" label="About" rules={[{ required: true, message: "About is required" }]}>
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="type" label="Category" rules={[{ required: true, message: "Category is required" }]}>
          <Select
            disabled={categories?.length === 0}
            onChange={handleCategoryChange}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                {showNewCategoryInput ? (
                  <Space style={{ padding: "0 8px 4px" }}>
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onPressEnter={handleCreateCategory}
                    />
                    <Button type="text" icon={<PlusOutlined />} onClick={handleCreateCategory}>
                      Add
                    </Button>
                  </Space>
                ) : (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setShowNewCategoryInput(true)}
                    style={{ padding: "0 8px 4px" }}
                  >
                    Add Category
                  </Button>
                )}
              </>
            )}
          >
            {categories?.length === 0 && <Option value="">None</Option>}
            {categories.map((category) => (
              <Option key={category._id} value={category._id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedCategory && (
          <Form.Item name="subType" label="Subcategory">
            <Select
              allowClear
              placeholder="Select subcategory (optional)"
              disabled={subcategories?.length === 0 && !selectedCategory}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  {showNewSubcategoryInput ? (
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input
                        placeholder="New subcategory name"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        onPressEnter={handleCreateSubcategory}
                      />
                      <Button type="text" icon={<PlusOutlined />} onClick={handleCreateSubcategory}>
                        Add
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setShowNewSubcategoryInput(true)}
                      style={{ padding: "0 8px 4px" }}
                      disabled={!selectedCategory}
                    >
                      Add Subcategory
                    </Button>
                  )}
                </>
              )}
            >
              {subcategories.map((subName) => (
                <Option key={subName} value={subName}>
                  {subName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item name="location" label="Location" rules={[{ required: true, message: "Location is required" }]}>
          <Select>
            <Option value="mirpur">Mirpur</Option>
            <Option value="islamabad">Islamabad</Option>
          </Select>
        </Form.Item>

        <Form.List name="price">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "cost"]}
                    label="Cost"
                    rules={[{ required: true, message: "Missing cost" }]}
                  >
                    <InputNumber min={0} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "type"]}
                    label="Type"
                    rules={[{ required: true, message: "Missing type" }]}
                  >
                    <Input placeholder="e.g., Hourly, Daily, Fixed" />
                  </Form.Item>
                  <DeleteOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Price
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

       
      </Form>
    </Modal>
  )
}

export default CreateItemModal
