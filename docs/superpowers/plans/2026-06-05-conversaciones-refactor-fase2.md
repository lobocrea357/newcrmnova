# Conversaciones Refactor Fase 2 - Hooks y Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extraer lógica de filtrado y localStorage a hooks personalizados, eliminar código muerto (rutas legacy, código comentado, stubs de AI insights), y consolidar utilidades de formateo de fechas.

**Architecture:** Refactorización incremental que extrae ~200 líneas de lógica de filtrado a un hook memoizado, abstrae el patrón localStorage repetido 6+ veces, elimina rutas legacy huérfanas (~444 líneas), y consolida funciones de formateo duplicadas. Cada cambio es independiente y reversible.

**Tech Stack:** React hooks (useState, useMemo, useCallback), Next.js 16 App Router, Supabase, localStorage API, Git para verificación de uso de rutas.

---

## Pre-requisitos

Este plan asume que las **Fases 1-5 del plan `2026-06-05-conversaciones-god-component-refactor.md` ya fueron ejecutadas**. El estado post-Fase 1 es:
- `page.js` tiene ~1684 líneas (reducido desde 2667)
- `generatePdfReport` vive en `lib/conversaciones/generatePdfReport.js`
- Modales extraídos: `SalesModal`, `SyncModal`, `ReportModal` en `components/conversaciones/`
- Auth usa `useAuth().session` (no `checkUser` manual)
- `parseBotSessionName` importado de `lib/botNameParser.js`
- Debug logs comentados

---

## ✅ FASE 1: Hook de Filtros (Refactorización 6) - COMPLETADA

### Task 1.1: Crear archivo del hook useConversacionesFiltros

**Files:**
- Create: `dashboard/src/hooks/useConversacionesFiltros.js`

- [ ] **Step 1: Crear estructura base del hook con estados**

```javascript
// dashboard/src/hooks/useConversacionesFiltros.js
import { useState, useMemo, useCallback } from 'react'
import { parseBotSessionName } from '@/lib/botNameParser'

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
  
  return {
    // Estados
    searchFilter, setSearchFilter,
    statusFilter, setStatusFilter,
    leaderFilter, setLeaderFilter,
    leadFilter, setLeadFilter,
    sedeFilter, setSedeFilter,
    showFilters, setShowFilters,
    botSearchQuery, setBotSearchQuery,
  }
}
```

- [ ] **Step 2: Agregar función filterBots con memoización**

```javascript
// dashboard/src/hooks/useConversacionesFiltros.js
export function useConversacionesFiltros(bots = []) {
  // ... estados existentes ...
  
  const filterBots = useCallback((botsToFilter) => {
    return botsToFilter.filter(bot => {
      const parsed = parseBotSessionName(bot.session_name)
      
      // Filtro de búsqueda
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase()
        const matchesSearch = 
          (parsed.clientName && parsed.clientName.toLowerCase().includes(searchLower)) ||
          (parsed.agency && parsed.agency.toLowerCase().includes(searchLower)) ||
          (bot.session_name && bot.session_name.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      
      // Filtro de estado
      if (statusFilter !== 'all') {
        const isActive = isBotActive(bot)
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }
      
      // Filtro de leader
      if (leaderFilter !== 'all' && parsed.leader !== leaderFilter) {
        return false
      }
      
      // Filtro de lead
      if (leadFilter !== 'all' && parsed.lead !== leadFilter) {
        return false
      }
      
      // Filtro de sede
      if (sedeFilter !== 'all' && parsed.sede !== sedeFilter) {
        return false
      }
      
      return true
    })
  }, [searchFilter, statusFilter, leaderFilter, leadFilter, sedeFilter])
  
  // ... return existente ...
}
```

- [ ] **Step 3: Agregar helpers puros (formatBotStatus, isBotActive)**

```javascript
// dashboard/src/hooks/useConversacionesFiltros.js
export function useConversacionesFiltros(bots = []) {
  // ... estados y filterBots existentes ...
  
  // Helpers puros (exportados para testing)
  const formatBotStatus = useCallback((bot) => {
    if (!bot) return 'Desconocido'
    const isActive = isBotActive(bot)
    return isActive ? 'Activo' : 'Inactivo'
  }, [])
  
  const isBotActive = useCallback((bot) => {
    if (!bot) return false
    const lastMessage = bot.last_message_at
    if (!lastMessage) return false
    const hoursSinceLastMessage = (Date.now() - new Date(lastMessage).getTime()) / (1000 * 60 * 60)
    return hoursSinceLastMessage < 24
  }, [])
  
  // ... return existente ...
}
```

