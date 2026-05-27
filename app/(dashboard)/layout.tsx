"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ArrowClockwise, Eye, EyeSlash } from "@phosphor-icons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { navItems } from "@/components/layout/app-sidebar"
import { DashboardProvider, useDashboardData } from "@/hooks/use-dashboard-data"
import { PrivacyProvider, usePrivacy } from "@/hooks/use-privacy"

function getPageTitle(pathname: string) {
  const item = navItems.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  )
  return item?.title ?? "Dashboard"
}

function HeaderRefreshButton() {
  const { refresh, loading } = useDashboardData()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh data"
        >
          <ArrowClockwise
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Refresh data</TooltipContent>
    </Tooltip>
  )
}

function PrivacyToggleButton() {
  const { isPrivate, togglePrivacy } = usePrivacy()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={togglePrivacy}
          aria-label={isPrivate ? "Show emails" : "Hide emails"}
        >
          {isPrivate ? (
            <EyeSlash className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isPrivate ? "Show emails" : "Hide emails"}
      </TooltipContent>
    </Tooltip>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <DashboardProvider>
          <PrivacyProvider>
            <MobileNav />
            {/* Desktop header */}
            <header className="hidden h-12 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:flex">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground">{pageTitle}</span>
              <div className="ml-auto flex items-center gap-1">
                <HeaderRefreshButton />
                <PrivacyToggleButton />
                <ThemeToggle />
              </div>
            </header>
            <ScrollArea className="h-[calc(100svh-3.5rem)] md:h-[calc(100svh-3rem)]">
              <div className="min-w-0">{children}</div>
            </ScrollArea>
          </PrivacyProvider>
        </DashboardProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
