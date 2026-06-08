// dashboard/src/hooks/useConversacionesFiltros.js
import { useState, useMemo, useCallback } from 'react'
import { parseBotSessionName, capitalizeWord } from '@/lib/botNameParser'

export function useConversacionesFiltros(bots = []) {
  // Estados de filtro
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [leaderFilter, setLeaderFilter] = useState('all')
  const [leadFilter, setLeadFilter] = useState('all')
  const [sedeFilter, setSedeFilter] = useState('all')
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false)
  const [botSearchQuery, setBotSearchQuery] = useState('')
  
  // Helpers puros (exportados para testing)
  const isBotActive = useCallback((bot) => {
    if (!bot) return false
    // Usar el campo status de la tabla bots
    // WAHA devuelve status en mayúsculas: WORKING, STARTING, STOPPED, etc.
    const status = bot.status?.toUpperCase()
    return status === 'WORKING' || status === 'ACTIVE'
  }, [])
  
  const formatBotStatus = useCallback((bot) => {
    if (!bot) return 'Desconocido'
    const isActive = isBotActive(bot)
    return isActive ? 'Activo' : 'Inactivo'
  }, [isBotActive])
  
  const filterBots = useCallback((botsToFilter) => {
    return botsToFilter.filter(bot => {
      const meta = parseBotSessionName(bot.session_name)
      
      // Filtro de búsqueda global
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase()
        const matchesSearch =
          meta.fullName.toLowerCase().includes(searchLower) ||
          bot.session_name?.toLowerCase().includes(searchLower) ||
          bot.phone_number?.toLowerCase().includes(searchLower) ||
          bot.id?.toString().includes(searchLower)

        if (!matchesSearch) return false
      }
      
      // Filtro de búsqueda de asesores en el panel lateral
      if (botSearchQuery) {
        const botSearchLower = botSearchQuery.toLowerCase()
        const matchesBotSearch =
          meta.fullName.toLowerCase().includes(botSearchLower) ||
          bot.session_name?.toLowerCase().includes(botSearchLower) ||
          bot.phone_number?.toLowerCase().includes(botSearchLower)

        if (!matchesBotSearch) return false
      }
      
      // Filtro de estado
      if (statusFilter !== 'all') {
        const isActive = isBotActive(bot)
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }
      
      // Filtro de leader
      if (leaderFilter !== 'all' && meta.leaderKey !== leaderFilter) {
        return false
      }
      
      // Filtro de lead
      if (leadFilter !== 'all' && meta.leadKey !== leadFilter) {
        return false
      }
      
      // Filtro de sede
      if (sedeFilter !== 'all' && meta.sedeKey !== sedeFilter) {
        return false
      }
      
      return true
    })
  }, [searchFilter, statusFilter, leaderFilter, leadFilter, sedeFilter, botSearchQuery])
  
  const filteredBots = useMemo(() => {
    return filterBots(bots)
  }, [bots, filterBots])
  
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchFilter) count++
    if (statusFilter !== 'all') count++
    if (leaderFilter !== 'all') count++
    if (leadFilter !== 'all') count++
    if (sedeFilter !== 'all') count++
    return count
  }, [searchFilter, statusFilter, leaderFilter, leadFilter, sedeFilter])
  
  const activeFilterPills = useMemo(() => {
    const pills = []

    if (searchFilter) {
      const trimmed =
        searchFilter.length > 20
          ? `${searchFilter.slice(0, 20)}…`
          : searchFilter
      pills.push({ key: 'search', label: `Búsqueda: "${trimmed}"` })
    }

    if (statusFilter !== 'all') {
      let label = 'Todos'
      if (statusFilter === 'active') label = 'Activos'
      if (statusFilter === 'inactive') label = 'Inactivos'
      pills.push({ key: 'status', label: `Estado: ${label}` })
    }

    if (leaderFilter !== 'all') {
      pills.push({
        key: 'leader',
        label: `Líder: ${capitalizeWord(leaderFilter)}`,
      })
    }

    if (leadFilter !== 'all') {
      pills.push({
        key: 'lead',
        label: `Lead: ${capitalizeWord(leadFilter)}`,
      })
    }

    if (sedeFilter !== 'all') {
      pills.push({
        key: 'sede',
        label: `Sede: ${capitalizeWord(sedeFilter)}`,
      })
    }

    return pills
  }, [searchFilter, statusFilter, leaderFilter, leadFilter, sedeFilter])
  
  const clearFilters = useCallback(() => {
    setSearchFilter('')
    setStatusFilter('all')
    setLeaderFilter('all')
    setLeadFilter('all')
    setSedeFilter('all')
  }, [setSearchFilter, setStatusFilter, setLeaderFilter, setLeadFilter, setSedeFilter])
  
  const handleRemoveFilter = useCallback((key) => {
    switch (key) {
      case 'search': setSearchFilter(''); break
      case 'status': setStatusFilter('all'); break
      case 'leader': setLeaderFilter('all'); break
      case 'lead': setLeadFilter('all'); break
      case 'sede': setSedeFilter('all'); break
    }
  }, [setSearchFilter, setStatusFilter, setLeaderFilter, setLeadFilter, setSedeFilter])
  
  const getFilterPillClasses = useCallback((key) => {
    switch (key) {
      case 'status':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'leader':
        return 'bg-sky-50 text-sky-700 border border-sky-200'
      case 'lead':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'sede':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      case 'search':
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }, [])
  
  return {
    // Estados
    searchFilter, setSearchFilter,
    statusFilter, setStatusFilter,
    leaderFilter, setLeaderFilter,
    leadFilter, setLeadFilter,
    sedeFilter, setSedeFilter,
    showFilters, setShowFilters,
    botSearchQuery, setBotSearchQuery,
    
    // Valores derivados
    filteredBots,
    activeFiltersCount,
    activeFilterPills,
    
    // Handlers
    clearFilters,
    handleRemoveFilter,
    
    // Helpers
    formatBotStatus,
    isBotActive,
    getFilterPillClasses,
  }
}
