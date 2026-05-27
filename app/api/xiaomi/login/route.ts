import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/features/auth/schemas/auth"
import { AuthService } from "@/features/auth/services/AuthService"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body", raw: result.error },
        { status: 400 }
      )
    }

    const { email, password } = result.data
    const authService = new AuthService()
    const response = await authService.login(email, password)

    const res = NextResponse.json(response)

    if (response.status === "otp_required" && response.sessionData) {
      // Store the session data in an encrypted HttpOnly cookie
      res.cookies.set(
        "mimo_auth_session",
        JSON.stringify(response.sessionData),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 15, // 15 minutes
        }
      )

      // Remove sessionData from the response payload before sending to client
      delete response.sessionData
    }

    return res
  } catch (error: unknown) {
    console.error("Login API Error:", error)
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
