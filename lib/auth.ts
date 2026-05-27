import { jwtVerify, SignJWT } from "jose"


// ── Configuration ────────────────────────────────────────────

const SESSION_COOKIE = "mimo_session"
const SESSION_MAX_AGE = 24 * 60 * 60 // 24 hours in seconds

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable is required for session signing"
    )
  }
  return new TextEncoder().encode(secret)
}

// ── Password Verification ────────────────────────────────────

export function getDashboardPassword(): string | null {
  return (process.env.DASHBOARD_PASSWORD || "").trim() || null
}

export function isAuthEnabled(): boolean {
  return !!getDashboardPassword()
}

export function verifyPassword(password: string): boolean {
  const expected = getDashboardPassword()
  if (!expected) return false

  if (password.length !== expected.length) return false
  
  let mismatch = 0
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return mismatch === 0
}

// ── Session Token (JWT) ──────────────────────────────────────

export async function encryptSession(payload: Record<string, unknown>): Promise<string> {
  const secret = getAuthSecret()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret)
}

export async function decryptSession(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = getAuthSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

// ── Cookie Helpers ───────────────────────────────────────────

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function isSecureContext(): boolean {
  return process.env.NODE_ENV === "production"
}
