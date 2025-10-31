import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { SessionPayload } from '@/app/lib/definations'
import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
const secretKey = process.env.SESSION_SECRET
if (!secretKey) {
    throw new Error('SESSION_SECRET environment variable is not set')
}
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payLoad: any) {
    return new SignJWT(payLoad)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256']
        })
        return payload
    } catch (error) {
        console.log("Failed to Verify Session")
    }
}

export async function createSession(payload: SessionPayload) {
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt(payload)

  const response = NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL))

  response.cookies.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expireAt,
    sameSite: 'lax',
    path: '/',
  })

  return response
}


export async function updateSession() {
    const session = (await cookies()).get('session')?.value
    const payload = await decrypt(session)
   
    if (!session || !payload) {
      return null
    }
   
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
   
    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })
  }


export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    // Note: localStorage can't be accessed in server components
    // The client-side code should handle localStorage cleanup
    redirect('/auth')
  }