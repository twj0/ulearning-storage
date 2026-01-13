import { login } from '../ulearning-api.js'

let cachedToken = null
let tokenExpiry = 0

export async function getAuthToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const username = process.env.ULEARNING_USERNAME
  const password = process.env.ULEARNING_PASSWORD

  if (!username || !password) {
    throw new Error('未配置 ULEARNING_USERNAME 或 ULEARNING_PASSWORD')
  }

  cachedToken = await login(username, password)
  tokenExpiry = Date.now() + 12 * 60 * 60 * 1000
  return cachedToken
}
