import { useState, useEffect } from 'react'
import { FiFolder, FiFile, FiFolderPlus, FiTrash2, FiMove, FiChevronRight, FiHome, FiRefreshCw, FiUpload } from 'react-icons/fi'
import FileUpload from './FileUpload'

interface Course {
  id: number
  name: string
}

interface ContentItem {
  id: number
  title: string
  type: number // 0=文件夹, 3=文件
  parentId: number
  contentSize?: number
  remark?: string
  location?: string
  mimeType?: string
}

interface CourseFoldersProps {
  refreshKey: number
}

export default function CourseFolders({ refreshKey }: CourseFoldersProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [currentPath, setCurrentPath] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [coursePassword, setCoursePassword] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [directories, setDirectories] = useState<any[]>([])
  const [showUpload, setShowUpload] = useState(false)

  const canWrite = coursePassword.trim().length > 0

  // 获取课程列表
  useEffect(() => {
    fetchCourses()
  }, [])

  // 课程变化时获取内容
  useEffect(() => {
    if (selectedCourse) {
      fetchContents(0)
      fetchDirectories()
      setCoursePassword('')
    }
  }, [selectedCourse, refreshKey])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/course-folders?action=courses')
      const data = await res.json()
      const courseList = data.courseList || data.result?.courseList || []
      setCourses(courseList)
      if (courseList?.length > 0) {
        setSelectedCourse(courseList[0])
      }
    } catch (err) {
      console.error('获取课程列表失败:', err)
    }
  }

  const fetchDirectories = async () => {
    if (!selectedCourse) return
    try {
      const res = await fetch(`/api/course-folders?action=directory&courseId=${selectedCourse.id}`)
      const data = await res.json()
      setDirectories(data || [])
    } catch (err) {
      console.error('获取目录树失败:', err)
    }
  }

  const fetchContents = async (parentId: number) => {
    if (!selectedCourse) return
    setLoading(true)
    try {
      const res = await fetch(`/api/course-folders?action=content&courseId=${selectedCourse.id}&parentId=${parentId}`)
      const data = await res.json()
      setContents(data.list || [])
    } catch (err) {
      console.error('获取内容失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentParentId = () => currentPath.length > 0 ? currentPath[currentPath.length - 1].id : 0

  const handleFolderClick = (item: ContentItem) => {
    if (item.type === 0) {
      setCurrentPath([...currentPath, { id: item.id, name: item.title }])
      fetchContents(item.id)
      setSelectedItems([])
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([])
      fetchContents(0)
    } else {
      const newPath = currentPath.slice(0, index + 1)
      setCurrentPath(newPath)
      fetchContents(newPath[newPath.length - 1].id)
    }
    setSelectedItems([])
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedCourse) return
    try {
      const res = await fetch('/api/course-folders?action=create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          name: newFolderName.trim(),
          parentId: getCurrentParentId()
        })
      })
      if (res.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        fetchContents(getCurrentParentId())
        fetchDirectories()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '创建文件夹失败')
      }
    } catch (err) {
      console.error('创建文件夹失败:', err)
    }
  }

  const handleDelete = async () => {
    if (!selectedCourse) return
    if (selectedItems.length === 0) return
    if (!confirm(`确定删除选中的 ${selectedItems.length} 个项目？`)) return
    try {
      const res = await fetch('/api/course-folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({ courseId: selectedCourse.id, contentIds: selectedItems })
      })
      if (res.ok) {
        setSelectedItems([])
        fetchContents(getCurrentParentId())
        fetchDirectories()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '删除失败')
      }
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  const handleMove = async (targetParentId: number) => {
    if (!selectedCourse || selectedItems.length === 0) return
    try {
      const res = await fetch('/api/course-folders?action=move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          contentIds: selectedItems,
          targetParentId
        })
      })
      if (res.ok) {
        setSelectedItems([])
        setShowMoveDialog(false)
        fetchContents(getCurrentParentId())
        fetchDirectories()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '移动失败')
      }
    } catch (err) {
      console.error('移动失败:', err)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const renderDirectoryTree = (items: any[], level = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <button
          onClick={() => handleMove(item.id)}
          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <FiFolder className="text-yellow-500" />
          <span className="truncate">{item.title}</span>
        </button>
        {item.son?.length > 0 && renderDirectoryTree(item.son, level + 1)}
      </div>
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 课程选择 */}
      <div className="p-4 border-b flex items-center gap-4">
        <select
          value={selectedCourse?.id || ''}
          onChange={e => {
            const course = courses.find(c => c.id === Number(e.target.value))
            setSelectedCourse(course || null)
            setCurrentPath([])
          }}
          className="px-3 py-2 border rounded-lg"
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="password"
          value={coursePassword}
          onChange={e => setCoursePassword(e.target.value)}
          placeholder="课程口令（可选）"
          className="px-3 py-2 border rounded-lg"
        />

        {canWrite && (
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiFolderPlus /> 新建文件夹
          </button>
        )}

        {canWrite && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FiUpload /> 上传
          </button>
        )}

        {canWrite && selectedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowMoveDialog(true)}
              className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
            >
              <FiMove /> 移动 ({selectedItems.length})
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FiTrash2 /> 删除 ({selectedItems.length})
            </button>
          </>
        )}

        <button
          onClick={() => fetchContents(getCurrentParentId())}
          className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* 面包屑导航 */}
      <div className="px-4 py-2 border-b flex items-center gap-1 text-sm bg-gray-50">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 rounded"
        >
          <FiHome /> 根目录
        </button>
        {currentPath.map((p, i) => (
          <span key={p.id} className="flex items-center">
            <FiChevronRight className="text-gray-400" />
            <button
              onClick={() => handleBreadcrumbClick(i)}
              className="px-2 py-1 hover:bg-gray-200 rounded"
            >
              {p.name}
            </button>
          </span>
        ))}
      </div>

      {/* 内容列表 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : contents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">空文件夹</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {contents.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 0) {
                    handleFolderClick(item)
                    return
                  }

                  if (!canWrite) {
                    if (item.location) window.open(item.location, '_blank')
                    return
                  }

                  toggleSelect(item.id)
                }}
                className={`p-4 border rounded-lg cursor-pointer transition hover:shadow-md ${
                  selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {canWrite && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      onClick={e => e.stopPropagation()}
                      className="self-start"
                    />
                  )}
                  {item.type === 0 ? (
                    <FiFolder className="text-4xl text-yellow-500" />
                  ) : (
                    <FiFile className="text-4xl text-gray-400" />
                  )}
                  <span className="text-sm text-center truncate w-full" title={item.title}>
                    {item.title}
                  </span>
                  {item.remark && item.type !== 0 && (
                    <span className="text-xs text-gray-400">{item.remark}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建文件夹对话框 */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">新建文件夹</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="文件夹名称"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移动对话框 */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold mb-4">移动到...</h3>
            <div className="border rounded-lg">
              <button
                onClick={() => handleMove(0)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 border-b"
              >
                <FiHome className="text-gray-500" />
                <span>根目录</span>
              </button>
              {renderDirectoryTree(directories)}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowMoveDialog(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && selectedCourse && (
        <FileUpload
          token="public"
          endpoint="/api/course-upload"
          requestHeaders={{ 'X-Course-Password': coursePassword }}
          extraBody={{ courseId: selectedCourse.id, parentId: getCurrentParentId() }}
          onClose={() => setShowUpload(false)}
          onComplete={() => {
            setShowUpload(false)
            fetchContents(getCurrentParentId())
          }}
        />
      )}
    </div>
  )
}
