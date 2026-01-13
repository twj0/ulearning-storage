import { useState, useEffect } from 'react'
import { FiTrash2, FiCopy, FiDownload, FiRefreshCw, FiHome, FiUpload, FiSend } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import FileUpload from './FileUpload'

interface FileItem {
  contentId: number
  title: string
  contentSize: number
  location: string
  mimeType: string
  createDate: number
}

interface Course {
  id: number
  name: string
}

/**
 * 管理员面板组件
 * 用于管理上传的文件，包括查看、删除和复制链接功能
 */
export default function AdminPanel() {
  // 使用React Router的导航
  const navigate = useNavigate()
  // 密码状态
  const [password, setPassword] = useState('')
  // 认证状态
  const [authenticated, setAuthenticated] = useState(false)
  // 文件列表状态
  const [files, setFiles] = useState<FileItem[]>([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 选中的文件ID列表
  const [selected, setSelected] = useState<number[]>([])

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])
  const [publishParentId, setPublishParentId] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  /**
   * 获取文件列表
   * 从服务器API获取文件数据并更新状态
   */
  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/files', {
        headers: { 'X-Admin-Password': password }
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '获取文件列表失败')
        setFiles([])
        setAuthenticated(false)
      } else {
        setFiles(data.list || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setAuthenticated(true)
  }

  useEffect(() => {
    if (authenticated) {
      fetchFiles()
      fetchCourses()
    }
  }, [authenticated])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/course-folders?action=courses')
      const data = await res.json()
      const courseList = data.courseList || data.result?.courseList || []
      setCourses(courseList)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    )
  }

  const handlePublish = async () => {
    if (selected.length === 0) {
      alert('请先选择要发布的库文件')
      return
    }
    if (selectedCourseIds.length === 0) {
      alert('请先选择要发布到的课程')
      return
    }

    setPublishing(true)
    try {
      const res = await fetch('/api/course-folders?action=release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({
          resourceIds: selected,
          courseIds: selectedCourseIds,
          parentId: publishParentId
        })
      })

      if (res.ok) {
        alert('发布成功')
        setSelected([])
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '发布失败')
      }
    } catch (e) {
      console.error(e)
      alert('发布失败')
    }
    setPublishing(false)
  }

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
          <div className="flex justify-end mb-3">
            <button
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => navigate('/')}
            >
              <FiHome /> Home
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4 text-center">管理员登录</h2>
          <input
            type="password"
            placeholder="输入管理员密码"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            onClick={handleLogin}
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
            <button
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => navigate('/')}
            >
              <FiHome /> Home
            </button>
            <button
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setShowUpload(true)}
            >
              <FiUpload /> 上传到库
            </button>
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

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="font-semibold">发布到课程</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={publishParentId}
                onChange={e => setPublishParentId(Number(e.target.value) || 0)}
                className="w-28 px-3 py-2 border rounded-lg"
                placeholder="parentId"
                title="课件目录 parentId（默认 0）"
              />
              <button
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                disabled={publishing || selected.length === 0 || selectedCourseIds.length === 0}
                onClick={handlePublish}
              >
                <FiSend /> 发布 ({selected.length})
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {courses.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
            {courses.length === 0 && <div className="text-sm text-gray-500">暂无课程</div>}
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

      {showUpload && (
        <FileUpload
          token="public"
          endpoint="/api/upload"
          requestHeaders={{ 'X-Admin-Password': password }}
          onClose={() => setShowUpload(false)}
          onComplete={() => {
            setShowUpload(false)
            fetchFiles()
          }}
        />
      )}
    </div>
  )
}
