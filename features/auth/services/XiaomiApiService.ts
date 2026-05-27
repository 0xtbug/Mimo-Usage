import {
  parseSetCookies,
  cookieString,
  parseCookieString,
} from "@/lib/utils/cookies"
import { fetchWithTimeout } from "@/lib/utils/helpers"

export class XiaomiApiService {
  private readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

  public async serviceLogin(): Promise<{
    sign: string
    callback: string
    sid: string
    qs: string
    cookies: Record<string, string>
  }> {
    const cb =
      "https://platform.xiaomimimo.com/sts?sign=M7gfywevl3CG5YTTcZDifhK6IK8%3D&followup=https%3A%2F%2Fplatform.xiaomimimo.com%2Fconsole%2Fbalance"
    const res = await fetchWithTimeout(
      `https://account.xiaomi.com/pass/serviceLogin?sid=api-platform&_group=DEFAULT&_json=true&callback=${encodeURIComponent(cb)}`,
      {
        headers: { "User-Agent": this.USER_AGENT },
        redirect: "manual",
      }
    )

    const text = await res.text()
    const json = JSON.parse(text.replace("&&&START&&&", ""))
    const cookies = parseSetCookies(res.headers)

    return {
      sign: json._sign,
      callback: json.callback,
      sid: json.sid,
      qs: json.qs,
      cookies,
    }
  }

  public async serviceLoginAuth2(
    email: string,
    passwordHash: string,
    sign: string,
    callback: string,
    sid: string,
    qs: string,
    sessionCookies: string,
    captchaCode?: string
  ): Promise<{ json: Record<string, unknown>; cookies: Record<string, string> }> {
    const params = new URLSearchParams({
      _json: "true",
      callback: callback,
      sid: sid,
      qs: qs,
      _sign: sign,
      user: email,
      hash: passwordHash.toUpperCase(),
      _locale: "en_US",
    })

    if (captchaCode) {
      params.set("captCode", captchaCode)
    }

    const res = await fetchWithTimeout(
      "https://account.xiaomi.com/pass/serviceLoginAuth2",
      {
        method: "POST",
        headers: {
          "User-Agent": this.USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: sessionCookies,
        },
        body: params.toString(),
        redirect: "manual",
      }
    )

    const text = await res.text()
    const json = JSON.parse(text.replace("&&&START&&&", ""))
    const cookies = parseSetCookies(res.headers)

    return { json, cookies }
  }

  public async followRedirectsForCookies(
    location: string,
    initialCookies: string
  ): Promise<{ finalUrl: string; allCookies: Record<string, string> }> {
    const allCookies: Record<string, string> = {}
    let url = location
    let cookies = initialCookies

    console.log("Follow Redirects Start:", url)

    for (let i = 0; i < 10; i++) {
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": this.USER_AGENT,
          Cookie: cookies,
        },
        redirect: "manual",
      })

      const newCookies = parseSetCookies(res.headers)
      Object.assign(allCookies, newCookies)

      const merged = { ...parseCookieString(cookies), ...newCookies }
      cookies = cookieString(merged)

      const redirectUrl = res.headers.get("location")
      console.log(
        `[Redirect ${i}] Status:`,
        res.status,
        "Location:",
        redirectUrl
      )

      if (
        redirectUrl &&
        (res.status === 301 ||
          res.status === 302 ||
          res.status === 303 ||
          res.status === 307)
      ) {
        url = redirectUrl.startsWith("http")
          ? redirectUrl
          : new URL(redirectUrl, url).href
      } else {
        console.log(`[Redirect ${i}] Final URL reached.`)
        break
      }
    }

    return { finalUrl: url, allCookies }
  }
}
