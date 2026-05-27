import { randomUUID } from "crypto"
import { readFile, writeFile } from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

interface StoredAccount {
  id: string
  name: string
  cookie: string
}

const DATA_DIR = join(process.cwd(), "data")
const ACCOUNTS_FILE = join(DATA_DIR, "accounts.json")

// In-memory cache to avoid repeated disk reads
let accountsCache: StoredAccount[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5_000 // 5 seconds

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

async function readAccounts(): Promise<StoredAccount[]> {
  const now = Date.now()
  if (accountsCache && now - cacheTimestamp < CACHE_TTL) {
    return accountsCache
  }

  ensureDataDir()
  if (!existsSync(ACCOUNTS_FILE)) {
    await writeFile(ACCOUNTS_FILE, "[]")
    accountsCache = []
    cacheTimestamp = now
    return []
  }
  const data = await readFile(ACCOUNTS_FILE, "utf-8")
  const parsed = JSON.parse(data) as StoredAccount[]
  accountsCache = parsed
  cacheTimestamp = now
  return parsed
}

export async function writeAccounts(accounts: StoredAccount[]) {
  ensureDataDir()
  await writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2))
  accountsCache = accounts
  cacheTimestamp = Date.now()
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
