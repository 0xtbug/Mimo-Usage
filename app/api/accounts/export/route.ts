import { NextResponse } from "next/server"
import { getAccounts } from "@/lib/accounts"

export async function GET() {
  const accounts = await getAccounts()
  const exportData = accounts.map((a) => ({ name: a.name, cookie: a.cookie }))
  return NextResponse.json(exportData)
}
