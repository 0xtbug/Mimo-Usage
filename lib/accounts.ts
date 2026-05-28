import { randomUUID } from "crypto"
import { Redis } from "@upstash/redis"

export interface StoredAccount {
  id: string
  name: string
  cookie: string
}

const REDIS_KEY = "mimo_accounts"

// Initialize Redis from environment variables
const redis = Redis.fromEnv()

async function readAccounts(): Promise<StoredAccount[]> {
  try {
    const data = await redis.get<StoredAccount[]>(REDIS_KEY)
    return data || []
  } catch (err) {
    console.error("Failed to read accounts from Redis", err)
    return []
  }
}

export async function writeAccounts(accounts: StoredAccount[]) {
  try {
    await redis.set(REDIS_KEY, accounts)
  } catch (err) {
    console.error("Failed to write accounts to Redis", err)
  }
}

export async function getAccounts(): Promise<StoredAccount[]> {
  return readAccounts()
}

export async function getAccountById(
  id: string
): Promise<StoredAccount | undefined> {
  const accounts = await readAccounts()
  return accounts.find((a) => a.id === id)
}

export async function addAccount(
  name: string,
  cookie: string
): Promise<StoredAccount> {
  const accounts = await readAccounts()
  const account: StoredAccount = { id: randomUUID(), name, cookie }
  accounts.push(account)
  await writeAccounts(accounts)
  return account
}

export async function updateAccountCookie(
  id: string,
  newCookie: string
): Promise<boolean> {
  const accounts = await readAccounts()
  const account = accounts.find((a) => a.id === id)
  if (!account) return false
  account.cookie = newCookie
  await writeAccounts(accounts)
  return true
}

export async function deleteAccount(id: string): Promise<boolean> {
  const accounts = await readAccounts()
  const index = accounts.findIndex((a) => a.id === id)
  if (index === -1) return false
  accounts.splice(index, 1)
  await writeAccounts(accounts)
  return true
}

/**
 * Extract a specific cookie value from the stored cookie string.
 * Cookie format: "key1=value1; key2=value2; ..."
 */
export function extractCookieValue(
  cookie: string,
  name: string
): string | undefined {
  const pairs = cookie.split(";")
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=")
    if (key.trim() === name) {
      let value = rest.join("=").trim()
      // Strip surrounding double quotes (common in cookie values)
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      return value
    }
  }
  return undefined
}
