"use client"

import * as React from "react"

interface PrivacyContextValue {
  isPrivate: boolean
  togglePrivacy: () => void
  maskEmail: (email: string | null | undefined) => string
}

const PrivacyContext = React.createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = React.useState(false)

  const togglePrivacy = React.useCallback(() => {
    setIsPrivate((prev) => !prev)
  }, [])

  const maskEmail = React.useCallback(
    (email: string | null | undefined): string => {
      if (!isPrivate || !email) return email ?? ""
      return "****@****"
    },
    [isPrivate]
  )

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy, maskEmail }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = React.useContext(PrivacyContext)
  if (!context) {
    throw new Error("usePrivacy must be used within PrivacyProvider")
  }
  return context
}
