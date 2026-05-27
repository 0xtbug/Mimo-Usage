import { NextResponse } from "next/server"
import { getAccounts, addAccount } from "@/lib/accounts"

import { addAccountSchema } from "@/features/accounts/schemas/accounts"

export async function GET() {
  const accounts = await getAccounts()
  return NextResponse.json(accounts.map((a) => ({ id: a.id, name: a.name })))
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = addAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, cookie } = parsed.data

  let defaultName = `Account ${Date.now()}`
  const userIdMatch = cookie.match(/(?:cUserId|userId)=([a-zA-Z0-9]+)/i)
  if (userIdMatch && userIdMatch[1]) {
    defaultName = `Account ${userIdMatch[1]}`
  }

  const account = await addAccount(name?.trim() || defaultName, cookie.trim())
  return NextResponse.json({ id: account.id, name: account.name })
}