- [ ] **Step 4: Agregar valores derivados memoizados (filteredBots, activeFiltersCount)**

```javascript
// dashboard/src/hooks/useConversacionesFiltros.js
export function useConversacionesFiltros(bots = []) {
  // ... estados, filterBots, helpers existentes ...
  
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
  
  // ... return existente ...
}
```

- [ ] **Step 5: Agregar activeFilterPills memoizado y handlers**

```javascript
// dashboard/src/hooks/useConversacionesFiltros.js
export function useConversacionesFiltros(bots = []) {
  // ... estados, filterBots, helpers, valores derivados existentes ...
  
  const activeFilterPills = useMemo(() => {
    const pills = []
    if (searchFilter) pills.push({ key: 'search', label: searchFilter, type: 'search' })
    if (statusFilter !== 'all') pills.push({ key: 'status', label: statusFilter === 'active' ? 'Activos' : 'Inactivos', type: 'status' })
    if (leaderFilter !== 'all') pills.push({ key: 'leader', label: leaderFilter, type: 'leader' })
    if (leadFilter !== 'all') pills.push({ key: 'lead', label: leadFilter, type: 'lead' })
    if (sedeFilter !== 'all') pills.push({ key: 'sede', label: sedeFilter, type: 'sede' })
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
  
  const getFilterPillClasses = useCallback((type) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
    const typeClasses = {
      search: 'bg-indigo-100 text-indigo-800',
      status: 'bg-green-100 text-green-800',
      leader: 'bg-blue-100 text-blue-800',
      lead: 'bg-purple-100 text-purple-800',
      sede: 'bg-amber-100 text-amber-800',
    }
    return `${baseClasses} ${typeClasses[type] || 'bg-gray-100 text-gray-800'}`
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
```

- [ ] **Step 6: Commit del hook**

```bash
git add dashboard/src/hooks/useConversacionesFiltros.js
git commit -m "feat(conversaciones): crear hook useConversacionesFiltros con lógica de filtrado memoizada"
```

### Task 1.2: Integrar hook en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Reemplazar estados de filtro con el hook**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar estas líneas (aprox línea 200-220):
// const [searchFilter, setSearchFilter] = useState('')
// const [statusFilter, setStatusFilter] = useState('all')
// const [leaderFilter, setLeaderFilter] = useState('all')
// const [leadFilter, setLeadFilter] = useState('all')
// const [sedeFilter, setSedeFilter] = useState('all')
// const [showFilters, setShowFilters] = useState(false)
// const [botSearchQuery, setBotSearchQuery] = useState('')

// Reemplazar con:
import { useConversacionesFiltros } from '@/hooks/useConversacionesFiltros'

// En el componente DashboardContent, después de const { bots } = useBots():
const {
  searchFilter, setSearchFilter,
  statusFilter, setStatusFilter,
  leaderFilter, setLeaderFilter,
  leadFilter, setLeadFilter,
  sedeFilter, setSedeFilter,
  showFilters, setShowFilters,
  botSearchQuery, setBotSearchQuery,
  filteredBots,
  activeFiltersCount,
  activeFilterPills,
  clearFilters,
  handleRemoveFilter,
  formatBotStatus,
  isBotActive,
  getFilterPillClasses,
} = useConversacionesFiltros(bots)
```

- [ ] **Step 2: Eliminar función filterBots local (aprox líneas 400-450)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar completamente la función filterBots() ya que ahora está en el hook
// La función getAllFilteredBots() también se elimina ya que filteredBots viene del hook
```

- [ ] **Step 3: Eliminar funciones helpers duplicadas (formatBotStatus, isBotActive)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar las funciones formatBotStatus() e isBotActive() locales
// Ahora vienen del hook
```

- [ ] **Step 4: Eliminar funciones de contadores de filtros (activeFiltersCount, getActiveFilterPills, getFilterPillClasses, handleRemoveFilter)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar estas funciones locales ya que vienen del hook:
// - activeFiltersCount()
// - getActiveFilterPills()
// - getFilterPillClasses()
// - handleRemoveFilter()
// - clearFilters()
```

