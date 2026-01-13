import { useState, useEffect } from 'react'
import { FiUpload, FiGrid, FiList, FiImage, FiSettings, FiFolder } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import FileUpload from './FileUpload'
import FileList from './FileList'
import ImageGallery from './ImageGallery'
import CourseFolders from './CourseFolders'

interface FileManagerProps {
  token: string
  onLogout: () => void
}

type ViewMode = 'files' | 'gallery' | 'course'

export default function FileManager({ token, onLogout }: FileManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('files')
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()

  const handleUploadComplete = () => {
    setShowUpload(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">ulearning-storage</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('files')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                viewMode === 'files'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiList /> 库
            </button>

            <button
              onClick={() => setViewMode('course')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                viewMode === 'course'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFolder /> 课件
            </button>

            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                viewMode === 'gallery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiImage /> 图床
            </button>

            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <FiUpload /> 上传文件
            </button>

            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FiSettings /> 管理员
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === 'files' ? (
          <FileList token={token} refreshKey={refreshKey} />
        ) : viewMode === 'course' ? (
          <CourseFolders refreshKey={refreshKey} />
        ) : (
          <ImageGallery token={token} refreshKey={refreshKey} />
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          token={token}
          onClose={() => setShowUpload(false)}
          onComplete={handleUploadComplete}
        />
      )}
    </div>
  )
}
