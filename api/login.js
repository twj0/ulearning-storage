import { login } from './ulearning-api.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '缺少用户名或密码' })
    }

    const authToken = await login(username, password)
    res.status(200).json({ token: authToken })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: error.message })
  }
}