- [ ] **Step 5: Reemplazar llamadas a getAllFilteredBots() con filteredBots**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Buscar todas las ocurrencias de getAllFilteredBots() y reemplazar con filteredBots
// Ejemplo:
// Antes: const botsToShow = getAllFilteredBots()
// Después: const botsToShow = filteredBots
```

- [ ] **Step 6: Verificar que el componente renderiza correctamente**

```bash
cd dashboard
npm run dev
```

Expected: La página de conversaciones carga sin errores, los filtros funcionan igual que antes.

- [ ] **Step 7: Commit de la integración**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): integrar hook useConversacionesFiltros en page.js"
```

---

## ✅ FASE 2: Hook useLocalStorage (Refactorización 7) - COMPLETADA

### Task 2.1: Crear hook useLocalStorage

**Files:**
- Create: `dashboard/src/hooks/useLocalStorage.js`

- [ ] **Step 1: Crear hook base con manejo de SSR**

```javascript
// dashboard/src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}
```

- [ ] **Step 2: Commit del hook**

```bash
git add dashboard/src/hooks/useLocalStorage.js
git commit -m "feat(conversaciones): crear hook useLocalStorage con manejo de SSR y errores"
```

### Task 2.2: Reemplazar localStorage en page.js (lastChatId)

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Importar hook y reemplazar lógica de lastChatId (líneas 209-234)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
import { useLocalStorage } from '@/hooks/useLocalStorage'

// En el componente, reemplazar:
// const [lastChatId, setLastChatId] = useState(null)
// useEffect(() => { ... localStorage logic ... }, [])

// Con:
const [lastChatId, setLastChatId] = useLocalStorage('conversaciones:lastChatId', null)
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar useLocalStorage para lastChatId"
```

### Task 2.3: Reemplazar localStorage en page.js (globalSearchQuery + results)

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Reemplazar lógica de globalSearchQuery (líneas 238-261)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Reemplazar:
// const [globalSearchQuery, setGlobalSearchQuery] = useState('')
// const [globalSearchResults, setGlobalSearchResults] = useState([])
// useEffect(() => { ... localStorage logic ... }, [])

// Con:
const [globalSearchQuery, setGlobalSearchQuery] = useLocalStorage('conversaciones:globalSearchQuery', '')
const [globalSearchResults, setGlobalSearchResults] = useLocalStorage('conversaciones:globalSearchResults', [])
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar useLocalStorage para globalSearchQuery y results"
```

### Task 2.4: Reemplazar localStorage en page.js (paginador por bot)

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Reemplazar lógica de paginador (líneas 160-173)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Reemplazar:
// const [botPages, setBotPages] = useState({})
// useEffect(() => { ... localStorage logic ... }, [botPages])

// Con:
const [botPages, setBotPages] = useLocalStorage('conversaciones:botPages', {})
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar useLocalStorage para botPages (paginador)"
```

### Task 2.5: Reemplazar localStorage en page.js (búsqueda al click)

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Reemplazar lógica de guardado al click (líneas 1290-1303)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// En handleSearchResultClick, reemplazar:
// try {
//   if (typeof window !== 'undefined') {
//     localStorage.setItem('conversaciones:lastSearchQuery', query)
//   }
// } catch (error) {
//   console.error('Error saving search query:', error)
// }

// Con:
const [lastSearchQuery, setLastSearchQuery] = useLocalStorage('conversaciones:lastSearchQuery', '')

// Y en el handler:
setLastSearchQuery(query)
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar useLocalStorage para lastSearchQuery"
```

### Task 2.6: Reemplazar localStorage en chat/[chatId]/page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js`

- [ ] **Step 1: Importar hook y reemplazar todas las instancias de localStorage**

