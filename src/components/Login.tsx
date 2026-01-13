import { useState } from 'react'
import { FiLogIn } from 'react-icons/fi'

interface LoginProps {
  onLogin: (token: string) => void
}

/**
 * 登录组件
 * @param {Function} onLogin - 登录成功后的回调函数，接收token参数
 */
export default function Login({ onLogin }: LoginProps) {
  // 用户名状态
  const [username, setUsername] = useState('')
  // 密码状态
  const [password, setPassword] = useState('')
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 错误信息状态
  const [error, setError] = useState('')

  /**
   * 处理登录表单提交
   * @param {React.FormEvent} e - 表单提交事件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单默认提交行为
    setLoading(true) // 设置加载状态为true
    setError('') // 清空错误信息

    try {
      // 发送登录请求
      const response = await fetch('/api/auth/login', {
        method: 'POST', // POST请求
        headers: { 'Content-Type': 'application/json' }, // 设置请求头
        body: JSON.stringify({ username, password }) // 请求体
      })

      // 如果响应状态码不是200-299，抛出错误
      if (!response.ok) throw new Error('登录失败')

      // 解析响应数据
      const data = await response.json()
      // 调用登录成功回调函数
      onLogin(data.token)
    } catch (err) {
      // 设置错误信息
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      // 无论成功失败，最终都设置加载状态为false
      setLoading(false)
    }
  }

  return (
    // 登录页面容器，使用渐变背景
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 登录卡片 */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">云存储</h1>
          <p className="text-gray-600 mt-2">您的在线网盘</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 用户名输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 密码输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 错误信息显示 */}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiLogIn />
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
