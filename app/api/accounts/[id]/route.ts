import { NextResponse } from "next/server"
import { deleteAccount } from "@/lib/accounts"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = await deleteAccount(id)

  if (!deleted) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
