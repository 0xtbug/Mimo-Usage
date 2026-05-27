export function parseSetCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {}
  // getAll is available in Workers, but we can also use getSetCookie() if available
  let setCookies: string[] = []
  if (typeof (headers as unknown as Record<string, () => string[]>).getSetCookie === "function") {
    setCookies = (headers as unknown as Record<string, () => string[]>).getSetCookie()
  } else if (typeof (headers as unknown as Record<string, () => string[]>).getAll === "function") {
    setCookies = (headers as unknown as Record<string, (name: string) => string[]>).getAll("set-cookie") || []
  } else {
    // fallback for standard headers.get
    const cookieHeader = headers.get("set-cookie")
    if (cookieHeader) {
      // rough split, might not be perfect for multiple Set-Cookie headers folded into one string
      setCookies = cookieHeader.split(/,\s*(?=[^;]+=[^;]+;)/)
    }
  }

  for (const sc of setCookies) {
    const match = sc.match(/^([^=]+)=([^;]*)/)
    if (match && match[2] !== "EXPIRED") {
      cookies[match[1]] = match[2]
    }
  }
  return cookies
}

export function cookieString(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ")
}

export function parseCookieString(cs: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cs) return cookies
  for (const pair of cs.split(";")) {
    const [key, ...rest] = pair.trim().split("=")
    if (key) cookies[key] = rest.join("=")
  }
  return cookies
}

export function buildPlatformCookies(
  redirectCookies: Record<string, string>,
  authCookies: Record<string, string>
): string {
  // Merge all cookies and pick the relevant ones
  const all = { ...authCookies, ...redirectCookies }

  const relevant = [
    "userId",
    "serviceToken",
    "api-platform_serviceToken",
    "api-platform_slh",
    "api-platform_ph",
    "cookie-preferences",
    "passToken",
    "identity_session",
    "deviceId",
  ]

  const parts: string[] = []
  for (const name of relevant) {
    if (all[name] && all[name] !== "EXPIRED") {
      let val = all[name]
      // Remove surrounding quotes if they exist
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      }
      const needsQuotes =
        val.includes("+") || val.includes("/") || val.includes("=")
      parts.push(`${name}=${needsQuotes ? `"${val}"` : val}`)
    }
  }

  // Also include any cookies we might have missed that look platform-related
  for (const [name, rawVal] of Object.entries(all)) {
    if (
      name.startsWith("api-platform") &&
      !relevant.includes(name) &&
      rawVal !== "EXPIRED"
    ) {
      let val = rawVal
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      }
      const needsQuotes =
        val.includes("+") || val.includes("/") || val.includes("=")
      parts.push(`${name}=${needsQuotes ? `"${val}"` : val}`)
    }
  }

  return parts.join("; ")
}
