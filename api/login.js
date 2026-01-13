import { login } from './ulearning-api.js'

/**
 * 默认导出的异步处理函数，用于处理登录请求
 * @param {Object} req - 请求对象，包含请求方法和请求体
 * @param {Object} res - 响应对象，用于返回响应数据
 */
export default async function handler(req, res) {
  // 设置CORS头，允许所有来源的请求
  res.setHeader('Access-Control-Allow-Origin', '*')
  // 设置允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  // 设置允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 从请求体中解构出用户名和密码
    const { username, password } = req.body

    // 验证用户名和密码是否为空
    if (!username || !password) {
      return res.status(400).json({ error: '缺少用户名或密码' })
    }

    // 调用登录函数获取认证令牌
    const authToken = await login(username, password)
    // 返回成功响应和令牌
    res.status(200).json({ token: authToken })
  } catch (error) {
    // 记录错误日志
    console.error('Login error:', error)
    // 返回错误响应
    res.status(500).json({ error: error.message })
  }
}
