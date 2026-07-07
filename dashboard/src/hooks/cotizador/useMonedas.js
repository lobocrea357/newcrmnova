import { useState, useEffect } from 'react'
import { obtenerMonedas, obtenerTasasConversion } from '@/lib/cotizador/tasasHelpers'

/**
 * Hook para manejar monedas y tasas
 * Centraliza carga y estado de monedas
 */
export const useMonedas = () => {
  const [estado, setEstado] = useState({
    monedaBase: 'USD',
    monedaCotizacion: '',
    tasaCambio: '1.0',
    monedasDB: [],
    tasasDB: {},
    loading: true,
    error: null
  })

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setEstado(prev => ({ ...prev, loading: true }))
        
        const [monedas, tasas] = await Promise.all([
          obtenerMonedas(),
          obtenerTasasConversion()
        ])
        
        // Procesar tasas en formato objeto anidado
        const tasasObj = {}
        tasas.forEach(tasa => {
          const origen = tasa.moneda_origen?.codigo
          const destino = tasa.moneda_destino?.codigo
          
          if (origen && destino) {
            if (!tasasObj[origen]) {
              tasasObj[origen] = {}
            }
            tasasObj[origen][destino] = tasa.tasa
          }
        })
        
        setEstado(prev => ({
          ...prev,
          monedasDB: monedas,
          tasasDB: tasasObj,
          loading: false
        }))
      } catch (error) {
        console.error('Error cargando monedas:', error)
        setEstado(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }))
      }
    }
    cargarDatos()
  }, [])

  const setMonedaBase = (moneda) => {
    setEstado(prev => ({ ...prev, monedaBase: moneda }))
  }

  const setMonedaCotizacion = (moneda) => {
    setEstado(prev => ({ ...prev, monedaCotizacion: moneda }))
  }

  const setTasaCambio = (tasa) => {
    setEstado(prev => ({ ...prev, tasaCambio: tasa }))
  }

  return {
    ...estado,
    setMonedaBase,
    setMonedaCotizacion,
    setTasaCambio
  }
}
