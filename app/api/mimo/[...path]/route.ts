import { NextRequest, NextResponse } from "next/server"
import { getAccountById, getAccounts } from "@/lib/accounts"
import { refreshCookieDeduped } from "@/lib/utils/refresh-lock"

const MIMO_BASE = "https://platform.xiaomimimo.com/api/v1"

const COMMON_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en",
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "x-timezone": "Asia/Bangkok",
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  let accountId = request.nextUrl.searchParams.get("accountId")
  let cookie: string | undefined

  if (accountId) {
    const account = await getAccountById(accountId)
    if (!account) {
      return NextResponse.json(
        { code: -1, message: "Account not found" },
        { status: 404 }
      )
    }
    cookie = account.cookie
  } else {
    // Fallback: use first account or env var
    const accounts = await getAccounts()
    if (accounts.length > 0) {
      accountId = accounts[0].id
      cookie = accounts[0].cookie
    } else {
      cookie = process.env.MIMO_COOKIE
    }
  }

  if (!cookie) {
    return NextResponse.json(
      { code: -1, message: "No account configured. Add an account first." },
      { status: 500 }
    )
  }

  const targetPath = path.join("/")
  const url = `${MIMO_BASE}/${targetPath}`

  try {
    let response = await fetch(url, {
      method: "GET",
      headers: { ...COMMON_HEADERS, Cookie: cookie },
    })

    let data = await response.json()

    // Handle Mimo 401 Unauthorized (token expired)
    if (data.code === 401 && accountId) {
      const newCookie = await refreshCookieDeduped(accountId, cookie)
      if (newCookie) {
        response = await fetch(url, {
          method: "GET",
          headers: { ...COMMON_HEADERS, Cookie: newCookie },
        })
        data = await response.json()
      }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { code: -1, message: "Failed to fetch from MiMo API" },
      { status: 502 }
    )
  }
}

