'use client'
import Sidebar from '@/components/ui/Sidebar'
import { Layout } from 'antd'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '../lib/get-token'

const { Sider, Content } = Layout

export default function Layoutd({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
            router.push('/auth');
        }
    }, [router]);

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
