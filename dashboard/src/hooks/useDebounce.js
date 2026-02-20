import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para debounce de funciones (sin loading automático)
export function useDebouncedCallback(callback, delay) {
  const [debounceTimer, setDebounceTimer] = useState(null)

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)

    setDebounceTimer(newTimer)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return debouncedCallback
}

// Hook para mostrar SweetAlert con spinner manualmente
export function useLoadingAlert() {
  const showLoadingAlert = (title = 'Procesando...', text = 'Guardando cambios...') => {
    return Swal.fire({
      title,
      html: text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-xl font-semibold text-slate-800',
        htmlContainer: 'text-slate-600'
      },
      didOpen: () => {
        Swal.showLoading()
      }
    })
  }

  const closeLoadingAlert = () => {
    Swal.close()
  }

  return { showLoadingAlert, closeLoadingAlert }
}

// Hook para debounce de funciones (versión simple sin loading)
export function useSimpleDebouncedCallback(callback, delay) {
  const [debounceTimer, setDebounceTimer] = useState(null)

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)

    setDebounceTimer(newTimer)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return debouncedCallback
}
