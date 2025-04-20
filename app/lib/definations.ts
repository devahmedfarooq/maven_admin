import { z } from 'zod'

export const SigninSchema  = z.object({
    email : z.string().email("Please Enter A Valid Email"),
    password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})


export type SigninFormState =
    | { error: { email: string[]; password: string[] }; msg?: undefined }
    | { msg: string; error?: undefined };


export type SessionPayload = {
    token : string,
    verified : string,
    email : string,
    id : string
}