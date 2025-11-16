"use server";
import axios from 'axios';
import { revalidatePath } from 'next/cache';
import { SigninSchema, SigninFormState } from '@/app/lib/definations';
import { createSession, decrypt, deleteSession } from '../lib/session';
import { redirect } from 'next/navigation';

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
            const sessionPayload = {
                token: response.token.token,
                verified: String(response.token.verified),
                email: response.token.email,
                id: response.token.id
            };
            console.log('Creating session for user.');
            await createSession(sessionPayload);
            redirect('/dashboard');
        }

        return { msg: 'User has been logged in' };
    } catch (err: any) {
        return { msg: err?.response?.data?.message || err.message || 'Unknown error' };
    }
}


export async function logout() {
    deleteSession()
    redirect('/auth')
  }