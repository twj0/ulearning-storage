import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUploadCloud, FiX, FiCheck } from 'react-icons/fi'

interface FileUploadProps {
  token: string
  onClose: () => void
  onComplete: () => void
}

export default function FileUpload({ token, onClose, onComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const files = await Promise.all(
        acceptedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer()
          return {
            name: file.name,
            size: file.size,
            content: btoa(String.fromCharCode(...new Uint8Array(buffer)))
          }
        })
      )

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }

      const { files: uploaded } = await response.json()
      setProgress(100)
      setSuccess(true)

      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      setUploading(false)
    }
  }, [onComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">上传文件</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <FiX size={24} />
          </button>
        </div>

        {!uploading && !success && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">
              {isDragActive
                ? '释放文件以上传'
                : '拖拽文件到此处，或点击选择文件'}
            </p>
          </div>
        )}

        {uploading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600">上传中... {progress}%</p>
          </div>
        )}

        {success && (
          <div className="text-center py-8">
            <FiCheck className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-gray-600">上传成功！</p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center mt-4">{error}</div>
        )}
      </div>
    </div>
  )
}
