import { useState, useEffect } from 'react'
import { FiCopy, FiCheck, FiTrash2, FiFolder, FiFolderPlus, FiHome, FiChevronRight, FiZoomIn, FiDownload, FiRefreshCw } from 'react-icons/fi'

interface ImageItem {
  id: number
  title: string
  location: string
  contentSize: number
  mimeType: string
  createDate: number
  remark?: string
}

interface FolderItem {
  id: number
  title: string
  type: number // 0=文件夹
  parentId: number
}

interface ImgBedProps {
  refreshKey?: number
}

export default function ImgBed({ refreshKey = 0 }: ImgBedProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [currentPath, setCurrentPath] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null)

  useEffect(() => {
    fetchData()
  }, [refreshKey, currentPath])

  const fetchData = async () => {
    setLoading(true)
    try {
      const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : 0
      
      // 获取图片
      const filesRes = await fetch(`/api/files?parentId=${parentId}&type=image`)
      const filesData = await filesRes.json()
      const imageFiles = (filesData.list || []).filter((item: any) => 
        item.mimeType && item.mimeType.startsWith('image/')
      )
      setImages(imageFiles)

      // 获取文件夹
      if (parentId === 0) {
        const courseRes = await fetch('/api/course-folders?action=content&courseId=153836&parentId=0')
        const courseData = await courseRes.json()
        const courseFolders = (courseData.list || []).filter((item: any) => item.type === 0)
        setFolders(courseFolders)
      } else {
        setFolders([])
      }
    } catch (err) {
      console.error('获取图床数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const isImageFile = (mimeType: string) => {
    return mimeType && mimeType.startsWith('image/')
  }

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentPath([...currentPath, { id: folder.id, name: folder.title }])
    setSelectedImages([])
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([])
    } else {
      const newPath = currentPath.slice(0, index + 1)
      setCurrentPath(newPath)
    }
    setSelectedImages([])
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const res = await fetch('/api/course-folders?action=create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 153836,
          name: newFolderName.trim(),
          parentId: currentPath.length > 0 ? currentPath[currentPath.length - 1].id : 0
        })
      })
      if (res.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        fetchData()
      }
    } catch (err) {
      console.error('创建文件夹失败:', err)
    }
  }

  const handleDelete = async () => {
    if (selectedImages.length === 0) return
    if (!confirm(`确定删除选中的 ${selectedImages.length} 个图片？`)) return
    
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds: selectedImages })
      })
      if (res.ok) {
        setSelectedImages([])
        fetchData()
      }
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  const toggleImageSelection = (id: number) => {
    setSelectedImages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">图床</h1>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewFolder(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiFolderPlus /> 新建文件夹
            </button>
            
            {selectedImages.length > 0 && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FiTrash2 /> 删除 ({selectedImages.length})
              </button>
            )}
            
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FiRefreshCw />
            </button>
            
            <a
              href="/"
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              返回主页
            </a>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg shadow">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
          >
            <FiHome /> 根目录
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Folders */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">文件夹</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          </div>
        )}

        {/* Images */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            图片 ({images.length})
          </h2>
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <FiFolder className="text-6xl text-gray-300 mx-auto mb-4" />
              <p>暂无图片</p>
              <p className="text-sm mt-2">上传图片后即可使用图床功能</p>
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
                    
                    {/* Selection checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="absolute top-2 left-2 w-5 h-5 text-blue-600 bg-white rounded border-gray-300 focus:ring-blue-500"
                    />
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setPreviewImage(image)}
                        className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                        title="预览"
                      >
                        <FiZoomIn />
                      </button>
                      <button
                        onClick={() => copyToClipboard(image.location, image.id)}
                        className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-1"
                        title="复制链接"
                      >
                        {copiedId === image.id ? <FiCheck /> : <FiCopy />}
                        {copiedId === image.id ? '已复制' : ''}
                      </button>
                      <a
                        href={image.location}
                        target="_blank"
                        download={image.title}
                        className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                        title="下载"
                      >
                        <FiDownload />
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-800 truncate" title={image.title}>
                      {image.title}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>{formatFileSize(image.contentSize)}</span>
                      <span>{new Date(image.createDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Folder Modal */}
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

      {/* Image Preview Modal */}
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
                <p>上传时间: {new Date(previewImage.createDate).toLocaleString('zh-CN')}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => copyToClipboard(previewImage.location, previewImage.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  {copiedId === previewImage.id ? <FiCheck /> : <FiCopy />}
                  {copiedId === previewImage.id ? '已复制' : '复制链接'}
                </button>
                <a
                  href={previewImage.location}
                  target="_blank"
                  download={previewImage.title}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <FiDownload /> 下载
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
