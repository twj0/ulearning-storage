// Cloudflare Workers API - 调用优学院和华为云 OBS
// 完整实现：登录、上传、下载、文件管理

import * as UlearningAPI from '../ulearning-api'
import { uploadToOBS } from '../obs-uploader'

interface Env {
  DB: D1Database
  KV: KVNamespace
  DEFAULT_COURSE_ID?: string
  ULEARNING_USERNAME?: string
  ULEARNING_PASSWORD?: string
  ADMIN_NAME?: string
  ADMIN_PASSWORD?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 获取或刷新 token
async function getAuthToken(env: Env, forceRefresh: boolean = false): Promise<string> {
  // 1. 尝试从 KV 获取缓存的 token（除非强制刷新）
  if (!forceRefresh) {
    const cachedToken = await env.KV.get('auth_token')
    if (cachedToken) {
      return cachedToken
    }
  }

  // 2. 使用环境变量中的用户名密码登录
  if (!env.ULEARNING_USERNAME || !env.ULEARNING_PASSWORD) {
    throw new Error('未配置 ULEARNING_USERNAME 或 ULEARNING_PASSWORD')
  }

  const authToken = await UlearningAPI.login(env.ULEARNING_USERNAME, env.ULEARNING_PASSWORD)

  // 3. 缓存 token（12小时过期）
  await env.KV.put('auth_token', authToken, { expirationTtl: 43200 })

  return authToken
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 登录接口
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const { username, password } = await request.json() as { username: string; password: string }

      // 调用优学院登录 API
      const authToken = await UlearningAPI.login(username, password)

      // 保存到 KV（可选，用于会话管理）
      const sessionId = crypto.randomUUID()
      await env.KV.put(`session:${sessionId}`, authToken, { expirationTtl: 86400 })

      return new Response(JSON.stringify({
        token: authToken,
        sessionId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 刷新 token 接口
    if (url.pathname === '/api/auth/refresh' && request.method === 'POST') {
      const authToken = await getAuthToken(env, true)
      return new Response(JSON.stringify({ token: authToken }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 文件上传接口 - 返回上传令牌给前端
    if (url.pathname === '/api/files/upload' && request.method === 'POST') {
      const authToken = await getAuthToken(env)
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const courseId = formData.get('courseId') as string | null || env.DEFAULT_COURSE_ID

      const uploadTokens = []
      for (const file of files) {
        const remotePath = UlearningAPI.buildRemotePath(file.name)
        const tokenInfo = await UlearningAPI.getUploadToken(authToken, remotePath)

        uploadTokens.push({
          fileName: file.name,
          remotePath,
          tokenInfo,
          authToken,
          courseId
        })
      }

      return new Response(JSON.stringify({ uploadTokens }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 通知上传完成接口
    if (url.pathname === '/api/files/complete' && request.method === 'POST') {
      const { authToken, fileName, fileUrl, fileSize, courseId } = await request.json() as {
        authToken: string
        fileName: string
        fileUrl: string
        fileSize: number
        courseId?: string
      }

      const contentId = await UlearningAPI.notifyUploadComplete(authToken, fileName, fileUrl, fileSize)

      if (courseId) {
        await UlearningAPI.publishToCourse(authToken, contentId, courseId)
      }

      await env.DB.prepare(
        'INSERT INTO files (id, name, size, type, url, content_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        crypto.randomUUID(),
        fileName,
        fileSize,
        '',
        fileUrl,
        contentId,
        new Date().toISOString()
      ).run()

      return new Response(JSON.stringify({ contentId, fileUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 获取文件列表
    if (url.pathname === '/api/files' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const type = url.searchParams.get('type')
      let query = 'SELECT * FROM files ORDER BY created_at DESC'

      if (type === 'image') {
        query = 'SELECT * FROM files WHERE type LIKE "image/%" ORDER BY created_at DESC'
      }

      const result = await env.DB.prepare(query).all()

      return new Response(JSON.stringify({ files: result.results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 删除文件
    if (url.pathname.match(/^\/api\/files\/([^/]+)$/) && request.method === 'DELETE') {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const fileId = url.pathname.split('/')[3]

      // 从数据库删除记录
      await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run()

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 发布到课程
    if (url.pathname === '/api/files/publish' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const authToken = authHeader.replace('Bearer ', '')
      const { contentId, courseId } = await request.json() as { contentId: string; courseId: string }

      const result = await UlearningAPI.publishToCourse(authToken, contentId, courseId)

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
