import { XiaomiApiService } from "./XiaomiApiService"
import { AuthSession, ApiResponse } from "@/lib/types"
import { md5 } from "@/lib/utils/crypto"
import {
  cookieString,
  parseSetCookies,
  parseCookieString,
  buildPlatformCookies,
} from "@/lib/utils/cookies"
import { fetchWithTimeout } from "@/lib/utils/helpers"

export class AuthService {
  private xiaomiApi: XiaomiApiService

  private readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

  constructor() {
    this.xiaomiApi = new XiaomiApiService()
  }

  public async login(
    email: string,
    passwordHash: string
  ): Promise<ApiResponse> {
    const loginData = await this.xiaomiApi.serviceLogin()
    const sessionCookies = cookieString(loginData.cookies)
    const passHashMD5 = await md5(passwordHash)

    const { json: authResult, cookies: authCookies } =
      await this.xiaomiApi.serviceLoginAuth2(
        email,
        passHashMD5,
        loginData.sign,
        loginData.callback,
        loginData.sid,
        loginData.qs,
        sessionCookies
      )

    const resultCode = Number(authResult.code)

    if (resultCode === 0 && authResult.location) {
      const mergedCookies = { ...loginData.cookies, ...authCookies }
      const { allCookies } = await this.xiaomiApi.followRedirectsForCookies(
        authResult.location as string,
        cookieString(mergedCookies)
      )
      const platformCookieStr = buildPlatformCookies(allCookies, mergedCookies)

      return {
        status: "success",
        message: "Login successful! Cookies extracted.",
        cookie: platformCookieStr,
      }
    }

    if (resultCode === 87001) {
      return {
        status: "error",
        message: "Login failed: Captcha required but auto-solve is disabled.",
        code: 87001,
        captchaUrl: authResult.captchaUrl as string | undefined,
      }
    }

    if (
      resultCode === 70016 ||
      resultCode === 20003 ||
      authResult.notificationUrl ||
      (authResult.description &&
        String(authResult.description).includes("验证"))
    ) {
      const notifUrl = new URL(authResult.notificationUrl as string)
      const context = notifUrl.searchParams.get("context")

      const listUrl = `https://account.xiaomi.com/identity/list?sid=api-platform&supportedMask=0&_locale=en_US&context=${encodeURIComponent(context || "")}`
      const listRes = await fetchWithTimeout(listUrl, {
        headers: { "User-Agent": this.USER_AGENT, Cookie: sessionCookies },
      })
      const listCookies = parseSetCookies(listRes.headers)
      const mergedCookies = {
        ...loginData.cookies,
        ...authCookies,
        ...listCookies,
      }
      const allCookiesStr = cookieString(mergedCookies)

      const sendParams = new URLSearchParams({
        retry: "0",
        icode: "",
        _json: "true",
      })
      await fetchWithTimeout(
        `https://account.xiaomi.com/identity/auth/sendEmailTicket?_dc=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "User-Agent": this.USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: allCookiesStr,
            Referer: `https://account.xiaomi.com/fe/service/identity/verifyEmail?sid=api-platform&context=${encodeURIComponent(context || "")}`,
          },
          body: sendParams.toString(),
        }
      )

      const sessionData: AuthSession = {
        kind: "login",
        cookies: allCookiesStr,
        sign: loginData.sign,
        callback: loginData.callback,
        sid: loginData.sid,
        qs: loginData.qs,
        deviceId: loginData.cookies.deviceId || "",
        createdAt: Date.now(),
      }

      return {
        status: "otp_required",
        sessionId: crypto.randomUUID(), // Just a placeholder ID, the actual data is in sessionData
        sessionData,
        message: "Verification required. An OTP has been sent to your email.",
        notificationUrl: (authResult.notificationUrl as string) || undefined,
        code: resultCode,
        description: authResult.description as string | undefined,
        raw: authResult,
      }
    }

    return {
      status: "error",
      message: `Login failed: ${authResult.description || "Unknown error (code: " + resultCode + ")"}`,
      code: resultCode,
      raw: authResult,
    }
  }

  public async verifyOtp(
    session: AuthSession,
    otp: string
  ): Promise<ApiResponse> {
    if (!session || session.kind !== "login") {
      return {
        status: "error",
        message: "Session expired or not found. Please restart login.",
      }
    }

    const verifyParams = new URLSearchParams({
      _flag: "8",
      ticket: otp,
      trust: "false",
      _json: "true",
    })

    const verifyRes = await fetchWithTimeout(
      `https://account.xiaomi.com/identity/auth/verifyEmail?_dc=${Date.now()}`,
      {
        method: "POST",
        headers: {
          "User-Agent": this.USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: session.cookies,
        },
        body: verifyParams.toString(),
        redirect: "manual",
      }
    )

    const verifyText = await verifyRes.text()
    const verifyJson = JSON.parse(verifyText.replace("&&&START&&&", ""))
    const verifyNewCookies = parseSetCookies(verifyRes.headers)
    const mergedSessionCookies = cookieString({
      ...parseCookieString(session.cookies),
      ...verifyNewCookies,
    })

    if (verifyJson.code !== 0 && !verifyJson.location) {
      return {
        status: "error",
        message: "Invalid OTP or verification failed",
        raw: verifyJson,
      }
    }

    const checkUrl = verifyJson.location || verifyRes.headers.get("location")
    if (!checkUrl) {
      return {
        status: "error",
        message: "OTP verified but no redirect location found",
        raw: verifyJson,
      }
    }

    const { allCookies } =
      await this.xiaomiApi.followRedirectsForCookies(
        checkUrl.startsWith("http")
          ? checkUrl
          : `https://account.xiaomi.com${checkUrl}`,
        mergedSessionCookies
      )

    const finalMergedCookies = {
      ...parseCookieString(mergedSessionCookies),
      ...allCookies,
    }
    const platformCookieStr = buildPlatformCookies(
      allCookies,
      finalMergedCookies
    )

    return {
      status: "success",
      message: "OTP verified and cookies extracted successfully!",
      cookie: platformCookieStr,
      raw: verifyJson,
    }
  }

  public async refresh(cookie: string): Promise<ApiResponse> {
    const cb =
      "https://platform.xiaomimimo.com/sts?sign=M7gfywevl3CG5YTTcZDifhK6IK8%3D&followup=https%3A%2F%2Fplatform.xiaomimimo.com%2Fconsole%2Fbalance"
    const loginUrl = `https://account.xiaomi.com/pass/serviceLogin?sid=api-platform&_group=DEFAULT&_json=true&callback=${encodeURIComponent(cb)}`

    const res = await fetchWithTimeout(loginUrl, {
      headers: { "User-Agent": this.USER_AGENT, Cookie: cookie },
      redirect: "manual",
    })

    const text = await res.text()
    const json = JSON.parse(text.replace("&&&START&&&", ""))

    if (json.code !== 0 || !json.location) {
      return {
        status: "error",
        message: "Master session expired or invalid. Please re-login.",
        raw: json,
      }
    }

    const { allCookies } = await this.xiaomiApi.followRedirectsForCookies(
      json.location as string,
      cookie
    )
    const mergedCookies = { ...parseCookieString(cookie), ...allCookies }
    const platformCookieStr = buildPlatformCookies(allCookies, mergedCookies)

    return {
      status: "success",
      message: "Session successfully refreshed!",
      cookie: platformCookieStr,
    }
  }
}
