"use client"

import * as React from "react"
import {
  Key,
  Plus,
  Copy,
  Check,
  ArrowClockwise,
  Warning,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
  ApiKeyCardsGridSkeleton,
  ApiKeyCardSkeleton,
} from "@/components/ui/loading-skeletons"
import { usePrivacy } from "@/hooks/use-privacy"

export default function ApiKeyPage() {
  const {
    accounts,
    accountData,
    loading,
    createKey,
    resetKey,
    newKeys,
    dismissNewKey,
    actionLoading,
  } = useDashboardData()
  const { maskEmail } = usePrivacy()
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopy = React.useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
    }
  }, [])

  const getDisplayName = React.useCallback(
    (id: string, fallback: string) => {
      const data = accountData.get(id)
      const raw = data?.profile?.email || fallback || "—"
      return data?.profile?.email ? maskEmail(data.profile.email) : raw
    },
    [accountData, maskEmail]
  )

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Account</span>
          {accounts.length > 0 && (
            <Badge variant="secondary">{accounts.length}</Badge>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Key className="size-8 opacity-50" />
          <p className="text-sm">No accounts added yet.</p>
          <p className="text-xs">Add an account first to manage API keys.</p>
        </div>
      )}

      {/* Loading initial */}
      {loading && accounts.length === 0 && (
        <div className="p-4 md:p-6">
          <ApiKeyCardsGridSkeleton />
        </div>
      )}

      {/* Account API key list */}
      {accounts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((account) => {
            const data = accountData.get(account.id)
            if (!data) {
              return <ApiKeyCardSkeleton key={account.id} />
            }

            const hasKey = data.apiKey?.redactedApiKey != null
            const newKey = newKeys.get(account.id)
            const isCreateLoading = actionLoading === `create-${account.id}`
            const isResetLoading = actionLoading === `reset-${account.id}`
            const displayName = getDisplayName(account.id, account.name)

            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm">
                        {displayName}
                      </CardTitle>
                      {data.apiKey?.createTime && (
                        <CardDescription>
                          Created:{" "}
                          {new Date(data.apiKey.createTime).toLocaleString()}
                        </CardDescription>
                      )}
                    </div>
                    {hasKey && (
                      <Badge variant="secondary" className="shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Error */}
                  {data.error && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <Warning className="size-3 shrink-0" />
                      <span className="min-w-0 flex-1">{data.error}</span>
                    </div>
                  )}

                  {/* New key alert */}
                  {newKey && (
                    <div className="rounded-md border border-primary/50 bg-primary/5 p-3">
                      <p className="mb-2 text-xs font-medium text-primary">
                        New key generated — copy now, it won&apos;t be shown
                        again.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={newKey}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            handleCopy(newKey, `new-${account.id}`)
                          }
                          className="shrink-0"
                        >
                          {copiedId === `new-${account.id}` ? (
                            <Check className="size-3 text-primary" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs text-muted-foreground"
                        onClick={() => dismissNewKey(account.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {/* Key display */}
                  {hasKey && !newKey && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={data.apiKey!.redactedApiKey!}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            handleCopy(
                              data.apiKey!.redactedApiKey!,
                              `redacted-${account.id}`
                            )
                          }
                          className="shrink-0"
                        >
                          {copiedId === `redacted-${account.id}` ? (
                            <Check className="size-3 text-primary" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetKey(account.id)}
                        disabled={actionLoading !== null}
                      >
                        <ArrowClockwise
                          className={`mr-1.5 size-3 ${
                            isResetLoading ? "animate-spin" : ""
                          }`}
                        />
                        Reset Key
                      </Button>
                    </div>
                  )}

                  {/* No key state */}
                  {!hasKey && !newKey && (
                    <Button
                      size="sm"
                      onClick={() => createKey(account.id)}
                      disabled={actionLoading !== null}
                    >
                      <Plus
                        className={`mr-1.5 size-3 ${
                          isCreateLoading ? "animate-spin" : ""
                        }`}
                      />
                      Create API Key
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
