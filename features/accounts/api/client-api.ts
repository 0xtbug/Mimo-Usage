import type {
  MimoApiResponse,
  UserProfile,
  TokenPlanDetail,
  TokenPlanUsage,
  AccountSummary,
  ApiKeyGetResponse,
  ApiKeyCreateResponse,
} from "@/lib/types"

// Custom error class for API errors
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

// Generic fetch wrapper for MiMo API
async function fetchMimo<T>(
  endpoint: string,
  accountId?: string
): Promise<MimoApiResponse<T>> {
  const params = accountId ? `?accountId=${accountId}` : ""
  const url = `/api/mimo${endpoint}${params}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new ApiClientError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    const data: MimoApiResponse<T> = await response.json()

    if (data.code !== 0) {
      throw new ApiClientError(
        data.message || `API error (code: ${data.code})`,
        undefined,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    if (error instanceof Error) {
      throw new ApiClientError(
        `Network error: ${error.message}`,
        undefined,
        error
      )
    }
    throw new ApiClientError("An unknown error occurred", undefined, error)
  }
}

/**
 * Fetch user profile info
 */
export async function getUserProfile(
  accountId?: string
): Promise<MimoApiResponse<UserProfile>> {
  return fetchMimo<UserProfile>("/userProfile", accountId)
}

/**
 * Fetch token plan detail
 */
export async function getTokenPlanDetail(
  accountId?: string
): Promise<MimoApiResponse<TokenPlanDetail>> {
  return fetchMimo<TokenPlanDetail>("/tokenPlan/detail", accountId)
}

/**
 * Fetch token plan usage
 */
export async function getTokenPlanUsage(
  accountId?: string
): Promise<MimoApiResponse<TokenPlanUsage>> {
  return fetchMimo<TokenPlanUsage>("/tokenPlan/usage", accountId)
}

// ── Account Management ───────────────────────────────────────

export async function getAccounts(): Promise<AccountSummary[]> {
  const response = await fetch("/api/accounts")
  if (!response.ok) {
    throw new ApiClientError("Failed to fetch accounts", response.status)
  }
  return response.json()
}

export async function addAccount(cookie: string): Promise<AccountSummary> {
  const response = await fetch("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cookie }),
  })
  if (!response.ok) {
    throw new ApiClientError("Failed to add account", response.status)
  }
  return response.json()
}

export async function deleteAccountApi(id: string): Promise<void> {
  const response = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
  if (!response.ok) {
    throw new ApiClientError("Failed to delete account", response.status)
  }
}

export async function deleteAllAccountsApi(): Promise<{ deleted: number }> {
  const response = await fetch("/api/accounts/delete-all", {
    method: "POST",
  })
  if (!response.ok) {
    throw new ApiClientError("Failed to delete all accounts", response.status)
  }
  return response.json()
}

// ── Account Import / Export ──────────────────────────────────

export interface ExportedAccount {
  name: string
  cookie: string
}

export interface ImportResult {
  imported: { name: string; id: string }[]
  errors: { index: number; message: string }[]
}

export async function exportAccounts(): Promise<ExportedAccount[]> {
  const response = await fetch("/api/accounts/export")
  if (!response.ok) {
    throw new ApiClientError("Failed to export accounts", response.status)
  }
  return response.json()
}

export async function importAccounts(
  accounts: ExportedAccount[]
): Promise<ImportResult> {
  const response = await fetch("/api/accounts/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accounts),
  })
  if (!response.ok) {
    throw new ApiClientError("Failed to import accounts", response.status)
  }
  return response.json()
}

// ── API Key Management ────────────────────────────────────────

export async function getApiKey(
  accountId?: string
): Promise<MimoApiResponse<ApiKeyGetResponse>> {
  const params = accountId ? `?accountId=${accountId}` : ""
  const response = await fetch(`/api/apiKey${params}`)
  if (!response.ok) {
    throw new ApiClientError("Failed to fetch API key", response.status)
  }
  const data: MimoApiResponse<ApiKeyGetResponse> = await response.json()
  if (data.code !== 0) {
    throw new ApiClientError(data.message || "API error", undefined, data)
  }
  return data
}

export async function createApiKey(
  accountId?: string
): Promise<MimoApiResponse<ApiKeyCreateResponse>> {
  const response = await fetch("/api/apiKey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", accountId }),
  })
  if (!response.ok) {
    throw new ApiClientError("Failed to create API key", response.status)
  }
  const data: MimoApiResponse<ApiKeyCreateResponse> = await response.json()
  if (data.code !== 0) {
    throw new ApiClientError(data.message || "API error", undefined, data)
  }
  return data
}

export async function resetApiKey(
  accountId?: string
): Promise<MimoApiResponse<ApiKeyCreateResponse>> {
  const response = await fetch("/api/apiKey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset", accountId }),
  })
  if (!response.ok) {
    throw new ApiClientError("Failed to reset API key", response.status)
  }
  const data: MimoApiResponse<ApiKeyCreateResponse> = await response.json()
  if (data.code !== 0) {
    throw new ApiClientError(data.message || "API error", undefined, data)
  }
  return data
}

// ── Auto Login (Next.js Local Backend) ────────────────────

export interface AutoLoginResponse {
  status: "otp_required" | "success" | "error"
  sessionId?: string
  message: string
  cookie?: string
  account?: { id: string; name: string }
  notificationUrl?: string | null
  code?: number
  description?: string
  raw?: unknown
}

export async function startAutoLogin(
  email: string,
  password: string
): Promise<AutoLoginResponse> {
  const response = await fetch(`/api/xiaomi/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data: AutoLoginResponse = await response.json()

  // If worker returned cookies directly (success), auto-add the account
  if (data.status === "success" && data.cookie) {
    try {
      await addAccount(data.cookie)
      data.message = "Account added successfully!"
    } catch (err) {
      data.status = "error"
      data.message = `Got cookies but failed to save account: ${err instanceof Error ? err.message : "Unknown error"}`
    }
  }

  return data
}

export async function verifyAutoLoginOtp(
  sessionId: string,
  otp: string
): Promise<AutoLoginResponse> {
  const response = await fetch(`/api/xiaomi/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, otp }),
  })
  const data: AutoLoginResponse = await response.json()

  // If worker returned cookies directly (success), auto-add the account
  if (data.status === "success" && data.cookie) {
    try {
      await addAccount(data.cookie)
      data.message = "Account added successfully!"
    } catch (err) {
      data.status = "error"
      data.message = `Got cookies but failed to save account: ${err instanceof Error ? err.message : "Unknown error"}`
    }
  }

  return data
}
