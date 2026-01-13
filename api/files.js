import { getFileList, deleteFiles } from './ulearning-api.js'
import { getAuthToken } from './lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authToken = await getAuthToken()

    if (req.method === 'GET') {
      const { page = 1, pageSize = 100 } = req.query
      const data = await getFileList(authToken, page, pageSize)
      return res.status(200).json(data)
    }

    if (req.method === 'DELETE') {
      const adminPassword = req.headers['x-admin-password']
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: '管理员密码错误' })
      }

      const { contentIds } = req.body
      if (!contentIds || !Array.isArray(contentIds)) {
        return res.status(400).json({ error: '缺少 contentIds' })
      }

      await deleteFiles(authToken, contentIds)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Files API error:', error)
    res.status(500).json({ error: error.message })
  }
}
