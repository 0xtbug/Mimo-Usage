import { NextRequest, NextResponse } from "next/server"
import { refreshSchema } from "@/features/auth/schemas/auth"
import { AuthService } from "@/features/auth/services/AuthService"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = refreshSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body", raw: result.error },
        { status: 400 }
      )
    }

    const { cookie } = result.data
    const authService = new AuthService()
    const response = await authService.refresh(cookie)

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Refresh API Error:", error)
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
