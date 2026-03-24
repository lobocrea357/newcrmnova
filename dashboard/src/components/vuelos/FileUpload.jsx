'use client'
import { useState, useCallback } from 'react'
import { Upload, X, File, FileText, Image as ImageIcon } from 'lucide-react'

export default function FileUpload({ 
  tipo, 
  onFilesChange, 
  maxFiles = 5,
  maxSizeMB = 10,
  unlimited = false // Para depósito en oficina (efectivo)
}) {
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Solo se permiten archivos PDF, JPG y PNG'
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo no debe superar ${maxSizeMB}MB`
    }
    return null
  }

  const handleFiles = useCallback((newFiles) => {
    setError('')
    const fileArray = Array.from(newFiles)

    // Si unlimited es true, no validar cantidad de archivos
    if (!unlimited && files.length + fileArray.length > maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    const validFiles = []
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      validFiles.push(file)
    }

    const updatedFiles = [...files, ...validFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, maxFiles, onFilesChange])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
    setError('')
  }

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />
    }
    return <File className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={`file-upload-${tipo}`}
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
        />
        <label
          htmlFor={`file-upload-${tipo}`}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold text-purple-600">Click para subir</span> o arrastra archivos aquí
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG o PNG (máx. {maxSizeMB}MB)
          </p>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Archivos seleccionados ({files.length}{unlimited ? '' : `/${maxFiles}`})
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
