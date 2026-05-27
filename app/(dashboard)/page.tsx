"use client"

import * as React from "react"
import {
  ChartBar,
  Coins,
  ShieldCheck,
  Warning,
  Plus,
  TrendUp,
} from "@phosphor-icons/react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatTokens, formatTokensFull } from "@/lib/utils"
import type { AccountData } from "@/lib/types"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { usePrivacy } from "@/hooks/use-privacy"

import Link from "next/link"
import { DashboardSkeleton } from "@/components/ui/loading-skeletons"

// ── Chart configs ─────────────────────────────────────────────

const usageBarConfig = {
  used: {
    label: "Used",
    color: "var(--chart-1)",
  },
  limit: {
    label: "Limit",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const quotaPieConfig = {
  Used: {
    label: "Used",
    color: "var(--chart-1)",
  },
  Remaining: {
    label: "Remaining",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const percentBarConfig = {
  percent: {
    label: "Usage",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

// ── Stat card component ──────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  destructive = false,
  trend,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  destructive?: boolean
  trend?: { value: string; positive?: boolean } | null
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold tracking-tight ${destructive ? "text-destructive" : ""}`}
        >
          {value}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`flex items-center gap-0.5 font-medium ${
                trend.positive ? "text-foreground" : "text-destructive"
              }`}
            >
              <TrendUp
                className={`size-3 ${!trend.positive ? "rotate-180" : ""}`}
              />
              {trend.value}
            </span>
          )}
          <span className="text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function getDisplayName(
  d: AccountData,
  maskEmail: (email: string | null | undefined) => string
) {
  const raw = d.profile?.email || d.name || "—"
  return d.profile?.email ? maskEmail(d.profile.email) : raw
}

// ── Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { accounts, accountData, loading } = useDashboardData()

  const { maskEmail } = usePrivacy()
  const allData = Array.from(accountData.values()).filter(
    (d) => !d.error && d.usage
  )
  const totalUsed = allData.reduce(
    (sum, d) => sum + (d.usage?.usage?.items?.[0]?.used ?? 0),
    0
  )
  const totalLimit = allData.reduce(
    (sum, d) => sum + (d.usage?.usage?.items?.[0]?.limit ?? 0),
    0
  )
  const totalRemaining = totalLimit - totalUsed
  const overallPercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  const accountsWithAlert = allData.filter((d) => {
    const pct = d.usage?.usage?.items?.[0]?.percent ?? 0
    return pct >= 0.8
  })

  // Bar chart data: usage per account
  const accountUsageData = React.useMemo(() => {
    return allData.map((d) => {
      const label = getDisplayName(d, maskEmail)
      const raw = d.profile?.email || d.name || "—"
      return {
        name: label.length > 30 ? `${label.slice(0, 28)}…` : label,
        fullName: raw,
        used: d.usage!.usage?.items?.[0]?.used ?? 0,
        limit: d.usage!.usage?.items?.[0]?.limit ?? 0,
      }
    })
  }, [allData, maskEmail])

  // Pie chart data: overall quota
  const quotaPieData = React.useMemo(() => {
    if (totalLimit === 0) return []
    return [
      { name: "Used", value: totalUsed, fill: "var(--chart-1)" },
      {
        name: "Remaining",
        value: totalRemaining,
        fill: "var(--chart-2)",
      },
    ]
  }, [totalUsed, totalRemaining, totalLimit])

  // Per-account percentage leaderboard data (sorted desc)
  const percentBarData = React.useMemo(() => {
    return allData
      .map((d) => {
        const raw = d.profile?.email || d.name || "—"
        const label = getDisplayName(d, maskEmail)
        return {
          name: label.length > 20 ? `${label.slice(0, 18)}…` : label,
          fullName: raw,
          percent: (d.usage?.usage?.items?.[0]?.percent ?? 0) * 100,
        }
      })
      .sort((a, b) => b.percent - a.percent)
  }, [allData, maskEmail])

  // ── Loading ─────────────────────────────────────────────────

  if (loading && accounts.length === 0) {
    return <DashboardSkeleton />
  }

  // ── Empty ───────────────────────────────────────────────────

  if (!loading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <p className="text-sm">No accounts added yet.</p>
        <Link href="/Accounts">
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 size-3" />
            Go to Accounts
          </Button>
        </Link>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      <main className="container flex-1 px-4 pt-6 pb-6">
        {/* ── Stat cards ──────────────────────────────────────── */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value={String(accounts.length)}
            description={`${allData.length} active`}
            icon={ChartBar}
          />
          <StatCard
            title="Total Tokens Used"
            value={formatTokens(totalUsed)}
            description={`of ${formatTokens(totalLimit)} limit`}
            icon={Coins}
            trend={{
              value: `${overallPercent.toFixed(1)}%`,
              positive: overallPercent < 80,
            }}
          />
          <StatCard
            title="Tokens Remaining"
            value={formatTokens(totalRemaining)}
            description={`of ${formatTokens(totalLimit)} total`}
            icon={ShieldCheck}
            trend={{
              value: `${(100 - overallPercent).toFixed(1)}%`,
              positive: overallPercent < 80,
            }}
          />
          <StatCard
            title="Quota Alerts"
            value={String(accountsWithAlert.length)}
            description={
              accountsWithAlert.length > 0
                ? `of ${allData.length} accounts`
                : "all healthy"
            }
            icon={Warning}
            destructive={accountsWithAlert.length > 0}
          />
        </section>

        {/* ── Charts row 1: bar + pie ─────────────────────────── */}
        <section className="mb-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          {/* Bar chart — used vs limit per account */}
          <Card>
            <CardHeader>
              <CardTitle>Token usage per account</CardTitle>
              <CardDescription>Used vs limit comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {accountUsageData.length === 0 ? (
                <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <ChartContainer
                  config={usageBarConfig}
                  className="h-50 w-full sm:h-65"
                >
                  <BarChart
                    accessibilityLayer
                    data={accountUsageData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval={0}
                      height={8}
                      tick={false}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => formatTokens(v)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const entry = payload[0].payload as {
                          fullName: string
                          used: number
                          limit: number
                        }
                        const pct =
                          entry.limit > 0
                            ? ((entry.used / entry.limit) * 100).toFixed(1)
                            : "0"
                        return (
                          <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="mb-1.5 font-medium">
                              {entry.fullName}
                            </p>
                            <div className="grid gap-1">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-sm bg-(--color-used)" />
                                <span className="text-muted-foreground">
                                  Used
                                </span>
                                <span className="ml-auto font-mono font-medium">
                                  {formatTokensFull(entry.used)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-sm bg-(--color-limit) opacity-40" />
                                <span className="text-muted-foreground">
                                  Limit
                                </span>
                                <span className="ml-auto font-mono font-medium">
                                  {formatTokensFull(entry.limit)}
                                </span>
                              </div>
                              <div className="mt-1 border-t pt-1 font-medium">
                                {pct}% used
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="used"
                      fill="var(--color-used)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="limit"
                      fill="var(--color-limit)"
                      radius={[4, 4, 0, 0]}
                      className="opacity-40"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Donut chart — overall quota */}
          <Card>
            <CardHeader>
              <CardTitle>Overall quota</CardTitle>
              <CardDescription>
                {overallPercent.toFixed(1)}% used — {formatTokens(totalUsed)} of{" "}
                {formatTokens(totalLimit)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotaPieData.length === 0 ? (
                <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <div className="relative">
                  <ChartContainer
                    config={quotaPieConfig}
                    className="mx-auto h-50 w-full max-w-70 sm:h-65 sm:max-w-80"
                  >
                    <PieChart accessibilityLayer>
                      <ChartTooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const entry = payload[0]
                          const name = entry.name as string
                          const value = entry.value as number
                          const pct =
                            totalLimit > 0
                              ? ((value / totalLimit) * 100).toFixed(1)
                              : "0"
                          return (
                            <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-xl">
                              <p className="mb-1.5 font-medium">{name}</p>
                              <div className="grid gap-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2 rounded-sm"
                                    style={{
                                      backgroundColor: entry.payload.fill,
                                    }}
                                  />
                                  <span className="text-muted-foreground">
                                    Tokens
                                  </span>
                                  <span className="ml-auto font-mono font-medium">
                                    {formatTokensFull(value)}
                                  </span>
                                </div>
                                <div className="mt-1 border-t pt-1 font-medium">
                                  {pct}% of total
                                </div>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                      />
                      <Pie
                        data={quotaPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {quotaPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  {/* Center percentage label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight">
                      {overallPercent.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      quota used
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        {/* ── Chart row 2: usage % leaderboard ─────────────────── */}
        <section className="mb-0">
          <Card>
            <CardHeader>
              <CardTitle>Usage percentage</CardTitle>
              <CardDescription>
                Each account&apos;s quota consumption — avg{" "}
                {percentBarData.length > 0
                  ? (
                      percentBarData.reduce((s, d) => s + d.percent, 0) /
                      percentBarData.length
                    ).toFixed(1)
                  : 0}
                %
              </CardDescription>
            </CardHeader>
            <CardContent>
              {percentBarData.length === 0 ? (
                <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <ChartContainer
                  config={percentBarConfig}
                  className="h-50 w-full sm:h-65"
                >
                  <BarChart
                    accessibilityLayer
                    data={percentBarData}
                    layout="vertical"
                    margin={{ left: 10, right: 40 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={130}
                      tick={{ className: "text-[11px]" }}
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      tick={{ className: "text-[11px]" }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const entry = payload[0].payload as {
                          fullName: string
                          percent: number
                        }
                        const remPct = (100 - entry.percent).toFixed(1)
                        return (
                          <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="mb-1.5 font-medium">
                              {entry.fullName}
                            </p>
                            <div className="grid gap-1">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-sm bg-(--color-percent)" />
                                <span className="text-muted-foreground">
                                  Used
                                </span>
                                <span className="ml-auto font-mono font-medium">
                                  {entry.percent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-sm bg-muted" />
                                <span className="text-muted-foreground">
                                  Remaining
                                </span>
                                <span className="ml-auto font-mono font-medium">
                                  {remPct}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="percent"
                      fill="var(--color-percent)"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="percent"
                        position="right"
                        formatter={(v) => `${Number(v).toFixed(0)}%`}
                        className="fill-foreground text-[11px] font-medium"
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
