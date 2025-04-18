'use client'
import Sidebar from '@/components/ui/Sidebar'
import { Layout } from 'antd'

const { Sider, Content } = Layout

export default function Layoutd({ children }: { children: React.ReactNode }) {
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
