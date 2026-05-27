"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  User,
  CreditCard,
  CalendarCheck,
  Clock,
  Percent,
  ArrowsClockwise,
  Lightning,
} from "@phosphor-icons/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AccountData } from "@/lib/types"
import {
  formatTokens,
  formatTokensFull,
  formatPercent,
  formatDateShort,
  getDaysRemaining,
} from "@/lib/utils"

interface AccountDetailDialogProps {
  account: AccountData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountDetailDialog({
  account,
  open,
  onOpenChange,
}: AccountDetailDialogProps) {
  if (!account) return null

  const planItem = account.usage?.usage?.items?.[0]
  const daysRemaining = account.plan
    ? getDaysRemaining(account.plan.currentPeriodEnd)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] p-0 sm:max-w-lg">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="mb-3 flex items-center gap-2">
                Account Detail
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {/* Profile */}
              {account.profile && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-4 text-primary" />
                    User Profile
                  </div>
                  <div className="flex flex-col gap-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        User ID
                      </span>
                      <span className="font-mono text-sm">
                        {account.profile.userId}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">IDC</span>
                      <Badge variant="secondary">{account.profile.idc}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Detail */}
              {account.plan && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="size-4 text-primary" />
                    Current Plan
                  </div>
                  <div className="flex flex-col gap-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Plan
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {account.plan.planName}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarCheck className="size-3" />
                        Period End
                      </span>
                      <span className="text-sm">
                        {formatDateShort(account.plan.currentPeriodEnd)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Days Left
                      </span>
                      <Badge
                        variant={daysRemaining <= 7 ? "destructive" : "default"}
                      >
                        {daysRemaining > 0
                          ? `${daysRemaining} days`
                          : "Expired"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowsClockwise className="size-3" />
                        Auto Renew
                      </span>
                      <Badge
                        variant={
                          account.plan.hasAutoRenewSubscribed
                            ? "default"
                            : "secondary"
                        }
                      >
                        {account.plan.hasAutoRenewSubscribed ? "On" : "Off"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Percent className="size-3" />
                        Renew Discount
                      </span>
                      <span className="font-mono text-sm">
                        {(
                          parseFloat(account.plan.autoRenewDiscount) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Token Usage */}
              {planItem && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightning className="size-4 text-primary" />
                      Token Usage
                    </div>
                    <Badge
                      variant={
                        planItem.percent >= 0.9 ? "destructive" : "default"
                      }
                    >
                      {formatPercent(planItem.percent)}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Progress value={planItem.percent * 100} className="h-3" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Used
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          {formatTokens(planItem.used)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTokensFull(planItem.used)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Limit
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          {formatTokens(planItem.limit)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTokensFull(planItem.limit)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Remaining
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          {formatTokens(planItem.limit - planItem.used)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTokensFull(planItem.limit - planItem.used)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {account.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {account.error}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
