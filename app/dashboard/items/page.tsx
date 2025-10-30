"use client"

import { useItems } from "@/services/apis/items"
import { Card, Space, Table, Pagination, Spin, Alert, Button } from "antd"
import Link from "next/link"
import { useEffect, useState } from "react"
import CreateItemModal from "@/components/ui/CreateItemModal"

export default function ItemsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const { data, isError, isPending, refetch } = useItems(page, pageSize)

  useEffect(() => {
    refetch()
  }, [page, pageSize, refetch])

  const dataSource =
    data?.items?.map((item: any) => ({
      key: item._id,
      title: item.title,
      type: item.type,
      subType: item.subType,
      price: item.price.map((p: any) => `${p.type}: $${p.cost}`).join(", "),
      location: item.location || "",
    })) || []

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Category",
      dataIndex: "type",
      key: "type",
      render: (category: any) => (category && category.name ? <p>{category.name}</p> : <p>N/A</p>),
    },
    {
      title: "Subcategory",
      dataIndex: "subType",
      key: "subType",
      render: (subType: any) => (subType ? <p>{subType}</p> : <p>N/A</p>),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location: any) => (location ? <p style={{ textTransform: "capitalize" }}> {location} </p> : "N/A"),
    },
    {
      title: "Actions",
      render: ({ key }: any) => (
        <Link href={`/dashboard/items/${key}`} className="text-blue-500 hover:underline">
          View Details
        </Link>
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Space direction="vertical" className="w-full" size="large">
        <Space size="middle" className="w-full flex flex-wrap justify-start">
          <Card title="Total Items" className="w-48 text-center">
            <span className="text-xl font-bold">{data?.pagination?.totalItems || 0}</span>
          </Card>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Create Item
          </Button>
        </Space>

        {isError && <Alert message="Error loading items" type="error" showIcon />}

        <Spin spinning={isPending}>
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            className="shadow-md rounded-lg overflow-hidden"
          />
        </Spin>

        <Pagination
          current={page}
          pageSize={pageSize}
          total={data?.pagination?.totalItems || 0}
          onChange={(newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize || 10)
          }}
          showSizeChanger
          pageSizeOptions={["2", "5", "10", "20", "50"]}
          className="flex justify-center mt-4"
        />

        <CreateItemModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onItemCreated={refetch}
          setIsModalVisible={setIsModalVisible}
        />
      </Space>
    </div>
  )
}
