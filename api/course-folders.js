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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authToken = await getAuthToken()
    const { action } = req.query

    // GET: 获取课程列表、目录树、内容列表
    if (req.method === 'GET') {
      if (action === 'courses') {
        const data = await getCourseList(authToken)
        return res.json(data)
      }

      if (action === 'directory') {
        const { courseId } = req.query
        if (!courseId) return res.status(400).json({ error: '缺少 courseId' })
        const data = await getCourseDirectory(authToken, courseId)
        return res.json(data)
      }

      if (action === 'content') {
        const { courseId, parentId = 0, page = 1, pageSize = 100 } = req.query
        if (!courseId) return res.status(400).json({ error: '缺少 courseId' })
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
        const folderId = await createFolder(authToken, courseId, name, parentId)
        return res.json({ success: true, folderId })
      }

      if (action === 'release') {
        const { resourceIds, courseIds, parentId = 0 } = req.body
        if (!resourceIds || !courseIds) return res.status(400).json({ error: '缺少参数' })
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
        await moveCourseContent(authToken, courseId, contentIds, targetParentId)
        return res.json({ success: true })
      }

      return res.status(400).json({ error: '未知操作' })
    }

    // DELETE: 删除文件夹/文件
    if (req.method === 'DELETE') {
      const { contentIds } = req.body
      if (!contentIds || !Array.isArray(contentIds)) {
        return res.status(400).json({ error: '缺少 contentIds' })
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
