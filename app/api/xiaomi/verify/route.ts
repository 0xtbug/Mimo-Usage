import { NextRequest, NextResponse } from "next/server"
import { verifyOtpSchema } from "@/features/auth/schemas/auth"
import { AuthService } from "@/features/auth/services/AuthService"
import { AuthSession } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = verifyOtpSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body", raw: result.error },
        { status: 400 }
      )
    }

    const { otp } = result.data

    // Read the session from the cookie
    const sessionCookie = req.cookies.get("mimo_auth_session")?.value
    if (!sessionCookie) {
      return NextResponse.json(
        {
          status: "error",
          message: "Session expired or not found. Please restart login.",
        },
        { status: 400 }
      )
    }

    let sessionData: AuthSession
    try {
      sessionData = JSON.parse(sessionCookie)
    } catch {
      return NextResponse.json(
        { status: "error", message: "Invalid session format." },
        { status: 400 }
      )
    }

    const authService = new AuthService()
    const response = await authService.verifyOtp(sessionData, otp)

    const res = NextResponse.json(response)

    // If verification was successful, clear the auth session cookie
    if (response.status === "success") {
      res.cookies.delete("mimo_auth_session")
    }

    return res
  } catch (error: unknown) {
    console.error("Verify API Error:", error)
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
