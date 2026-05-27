"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  importAccounts,
  type ExportedAccount,
} from "@/features/accounts/api/client-api"
import { toast } from "sonner"

import { importAccountsSchema } from "@/features/accounts/schemas/accounts"

interface ImportAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ImportAccountsDialog({
  open,
  onOpenChange,
  onImported,
}: ImportAccountsDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{
    imported: number
    errors: number
    errorMessages: string[]
  } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  function reset() {
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setResult(null)
    setLoading(true)

    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        toast.error("Invalid JSON file")
        setLoading(false)
        return
      }

      // Convert case-insensitive keys (like Cookie/cookie, Name/name) to match schema
      let normalizedParsed = parsed
      if (Array.isArray(parsed)) {
        normalizedParsed = parsed.map((entry: Record<string, unknown>, i: number) => ({
          cookie:
            typeof entry.cookie === "string" ? entry.cookie : entry.Cookie,
          name:
            typeof entry.name === "string"
              ? entry.name
              : entry.Name || `Account ${i + 1}`,
        }))
      }

      const validated = importAccountsSchema.safeParse(normalizedParsed)
      if (!validated.success) {
        toast.error(validated.error.issues[0].message)
        setLoading(false)
        return
      }

      const accounts = validated.data.map((acc, i) => ({
        cookie: acc.cookie,
        name: acc.name || `Account ${i + 1}`,
      }))

      const res = await importAccounts(accounts)
      setResult({
        imported: res.imported.length,
        errors: res.errors.length,
        errorMessages: res.errors.map((e) => `#${e.index + 1}: ${e.message}`),
      })

      if (res.imported.length > 0) {
        toast.success(`Successfully imported ${res.imported.length} account(s)`)
        onImported()
      } else if (res.errors.length > 0) {
        toast.error(`Failed to import accounts`)
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import accounts"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Accounts</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing accounts to import. Each entry should
            have <code className="text-xs">name</code> and{" "}
            <code className="text-xs">cookie</code> fields.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            disabled={loading}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />

          {loading && (
            <p className="text-sm text-muted-foreground">Importing...</p>
          )}

          {result && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p>
                Imported{" "}
                <span className="font-medium text-foreground">
                  {result.imported}
                </span>{" "}
                account{result.imported !== 1 ? "s" : ""}
                {result.errors > 0 && (
                  <>
                    ,{" "}
                    <span className="font-medium text-destructive">
                      {result.errors}
                    </span>{" "}
                    failed
                  </>
                )}
              </p>
              {result.errorMessages.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs text-destructive">
                  {result.errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
