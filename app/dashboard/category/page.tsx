"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  Popconfirm,
  message,
  Spin,
  Tabs,
  Select,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons"
import axios from "@/services/apis/api"

const { TabPane } = Tabs

// Types
interface Category {
  _id: string
  name: string
  hasSubType: boolean
  subName: string[]
}

interface CategoryFormValues {
  name: string
  hasSubType: boolean
}

interface SubCategoryFormValues {
  categoryId: string
  subName: string
}

export default function CategoryManagement() {
  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm] = Form.useForm()
  const [subCategoryForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState("1")

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get<Category[]>("/category")
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      message.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Category CRUD operations
  const handleCreateCategory = async (values: CategoryFormValues) => {
    try {
      await axios.post("/category", {
        category: {
          name: values.name,
          hasSubType: values.hasSubType,
        },
      })
      message.success("Category created successfully")
      setCategoryModalVisible(false)
      categoryForm.resetFields()
      fetchCategories()
    } catch (error) {
      console.error("Error creating category:", error)
      message.error("Failed to create category")
    }
  }

  const handleUpdateCategory = async (values: CategoryFormValues) => {
    if (!editingCategory) return

    try {
      await axios.patch(`/category/${editingCategory._id}`, {
        name: values.name,
        hasSubType: values.hasSubType,
      })
      message.success("Category updated successfully")
      setCategoryModalVisible(false)
      categoryForm.resetFields()
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      console.error("Error updating category:", error)
      message.error("Failed to update category")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await axios.delete(`/category/${id}`)
      message.success("Category deleted successfully")
      fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      message.error("Failed to delete category")
    }
  }

  // Subcategory operations
  const handleAddSubCategory = async (values: SubCategoryFormValues) => {
    try {
      const category = categories.find((c) => c._id === values.categoryId)
      if (!category) {
        message.error("Category not found")
        return
      }

      await axios.post("/category/sub", {
        category: {
          name: category.name,
          hasSubType: true,
          subName: [values.subName],
        },
      })
      message.success("Subcategory added successfully")
      setSubCategoryModalVisible(false)
      subCategoryForm.resetFields()
      fetchCategories()
    } catch (error) {
      console.error("Error adding subcategory:", error)
      message.error("Failed to add subcategory")
    }
  }

  const handleRemoveSubCategory = async (categoryId: string, subName: string) => {
    try {
      await axios.delete(`/category/${categoryId}/${subName}`)
      message.success("Subcategory removed successfully")
      fetchCategories()
    } catch (error) {
      console.error("Error removing subcategory:", error)
      message.error("Failed to remove subcategory")
    }
  }

  // Modal handlers
  const showCreateCategoryModal = () => {
    setEditingCategory(null)
    categoryForm.resetFields()
    setCategoryModalVisible(true)
  }

  const showEditCategoryModal = (category: Category) => {
    setEditingCategory(category)
    categoryForm.setFieldsValue({
      name: category.name,
      hasSubType: category.hasSubType,
    })
    setCategoryModalVisible(true)
  }

  const showAddSubCategoryModal = () => {
    subCategoryForm.resetFields()
    setSubCategoryModalVisible(true)
  }

  // Table columns
  const categoryColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: Category, b: Category) => a.name.localeCompare(b.name),
    },
    {
      title: "Has Subtypes",
      dataIndex: "hasSubType",
      key: "hasSubType",
      render: (hasSubType: boolean) => (hasSubType ? "Yes" : "No"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Category) => (
        <Space size="small">
          <Button icon={<EditOutlined />} onClick={() => showEditCategoryModal(record)} size="small">
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDeleteCategory(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const subCategoryColumns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      sorter: (a: Category, b: Category) => a.name.localeCompare(b.name),
    },
    {
      title: "Subcategories",
      dataIndex: "subName",
      key: "subName",
      render: (subNames: string[], record: Category) => (
        <div style={{ maxWidth: "500px" }}>
          {subNames && subNames.length > 0 ? (
            subNames.map((name) => (
              <Tag
                key={`${record._id}-${name}`}
                closable
                onClose={() => handleRemoveSubCategory(record._id, name)}
                style={{ margin: "2px" }}
              >
                {name}
              </Tag>
            ))
          ) : (
            <span style={{ color: "#999" }}>No subcategories</span>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Category) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            subCategoryForm.setFieldsValue({ categoryId: record._id })
            setSubCategoryModalVisible(true)
          }}
          size="small"
          disabled={!record.hasSubType}
        >
          Add Subcategory
        </Button>
      ),
    },
  ]

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: "20px" }}>
      <Card title="Category Management">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Categories" key="1">
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={showCreateCategoryModal}>
                Add Category
              </Button>
            </div>
            <Table dataSource={categories} columns={categoryColumns} rowKey="_id" pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="Subcategories" key="2">
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <Button type="primary" icon={<TagOutlined />} onClick={showAddSubCategoryModal}>
                Add Subcategory
              </Button>
            </div>
            <Table
              dataSource={categories.filter((c) => c.hasSubType)}
              columns={subCategoryColumns}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? "Edit Category" : "Create Category"}
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        footer={null}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={editingCategory ? handleUpdateCategory : handleCreateCategory}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item name="hasSubType" label="Has Subtypes" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {editingCategory ? "Update" : "Create"}
              </Button>
              <Button onClick={() => setCategoryModalVisible(false)} icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        title="Add Subcategory"
        open={subCategoryModalVisible}
        onCancel={() => setSubCategoryModalVisible(false)}
        footer={null}
      >
        <Form form={subCategoryForm} layout="vertical" onFinish={handleAddSubCategory}>
          <Form.Item
            name="categoryId"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select placeholder="Select category">
              {categories
                .filter((c) => c.hasSubType)
                .map((category) => (
                  <Select.Option key={category._id} value={category._id}>
                    {category.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="subName"
            label="Subcategory Name"
            rules={[{ required: true, message: "Please enter subcategory name" }]}
          >
            <Input placeholder="Enter subcategory name" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Add
              </Button>
              <Button onClick={() => setSubCategoryModalVisible(false)} icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
