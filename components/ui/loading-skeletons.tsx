"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ── Stat Card Skeleton ───────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded-none" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="mt-1.5 h-3 w-28" />
      </CardContent>
    </Card>
  )
}

// ── Dashboard Skeleton ───────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="container flex-1 px-4 pt-6 pb-12">
        {/* Stat cards */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </section>

        {/* Charts row 1: bar + pie */}
        <section className="mb-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          {/* Bar chart card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-50 w-full sm:h-65" />
            </CardContent>
          </Card>

          {/* Pie chart card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-36" />
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="h-50 w-50 rounded-full sm:h-65 sm:w-65" />
            </CardContent>
          </Card>
        </section>

        {/* Chart row 2: usage percentage */}
        <section>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-50 w-full sm:h-65" />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

// ── Account Card Skeleton ────────────────────────────────────

export function AccountCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-2.5 pt-3">
        {/* Header: Email + Actions */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex shrink-0 items-center gap-1">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>

        {/* Plan badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>

        {/* Token Usage */}
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
      </CardContent>
    </Card>
  )
}

// ── Account Cards Grid Skeleton ──────────────────────────────

export function AccountCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── API Key Card Skeleton ────────────────────────────────────

export function ApiKeyCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key display */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="size-9 shrink-0" />
        </div>
        {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── API Key Cards Grid Skeleton ──────────────────────────────

export function ApiKeyCardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ApiKeyCardSkeleton key={i} />
      ))}
    </div>
  )
}
