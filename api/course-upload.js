import { getUploadToken, notifyUploadComplete, buildRemotePath, releaseToCourseFolders } from './ulearning-api.js'
import { uploadToOBS } from './obs-uploader.js'
import { getAuthToken } from './lib/auth.js'

function parseJsonEnv(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function getAllowedCourseIds() {
  const raw = process.env.COURSE_IDS
  if (!raw) return null
  const ids = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => Number(s))
    .filter(n => Number.isFinite(n))

  return ids.length > 0 ? new Set(ids) : null
}

function canWriteCourse(req, courseId) {
  const adminPassword = req.headers['x-admin-password']
  if (adminPassword && adminPassword === process.env.ADMIN_PASSWORD) return true

  const coursePasswords = parseJsonEnv(process.env.COURSE_PASSWORDS, {})
  const coursePassword = req.headers['x-course-password']
  if (!coursePassword) return false

  return coursePasswords[String(courseId)] === coursePassword
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Course-Password, X-Admin-Password')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { files, courseId, parentId = 0 } = req.body
    if (!courseId) return res.status(400).json({ error: '缺少 courseId' })
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '缺少 files' })
    }

    const allowedCourseIds = getAllowedCourseIds()
    if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
      return res.status(403).json({ error: '课程不允许访问' })
    }

    if (!canWriteCourse(req, courseId)) {
      return res.status(401).json({ error: '课程口令错误' })
    }

    const authToken = await getAuthToken()
    const uploaded = []

    for (const fileData of files) {
      const { name, size, content } = fileData
      const buffer = Buffer.from(content, 'base64')

      const remotePath = buildRemotePath(name)
      const tokenInfo = await getUploadToken(authToken, remotePath)

      const fileUrl = await uploadToOBS(buffer, remotePath, tokenInfo)
      const contentId = await notifyUploadComplete(authToken, name, fileUrl, size)

      await releaseToCourseFolders(authToken, [contentId], [courseId], parentId)

      uploaded.push({ name, url: fileUrl, contentId })
    }

    return res.status(200).json({ files: uploaded })
  } catch (error) {
    console.error('Course upload error:', error)
    return res.status(500).json({ error: error.message })
  }
}
