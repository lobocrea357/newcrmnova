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
  const [realtimeActivo, setRealtimeActivo] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargarRanking = useCallback(async () => {
    try {
      const res = await fetch(RANKINGS_API.global)
      if (!res.ok) throw new Error('Error obteniendo ranking')
      const data = await res.json()
      setRankingData(data)
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error('Error cargando ranking global:', err)
    } finally {
      setLoadingRanking(false)
    }
  }, [])

  useEffect(() => {
    cargarRanking()

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
          cargarRanking()
        }
      )
      .subscribe((status) => {
        setRealtimeActivo(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeActivo(false)
    }
  }, [cargarRanking])

  return (
    <RankingContext.Provider value={{
      rankingData,
      loadingRanking,
      filtroVista,
      setFiltroVista,
      realtimeActivo,
      ultimaActualizacion,
      recargar: cargarRanking
    }}>
      {children}
    </RankingContext.Provider>
  )
}

export default RankingContext
