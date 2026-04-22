'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'

export default function UploadComprobante({ onFileSelect, disabled = false }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // LOGGING DIAGNÓSTICO (comentado)
    // console.log('🔍 [FRONTEND UploadComprobante] Archivo seleccionado:', {
    //   name: selectedFile.name,
    //   type: selectedFile.type,
    //   size: selectedFile.size
    // })

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/pjpeg']
    // console.log('🔍 [FRONTEND UploadComprobante] Tipos permitidos:', allowedTypes)
    // console.log('🔍 [FRONTEND UploadComprobante] Tipo está en lista permitida:', allowedTypes.includes(selectedFile.type))

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Solo se permiten archivos PDF, PNG o JPG')
      setFile(null)
      onFileSelect(null)
      return
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('El archivo no puede exceder 10MB')
      setFile(null)
      onFileSelect(null)
      return
    }

    setError(null)
    setFile(selectedFile)
    onFileSelect(selectedFile)
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={disabled}
            className="hidden"
            id="comprobante-input"
          />
          
          <label
            htmlFor="comprobante-input"
            className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">
              Click para subir comprobante
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, PNG o JPG (máx. 10MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              type="button"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}
