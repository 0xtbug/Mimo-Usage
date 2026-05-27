// ── MiMo API Response Types ───────────────────────────────────

export interface MimoApiResponse<T> {
  code: number
  message: string
  data: T
}

// ── User Profile ──────────────────────────────────────────────

export interface UserProfile {
  userId: string
  phone: string | null
  email: string | null
  platformEmail: string | null
  weixin: string | null
  agreement: boolean
  idc: number
  nickName: string | null
  userName: string | null
}

// ── Token Plan Detail ─────────────────────────────────────────

export interface TokenPlanDetail {
  planCode: string
  planName: string
  currentPeriodEnd: string
  expired: boolean
  enableAutoRenew: boolean
  autoRenewDiscount: string
  hasAutoRenewSubscribed: boolean
}

// ── Account ──────────────────────────────────────────────────

export interface AccountSummary {
  id: string
  name: string
}

export interface AccountData {
  id: string
  name: string
  profile: UserProfile | null
  plan: TokenPlanDetail | null
  usage: TokenPlanUsage | null
  apiKey: ApiKeyGetResponse | null
  error?: string
}

// ── API Key ───────────────────────────────────────────────────

export interface ApiKeyGetResponse {
  id: number | null
  redactedApiKey: string | null
  createTime: string | null
  openaiBaseUrl: string
  anthropicBaseUrl: string
}

export interface ApiKeyCreateResponse {
  id: number
  apiKey: string
  redactedApiKey: string
  createTime: string
}

// ── Token Plan Usage ──────────────────────────────────────────

export interface UsageItem {
  name: string
  used: number
  limit: number
  percent: number
}

export interface UsageGroup {
  percent: number
  items: UsageItem[]
}

export interface TokenPlanUsage {
  monthUsage: UsageGroup
  usage: UsageGroup
}

export interface AuthSession {
  kind: "login" | "register"
  cookies: string
  sign: string
  callback: string
  sid: string
  qs: string
  deviceId: string
  createdAt: number
  email?: string
  passwordHash?: string
  region?: string
  deviceFingerprint?: string
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error" | "otp_required"
  message: string
  code?: number
  data?: T
  sessionId?: string
  cookie?: string
  captchaUrl?: string
  notificationUrl?: string
  description?: string
  raw?: unknown
  finalUrl?: string | null
  sessionData?: AuthSession
}
