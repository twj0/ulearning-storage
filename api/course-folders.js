import { getAuthToken } from './lib/auth.js'
import {
  getCourseList,
  getCourseDirectory,
  getCourseContent,
  createFolder,
  deleteCourseContent,
  moveCourseContent,
  releaseToCourseFolders
} from './ulearning-api.js'

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password, X-Course-Password')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authToken = await getAuthToken()
    const { action } = req.query
    const allowedCourseIds = getAllowedCourseIds()

    // GET: 获取课程列表、目录树、内容列表
    if (req.method === 'GET') {
      if (action === 'courses') {
        const data = await getCourseList(authToken)
        if (!allowedCourseIds) return res.json(data)

        const courseList = Array.isArray(data.courseList)
          ? data.courseList
          : (data.result && Array.isArray(data.result.courseList) ? data.result.courseList : null)

        if (!courseList) return res.json(data)

        const filtered = courseList.filter(c => allowedCourseIds.has(Number(c.id)))
        if (Array.isArray(data.courseList)) {
          return res.json({ ...data, courseList: filtered })
        }
        return res.json({ ...data, result: { ...(data.result || {}), courseList: filtered } })
      }

      if (action === 'directory') {
        const { courseId } = req.query
        if (!courseId) return res.status(400).json({ error: '缺少 courseId' })
        if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
          return res.status(403).json({ error: '课程不允许访问' })
        }
        const data = await getCourseDirectory(authToken, courseId)
        return res.json(data)
      }

      if (action === 'content') {
        const { courseId, parentId = 0, page = 1, pageSize = 100 } = req.query
        if (!courseId) return res.status(400).json({ error: '缺少 courseId' })
        if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
          return res.status(403).json({ error: '课程不允许访问' })
        }
        const data = await getCourseContent(authToken, courseId, parentId, page, pageSize)
        return res.json(data)
      }

      return res.status(400).json({ error: '未知操作' })
    }

    // POST: 创建文件夹、发布文件
    if (req.method === 'POST') {
      if (action === 'create-folder') {
        const { courseId, name, parentId = 0 } = req.body
        if (!courseId || !name) return res.status(400).json({ error: '缺少参数' })
        if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
          return res.status(403).json({ error: '课程不允许访问' })
        }
        if (!canWriteCourse(req, courseId)) {
          return res.status(401).json({ error: '课程口令错误' })
        }
        const folderId = await createFolder(authToken, courseId, name, parentId)
        return res.json({ success: true, folderId })
      }

      if (action === 'release') {
        const { resourceIds, courseIds, parentId = 0 } = req.body
        if (!resourceIds || !courseIds) return res.status(400).json({ error: '缺少参数' })

        const courseIdList = Array.isArray(courseIds) ? courseIds : [courseIds]
        for (const cid of courseIdList) {
          if (allowedCourseIds && !allowedCourseIds.has(Number(cid))) {
            return res.status(403).json({ error: '课程不允许访问' })
          }
          if (!canWriteCourse(req, cid)) {
            return res.status(401).json({ error: '课程口令错误' })
          }
        }

        await releaseToCourseFolders(authToken, resourceIds, courseIds, parentId)
        return res.json({ success: true })
      }

      return res.status(400).json({ error: '未知操作' })
    }

    // PUT: 移动文件/文件夹
    if (req.method === 'PUT') {
      if (action === 'move') {
        const { courseId, contentIds, targetParentId } = req.body
        if (!courseId || !contentIds) return res.status(400).json({ error: '缺少参数' })
        if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
          return res.status(403).json({ error: '课程不允许访问' })
        }
        if (!canWriteCourse(req, courseId)) {
          return res.status(401).json({ error: '课程口令错误' })
        }
        await moveCourseContent(authToken, courseId, contentIds, targetParentId)
        return res.json({ success: true })
      }

      return res.status(400).json({ error: '未知操作' })
    }

    // DELETE: 删除文件夹/文件
    if (req.method === 'DELETE') {
      const { courseId, contentIds } = req.body
      if (!courseId) {
        return res.status(400).json({ error: '缺少 courseId' })
      }
      if (!contentIds || !Array.isArray(contentIds)) {
        return res.status(400).json({ error: '缺少 contentIds' })
      }
      if (allowedCourseIds && !allowedCourseIds.has(Number(courseId))) {
        return res.status(403).json({ error: '课程不允许访问' })
      }
      if (!canWriteCourse(req, courseId)) {
        return res.status(401).json({ error: '课程口令错误' })
      }
      await deleteCourseContent(authToken, contentIds)
      return res.json({ success: true })
    }

    return res.status(405).json({ error: '方法不允许' })
  } catch (error) {
    console.error('课件文件夹API错误:', error)
    return res.status(500).json({ error: error.message })
  }
}
