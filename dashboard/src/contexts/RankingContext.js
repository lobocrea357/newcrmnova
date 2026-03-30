'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RANKINGS_API } from '@/config/apiConfig'

const RankingContext = createContext({})

export const useRanking = () => {
  const ctx = useContext(RankingContext)
  if (!ctx) throw new Error('useRanking must be used within RankingProvider')
  return ctx
}

export function RankingProvider({ children }) {
  const [rankingData, setRankingData] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(true)
  const [filtroVista, setFiltroVista] = useState('general')
  const [monedaVista, setMonedaVista] = useState('USD') // USD o EUR
  const [realtimeActivo, setRealtimeActivo] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargarRanking = useCallback(async (moneda = monedaVista) => {
    try {
      const url = `${RANKINGS_API.global}?moneda=${moneda}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error obteniendo ranking')
      const data = await res.json()
      setRankingData(data)
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error('Error cargando ranking global:', err)
    } finally {
      setLoadingRanking(false)
    }
  }, [monedaVista])

  useEffect(() => {
    cargarRanking(monedaVista)

    // Suscripción Realtime a INSERT/UPDATE en vuelos — igual al patrón de ChatView
    const channel = supabase
      .channel('ranking-vuelos-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vuelos'
        },
        () => {
          // Al haber cualquier cambio en vuelos → recargar ranking
          cargarRanking(monedaVista)
        }
      )
      .subscribe((status) => {
        setRealtimeActivo(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeActivo(false)
    }
  }, [cargarRanking, monedaVista])

  return (
    <RankingContext.Provider value={{
      rankingData,
      loadingRanking,
      filtroVista,
      setFiltroVista,
      monedaVista,
      setMonedaVista,
      realtimeActivo,
      ultimaActualizacion,
      recargar: cargarRanking
    }}>
      {children}
    </RankingContext.Provider>
  )
}

export default RankingContext