```javascript
// dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Reemplazar las 3 instancias (líneas 29-47, 54-66, 106-119):
// Ejemplo para la primera:
// const [searchQuery, setSearchQuery] = useState('')
// useEffect(() => { ... localStorage logic ... }, [])

// Con:
const [searchQuery, setSearchQuery] = useLocalStorage('conversaciones:chatSearchQuery', '')
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js
git commit -m "refactor(conversaciones): usar useLocalStorage en chat page"
```

---

## FASE 3: Decisión sobre AI Insights (Refactorización 8)

### Task 3.1: Verificar dependencias de ai-insights

**Files:**
- Check: `dashboard/src/app/(crm)/conversaciones/ai-insights/page.js`
- Check: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Buscar navegación a ai-insights en todo el proyecto**

```bash
cd dashboard
grep -r "ai-insights" src/ --include="*.js" --include="*.jsx"
```

Expected: Encontrar el botón en page.js (línea ~1543) y verificar si hay otros links.

- [ ] **Step 2: Revisar el contenido actual de ai-insights/page.js**

```bash
cat dashboard/src/app/(crm)/conversaciones/ai-insights/page.js
```

Expected: Verificar que es un stub con datos hardcodeados (setTimeout con datos falsos).

- [ ] **Step 3: Eliminar el botón de navegación en page.js**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Buscar y eliminar el botón que navega a /conversaciones/ai-insights
// Aprox línea 1543, algo como:
// <Link href="/conversaciones/ai-insights">
//   <button>AI Insights</button>
// </Link>
```

- [ ] **Step 4: Eliminar el archivo ai-insights/page.js**

```bash
rm dashboard/src/app/(crm)/conversaciones/ai-insights/page.js
rmdir dashboard/src/app/(crm)/conversaciones/ai-insights  # si está vacío
```

- [ ] **Step 5: Commit de la eliminación**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git add -A dashboard/src/app/(crm)/conversaciones/ai-insights/
git commit -m "refactor(conversaciones): eliminar ai-insights stub con datos falsos"
```

---

## FASE 4: Eliminar Rutas Legacy (Refactorización 9)

### Task 4.1: Verificar uso de rutas legacy

**Files:**
- Check: `dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js`
- Check: `dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/[conversationId]/page.js`

- [ ] **Step 1: Buscar navegación a rutas legacy en todo el proyecto**

```bash
cd dashboard
grep -r "conversaciones/bot/" src/ --include="*.js" --include="*.jsx"
```

Expected: Verificar que ningún componente navega a estas rutas (excepto las propias rutas legacy).

- [ ] **Step 2: Verificar Sidebar.jsx para links**

```bash
grep -n "bot/" dashboard/src/components/Sidebar.jsx
```

Expected: No debería haber links a /conversaciones/bot/

- [ ] **Step 3: Revisar contenido de bot/[botId]/page.js**

```bash
head -50 dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js
```

Expected: Verificar que usa checkAuth() propio y handleConversationClick que navega a ruta legacy.

- [ ] **Step 4: Commit de verificación (documentación)**

```bash
echo "Verificación de rutas legacy completada - no se encontraron referencias externas" > docs/verification-legacy-routes.md
git add docs/verification-legacy-routes.md
git commit -m "docs: documentar verificación de rutas legacy conversaciones/bot/"
```

### Task 4.2: Eliminar rutas legacy

**Files:**
- Delete: `dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js`
- Delete: `dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/[conversationId]/page.js`

- [ ] **Step 1: Eliminar bot/[botId]/conversation/[conversationId]/page.js**

```bash
rm dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/[conversationId]/page.js
```

- [ ] **Step 2: Eliminar bot/[botId]/page.js**

```bash
rm dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js
```

- [ ] **Step 3: Eliminar directorios vacíos**

```bash
rmdir dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/
rmdir dashboard/src/app/(crm)/conversaciones/bot/[botId]/
rmdir dashboard/src/app/(crm)/conversaciones/bot/
```

- [ ] **Step 4: Commit de la eliminación**

```bash
git add -A dashboard/src/app/(crm)/conversaciones/bot/
git commit -m "refactor(conversaciones): eliminar rutas legacy bot/[botId]/ (~444 líneas)"
```

---

## FASE 5: Eliminar Código Comentado (Refactorización 10)

