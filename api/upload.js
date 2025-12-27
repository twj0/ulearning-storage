import { login, getUploadToken, notifyUploadComplete, publishToCourse, buildRemotePath } from './ulearning-api.js'
import { uploadToOBS } from './obs-uploader.js'

let cachedToken = null
let tokenExpiry = 0

async function getAuthToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const username = process.env.ULEARNING_USERNAME
  const password = process.env.ULEARNING_PASSWORD

  if (!username || !password) {
    throw new Error('未配置 ULEARNING_USERNAME 或 ULEARNING_PASSWORD')
  }

  cachedToken = await login(username, password)
  tokenExpiry = Date.now() + 12 * 60 * 60 * 1000 // 12小时
  return cachedToken
}

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
    const authToken = await getAuthToken()
    const { files, courseId } = req.body
    const uploaded = []

    for (const fileData of files) {
      const { name, size, content } = fileData
      const buffer = Buffer.from(content, 'base64')

      const remotePath = buildRemotePath(name)
      const tokenInfo = await getUploadToken(authToken, remotePath)

      const fileUrl = await uploadToOBS(buffer, remotePath, tokenInfo)
      const contentId = await notifyUploadComplete(authToken, name, fileUrl, size)

      if (courseId) {
        await publishToCourse(authToken, contentId, courseId)
      }

      uploaded.push({ name, url: fileUrl, contentId })
    }

    res.status(200).json({ files: uploaded })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
}
