"use client";

import { Modal, Form, Input, Button, InputNumber, Select, Space } from "antd";
import { useCreateItem } from "@/services/apis/items";
import { useEffect, useState } from "react";
import backendAPI from '@/services/apis/api'

const { Option } = Select;

type Categories = {
    name : string
    hasSubType : boolean
    subName : string[]
    _id:string
}

export default function CreateItemModal({ visible, onClose, onItemCreated, setIsModalVisible }) {
    const [form] = Form.useForm();
    const [categories,setCategoires] = useState<Categories[]>([])


    useEffect(() => {
        async function fetchData () {
            try {
            const {data,status} = await backendAPI.get<Categories[]>('/category')
            setCategoires(data)
          //  console.log(data,status)
            } catch (error) {
                console.log(`Error Fetching Categories : `,error.message)
            }

        }
        fetchData()
    },[])

    const createItem = useCreateItem();

    /* useEffect(() => {
        if (!visible && form) {
            form.resetFields();
        }
    }, [visible, form]); */


    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Ensure required fields exist before sending
            const formattedValues = {
                title: values.title ?? "",  // Ensure title exists
                subtitle: values.subtitle ?? "",
                about: values.about ?? "",
                type: values.type ?? "", // Ensure type exists
                location: values.location ?? "",
                imgs: values.imgs ?? [], // Default to an empty array
                price: values.price ?? [], // Default to an empty array
            };

            console.log("Submitting values:", formattedValues); // Debugging: See what's being sent

            await createItem.mutateAsync(formattedValues);
            onItemCreated();
            onClose();
            form.resetFields();
        } catch (error) {
            console.error("Form validation or API call failed:", error);
        }
    };



    return (
        <Modal
            title="Create Item"
            open={visible}
            onCancel={() => {
                setIsModalVisible(false)
                form.resetFields()
            }}
            footer={[
                <Button key="cancel" onClick={() => {
                    setIsModalVisible(false)
                    form.resetFields()
                }}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit}>
                    Create
                </Button>,
            ]}
        >
            <Form
                form={form} // ✅ Pass the form instance
                layout="vertical"
            >
                <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="subtitle" label="Subtitle">
                    <Input />
                </Form.Item>

                <Form.Item name="about" label="About" rules={[{ required: true, message: "About is required" }]}>
                    <Input.TextArea />
                </Form.Item>

                <Form.Item name="type" label="Type" rules={[{ required: true, message: "Type is required" }]}>
                    <Select disabled={categories.length == 0 }>
                        
                        {categories.length == 0  && <Option value="">None</Option>}
                        {
                            categories.map(category => <Option key={category._id} value={`${category._id}`}>{category.name}</Option>)
                        }
                    </Select>
                </Form.Item>

                <Form.Item name="location" label="Location" rules={[{ required: true, message: "Location is required" }]}>
                    <Select>
                        <Option value="mirpur">Mirpur</Option>
                        <Option value="islamabad">Islamabad</Option>
                    </Select>
                </Form.Item>


                {/* PRICE LIST */}
                <Form.List name="price">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, "cost"]}
                                        rules={[{ required: true, message: "Cost is required" }]}
                                    >
                                        <InputNumber placeholder="Cost" style={{ width: "100%" }} />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "type"]}
                                        rules={[{ required: true, message: "Type is required" }]}
                                    >
                                        <Input placeholder="Price Type" />
                                    </Form.Item>
                                    <Button onClick={() => remove(name)}>-</Button>
                                </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} block>
                                + Add Price
                            </Button>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
}
