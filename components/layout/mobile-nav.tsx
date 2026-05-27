"use client"

import { List, ArrowClockwise, Eye, EyeSlash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useSidebar } from "@/components/ui/sidebar"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { usePrivacy } from "@/hooks/use-privacy"

export function MobileNav() {
  const { toggleSidebar } = useSidebar()
  const { refresh, loading } = useDashboardData()
  const { isPrivate, togglePrivacy } = usePrivacy()

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={toggleSidebar}
      >
        <List className="size-4" />
        <span className="sr-only">Open navigation</span>
      </Button>
      <div className="ml-auto flex items-center gap-1">
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
        <ThemeToggle />
      </div>
    </header>
  )
}
