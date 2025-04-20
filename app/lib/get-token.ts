// lib/get-auth-headers.ts
"use server";

import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";

export async function getToken() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) return null;

    const payload = await decrypt(session);
    if (payload?.token) {
        /* return {
            Authorization: `Bearer ${payload.token}`
        }; */
        return String(payload.token) 
    }

    return null;
}
