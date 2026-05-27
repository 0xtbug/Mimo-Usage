import { NextRequest, NextResponse } from "next/server"
import { getAccountById, getAccounts, extractCookieValue } from "@/lib/accounts"

const MIMO_BASE = "https://platform.xiaomimimo.com/api/v1/tokenPlan/apiKey"

const COMMON_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en",
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "x-timezone": "Asia/Bangkok",
}

async function resolveCookie(
  accountId: string | null
): Promise<string | undefined> {
  if (accountId) {
    const account = await getAccountById(accountId)
    return account?.cookie
  }
  const accounts = await getAccounts()
  return accounts[0]?.cookie || process.env.MIMO_COOKIE
}

/**
 * GET /api/apiKey?accountId=xxx
 * Proxies GET to MiMo /v1/tokenPlan/apiKey
 */
export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId")
  const cookie = await resolveCookie(accountId)

  if (!cookie) {
    return NextResponse.json(
      { code: -1, message: "No account configured. Add an account first." },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(MIMO_BASE, {
      method: "GET",
      headers: { ...COMMON_HEADERS, Cookie: cookie },
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { code: -1, message: "Failed to fetch API key from MiMo" },
      { status: 502 }
    )
  }
}

/**
 * POST /api/apiKey
 * Body: { action: "create" | "reset", accountId?: string }
 * Proxies POST to MiMo create or reset endpoint
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, accountId } = body as {
    action: "create" | "reset"
    accountId?: string
  }

  const cookie = await resolveCookie(accountId || null)

  if (!cookie) {
    return NextResponse.json(
      { code: -1, message: "No account configured. Add an account first." },
      { status: 500 }
    )
  }

  // Extract api-platform_ph cookie value for CSRF protection
  const platformPh = extractCookieValue(cookie, "api-platform_ph")
  if (!platformPh) {
    return NextResponse.json(
      {
        code: -1,
        message:
          "Missing api-platform_ph cookie. Re-add account with full cookie.",
      },
      { status: 400 }
    )
  }

  const url =
    action === "reset"
      ? `${MIMO_BASE}/reset?api-platform_ph=${encodeURIComponent(platformPh)}`
      : `${MIMO_BASE}?api-platform_ph=${encodeURIComponent(platformPh)}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...COMMON_HEADERS, Cookie: cookie },
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { code: -1, message: "Failed to create/reset API key on MiMo" },
      { status: 502 }
    )
  }
}
