import { NextResponse } from "next/server"
import { addAccount } from "@/lib/accounts"

interface ImportEntry {
  name?: string
  cookie?: string
}

import { importAccountsSchema } from "@/features/accounts/schemas/accounts"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = importAccountsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const entries = parsed.data
  const results: { name: string; id: string }[] = []
  const errors: { index: number; message: string }[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const cookie = entry.cookie.trim()
    const name = entry.name?.trim() || `Account ${Date.now()}-${i}`
    try {
      const account = await addAccount(name, cookie)
      results.push({ name: account.name, id: account.id })
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : "Failed to add account",
      })
    }
  }

  return NextResponse.json({ imported: results, errors })
}
