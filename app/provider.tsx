// app/providers.jsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import '@ant-design/v5-patch-for-react-19';
export default function Providers({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    const [queryClient] = React.useState(() => new QueryClient())

    return (<>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
       <ReactQueryDevtools client={queryClient} />
        </>
    )
}