import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format token count to human-readable string
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat("en-US").format(count)
}

/**
 * Format token count with full number and readable version
 */
export function formatTokensFull(count: number): string {
  return new Intl.NumberFormat("en-US").format(count)
}

/**
 * Format percentage (0-1 scale) to display string
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

/**
 * Format percentage (0-1 scale) with 0 decimal places
 */
export function formatPercentShort(value: number): string {
  return `${(value * 100).toFixed(0)}%`
}

/**
 * Format date string to readable format
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

/**
 * Format date string to short date
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

/**
 * Get days remaining until date
 */
export function getDaysRemaining(dateStr: string): number {
  try {
    const target = new Date(dateStr)
    const now = new Date()
    const diffMs = target.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}
