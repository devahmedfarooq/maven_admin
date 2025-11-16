import axios from 'axios';
import { SigninSchema, SigninFormState } from '@/app/lib/definations';

export async function signin(prevState: SigninFormState, formData: FormData): Promise<SigninFormState> {

    const backendAPI = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    })

    try {
        const rawData = {
            email: formData.get("email"),
            password: formData.get("password")
        };

        const validatedValues = SigninSchema.safeParse(rawData);

        if (!validatedValues.success) {
            return {
                error: {
                    email: validatedValues.error.flatten().fieldErrors.email || [],
                    password: validatedValues.error.flatten().fieldErrors.password || [],
                }
            };
        }

        const data = validatedValues.data;
        const response = (await backendAPI.post("/auth/admin-login", data)).data;

        console.log('User data received from backend:', response);

        if(response && response.token) {
            // Backend returns nested structure: { token: { token: 'jwt...', verified: false, email: '...', id: '...' } }
            const sessionData = {
                token: response.token.token,
                verified: String(response.token.verified),
                email: response.token.email,
                id: response.token.id
            };
            console.log('Storing auth data in localStorage');
            
            // Store in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', sessionData.token);
                localStorage.setItem('userEmail', sessionData.email);
                localStorage.setItem('userId', sessionData.id);
                localStorage.setItem('userVerified', sessionData.verified);
            }
            
            return { msg: 'Login successful. Redirecting...' };
        }

        return { msg: 'User has been logged in' };
    } catch (err: any) {
        return { msg: err?.response?.data?.message || err.message || 'Unknown error' };
    }
}


export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('userVerified');
        window.location.href = '/auth';
    }
}