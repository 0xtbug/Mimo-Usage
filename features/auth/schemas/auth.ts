import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const verifyOtpSchema = z.object({
  sessionId: z.string().min(1, { message: "sessionId is required" }),
  otp: z.string().min(1, { message: "otp is required" }),
})

export const refreshSchema = z.object({
  cookie: z.string().min(1, { message: "cookie is required" }),
})
