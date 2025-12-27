// 优学院 API 客户端 - TypeScript 实现
// 基于 Python 版本的逻辑重写

interface UlearningTokenInfo {
  ak: string
  sk: string
  securitytoken: string
  endpoint: string
  bucket: string
  domain: string
}

interface LoginResponse {
  authorization: string
}

interface UploadTokenResponse {
  code: number
  message?: string
  result: UlearningTokenInfo
}

const API_BASE_URL = 'https://courseapi.ulearning.cn'

// 登录获取 Token
export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginName: username, password })
  })

  if (!response.ok) {
    throw new Error(`登录失败: ${response.status}`)
  }

  const result: LoginResponse = await response.json()
  if (!result.authorization) {
    throw new Error('登录失败: 未获取到 authorization')
  }

  return result.authorization
}

// 获取上传令牌
export async function getUploadToken(authToken: string, remotePath: string): Promise<UlearningTokenInfo> {
  const url = new URL(`${API_BASE_URL}/obs/uploadToken`)
  url.searchParams.set('path', remotePath)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`获取上传令牌失败: ${response.status} - ${errorText}`)
  }

  const data: UploadTokenResponse = await response.json()
  if (data.code !== 1) {
    throw new Error(`获取上传令牌失败: ${data.message}`)
  }

  return data.result
}

// 通知上传完成
export async function notifyUploadComplete(
  authToken: string,
  filename: string,
  fileUrl: string,
  fileSize: number
): Promise<string> {
  const ext = filename.split('.').pop() || ''

  const response = await fetch(`${API_BASE_URL}/course/content/upload?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      Origin: 'https://courseweb.ulearning.cn',
      Referer: 'https://courseweb.ulearning.cn/'
    },
    body: JSON.stringify({
      title: filename,
      type: 1,
      status: 2,
      contentSize: fileSize,
      location: fileUrl,
      mimeType: ext,
      isView: 0,
      remark2: 1,
      remark3: 0
    })
  })

  if (!response.ok) {
    throw new Error(`通知上传完成失败: ${response.status}`)
  }

  return await response.text()
}

// 发布到课程
export async function publishToCourse(
  authToken: string,
  contentId: string,
  courseId: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/course/content?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      Origin: 'https://courseweb.ulearning.cn',
      Referer: 'https://courseweb.ulearning.cn/'
    },
    body: JSON.stringify({
      ocId: courseId,
      contentIds: [{ id: null, contentId: parseInt(contentId), localType: 0 }],
      parentId: 0
    })
  })

  if (!response.ok) {
    throw new Error(`发布到课程失败: ${response.status}`)
  }

  return await response.text()
}

// 构建远程路径
export function buildRemotePath(filename: string): string {
  const timestamp = Date.now()
  const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : ''
  return `resources/web/${timestamp}${ext}`
}
