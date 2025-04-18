"use client";

import { useEffect, useState } from "react";
import { Table, Pagination, Card, Typography, Spin, message, Empty, Alert, Button, Modal, Form, Input, InputNumber, Statistic, Row, Col, DatePicker, Select, Space } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/apis/api";
import Link from "next/link";
import { useItems } from '@/services/apis/items'
import { useBookings, useBookingsMutation } from "@/services/apis/bookings";

const { Title } = Typography;
const { Option } = Select;

interface Booking {
  _id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  summary: {
    total: number;
    gst: number;
    subtotal: number;
    items: { name: string; cost: number; amount: number }[];
  };
  appointment?: {
    date?: string;
    time?: string;
  };
  details: { type: string; key: string; value: any }[];
  createdAt: string;
}





const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const [type, setType] = useState<string | undefined>();
  const [selectedItems, setSelectedItems] = useState([])
  const items = useItems(1, 100, { type })


  const { data, isError, isLoading } = useBookings(currentPage, pageSize, message)
  const mutation = useBookingsMutation(queryClient, message, setIsModalOpen, form)


  useEffect(() => {
    setType(form.getFieldValue(["summary", "type"]));
  }, [form.getFieldValue(["summary", "type"])]);


  const handleSelectedItems = (e: string) => {
    //console.log("Value :", e)
    if (e) {
      setSelectedItems([JSON.parse(e)])
    }
  }



  const handleCreateBooking = (values: any) => {
    const item = JSON.parse(values.summary.items)
    console.log(item)
    mutation.mutate({
      appointment: values.appointment,
      details: values.details,
      summary: {
        items: [{
          name: item.title,
          cost: values.summary.subtotal,
          amount: Number(values.summary.amount),
          id: item._id,
          img : item.imgs.length > 0 ? item.imgs[0] : "https://unsplash.it/640"
        }],
        subtotal: Number(values.summary.amount) * (values.summary.subtotal),
        gst: ((values.summary.gst / 100) * (Number(values.summary.amount) * (values.summary.subtotal))),
        total: Number(values.summary.amount) * (values.summary.subtotal + ((values.summary.gst / 100) * values.summary.subtotal)),
      },
      personalInfo: values.personalInfo,
    });
  };


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
      title: "Action",
      dataIndex: "_id",
      key: "_id",
      render: (_id: string) => <Link href={`/dashboard/bookings/${_id}`}> More Details</Link>,
    }
  ];

  return (
    <Card style={{ margin: "20px auto", maxWidth: 1000, padding: 20 }}>
      <Title level={2} style={{ textAlign: "center" }}>Booking List</Title>

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

      {/* Create Booking Button */}
      <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: 20 }}>
        + Create Booking
      </Button>


      {/* Table */}
      {isLoading ? (
        <Spin size="large" style={{ display: "block", margin: "20px auto" }} />
      ) : isError ? (
        <Alert message="Failed to fetch bookings" type="error" showIcon />
      ) : data?.data.length === 0 ? (
        <Empty description="No Bookings Found" style={{ margin: "20px auto" }} />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={data?.data}
            rowKey="_id"
            pagination={false}
            bordered
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={data?.total || 0}
            onChange={(page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            }}
            showSizeChanger
            style={{ marginTop: 20, textAlign: "center" }}
          />
        </>
      )}

      {/* Create Booking Modal */}
      <Modal title="Create Booking" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleCreateBooking}>
          <Title level={4}>Summary</Title>
          <Form.Item label="Type" name={["summary", "type"]}>
            <Select onChange={(value) => setType(value)}>
              <Select.Option value={"hotel"}>
                Hotel
              </Select.Option>
              <Select.Option value={"cars"}>
                Cars
              </Select.Option>
              <Select.Option value={"services"}>
                Services
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Item" name={["summary", "items"]}>
            <Select /* mode="multiple" */ onChange={handleSelectedItems} onClear={() => setSelectedItems([])} value={selectedItems} allowClear>
              {
                items?.data?.items?.map((item) => (
                  <Select.Option key={item._id} value={JSON.stringify(item)}>
                    {item.title}
                  </Select.Option>
                ))
              }
            </Select>
          </Form.Item>


          <Form.Item label={"GST"} name={["summary", "gst"]}>
            <Input type="number" max={100} min={0} />
          </Form.Item>

          <Form.Item label={"Quantity"} name={["summary", "amount"]}>
            <Input type="number" max={100} min={0} />
          </Form.Item>

          {
            selectedItems.length > 0 ? selectedItems.map(item => <>
              <Form.Item name={["summary", "subtotal"]} label={"Price"}><Select>
                {
                  item.price.map(p => <Select.Option value={p.cost}>Rs. {p.cost} - {p.type}</Select.Option>)
                }
              </Select></Form.Item>
            </>) : <></>
          }

          {
            type == "hotel" && <>

              <Title level={4}>Appointment</Title>
              <Form.Item label="Date" name={["appointment", "date"]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Time" name={["appointment", "time"]}>
                <Input placeholder="Enter time" />
              </Form.Item>


            </>
          }


          <Title level={4}>Personal Info</Title>
          <Form.Item label="Name" name={["personalInfo", "name"]} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name={["personalInfo", "email"]} rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name={["personalInfo", "phone"]} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Address" name={["personalInfo", "address"]}>
            <Input />
          </Form.Item>

          <Title level={4}>Details</Title>
          {selectedItems?.map((item, index) => (

            <>
              <Title level={5}>{item.title}</Title>
              {item?.keyvalue?.map((detail, i) => (
                <>

                  <Form.Item style={{ display: "none" }} name={["details", index, "key"]} initialValue={detail.key} />
                  <Form.Item style={{ display: "none" }} name={["details", index, "type"]} initialValue={detail.type} />


                  <Form.Item
                    key={`${index}-${i}`}
                    label={detail.key}
                    name={["details", index, "value"]}

                  >
                    {detail.type === "text" ? (
                      <Input placeholder="Enter your response" />
                    ) : detail.type === "checkbox" ? (
                      <Checkbox>Check if applicable</Checkbox>
                    ) : detail.type === "select" ? (
                      <Select placeholder="Select an option">
                        {detail.options?.map((opt) => (
                          <Select.Option key={opt} value={opt}>
                            {opt}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : detail.type === "date" ? (
                      <DatePicker style={{ width: "100%" }} />
                    ) : detail.type === "time" ? (
                      <Input placeholder="Enter time (e.g., 10:00 AM)" />
                    ) : null}
                  </Form.Item>

                </>
              ))}

            </>
          ))}



          {/*  {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16}>
                    <Col span={24}>
                      <Form.Item {...restField} name={[form.getFieldValue(['summary','items'])[key].title]}>

                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, "type"]}>
                        <Select placeholder="Select type">
                          <Option value="checkbox">Checkbox</Option>
                          <Option value="options">Options</Option>
                          <Option value="select">Select</Option>
                          <Option value="date">Date</Option>
                          <Option value="time">Time</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, "key"]}>
                        <Input placeholder="Key" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, "value"]}>
                        <Input placeholder="Value" />
                      </Form.Item>
                    </Col>
                    <Button onClick={() => remove(name)}>Remove</Button>
                  </Row>
                ))}
                <Button onClick={() => add()}>Add Detail</Button>
              </>
            )} */}

          <Button type="primary" htmlType="submit" block loading={mutation.isLoading}>
            Create Booking
          </Button>
        </Form>
      </Modal>




    </Card>
  );
};

export default Page;
