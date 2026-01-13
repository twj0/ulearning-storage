import { useEffect, useMemo, useState } from 'react'
import {
  FiCheck,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiFolder,
  FiFolderPlus,
  FiHome,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
  FiZoomIn
} from 'react-icons/fi'
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
  location?: string
  mimeType?: string
  createDate?: number
}

export default function CourseImgBed() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [coursePassword, setCoursePassword] = useState('')
  const [imgBedFolderName, setImgBedFolderName] = useState('图床')

  const [rootFolderId, setRootFolderId] = useState<number | null>(null)
  const [currentPath, setCurrentPath] = useState<{ id: number; name: string }[]>([])

  const [folders, setFolders] = useState<ContentItem[]>([])
  const [images, setImages] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)

  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [selectedImages, setSelectedImages] = useState<number[]>([])

  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [previewImage, setPreviewImage] = useState<ContentItem | null>(null)

  const canWrite = coursePassword.trim().length > 0

  const currentParentId = useMemo(() => {
    if (currentPath.length > 0) return currentPath[currentPath.length - 1].id
    return rootFolderId
  }, [currentPath, rootFolderId])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data?.imgBedFolderName) setImgBedFolderName(String(data.imgBedFolderName))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setCoursePassword('')
    setCurrentPath([])
    setSelectedImages([])
    setRootFolderId(null)
    ensureRootFolder(selectedCourse.id)
  }, [selectedCourse?.id, imgBedFolderName])

  useEffect(() => {
    if (!selectedCourse) return
    if (!rootFolderId) return
    fetchContents(currentParentId)
  }, [selectedCourse?.id, rootFolderId, currentParentId])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/course-folders?action=courses')
      const data = await res.json()
      const list = data.courseList || data.result?.courseList || []
      setCourses(list)
      if (list.length > 0) setSelectedCourse(list[0])
    } catch (e) {
      console.error(e)
    }
  }

  const isImageFile = (mimeType?: string) => {
    return !!mimeType && mimeType.startsWith('image/')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const ensureRootFolder = async (courseId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/course-folders?action=content&courseId=${courseId}&parentId=0`)
      const data = await res.json()
      const list: ContentItem[] = data.list || []
      const found = list.find(i => i.type === 0 && i.title === imgBedFolderName)
      if (found) {
        setRootFolderId(found.id)
      } else {
        setRootFolderId(0)
        setFolders([])
        setImages([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchContents = async (parentId: number | null) => {
    if (!selectedCourse || !parentId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/course-folders?action=content&courseId=${selectedCourse.id}&parentId=${parentId}`
      )
      const data = await res.json()
      const list: ContentItem[] = data.list || []
      setFolders(list.filter(i => i.type === 0))
      setImages(list.filter(i => i.type !== 0 && isImageFile(i.mimeType)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index + 1))
    }
    setSelectedImages([])
  }

  const handleFolderClick = (folder: ContentItem) => {
    setCurrentPath([...currentPath, { id: folder.id, name: folder.title }])
    setSelectedImages([])
  }

  const toggleImageSelection = (id: number) => {
    setSelectedImages(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  const handleCreateRootFolder = async () => {
    if (!selectedCourse) return
    if (!canWrite) {
      alert('请输入课程口令后再创建图床目录')
      return
    }

    try {
      const res = await fetch('/api/course-folders?action=create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({ courseId: selectedCourse.id, name: imgBedFolderName, parentId: 0 })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || '创建图床目录失败')
        return
      }

      setRootFolderId(data.folderId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateFolder = async () => {
    if (!selectedCourse) return
    if (!newFolderName.trim()) return
    if (!canWrite) {
      alert('请输入课程口令后再创建文件夹')
      return
    }

    if (!currentParentId) return

    try {
      const res = await fetch('/api/course-folders?action=create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          name: newFolderName.trim(),
          parentId: currentParentId
        })
      })

      if (res.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        fetchContents(currentParentId)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '创建文件夹失败')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async () => {
    if (!selectedCourse) return
    if (!canWrite) {
      alert('请输入课程口令后再删除')
      return
    }
    if (selectedImages.length === 0) return
    if (!confirm(`确定删除选中的 ${selectedImages.length} 个图片？`)) return

    try {
      const res = await fetch('/api/course-folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Course-Password': coursePassword },
        body: JSON.stringify({ courseId: selectedCourse.id, contentIds: selectedImages })
      })

      if (res.ok) {
        setSelectedImages([])
        fetchContents(currentParentId)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '删除失败')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    setSelectedImages([])
    fetchContents(currentParentId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">图床</h1>

          <div className="flex items-center gap-3">
            <select
              value={selectedCourse?.id || ''}
              onChange={e => {
                const course = courses.find(c => c.id === Number(e.target.value))
                setSelectedCourse(course || null)
              }}
              className="px-3 py-2 border rounded-lg"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="password"
              value={coursePassword}
              onChange={e => setCoursePassword(e.target.value)}
              placeholder="课程口令（可选）"
              className="px-3 py-2 border rounded-lg"
            />

            <button
              onClick={() => fetchContents(currentParentId)}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              title="刷新"
            >
              <FiRefreshCw />
            </button>

            <a href="/" className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              返回主页
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg shadow">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
            disabled={!rootFolderId}
          >
            <FiHome /> {imgBedFolderName}
          </button>
          {currentPath.map((p, i) => (
            <span key={p.id} className="flex items-center">
              <FiChevronRight className="text-gray-400" />
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className="px-2 py-1 hover:bg-gray-100 rounded"
              >
                {p.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : !selectedCourse ? (
          <div className="text-center py-12 text-gray-500">暂无课程</div>
        ) : rootFolderId === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">未找到该课程的图床目录：{imgBedFolderName}</p>
            {canWrite && (
              <button
                onClick={handleCreateRootFolder}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiFolderPlus className="inline mr-2" /> 创建图床目录
              </button>
            )}
            {!canWrite && <p className="text-sm text-gray-500 mt-3">输入课程口令后可创建</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">文件夹</h2>
              <div className="flex items-center gap-2">
                {canWrite && (
                  <>
                    <button
                      onClick={() => setShowNewFolder(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FiFolderPlus /> 新建文件夹
                    </button>
                    <button
                      onClick={() => setShowUpload(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <FiUpload /> 上传图片
                    </button>
                  </>
                )}

                {canWrite && selectedImages.length > 0 && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <FiTrash2 /> 删除 ({selectedImages.length})
                  </button>
                )}
              </div>
            </div>

            {folders.length > 0 && (
              <div className="mb-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder)}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FiFolder className="text-4xl text-yellow-500" />
                    <span className="text-sm text-center truncate w-full">{folder.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">图片 ({images.length})</h2>
              {images.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                  <FiFolder className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p>暂无图片</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {images.map(image => (
                    <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden group">
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={image.location}
                          alt={image.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(image)}
                        />

                        {canWrite && (
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.id)}
                            onChange={() => toggleImageSelection(image.id)}
                            className="absolute top-2 left-2 w-5 h-5 text-blue-600 bg-white rounded border-gray-300 focus:ring-blue-500"
                          />
                        )}

                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setPreviewImage(image)}
                            className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                            title="预览"
                          >
                            <FiZoomIn />
                          </button>
                          {image.location && (
                            <button
                              onClick={() => copyToClipboard(image.location || '', image.id)}
                              className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-1"
                              title="复制链接"
                            >
                              {copiedId === image.id ? <FiCheck /> : <FiCopy />}
                              {copiedId === image.id ? '已复制' : ''}
                            </button>
                          )}
                          {image.location && (
                            <a
                              href={image.location}
                              target="_blank"
                              download={image.title}
                              className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                              title="下载"
                            >
                              <FiDownload />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-sm font-medium text-gray-800 truncate" title={image.title}>
                          {image.title}
                        </p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(image.contentSize)}</span>
                          <span>
                            {image.createDate ? new Date(image.createDate).toLocaleDateString('zh-CN') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showUpload && selectedCourse && currentParentId && (
        <FileUpload
          token="public"
          endpoint="/api/course-upload"
          requestHeaders={{ 'X-Course-Password': coursePassword }}
          extraBody={{ courseId: selectedCourse.id, parentId: currentParentId }}
          onClose={() => setShowUpload(false)}
          onComplete={handleUploadComplete}
        />
      )}

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
                onClick={() => {
                  setShowNewFolder(false)
                  setNewFolderName('')
                }}
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

      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-full">
            <img
              src={previewImage.location}
              alt={previewImage.title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 max-w-md">
              <h3 className="font-bold text-lg mb-2">{previewImage.title}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>大小: {formatFileSize(previewImage.contentSize)}</p>
                <p>类型: {previewImage.mimeType}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {previewImage.location && (
                  <button
                    onClick={() => copyToClipboard(previewImage.location || '', previewImage.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                  >
                    {copiedId === previewImage.id ? <FiCheck /> : <FiCopy />}
                    {copiedId === previewImage.id ? '已复制' : '复制链接'}
                  </button>
                )}
                {previewImage.location && (
                  <a
                    href={previewImage.location}
                    target="_blank"
                    download={previewImage.title}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                  >
                    <FiDownload /> 下载
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
