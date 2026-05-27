import CryptoJS from "crypto-js"

export async function md5(input: string): Promise<string> {
  return CryptoJS.MD5(input).toString()
}
