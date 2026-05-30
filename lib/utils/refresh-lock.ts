import { AuthService } from "@/features/auth/services/AuthService"
import { updateAccountCookie } from "@/lib/accounts"

/**
 * In-memory deduplication lock for cookie refreshes.
 *
 * When multiple API routes detect a 401 for the same account simultaneously
 * (e.g. profile, plan, usage, apiKey all fire in Promise.all), only the FIRST
 * one actually calls AuthService.refresh(). The rest await the same Promise
 * and receive the refreshed cookie without extra Xiaomi HTTP calls or Redis writes.
 *
 * The lock is automatically cleaned up after the refresh resolves (success or failure).
 */

const inflightRefreshes = new Map<string, Promise<string | null>>()

/**
 * Deduplicated cookie refresh.
 * Returns the new cookie string on success, or null on failure.
 */
export function refreshCookieDeduped(
  accountId: string,
  currentCookie: string
): Promise<string | null> {
  const existing = inflightRefreshes.get(accountId)
  if (existing) {
    console.log(
      `[RefreshLock] Refresh already in-flight for account ${accountId}. Reusing…`
    )
    return existing
  }

  const promise = doRefresh(accountId, currentCookie).finally(() => {
    inflightRefreshes.delete(accountId)
  })

  inflightRefreshes.set(accountId, promise)
  return promise
}

async function doRefresh(
  accountId: string,
  currentCookie: string
): Promise<string | null> {
  try {
    console.log(
      `[RefreshLock] Starting refresh for account ${accountId}…`
    )
    const authService = new AuthService()
    const result = await authService.refresh(currentCookie)

    if (result.status === "success" && result.cookie) {
      console.log(
        `[RefreshLock] Refresh successful for account ${accountId}. Updating stored cookie.`
      )
      await updateAccountCookie(accountId, result.cookie)
      return result.cookie
    }

    console.error(
      `[RefreshLock] Refresh failed for account ${accountId}:`,
      result.message
    )
    return null
  } catch (err) {
    console.error(
      `[RefreshLock] Refresh threw for account ${accountId}:`,
      err
    )
    return null
  }
}
