'use client'
import Sidebar from '@/components/ui/Sidebar'
import { Layout } from 'antd'
import { useEffect } from 'react'
import { getToken } from '../lib/get-token'

const { Sider, Content } = Layout

export default function Layoutd({ children }: { children: React.ReactNode }) {

    useEffect(() => {

        async function setLocalStorage() {
            const token = await getToken()
            if (token) {
                localStorage.setItem("authToken", token)
            }
        }

        setLocalStorage()

    }, [])

    return (
        <Layout className="h-screen overflow-hidden">
            <Sider theme="light">
                <Sidebar />
            </Sider>

            <Content className="overflow-auto p-4">
                {children}
            </Content>
        </Layout>
    )
}
