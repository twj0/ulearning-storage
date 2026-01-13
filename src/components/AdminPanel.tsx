import { useState, useEffect } from 'react'
import { FiTrash2, FiCopy, FiDownload, FiRefreshCw } from 'react-icons/fi'

interface FileItem {
  contentId: number
  title: string
  contentSize: number
  location: string
  mimeType: string
  createDate: number
}

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setFiles(data.list || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authenticated) fetchFiles()
  }, [authenticated])

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`确定删除 ${ids.length} 个文件？`)) return
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({ contentIds: ids })
      })
      if (res.ok) {
        setSelected([])
        fetchFiles()
      } else {
        const data = await res.json()
        alert(data.error)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('链接已复制')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-80">
          <h2 className="text-xl font-bold mb-4 text-center">管理员登录</h2>
          <input
            type="password"
            placeholder="输入管理员密码"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAuthenticated(true)}
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            onClick={() => setAuthenticated(true)}
          >
            登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">文件管理</h1>
          <div className="flex gap-2">
            {selected.length > 0 && (
              <button
                className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDelete(selected)}
              >
                <FiTrash2 /> 删除选中 ({selected.length})
              </button>
            )}
            <button
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={fetchFiles}
            >
              <FiRefreshCw /> 刷新
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">加载中...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === files.length && files.length > 0}
                      onChange={e => setSelected(e.target.checked ? files.map(f => f.contentId) : [])}
                    />
                  </th>
                  <th className="p-3 text-left">文件名</th>
                  <th className="p-3 text-left w-24">大小</th>
                  <th className="p-3 text-left w-40">上传时间</th>
                  <th className="p-3 text-left w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.contentId} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(file.contentId)}
                        onChange={e => setSelected(e.target.checked
                          ? [...selected, file.contentId]
                          : selected.filter(id => id !== file.contentId)
                        )}
                      />
                    </td>
                    <td className="p-3 truncate max-w-xs" title={file.title}>{file.title}</td>
                    <td className="p-3 text-gray-500">{formatSize(file.contentSize)}</td>
                    <td className="p-3 text-gray-500">{new Date(file.createDate).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700"
                          onClick={() => copyLink(file.location)}
                          title="复制链接"
                        >
                          <FiCopy />
                        </button>
                        <a
                          href={file.location}
                          target="_blank"
                          className="p-1 text-green-500 hover:text-green-700"
                          title="下载"
                        >
                          <FiDownload />
                        </a>
                        <button
                          className="p-1 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete([file.contentId])}
                          title="删除"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {files.length === 0 && <div className="text-center py-10 text-gray-500">暂无文件</div>}
          </div>
        )}
      </div>
    </div>
  )
}
