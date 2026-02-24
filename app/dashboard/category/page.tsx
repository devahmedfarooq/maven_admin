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
import { 
  HomeOutlined, CarOutlined, LineOutlined, BellOutlined, 
  RestOutlined, MedicineBoxOutlined, BookOutlined, 
  ShopOutlined, ToolOutlined, HeartOutlined, StarOutlined,
  CalendarOutlined, UserOutlined, SettingOutlined,
  SearchOutlined, MenuOutlined, GiftOutlined, TrophyOutlined
} from "@ant-design/icons"
import axios from "@/services/apis/api"

const { TabPane } = Tabs

// Types
interface Category {
  _id: string
  name: string
  hasSubType: boolean
  subName: string[]
  appointmentDateLabel?: string
  appointmentTimeLabel?: string
  appointmentStartDateLabel?: string
  appointmentStartTimeLabel?: string
  appointmentEndDateLabel?: string
  appointmentEndTimeLabel?: string
  appointmentDescription?: string
  requiresAppointment?: boolean
  requiresDuration?: boolean
  requiresAppointment?: boolean
  icon?: string
}

interface CategoryFormValues {
  name: string
  hasSubType: boolean
  appointmentDateLabel: string
  appointmentTimeLabel: string
  appointmentStartDateLabel: string
  appointmentStartTimeLabel: string
  appointmentEndDateLabel: string
  appointmentEndTimeLabel: string
  appointmentDescription: string
  requiresDuration: boolean
  requiresAppointment: boolean
  icon: string
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
          appointmentStartDateLabel: values.appointmentStartDateLabel,
          appointmentStartTimeLabel: values.appointmentStartTimeLabel,
          appointmentEndDateLabel: values.appointmentEndDateLabel,
          appointmentEndTimeLabel: values.appointmentEndTimeLabel,
          appointmentDescription: values.appointmentDescription,
          requiresDuration: values.requiresDuration,
          icon: values.icon,
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
        appointmentStartDateLabel: values.appointmentStartDateLabel,
        appointmentStartTimeLabel: values.appointmentStartTimeLabel,
        appointmentEndDateLabel: values.appointmentEndDateLabel,
        appointmentEndTimeLabel: values.appointmentEndTimeLabel,
        appointmentDescription: values.appointmentDescription,
        requiresDuration: values.requiresDuration,
        icon: values.icon,
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
    categoryForm.setFieldsValue({
      appointmentStartDateLabel: "Start Date",
      appointmentStartTimeLabel: "Start Time",
      appointmentEndDateLabel: "End Date",
      appointmentEndTimeLabel: "End Time",
      appointmentDescription: "Select your preferred start and end dates",
      requiresDuration: false,
      icon: "", // Initialize icon field
    })
    setCategoryModalVisible(true)
  }

  const showEditCategoryModal = (category: Category) => {
    setEditingCategory(category)
    categoryForm.setFieldsValue({
      name: category.name,
      hasSubType: category.hasSubType,
      appointmentDateLabel: category.appointmentDateLabel || "Appointment Date",
      appointmentTimeLabel: category.appointmentTimeLabel || "Appointment Time",
      appointmentStartDateLabel: category.appointmentStartDateLabel || "Start Date",
      appointmentStartTimeLabel: category.appointmentStartTimeLabel || "Start Time",
      appointmentEndDateLabel: category.appointmentEndDateLabel || "End Date",
      appointmentEndTimeLabel: category.appointmentEndTimeLabel || "End Time",
      appointmentDescription: category.appointmentDescription || "Select your preferred appointment date and time",
      requiresAppointment: category.requiresAppointment !== false,
      requiresDuration: category.requiresDuration || false,
      icon: category.icon || "", // Set icon field
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
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 80,
      render: (icon: string) => {
        if (!icon) return <span style={{ color: "#999" }}>No icon</span>
        // You can import and use the actual icon component here
        // For now, we'll show the icon name
        return <span style={{ fontFamily: "monospace" }}>{icon}</span>
      },
    },
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
      title: "Requires Appointment",
      dataIndex: "requiresAppointment",
      key: "requiresAppointment",
      render: (requiresAppointment: boolean) => (requiresAppointment !== false ? "Yes" : "No"),
    },
    {
      title: "Requires Duration (Start/End)",
      dataIndex: "requiresDuration",
      key: "requiresDuration",
      render: (requiresDuration: boolean) => (requiresDuration ? "Yes" : "No"),
    },
    {
      title: "Appointment Settings",
      key: "appointmentSettings",
      render: (_: any, record: Category) => (
        <div>
          {record.requiresAppointment !== false && (
            <>
              <div><strong>Date Label:</strong> {record.appointmentDateLabel || "Appointment Date"}</div>
              <div><strong>Time Label:</strong> {record.appointmentTimeLabel || "Appointment Time"}</div>
              {record.requiresDuration && (
                <>
                  <div><strong>Start Date Label:</strong> {record.appointmentStartDateLabel || "Start Date"}</div>
                  <div><strong>Start Time Label:</strong> {record.appointmentStartTimeLabel || "Start Time"}</div>
                  <div><strong>End Date Label:</strong> {record.appointmentEndDateLabel || "End Date"}</div>
                  <div><strong>End Time Label:</strong> {record.appointmentEndTimeLabel || "End Time"}</div>
                </>
              )}
            </>
          )}
        </div>
      ),
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
        width={600}
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

          <Form.Item name="requiresAppointment" label="Requires Appointment" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="requiresDuration" label="Requires Duration (Start/End)" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="appointmentDateLabel"
            label="Appointment Date Label"
            rules={[{ required: true, message: "Please enter appointment date label" }]}
          >
            <Input placeholder="e.g., Appointment Date, Booking Date" />
          </Form.Item>

          <Form.Item
            name="appointmentTimeLabel"
            label="Appointment Time Label"
            rules={[{ required: true, message: "Please enter appointment time label" }]}
          >
            <Input placeholder="e.g., Appointment Time, Booking Time" />
          </Form.Item>

          <Form.Item
            name="appointmentStartDateLabel"
            label="Start Date Label"
            rules={[{ required: true, message: "Please enter start date label" }]}
          >
            <Input placeholder="e.g., Start Date, Check-in Date" />
          </Form.Item>

          <Form.Item
            name="appointmentStartTimeLabel"
            label="Start Time Label"
            rules={[{ required: true, message: "Please enter start time label" }]}
          >
            <Input placeholder="e.g., Start Time, Check-in Time" />
          </Form.Item>

          <Form.Item
            name="appointmentEndDateLabel"
            label="End Date Label"
            rules={[{ required: true, message: "Please enter end date label" }]}
          >
            <Input placeholder="e.g., End Date, Check-out Date" />
          </Form.Item>

          <Form.Item
            name="appointmentEndTimeLabel"
            label="End Time Label"
            rules={[{ required: true, message: "Please enter end time label" }]}
          >
            <Input placeholder="e.g., End Time, Check-out Time" />
          </Form.Item>

          <Form.Item
            name="appointmentDescription"
            label="Appointment Description"
            rules={[{ required: true, message: "Please enter appointment description" }]}
          >
            <Input.TextArea 
              placeholder="e.g., Select your preferred appointment date and time"
              rows={3}
            />
          </Form.Item>

          <Form.Item name="icon" label="Icon">
            <Select placeholder="Select an icon" showSearch>
              <Select.Option value="home">🏠 Home</Select.Option>
              <Select.Option value="car">🚗 Car</Select.Option>
              <Select.Option value="airplane">✈️ Airplane</Select.Option>
              <Select.Option value="bed">🛏️ Bed</Select.Option>
              <Select.Option value="restaurant">🍽️ Restaurant</Select.Option>
              <Select.Option value="medical">🏥 Medical</Select.Option>
              <Select.Option value="school">🎓 School</Select.Option>
              <Select.Option value="business">💼 Business</Select.Option>
              <Select.Option value="construct">🔧 Construct</Select.Option>
              <Select.Option value="fitness">💪 Fitness</Select.Option>
              <Select.Option value="gift">🎁 Gift</Select.Option>
              <Select.Option value="heart">❤️ Heart</Select.Option>
              <Select.Option value="star">⭐ Star</Select.Option>
              <Select.Option value="bookmark">🔖 Bookmark</Select.Option>
              <Select.Option value="calendar">📅 Calendar</Select.Option>
              <Select.Option value="time">⏰ Time</Select.Option>
              <Select.Option value="location">📍 Location</Select.Option>
              <Select.Option value="person">👤 Person</Select.Option>
              <Select.Option value="people">👥 People</Select.Option>
              <Select.Option value="settings">⚙️ Settings</Select.Option>
              <Select.Option value="notifications">🔔 Notifications</Select.Option>
              <Select.Option value="search">🔍 Search</Select.Option>
              <Select.Option value="menu">📋 Menu</Select.Option>
            </Select>
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
