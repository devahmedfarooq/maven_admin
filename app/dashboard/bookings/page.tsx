"use client"

import { useEffect, useState } from "react"
import {
  Table,
  Pagination,
  Card,
  Typography,
  Spin,
  message,
  Empty,
  Alert,
  Button,
  Modal,
  Form,
  Input,
  Statistic,
  Row,
  Col,
  DatePicker,
  Select,
  Checkbox,
} from "antd"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useBookings, useBookingsMutation, useCategories, useItemsByCategory } from "@/services/apis/bookings"
import moment from "moment" // Import moment for date handling

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface Booking {
  _id: string
  personalInfo: {
    name: string
    email: string
    phone: string
    address?: string
  }
  summary: {
    total: number
    gst: number
    subtotal: number
    items: { name: string; cost: number; amount: number }[]
  }
  appointment?: {
    date?: string
    time?: string
  }
  details: { type: string; key: string; value: any }[]
  createdAt: string
  status: string
}

const Page = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const queryClient = useQueryClient()

  // State for selected category and item
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Filter state
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    dateRange: null as [moment.Moment, moment.Moment] | null,
    status: "",
  })

  // Fetch bookings
  const { data, isError, isLoading } = useBookings(currentPage, pageSize, message)

  // Fetch all categories
  const { categories, isLoadingCategories, isErrorCategories } = useCategories(message)

  // Fetch items based on selected category
  const { items, isLoadingItems } = useItemsByCategory(selectedCategory, 1, 100, message)

  // Booking mutation
  const mutation = useBookingsMutation(queryClient, message, setIsModalOpen, form)

  // Update category when form field changes
  useEffect(() => {
    const categoryValue = form.getFieldValue(["summary", "type"])
    if (categoryValue) {
      setSelectedCategory(categoryValue)
    }
  }, [form.getFieldValue(["summary", "type"])])

  // Handle item selection
  const handleSelectedItem = (value: string) => {
    if (value) {
      const parsedItem = JSON.parse(value)
      setSelectedItem(parsedItem)
      form.setFieldsValue({
        summary: {
          ...form.getFieldValue("summary"),
          subtotal: undefined,
          amount: 1,
        },
      })
    } else {
      setSelectedItem(null)
    }
  }

  // Handle booking creation
  const handleCreateBooking = (values: any) => {
    const item = JSON.parse(values.summary.items)
    mutation.mutate({
      appointment: values.appointment,
      details: values.details,
      summary: {
        items: [
          {
            name: item.title,
            cost: values.summary.subtotal,
            amount: Number(values.summary.amount),
            id: item._id,
            img: item.imgs?.length > 0 ? item.imgs[0] : "https://unsplash.it/640",
          },
        ],
        subtotal: Number(values.summary.amount) * values.summary.subtotal,
        gst: (values.summary.gst / 100) * (Number(values.summary.amount) * values.summary.subtotal),
        total:
          Number(values.summary.amount) *
          (values.summary.subtotal + (values.summary.gst / 100) * values.summary.subtotal),
      },
      personalInfo: values.personalInfo,
    })
  }

  // Handle filter changes
  const handleFilterChange = () => {
    const values = filterForm.getFieldsValue()
    setFilters({
      name: values.name || "",
      email: values.email || "",
      dateRange: values.dateRange,
      status: values.status || "",
    })
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Clear filters
  const handleClearFilters = () => {
    filterForm.resetFields()
    setFilters({
      name: "",
      email: "",
      dateRange: null,
      status: "",
    })
    setCurrentPage(1)
  }

  // Filter bookings
  const filteredData = data?.data?.filter((booking: Booking) => {
    const nameMatch = filters.name
      ? booking.personalInfo.name.toLowerCase().includes(filters.name.toLowerCase())
      : true
    const emailMatch = filters.email
      ? booking.personalInfo.email.toLowerCase().includes(filters.email.toLowerCase())
      : true
    const dateMatch = filters.dateRange
      ? moment(booking.createdAt).isBetween(filters.dateRange[0], filters.dateRange[1], "day", "[]")
      : true
    const statusMatch = filters.status ? booking.status.toLowerCase() === filters.status.toLowerCase() : true

    return nameMatch && emailMatch && dateMatch && statusMatch
  })

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: ["personalInfo", "name"],
      key: "name",
    },
    {
      title: "Email",
      dataIndex: ["personalInfo", "email"],
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: ["personalInfo", "phone"],
      key: "phone",
    },
    {
      title: "Total Price",
      dataIndex: ["summary", "total"],
      key: "total",
      render: (total: number) => `Rs.${total.toLocaleString()}`,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <p className="capitalize">{status}</p>,
    },
    {
      title: "Action",
      dataIndex: "_id",
      key: "_id",
      render: (_id: string) => <Link href={`/dashboard/bookings/${_id}`}>More Details</Link>,
    },
  ]

  return (
    <Card style={{ margin: "20px auto", maxWidth: 1000, padding: 20 }}>
      <Title level={2} style={{ textAlign: "center" }}>
        Booking List
      </Title>

      {/* Important Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Statistic title="Total Bookings" value={data?.total || 0} />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Revenue"
            value={`Rs. ${data?.data.reduce((sum: number, b: Booking) => sum + b.summary.total, 0) || 0}`}
          />
        </Col>
      </Row>

      {/* Filter Form */}
      <Form form={filterForm} layout="inline"  onValuesChange={handleFilterChange} style={{ marginBottom: 20 }}>
        <Form.Item label="Name" name="name">
          <Input placeholder="Filter by name" />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="Filter by email" />
        </Form.Item>
        <Form.Item label="Date Range" name="dateRange">
          <RangePicker />
        </Form.Item>
        <Form.Item label="Status" name="status">
          <Select placeholder="Filter by status" allowClear>
            <Option value="pending">Pending</Option>
            <Option value="contacted">Contacted</Option>
            <Option value="declinded">Declinded</Option>
            <Option value="confirmed">Confirmed</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
        </Form.Item>
      </Form>

      {/* Create Booking Button */}
      <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: 20 }}>
        + Create Booking
      </Button>

      {/* Table */}
      {isLoading ? (
        <Spin size="large" style={{ display: "block", margin: "20px auto" }} />
      ) : isError ? (
        <Alert message="Failed to fetch bookings" type="error" showIcon />
      ) : filteredData?.length === 0 ? (
        <Empty description="No Bookings Found" style={{ margin: "20px auto" }} />
      ) : (
        <>
          <Table columns={columns} dataSource={filteredData} rowKey="_id" pagination={false} bordered />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData?.length || 0}
            onChange={(page, pageSize) => {
              setCurrentPage(page)
              setPageSize(pageSize)
            }}
            showSizeChanger
            style={{ marginTop: 20, textAlign: "center" }}
          />
        </>
      )}

      {/* Create Booking Modal */}
      <Modal title="Create Booking" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={700}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleCreateBooking}
          initialValues={{ summary: { amount: 1, gst: 18 } }}
        >
          <Title level={4}>Summary</Title>

          {/* Category Selection */}
          <Form.Item
            label="Category"
            name={["summary", "type"]}
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              onChange={(value) => setSelectedCategory(value)}
              loading={isLoadingCategories}
              placeholder="Select a category"
            >
              {isErrorCategories ? (
                <Option value="" disabled>
                  Failed to load categories
                </Option>
              ) : (
                categories?.map((category: any) => (
                  <Option key={category._id} value={category.type}>
                    {category.name}
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>

          {/* Item Selection */}
          <Form.Item
            label="Item"
            name={["summary", "items"]}
            rules={[{ required: true, message: "Please select an item" }]}
          >
            <Select
              onChange={handleSelectedItem}
              loading={isLoadingItems}
              placeholder="Select an item"
              disabled={!selectedCategory}
              allowClear
            >
              {items?.items?.map((item: any) => (
                <Option key={item._id} value={JSON.stringify(item)}>
                  {item.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* GST */}
          <Form.Item
            label="GST (%)"
            name={["summary", "gst"]}
            rules={[{ required: true, message: "Please enter GST percentage" }]}
          >
            <Input type="number" max={100} min={0} />
          </Form.Item>

          {/* Quantity */}
          <Form.Item
            label="Quantity"
            name={["summary", "amount"]}
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <Input type="number" max={100} min={1} />
          </Form.Item>

          {/* Price Options */}
          {selectedItem && selectedItem.price && (
            <Form.Item
              name={["summary", "subtotal"]}
              label="Price"
              rules={[{ required: true, message: "Please select a price option" }]}
            >
              <Select placeholder="Select price option">
                {selectedItem.price.map((p: any, index: number) => (
                  <Option key={index} value={p.cost}>
                    Rs. {p.cost} - {p.type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Appointment Section (for hotels) */}
          {selectedCategory && (
            <>
              <Title level={4}>Appointment</Title>
              <Form.Item
                label="Date"
                name={["appointment", "date"]}
                rules={[{ required: true, message: "Please select a date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Time"
                name={["appointment", "time"]}
                rules={[{ required: true, message: "Please enter a time" }]}
              >
                <Input placeholder="Enter time" />
              </Form.Item>
            </>
          )}

          {/* Personal Info Section */}
          <Title level={4}>Personal Info</Title>
          <Form.Item
            label="Name"
            name={["personalInfo", "name"]}
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name={["personalInfo", "email"]}
            rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone"
            name={["personalInfo", "phone"]}
            rules={[{ required: true, message: "Please enter a phone number" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Address" name={["personalInfo", "address"]}>
            <Input />
          </Form.Item>

          {/* Details Section */}
          {selectedItem && selectedItem.keyvalue && selectedItem.keyvalue.length > 0 && (
            <>
              <Title level={4}>Details</Title>
              <Title level={5}>{selectedItem.title}</Title>

              {selectedItem.keyvalue.map((detail: any, index: number) => (
                <div key={`detail-${index}`}>
                  <Form.Item style={{ display: "none" }} name={["details", index, "key"]} initialValue={detail.key} />
                  <Form.Item style={{ display: "none" }} name={["details", index, "type"]} initialValue={detail.type} />

                  <Form.Item
                    label={detail.key}
                    name={["details", index, "value"]}
                    rules={[{ required: true, message: `Please provide ${detail.key}` }]}
                  >
                    {detail.type === "text" ? (
                      <Input placeholder="Enter your response" />
                    ) : detail.type === "checkbox" ? (
                      <Checkbox>Check if applicable</Checkbox>
                    ) : detail.type === "select" ? (
                      <Select placeholder="Select an option">
                        {detail.options?.map((opt: string) => (
                          <Option key={opt} value={opt}>
                            {opt}
                          </Option>
                        ))}
                      </Select>
                    ) : detail.type === "date" ? (
                      <DatePicker style={{ width: "100%" }} />
                    ) : detail.type === "time" ? (
                      <Input placeholder="Enter time (e.g., 10:00 AM)" />
                    ) : null}
                  </Form.Item>
                </div>
              ))}
            </>
          )}

          {/* Submit Button */}
          <Button type="primary" htmlType="submit" block loading={mutation.isLoading}>
            Create Booking
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}

export default Page