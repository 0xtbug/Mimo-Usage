"use client"

import * as React from "react"
import {
  getAccounts,
  deleteAccountApi,
  deleteAllAccountsApi,
  getUserProfile,
  getTokenPlanDetail,
  getTokenPlanUsage,
  getApiKey,
  createApiKey,
  resetApiKey,
  ApiClientError,
} from "@/features/accounts/api/client-api"
import type { AccountSummary, AccountData } from "@/lib/types"
import { USAGE_REFRESH_INTERVAL } from "@/lib/constants"
import { toast } from "sonner"

interface DashboardContextValue {
  accounts: AccountSummary[]
  accountData: Map<string, AccountData>
  loading: boolean
  refresh: () => void
  removeAccount: (id: string) => Promise<void>
  removeAllAccounts: () => Promise<void>
  createKey: (accountId: string) => Promise<void>
  resetKey: (accountId: string) => Promise<void>
  newKeys: Map<string, string>
  dismissNewKey: (accountId: string) => void
  actionLoading: string | null
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = React.useState<AccountSummary[]>([])
  const [accountData, setAccountData] = React.useState<
    Map<string, AccountData>
  >(new Map())
  const [loading, setLoading] = React.useState(true)
  const [newKeys, setNewKeys] = React.useState<Map<string, string>>(new Map())
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const initializedRef = React.useRef(false)

  const fetchRef = React.useRef<() => Promise<void>>(null)
  const accountDataRef = React.useRef(accountData)
  React.useEffect(() => {
    accountDataRef.current = accountData
  }, [accountData])

  const load = React.useCallback(async () => {
    try {
      const list = await getAccounts()
      setAccounts(list)

      await Promise.all(
        list.map(async (account) => {
          try {
            const [profileRes, planRes, usageRes, apiKeyRes] =
              await Promise.all([
                getUserProfile(account.id),
                getTokenPlanDetail(account.id),
                getTokenPlanUsage(account.id),
                getApiKey(account.id).catch(() => null),
              ])
            setAccountData((prev) =>
              new Map(prev).set(account.id, {
                id: account.id,
                name: account.name,
                profile: profileRes.data,
                plan: planRes.data,
                usage: usageRes.data,
                apiKey: apiKeyRes?.data ?? null,
              })
            )
          } catch (err: unknown) {
            const message =
              err instanceof ApiClientError ? err.message : "Failed to load"
            setAccountData((prev) =>
              new Map(prev).set(account.id, {
                id: account.id,
                name: account.name,
                profile: null,
                plan: null,
                usage: null,
                apiKey: null,
                error: message,
              })
            )
          }
        })
      )
    } catch {
      // accounts list fetch failed
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRef.current = load

    // Only fetch on first mount, not on re-renders
    if (!initializedRef.current) {
      initializedRef.current = true
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => load(), 0)
    }

    const interval = setInterval(
      () => fetchRef.current?.(),
      USAGE_REFRESH_INTERVAL
    )
    return () => clearInterval(interval)
  }, [load])

  const refresh = React.useCallback(() => {
    setLoading(true)
    fetchRef.current?.()
  }, [])

  const removeAccount = React.useCallback(async (id: string) => {
    try {
      await deleteAccountApi(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      setAccountData((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      toast.success("Account removed successfully")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch accounts")
    }
  }, [])

  const removeAllAccounts = React.useCallback(async () => {
    try {
      await deleteAllAccountsApi()
      setAccounts([])
      setAccountData(new Map())
      toast.success("All accounts removed")
    } catch {
      toast.error("Failed to remove all accounts")
    }
  }, [])

  const createKey = React.useCallback(async (accountId: string) => {
    const actionKey = `create-${accountId}`
    try {
      setActionLoading(actionKey)
      const res = await createApiKey(accountId)
      setNewKeys((prev) => new Map(prev).set(accountId, res.data.apiKey))
      // Re-fetch key data
      const keyRes = await getApiKey(accountId)
      setAccountData((prev) => {
        const existing = prev.get(accountId)
        if (!existing) return prev
        return new Map(prev).set(accountId, {
          ...existing,
          apiKey: keyRes.data,
        })
      })
      toast.success("API key created successfully")
    } catch (err: unknown) {
      const msg =
        err instanceof ApiClientError ? err.message : "Failed to create API key"
      setAccountData((prev) => {
        const existing = prev.get(accountId)
        if (!existing) return prev
        return new Map(prev).set(accountId, { ...existing, error: msg })
      })
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }, [])

  const resetKey = React.useCallback(async (accountId: string) => {
    const actionKey = `reset-${accountId}`
    try {
      setActionLoading(actionKey)
      const res = await resetApiKey(accountId)
      setNewKeys((prev) => new Map(prev).set(accountId, res.data.apiKey))
      // Re-fetch key data
      const keyRes = await getApiKey(accountId)
      setAccountData((prev) => {
        const existing = prev.get(accountId)
        if (!existing) return prev
        return new Map(prev).set(accountId, {
          ...existing,
          apiKey: keyRes.data,
        })
      })
      toast.success("API key reset successfully")
    } catch (err: unknown) {
      const msg =
        err instanceof ApiClientError ? err.message : "Failed to reset API key"
      setAccountData((prev) => {
        const existing = prev.get(accountId)
        if (!existing) return prev
        return new Map(prev).set(accountId, { ...existing, error: msg })
      })
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }, [])

  const dismissNewKey = React.useCallback((accountId: string) => {
    setNewKeys((prev) => {
      const next = new Map(prev)
      next.delete(accountId)
      return next
    })
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        accounts,
        accountData,
        loading,
        refresh,
        removeAccount,
        removeAllAccounts,
        createKey,
        resetKey,
        newKeys,
        dismissNewKey,
        actionLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardData() {
  const context = React.useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboardData must be used within DashboardProvider")
  }
  return context
}
