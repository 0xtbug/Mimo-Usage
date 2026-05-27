"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Trash } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccountData } from "@/lib/types"
import { formatTokens, formatPercent, getDaysRemaining } from "@/lib/utils"
import { usePrivacy } from "@/hooks/use-privacy"

interface AccountCardProps {
  account: AccountData
  onView: () => void
  onDelete: () => void
}

export function AccountCard({ account, onView, onDelete }: AccountCardProps) {
  const { maskEmail } = usePrivacy()
  const planItem = account.usage?.usage?.items?.[0]
  const daysRemaining = account.plan
    ? getDaysRemaining(account.plan.currentPeriodEnd)
    : 0

  const isLoading = !account.profile && !account.error

  const usagePercent = planItem?.percent ?? 0
  const isWarning = usagePercent >= 0.8 && usagePercent < 0.9
  const isCritical = usagePercent >= 0.9

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex flex-col gap-2.5 pt-3">
        {/* Header: Email + Actions */}
        <div className="flex items-start justify-between gap-2">
          {isLoading ? (
            <Skeleton className="h-4 w-36" />
          ) : (
            <span className="min-w-0 truncate font-mono text-sm">
              {account.profile?.email
                ? maskEmail(account.profile.email)
                : account.name || "—"}
            </span>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {isCritical && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                Critical
              </Badge>
            )}
            {isWarning && !isCritical && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                Warning
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onView}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onDelete}
            >
              <Trash className="size-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Plan Badge + Days Left */}
        {isLoading ? (
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        ) : account.plan ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="px-1.5 py-0 font-mono text-[10px]"
            >
              {account.plan.planCode}
            </Badge>
            <Badge
              variant={daysRemaining <= 7 ? "destructive" : "secondary"}
              className="px-1.5 py-0 text-[10px]"
            >
              {daysRemaining > 0 ? `${daysRemaining}d left` : "Expired"}
            </Badge>
          </div>
        ) : null}

        {/* Token Usage */}
        {isLoading ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ) : planItem ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Token Usage</span>
              <span
                className={
                  planItem.percent >= 0.9
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                }
              >
                {formatPercent(planItem.percent)}
              </span>
            </div>
            <Progress
              value={planItem.percent * 100}
              className={`h-2 ${isCritical ? "[&>div]:bg-destructive" : ""}`}
            />
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>{formatTokens(planItem.used)}</span>
              <span>{formatTokens(planItem.limit)}</span>
            </div>
          </div>
        ) : null}

        {/* Error */}
        {account.error && (
          <p className="text-xs text-destructive">{account.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
