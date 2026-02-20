import { useState, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditableCell({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  disabled = false,
  maxLength = null,
  step = undefined,
  ...inputProps
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)

  // Sincronizar valor cuando cambia desde afuera
  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(editValue)
      // El toast de éxito lo maneja el componente padre
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || 'Error al actualizar')
      setEditValue(value) // Revertir valor original
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
    // Enter ya no guarda automáticamente, solo el botón de guardar
  }

  if (disabled) {
    return (
      <div className={`px-3 py-2 text-slate-600 ${className}`}>
        {value || '-'}
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          step={type === 'number' ? '0.0001' : undefined}
          className={`flex-1 px-2 py-1 border border-indigo-400 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isLoading ? 'opacity-50' : ''
            }`}
          autoFocus
          disabled={isLoading}
          {...inputProps}
        />
        {isLoading ? (
          <div className="p-1 text-indigo-600">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Guardar"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className={`group px-3 py-2 cursor-pointer hover:bg-slate-50 rounded transition-colors ${className}`}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-700">
          {value || <span className="text-slate-400 italic">{placeholder}</span>}
        </span>
        {!disabled && (
          <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  )
}
