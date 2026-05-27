import { NextResponse } from "next/server"
import { getAccounts, writeAccounts } from "@/lib/accounts"

export async function POST() {
  const accounts = await getAccounts()
  const count = accounts.length
  await writeAccounts([])
  return NextResponse.json({ deleted: count })
}
