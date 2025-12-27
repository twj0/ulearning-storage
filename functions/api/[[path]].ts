// Cloudflare Workers API - 调用优学院和华为云 OBS
// 完整实现：登录、上传、下载、文件管理

import * as UlearningAPI from '../ulearning-api'
import { uploadToOBS } from '../obs-uploader'

interface Env {
  DB: D1Database
  KV: KVNamespace
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    // 文件上传接口
    if (url.pathname === '/api/files/upload' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const authToken = authHeader.replace('Bearer ', '')
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const uploaded = []

      for (const file of files) {
        // 1. 构建远程路径
        const remotePath = UlearningAPI.buildRemotePath(file.name)

        // 2. 获取上传令牌
        const tokenInfo = await UlearningAPI.getUploadToken(authToken, remotePath)

        // 3. 上传到华为云 OBS
        const fileUrl = await uploadToOBS(file, tokenInfo, remotePath)

        // 4. 通知优学院上传完成
        const contentId = await UlearningAPI.notifyUploadComplete(
          authToken,
          file.name,
          fileUrl,
          file.size
        )

        // 5. 保存文件元数据到 D1
        await env.DB.prepare(
          'INSERT INTO files (id, name, size, type, url, content_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          crypto.randomUUID(),
          file.name,
          file.size,
          file.type,
          fileUrl,
          contentId,
          new Date().toISOString()
        ).run()

        uploaded.push({
          name: file.name,
          url: fileUrl,
          contentId
        })
      }

      return new Response(JSON.stringify({ files: uploaded }), {
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
