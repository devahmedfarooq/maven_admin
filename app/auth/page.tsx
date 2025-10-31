'use client';

import { useActionState, useEffect, useRef } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { Typography, Card, message, Spin } from 'antd';
import { SigninFormState } from '@/app/lib/definations';
import { signin } from '@/app/actions/auth';

const { Title } = Typography;

const AuthPage = () => {
    const initialState: SigninFormState = {
        error: { email: [], password: [] }
    };
    
    const [state, formAction, isPending] = useActionState(signin, initialState);

    const router = useRouter();

    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
    
        if (!isPending) {
            if (state?.msg) {
                message.success(state.msg);
                // Redirect is now handled server-side in the signin action
            } else if (state?.error && (state.error.email.length > 0 || state.error.password.length > 0)) {
                const emailErrors = state.error.email.join('\n');
                const passwordErrors = state.error.password.join('\n');
                message.error(`Login Failed:\n${emailErrors}\n${passwordErrors}`);
            }
        }
    }, [state, isPending]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            {isPending ? (
                <Spin size="large" />
            ) : (
                <Card className="w-96 shadow-lg p-6">
                    <Title level={3} className="text-center">
                        MAVEN APP ADMIN PANEL - Login
                    </Title>
                    <form action={formAction}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="email">Email</label><br />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                            {state?.error?.email?.map((err, i) => (
                                <p key={i} style={{ color: 'red', margin: 0 }}>{err}</p>
                            ))}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="password">Password</label><br />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                            {state?.error?.password?.map((err, i) => (
                                <p key={i} style={{ color: 'red', margin: 0 }}>{err}</p>
                            ))}
                        </div>

                        <div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#1890ff',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                disabled={isPending}
                            >
                                {isPending ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
};

export default AuthPage;