### Task 5.1: Eliminar bloque de contadores comentado

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Eliminar líneas 1957-1975 (contadores comentados)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar el bloque comentado que contiene:
// {/* Comentado: Contadores de conversaciones y cotizaciones para simplificar la UI */}
// Y todo el código JSX comentado dentro
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): eliminar bloque de código comentado (contadores)"
```

### Task 5.2: Eliminar bloque de métricas comentado

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Eliminar líneas 2297-2347 (métricas comentadas)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
// Eliminar el bloque comentado que contiene:
// Métricas de conversación (tiempo de respuesta, pagos, cotizaciones)
// Y contador de mensajes
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): eliminar bloque de código comentado (métricas)"
```

---

## FASE 6: Consolidar Utilidades de Fecha (Refactorización 11)

### Task 6.1: Crear utilidad formatDate

**Files:**
- Create: `dashboard/src/lib/utils/formatDate.js`

- [ ] **Step 1: Crear archivo con funciones de formateo**

```javascript
// dashboard/src/lib/utils/formatDate.js

export function formatDate(timestamp, options = {}) {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'N/A'
  
  const { 
    includeTime = false, 
    locale = 'es-ES',
    dateStyle = 'medium',
    timeStyle = 'short'
  } = options
  
  if (includeTime) {
    return date.toLocaleString(locale, { 
      dateStyle, 
      timeStyle 
    })
  }
  
  return date.toLocaleDateString(locale, { dateStyle })
}

export function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'N/A'
  
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function formatResponseTime(minutes) {
  if (!minutes || minutes < 0) return 'N/A'
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 
    ? `${days}d ${remainingHours}h` 
    : `${days}d`
}
```

- [ ] **Step 2: Commit de la utilidad**

```bash
git add dashboard/src/lib/utils/formatDate.js
git commit -m "feat(conversaciones): crear utilidad formatDate con formatTime y formatResponseTime"
```

### Task 6.2: Reemplazar formatResponseTime inline en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

- [ ] **Step 1: Importar y reemplazar función inline (líneas 501-508)**

```javascript
// dashboard/src/app/(crm)/conversaciones/page.js
import { formatResponseTime } from '@/lib/utils/formatDate'

// Eliminar la función formatResponseTime() local (líneas 501-508)
// Ya viene de la utilidad importada
```

- [ ] **Step 2: Commit del cambio**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar utilidad formatResponseTime en page.js"
```

---

## VERIFICACIÓN FINAL

### Task 7.1: Verificar que la aplicación funciona

**Files:**
- Test: `dashboard/src/app/(crm)/conversaciones/page.js`
- Test: `dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js`

- [ ] **Step 1: Iniciar servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

- [ ] **Step 2: Navegar a /conversaciones y verificar funcionalidad**

Expected: 
- La página carga sin errores
- Los filtros funcionan correctamente
- El localStorage persiste datos entre recargas
- No hay errores en consola

- [ ] **Step 3: Navegar a /conversaciones/chat/[chatId] y verificar**

Expected:
- La página de chat carga sin errores
- La búsqueda persiste en localStorage
- No hay errores en consola

- [ ] **Step 4: Verificar que las rutas eliminadas retornan 404**

Expected:
- /conversaciones/bot/[botId] retorna 404
- /conversaciones/ai-insights retorna 404

- [ ] **Step 5: Commit final de verificación**

```bash
git add docs/verification-legacy-routes.md
git commit -m "test: verificación final de refactorización Fase 2 conversaciones"
```

---

## RESUMEN DE CAMBIOS

**Archivos Creados:**
- `dashboard/src/hooks/useConversacionesFiltros.js` (~150 líneas)
- `dashboard/src/hooks/useLocalStorage.js` (~40 líneas)
- `dashboard/src/lib/utils/formatDate.js` (~60 líneas)

**Archivos Modificados:**
- `dashboard/src/app/(crm)/conversaciones/page.js` (~-350 líneas netas)
- `dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js` (~-30 líneas)

**Archivos Eliminados:**
- `dashboard/src/app/(crm)/conversaciones/ai-insights/page.js` (~165 líneas)
- `dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js` (~226 líneas)
- `dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/[conversationId]/page.js` (~218 líneas)

**Impacto Neto:** ~-749 líneas de código, mejor memoización, DRY en localStorage, eliminación de código muerto.
