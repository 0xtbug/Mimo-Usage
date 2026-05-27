import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  verifyPassword,
  encryptSession,
  getSessionCookieName,
  isSecureContext,
} from "@/lib/auth"

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { password } = result.data

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }

    // Generate JWT session
    const token = await encryptSession({
      authenticated: true,
      role: "admin",
    })

    const res = NextResponse.json({ success: true })

    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: isSecureContext(),
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return res
  } catch (error: unknown) {
    console.error("Dashboard Login Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
