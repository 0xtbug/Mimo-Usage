"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  addAccount,
  startAutoLogin,
  verifyAutoLoginOtp,
} from "@/features/accounts/api/client-api"
import {
  Lightning,
  Cookie,
  CircleNotch,
  ShieldCheck,
  Envelope,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { loginSchema, verifyOtpSchema } from "@/features/auth/schemas/auth"
import { manualCookieSchema } from "@/features/accounts/schemas/accounts"

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

type Tab = "auto" | "manual"
type AutoLoginStep = "credentials" | "otp"

export function AddAccountDialog({
  open,
  onOpenChange,
  onAdded,
}: AddAccountDialogProps) {
  const [tab, setTab] = React.useState<Tab>("auto")

  // Manual cookie state
  const [cookie, setCookie] = React.useState("")
  const [manualLoading, setManualLoading] = React.useState(false)

  // Auto login state
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [autoStep, setAutoStep] = React.useState<AutoLoginStep>("credentials")
  const [autoLoading, setAutoLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  function resetState() {
    setTab("auto")
    setCookie("")
    setEmail("")
    setPassword("")
    setOtp("")
    setSessionId(null)
    setAutoStep("credentials")
    setAutoLoading(false)
    setManualLoading(false)
    setShowPassword(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }

  // ── Manual cookie submission ──────────────────────────────

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = manualCookieSchema.safeParse({ cookie: cookie.trim() })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setManualLoading(true)
    const toastId = toast.loading("Adding account...")

    try {
      await addAccount(parsed.data.cookie)
      setCookie("")
      toast.success("Account added successfully!", { id: toastId })
      onAdded()
      handleOpenChange(false)
    } catch (err) {
      toast.error("Failed to add account", {
        description: err instanceof Error ? err.message : "Unknown error",
        id: toastId,
      })
    } finally {
      setManualLoading(false)
    }
  }

  // ── Auto login: Phase 1 ───────────────────────────────────

  async function handleAutoLogin(e: React.FormEvent) {
    e.preventDefault()
    const parsed = loginSchema.safeParse({
      email: email.trim(),
      password: password.trim(),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setAutoLoading(true)
    const toastId = toast.loading("Logging in...")

    try {
      const result = await startAutoLogin(
        parsed.data.email,
        parsed.data.password
      )

      if (result.status === "otp_required") {
        setSessionId(result.sessionId || null)
        setAutoStep("otp")
        toast.info("OTP Required", {
          description: result.message,
          id: toastId,
        })
      } else if (result.status === "success") {
        toast.success("Account added successfully!", { id: toastId })
        onAdded()
        handleOpenChange(false)
      } else {
        toast.error("Login failed", {
          description: result.message || "Unknown error",
          id: toastId,
        })
      }
    } catch (err) {
      toast.error("Login failed", {
        description: err instanceof Error ? err.message : "Unknown error",
        id: toastId,
      })
    } finally {
      setAutoLoading(false)
    }
  }

  // ── Auto login: Phase 2 (OTP) ─────────────────────────────

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = verifyOtpSchema.safeParse({
      otp: otp.trim(),
      sessionId: sessionId || "",
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setAutoLoading(true)
    const toastId = toast.loading("Verifying OTP...")

    try {
      const result = await verifyAutoLoginOtp(
        parsed.data.sessionId,
        parsed.data.otp
      )

      if (result.status === "success") {
        toast.success("Account added successfully!", { id: toastId })
        onAdded()
        handleOpenChange(false)
      } else {
        toast.error("Verification failed", {
          description: result.message || "Invalid OTP",
          id: toastId,
        })
      }
    } catch (err) {
      toast.error("Verification failed", {
        description: err instanceof Error ? err.message : "Unknown error",
        id: toastId,
      })
    } finally {
      setAutoLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Add a MiMo account using auto login or manual cookie entry.
          </DialogDescription>
        </DialogHeader>

        {/* ── Tab Switcher ─────────────────────────────────── */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("auto")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "auto"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lightning weight="bold" className="size-3.5" />
            Auto Login
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cookie weight="bold" className="size-3.5" />
            Manual Cookie
          </button>
        </div>

        {/* ── Auto Login Tab ──────────────────────────────── */}
        {tab === "auto" && (
          <div className="flex flex-col gap-4">
            {/* Step 1: Credentials */}
            {autoStep === "credentials" && (
              <form onSubmit={handleAutoLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-xiaomi-email@example.com"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your Xiaomi password"
                      className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeSlash className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Xiaomi will send an OTP to your email. You&apos;ll enter it in
                  the next step.
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={autoLoading || !email.trim() || !password.trim()}
                  >
                    {autoLoading && (
                      <CircleNotch className="mr-2 size-4 animate-spin" />
                    )}
                    Login
                  </Button>
                </DialogFooter>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {autoStep === "otp" && (
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-lg border border-primary bg-primary/10 p-3">
                  <Envelope
                    weight="duotone"
                    className="size-5 shrink-0 text-primary"
                  />
                  <div className="text-sm text-primary">
                    Verification required. An OTP has been sent to your email.
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the OTP from your email"
                    className="rounded-md border bg-background px-3 py-2 font-mono text-sm tracking-widest"
                    autoComplete="one-time-code"
                    maxLength={10}
                    required
                    autoFocus
                  />
                </div>
                <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAutoStep("credentials")
                      setSessionId(null)
                      setOtp("")
                    }}
                    disabled={autoLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={autoLoading || !otp.trim()}>
                    {autoLoading ? (
                      <CircleNotch className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <ShieldCheck weight="bold" className="mr-1.5 size-4" />
                    )}
                    Verify OTP
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        )}

        {/* ── Manual Cookie Tab ───────────────────────────── */}
        {tab === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Cookie</label>
              <textarea
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="Paste your full cookie string here..."
                rows={4}
                className="resize-none rounded-md border bg-background px-3 py-2 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Get this from browser DevTools → Application → Cookies →
                platform.xiaomimimo.com
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={manualLoading || !cookie.trim()}>
                {manualLoading && (
                  <CircleNotch className="mr-2 size-4 animate-spin" />
                )}
                Add Account
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
