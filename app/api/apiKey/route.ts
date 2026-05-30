import { NextRequest, NextResponse } from "next/server"
import {
  getAccountById,
  getAccounts,
  extractCookieValue,
  updateAccountCookie,
} from "@/lib/accounts"
import { AuthService } from "@/features/auth/services/AuthService"

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
): Promise<{ cookie: string | undefined; resolvedAccountId: string | null }> {
  if (accountId) {
    const account = await getAccountById(accountId)
    return { cookie: account?.cookie, resolvedAccountId: accountId }
  }
  const accounts = await getAccounts()
  if (accounts.length > 0) {
    return { cookie: accounts[0].cookie, resolvedAccountId: accounts[0].id }
  }
  return { cookie: process.env.MIMO_COOKIE, resolvedAccountId: null }
}

/**
 * Attempt a silent cookie refresh when the MiMo API returns 401.
 * Returns the new cookie string on success, or null on failure.
 */
async function tryRefreshCookie(
  accountId: string,
  currentCookie: string
): Promise<string | null> {
  try {
    console.log(
      `[ApiKey] 401 detected for account ${accountId}. Attempting silent refresh...`
    )
    const authService = new AuthService()
    const refreshData = await authService.refresh(currentCookie)

    if (refreshData.status === "success" && refreshData.cookie) {
      console.log(`[ApiKey] Silent refresh successful! Updating stored cookie.`)
      await updateAccountCookie(accountId, refreshData.cookie)
      return refreshData.cookie
    }

    console.error("[ApiKey] Silent refresh failed:", refreshData.message)
    return null
  } catch (err) {
    console.error("[ApiKey] Silent refresh threw an error:", err)
    return null
  }
}

/**
 * GET /api/apiKey?accountId=xxx
 * Proxies GET to MiMo /v1/tokenPlan/apiKey
 * Auto-refreshes expired session cookies on 401.
 */
export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId")
  const { cookie, resolvedAccountId } = await resolveCookie(accountId)

  if (!cookie) {
    return NextResponse.json(
      { code: -1, message: "No account configured. Add an account first." },
      { status: 500 }
    )
  }

  try {
    let response = await fetch(MIMO_BASE, {
      method: "GET",
      headers: { ...COMMON_HEADERS, Cookie: cookie },
    })
    let data = await response.json()

    // Handle 401 – attempt silent refresh and retry
    if (data.code === 401 && resolvedAccountId) {
      const newCookie = await tryRefreshCookie(resolvedAccountId, cookie)
      if (newCookie) {
        response = await fetch(MIMO_BASE, {
          method: "GET",
          headers: { ...COMMON_HEADERS, Cookie: newCookie },
        })
        data = await response.json()
      }
    }

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
 * Proxies POST to MiMo create or reset endpoint.
 * Auto-refreshes expired session cookies on 401.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, accountId } = body as {
    action: "create" | "reset"
    accountId?: string
  }

  const { cookie: initialCookie, resolvedAccountId } = await resolveCookie(
    accountId || null
  )

  if (!initialCookie) {
    return NextResponse.json(
      { code: -1, message: "No account configured. Add an account first." },
      { status: 500 }
    )
  }

  let activeCookie = initialCookie

  // Helper to build the POST URL with the current cookie's CSRF token
  function buildPostUrl(cookieStr: string) {
    const platformPh = extractCookieValue(cookieStr, "api-platform_ph")
    if (!platformPh) return null
    return action === "reset"
      ? `${MIMO_BASE}/reset?api-platform_ph=${encodeURIComponent(platformPh)}`
      : `${MIMO_BASE}?api-platform_ph=${encodeURIComponent(platformPh)}`
  }

  let url = buildPostUrl(activeCookie)
  if (!url) {
    return NextResponse.json(
      {
        code: -1,
        message:
          "Missing api-platform_ph cookie. Re-add account with full cookie.",
      },
      { status: 400 }
    )
  }

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: { ...COMMON_HEADERS, Cookie: activeCookie },
    })
    let data = await response.json()

    // Handle 401 – attempt silent refresh and retry
    if (data.code === 401 && resolvedAccountId) {
      const newCookie = await tryRefreshCookie(resolvedAccountId, activeCookie)
      if (newCookie) {
        activeCookie = newCookie
        url = buildPostUrl(activeCookie)
        if (url) {
          response = await fetch(url, {
            method: "POST",
            headers: { ...COMMON_HEADERS, Cookie: activeCookie },
          })
          data = await response.json()
        }
      }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { code: -1, message: "Failed to create/reset API key on MiMo" },
      { status: 502 }
    )
  }
}
