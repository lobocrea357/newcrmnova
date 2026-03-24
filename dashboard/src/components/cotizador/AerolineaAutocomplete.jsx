'use client'
import { useState, useEffect, useRef } from 'react'
import { Plane, Search, X } from 'lucide-react'
import aerolineasData from '@/lib/cotizador/aerolineas.json'

export default function AerolineaAutocomplete({ value, onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState([])
  const wrapperRef = useRef(null)

  // Combinar todas las aerolíneas en una sola lista
  const todasAerolineas = [
    ...aerolineasData.latinoamerica,
    ...aerolineasData.globales,
    ...aerolineasData.espana
  ]

  // Sincronizar input con el value del padre
  useEffect(() => {
    if (value) {
      // Buscar la aerolínea para mostrar su nombre completo
      const aerolinea = todasAerolineas.find(
        a => a.nombre.toLowerCase() === value.toLowerCase() || 
             a.iata.toLowerCase() === value.toLowerCase() ||
             a.icao.toLowerCase() === value.toLowerCase()
      )
      setInputValue(aerolinea ? `${aerolinea.nombre} (${aerolinea.iata})` : value)
    } else {
      setInputValue('')
    }
  }, [value])

  // Filtrar opciones
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions(todasAerolineas)
      return
    }

    const searchTerm = inputValue.toLowerCase().trim()
    const filtered = todasAerolineas.filter(aerolinea =>
      aerolinea.nombre.toLowerCase().includes(searchTerm) ||
      aerolinea.iata.toLowerCase().includes(searchTerm) ||
      aerolinea.icao.toLowerCase().includes(searchTerm) ||
      aerolinea.pais.toLowerCase().includes(searchTerm)
    )
    setFilteredOptions(filtered)
  }, [inputValue])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (aerolinea) => {
    setInputValue(`${aerolinea.nombre} (${aerolinea.iata})`)
    onChange(aerolinea.nombre)
    setIsOpen(false)
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <Plane className="w-4 h-4 inline mr-1" />
        Aerolínea
      </label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder="Buscar aerolínea por nombre o código..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de opciones */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((aerolinea, index) => (
                <li key={`${aerolinea.iata}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(aerolinea)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{aerolinea.nombre}</div>
                        <div className="text-xs text-gray-500">{aerolinea.pais}</div>
                      </div>
                      <div className="flex gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {aerolinea.iata}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {aerolinea.icao}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No se encontraron aerolíneas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
