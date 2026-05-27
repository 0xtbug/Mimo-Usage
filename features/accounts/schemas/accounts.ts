import { z } from "zod"

export const manualCookieSchema = z.object({
  cookie: z.string().min(1, { message: "Cookie string is required" }),
})

export const addAccountSchema = z.object({
  name: z.string().optional(),
  cookie: z.string().min(1, { message: "Cookie string is required" }),
})

export const importAccountSchema = z.object({
  name: z.string().optional(),
  cookie: z.string().min(1, { message: "Cookie string is required" }),
})

// Used for validating the parsed JSON array directly
export const importAccountsSchema = z
  .array(importAccountSchema)
  .min(1, { message: "Expected a JSON array of accounts" })
