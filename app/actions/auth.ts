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
        const user = (await backendAPI.post("/auth/admin-login", data)).data;

        if(user) {
            const retrivedData = user.token
            await createSession(retrivedData)
        }
      //  redirect('/dashboard');

        return { msg: 'User has been logged in' };
    } catch (err: any) {
        return { msg: err?.response?.data?.message || err.message || 'Unknown error' };
    }
}


export async function logout() {
    deleteSession()
    redirect('/auth')
  }