# Refactorización Módulo Conversaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactorizar el módulo de conversaciones para mejorar mantenibilidad eliminando código duplicado, números mágicos, strings hardcoded y descomponiendo el componente monolítico en componentes más pequeños.

**Architecture:** Extraer constantes a archivos dedicados en `lib/constants/`, eliminar duplicación de lógica de filtros usando exclusivamente el hook existente, y dividir el componente DashboardContent de 1410 líneas en componentes modulares con responsabilidades claras.

**Tech Stack:** React, Next.js 16, JavaScript, Lucide Icons, Tailwind CSS

---

## File Structure

**Archivos a crear:**
- `dashboard/src/lib/constants/conversacionesConstants.js` - Constantes de conversaciones (límites, timeouts, configuración)
- `dashboard/src/lib/constants/filtrosConstants.js` - Constantes de filtros (líderes, sedes, leads)
- `dashboard/src/lib/config/reportPrompts.js` - Prompts configurables para reportes IA
- `dashboard/src/components/conversaciones/StatsCards.jsx` - Tarjetas de estadísticas
- `dashboard/src/components/conversaciones/ConversationsFiltersPanel.jsx` - Panel de filtros
- `dashboard/src/components/conversaciones/AdvisorsList.jsx` - Lista de asesores
- `dashboard/src/components/conversaciones/ConversationsList.jsx` - Lista de conversaciones
- `dashboard/src/components/conversaciones/GlobalSearchBar.jsx` - Barra de búsqueda global

**Archivos a modificar:**
- `dashboard/src/app/(crm)/conversaciones/page.js` - Refactorizar para usar nuevos componentes y constantes

---

## FASE 1: Extraer Constantes

### Task 1: Crear archivo de constantes de conversaciones

**Files:**
- Create: `dashboard/src/lib/constants/conversacionesConstants.js`

- [ ] **Step 1: Crear archivo con constantes de conversaciones**

```javascript
// dashboard/src/lib/constants/conversacionesConstants.js

/**
 * Constantes para el módulo de conversaciones
 */

// Límites y paginación
export const CONVERSATIONS_PAGE_SIZE = 10;
export const SALES_LIMIT = 200;
export const SYNC_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

// Estados de bots
export const BOT_STATUS = {
  WORKING: 'WORKING',
  ACTIVE: 'ACTIVE',
  STARTING: 'STARTING',
  STOPPED: 'STOPPED'
};

// Estados de filtro
export const FILTER_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/lib/constants/conversacionesConstants.js
git commit -m "feat: agregar constantes de conversaciones (límites, timeouts, estados)"
```

---

### Task 2: Crear archivo de constantes de filtros

**Files:**
- Create: `dashboard/src/lib/constants/filtrosConstants.js`

- [ ] **Step 1: Crear archivo con constantes de filtros**

```javascript
// dashboard/src/lib/constants/filtrosConstants.js

/**
 * Constantes para filtros de conversaciones
 */

// Líderes
export const LEADERS = [
  { value: 'all', label: 'Todos' },
  { value: 'moises', label: 'Moisés' },
  { value: 'jesus', label: 'Jesús' },
  { value: 'endry', label: 'Endry' }
];

// Leads
export const LEADS = [
  { value: 'all', label: 'Todos' },
  { value: 'colombia', label: 'Colombia' },
  { value: 'venezuela', label: 'Venezuela' }
];

// Sedes
export const SEDES = [
  { value: 'all', label: 'Todas' },
  { value: 'nova', label: 'Nova' },
  { value: 'apolo', label: 'Apolo' },
  { value: 'flash', label: 'Flash' }
];
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/lib/constants/filtrosConstants.js
git commit -m "feat: agregar constantes de filtros (líderes, leads, sedes)"
```

---

### Task 3: Crear archivo de configuración de prompts de reporte

**Files:**
- Create: `dashboard/src/lib/config/reportPrompts.js`

- [ ] **Step 1: Crear archivo con prompt de reporte**

```javascript
// dashboard/src/lib/config/reportPrompts.js

/**
 * Prompts configurables para generación de reportes IA
 */

export const DEFAULT_AUDIT_PROMPT = `Eres un Auditor Comercial Senior especializado en ventas de alto impacto. 
Tu misión es auditar al asesor basándote ESTRICTAMENTE en los siguientes 13 KPIs:

CRÍTICOS (TIEMPOS):
1. Tiempo de contacto inicial: Máximo 5 minutos.
2. Tiempo de respuesta promedio: Máximo 5 minutos.
3. Tiempo de envío de cotización: Máximo 15 minutos.

AUDITORÍA COMERCIAL:
4. Lead respondió: ¿Hubo interacción real?
5. Número de teléfono: ¿Se obtuvo o validó?
6. Cierre con intención: ¿El asesor presionó por el cierre de forma profesional?
7. Ofreció Scalapay/Financiamiento: ¿Mencionó opciones de pago flexible?
8. Más de 2 opciones: ¿Presentó alternativas al cliente?
9. Seguimiento estructurado: ¿Hubo un plan de contacto posterior?
10. Preguntas de negociación: ¿Indagó sobre necesidades y presupuesto?
11. Calidad de cotización: ¿Es clara, atractiva y profesional?
12. Manejo de objeciones: ¿Supo rebatir dudas del cliente?
13. Venta confirmada: ¿Se cerró la transacción?

INSTRUCCIONES DE REPORTE:
- Identifica faltas en los tiempos críticos de forma prioritaria (¡Es vital!).
- Cita fragmentos del chat que demuestren el manejo de objeciones o cierres.
- Si el asesor tardó más de 5m en responder o 15m en cotizar, señalalo como ERROR CRÍTICO.
- No inventes datos. Si algo no está presente, márcalo como "No detectado".
- Usa un tono ejecutivo y directo.`;
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/lib/config/reportPrompts.js
git commit -m "feat: agregar configuración de prompts para reportes IA"
```

---

## FASE 2: Reemplazar Números Mágicos y Strings Hardcoded

### Task 4: Reemplazar números mágicos en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:318,374,278`

- [ ] **Step 1: Agregar imports de constantes**

Al inicio del archivo, después de los imports existentes:

```javascript
import {
  CONVERSATIONS_PAGE_SIZE,
  SALES_LIMIT,
  SYNC_TIMEOUT_MS
} from '@/lib/constants/conversacionesConstants'
```

- [ ] **Step 2: Reemplazar timeout de sincronización (línea 318)**

```javascript
// Antes:
const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

// Después:
const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
```

- [ ] **Step 3: Reemplazar límite de página en fetchConversations (línea 374)**

```javascript
// Antes:
const result = await getConversationsByBot(botId, page, 10);

// Después:
const result = await getConversationsByBot(botId, page, CONVERSATIONS_PAGE_SIZE);
```

- [ ] **Step 4: Reemplazar límite de ventas (línea 278)**

```javascript
// Antes:
const conversations = await getCompletedSalesConversations(200);

// Después:
const conversations = await getCompletedSalesConversations(SALES_LIMIT);
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: reemplazar números mágicos con constantes en conversaciones"
```

---

### Task 5: Reemplazar strings hardcoded de filtros en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:781-815`

- [ ] **Step 1: Agregar imports de constantes de filtros**

```javascript
import { LEADERS, LEADS, SEDES } from '@/lib/constants/filtrosConstants'
```

- [ ] **Step 2: Reemplazar select de líder (líneas 781-784)**

```javascript
// Antes:
<select
  value={leaderFilter}
  onChange={(e) => setLeaderFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  <option value="all">Todos</option>
  <option value="moises">Moisés</option>
  <option value="jesus">Jesús</option>
  <option value="endry">Endry</option>
</select>

// Después:
<select
  value={leaderFilter}
  onChange={(e) => setLeaderFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  {LEADERS.map((leader) => (
    <option key={leader.value} value={leader.value}>
      {leader.label}
    </option>
  ))}
</select>
```

- [ ] **Step 3: Reemplazar select de lead (líneas 791-799)**

```javascript
// Antes:
<select
  value={leadFilter}
  onChange={(e) => setLeadFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  <option value="all">Todos</option>
  <option value="colombia">Colombia</option>
  <option value="venezuela">Venezuela</option>
</select>

// Después:
<select
  value={leadFilter}
  onChange={(e) => setLeadFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  {LEADS.map((lead) => (
    <option key={lead.value} value={lead.value}>
      {lead.label}
    </option>
  ))}
</select>
```

- [ ] **Step 4: Reemplazar select de sede (líneas 807-816)**

```javascript
// Antes:
<select
  value={sedeFilter}
  onChange={(e) => setSedeFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  <option value="all">Todas</option>
  <option value="nova">Nova</option>
  <option value="apolo">Apolo</option>
  <option value="flash">Flash</option>
</select>

// Después:
<select
  value={sedeFilter}
  onChange={(e) => setSedeFilter(e.target.value)}
  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  {SEDES.map((sede) => (
    <option key={sede.value} value={sede.value}>
      {sede.label}
    </option>
  ))}
</select>
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: reemplazar strings hardcoded de filtros con constantes"
```

---

### Task 6: Reemplazar prompt hardcoded en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:86-111`

- [ ] **Step 1: Agregar import de prompt**

```javascript
import { DEFAULT_AUDIT_PROMPT } from '@/lib/config/reportPrompts'
```

- [ ] **Step 2: Reemplazar estado inicial de reportPrompt (líneas 86-111)**

```javascript
// Antes:
const [reportPrompt, setReportPrompt] = useState(`Eres un Auditor Comercial Senior especializado en ventas de alto impacto. 
Tu misión es auditar al asesor basándote ESTRICTAMENTE en los siguientes 13 KPIs:

CRÍTICOS (TIEMPOS):
1. Tiempo de contacto inicial: Máximo 5 minutos.
2. Tiempo de respuesta promedio: Máximo 5 minutos.
3. Tiempo de envío de cotización: Máximo 15 minutos.

AUDITORÍA COMERCIAL:
4. Lead respondió: ¿Hubo interacción real?
5. Número de teléfono: ¿Se obtuvo o validó?
6. Cierre con intención: ¿El asesor presionó por el cierre de forma profesional?
7. Ofreció Scalapay/Financiamiento: ¿Mencionó opciones de pago flexible?
8. Más de 2 opciones: ¿Presentó alternativas al cliente?
9. Seguimiento estructurado: ¿Hubo un plan de contacto posterior?
10. Preguntas de negociación: ¿Indagó sobre necesidades y presupuesto?
11. Calidad de cotización: ¿Es clara, atractiva y profesional?
12. Manejo de objeciones: ¿Supo rebatir dudas del cliente?
13. Venta confirmada: ¿Se cerró la transacción?

INSTRUCCIONES DE REPORTE:
- Identifica faltas en los tiempos críticos de forma prioritaria (¡Es vital!).
- Cita fragmentos del chat que demuestren el manejo de objeciones o cierres.
- Si el asesor tardó más de 5m en responder o 15m en cotizar, señalalo como ERROR CRÍTICO.
- No inventes datos. Si algo no está presente, márcalo como "No detectado".
- Usa un tono ejecutivo y directo.`);

// Después:
const [reportPrompt, setReportPrompt] = useState(DEFAULT_AUDIT_PROMPT);
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: reemplazar prompt hardcoded con configuración externa"
```

---

## FASE 3: Corregir Duplicación de Lógica de Filtros

### Task 7: Eliminar duplicación de lógica isBotActive en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:660-666`

- [ ] **Step 1: Reemplazar verificación manual de bots activos (líneas 660-666)**

```javascript
// Antes:
<dd className="text-3xl font-semibold text-gray-900" translate="no">
  {
    bots.filter(
      (bot) =>
        bot.status === "WORKING" ||
        bot.status === "ACTIVE" ||
        bot.status === "working" ||
        bot.status === "active",
    ).length
  }
</dd>

// Después:
<dd className="text-3xl font-semibold text-gray-900" translate="no">
  {bots.filter(isBotActive).length}
</dd>
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: eliminar duplicación de lógica isBotActive usando hook"
```

---

## FASE 4: Extraer Componentes

### Task 8: Crear componente StatsCards

**Files:**
- Create: `dashboard/src/components/conversaciones/StatsCards.jsx`

- [ ] **Step 1: Crear componente StatsCards**

```javascript
// dashboard/src/components/conversaciones/StatsCards.jsx
'use client'

import { Bot, MessageSquare, ArrowUp, RefreshCw } from 'lucide-react'

export default function StatsCards({
  salesCount,
  loadingSales,
  botsCount,
  filteredBotsCount,
  activeFiltersCount,
  totalConversations,
  activeBotsCount,
  compactMode,
  onSalesClick
}) {
  if (compactMode) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Ventas Concretadas */}
      <button
        type="button"
        onClick={onSalesClick}
        className="bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <ArrowUp className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Ventas Concretadas
              </dt>
              <dd className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                {loadingSales ? (
                  <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
                ) : (
                  <span translate="no">{salesCount}</span>
                )}
              </dd>
              <dd className="text-xs text-green-600 mt-1">
                Click para ver detalles
              </dd>
            </dl>
          </div>
        </div>
      </button>

      {/* Total Bots */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Bots
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {botsCount}
              </dd>
              {activeFiltersCount > 0 && (
                <dd className="text-xs text-indigo-600 mt-1">
                  {filteredBotsCount} mostrados
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Total Conversaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Conversaciones
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {totalConversations}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Bots Activos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Bots Activos
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {activeBotsCount}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/StatsCards.jsx
git commit -m "feat: crear componente StatsCards para tarjetas de estadísticas"
```

---

### Task 9: Integrar StatsCards en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:576-674`

- [ ] **Step 1: Agregar import de StatsCards**

```javascript
import StatsCards from '@/components/conversaciones/StatsCards'
```

- [ ] **Step 2: Reemplazar sección de stats (líneas 576-674)**

```javascript
// Antes: Todo el bloque de stats desde línea 576 hasta 674

// Después:
<StatsCards
  salesCount={salesCount}
  loadingSales={loadingSales}
  botsCount={bots.length}
  filteredBotsCount={filteredBots.length}
  activeFiltersCount={activeFiltersCount}
  totalConversations={totalConversations}
  activeBotsCount={bots.filter(isBotActive).length}
  compactMode={compactMode}
  onSalesClick={handleSalesClick}
/>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: integrar componente StatsCards en page.js"
```

---

### Task 10: Crear componente ConversationsFiltersPanel

**Files:**
- Create: `dashboard/src/components/conversaciones/ConversationsFiltersPanel.jsx`

- [ ] **Step 1: Crear componente ConversationsFiltersPanel**

```javascript
// dashboard/src/components/conversaciones/ConversationsFiltersPanel.jsx
'use client'

import { Filter, ChevronDown, ChevronUp, Trash2, Search } from 'lucide-react'
import { LEADERS, LEADS, SEDES } from '@/lib/constants/filtrosConstants'

export default function ConversationsFiltersPanel({
  showFilters,
  setShowFilters,
  activeFiltersCount,
  activeFilterPills,
  filteredBotsCount,
  botsCount,
  searchFilter,
  setSearchFilter,
  statusFilter,
  setStatusFilter,
  leaderFilter,
  setLeaderFilter,
  leadFilter,
  setLeadFilter,
  sedeFilter,
  setSedeFilter,
  clearFilters,
  handleRemoveFilter,
  getFilterPillClasses
}) {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
          {activeFiltersCount > 0 && (
            <span className="hidden md:inline text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {activeFiltersCount} filtro
              {activeFiltersCount > 1 ? "s" : ""} activo
              {activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && !showFilters && (
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
              <span className="truncate max-w-[140px] sm:max-w-xs">
                {filteredBotsCount} de {botsCount} asesores
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[11px] sm:text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {activeFilterPills.length > 0 && (
        <div className="px-6 py-2 border-b border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
          {activeFilterPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => handleRemoveFilter(pill.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${getFilterPillClasses(pill.key)}`}
            >
              <span>{pill.label}</span>
              <span className="text-xs">×</span>
            </button>
          ))}
        </div>
      )}
      <div className={`px-6 py-4 ${showFilters ? "block" : "hidden"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de búsqueda global */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda Global
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por nombre, teléfono..."
                className="w-full pl-10 pr-4 py-2 bg-white text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filtro de estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Filtro de líder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Líder
            </label>
            <select
              value={leaderFilter}
              onChange={(e) => setLeaderFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {LEADERS.map((leader) => (
                <option key={leader.value} value={leader.value}>
                  {leader.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de lead */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead
            </label>
            <select
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {LEADS.map((lead) => (
                <option key={lead.value} value={lead.value}>
                  {lead.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de sede */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede
            </label>
            <select
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SEDES.map((sede) => (
                <option key={sede.value} value={sede.value}>
                  {sede.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón para limpiar filtros y contador */}
        <div className="mt-4 flex items-center justify-between">
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredBotsCount} de {botsCount} asesores
                {activeFiltersCount > 0 &&
                  ` (${activeFiltersCount} filtro${
                    activeFiltersCount > 1 ? "s" : ""
                  } activo${activeFiltersCount > 1 ? "s" : ""})`}
              </span>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/ConversationsFiltersPanel.jsx
git commit -m "feat: crear componente ConversationsFiltersPanel"
```

---

### Task 11: Integrar ConversationsFiltersPanel en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:676-841`

- [ ] **Step 1: Agregar import de ConversationsFiltersPanel**

```javascript
import ConversationsFiltersPanel from '@/components/conversaciones/ConversationsFiltersPanel'
```

- [ ] **Step 2: Reemplazar sección de filtros (líneas 676-841)**

```javascript
// Antes: Todo el bloque de filtros desde línea 676 hasta 841

// Después:
<ConversationsFiltersPanel
  showFilters={showFilters}
  setShowFilters={setShowFilters}
  activeFiltersCount={activeFiltersCount}
  activeFilterPills={activeFilterPills}
  filteredBotsCount={filteredBots.length}
  botsCount={bots.length}
  searchFilter={searchFilter}
  setSearchFilter={setSearchFilter}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  leaderFilter={leaderFilter}
  setLeaderFilter={setLeaderFilter}
  leadFilter={leadFilter}
  setLeadFilter={setLeadFilter}
  sedeFilter={sedeFilter}
  setSedeFilter={setSedeFilter}
  clearFilters={clearFilters}
  handleRemoveFilter={handleRemoveFilter}
  getFilterPillClasses={getFilterPillClasses}
/>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: integrar componente ConversationsFiltersPanel en page.js"
```

---

### Task 12: Crear componente AdvisorsList

**Files:**
- Create: `dashboard/src/components/conversaciones/AdvisorsList.jsx`

- [ ] **Step 1: Crear componente AdvisorsList**

```javascript
// dashboard/src/components/conversaciones/AdvisorsList.jsx
'use client'

import { Bot, Search, X, Circle, Phone } from 'lucide-react'
import { parseBotSessionName } from '@/lib/botNameParser'

export default function AdvisorsList({
  filteredBots,
  selectedBotId,
  botSearchQuery,
  setBotSearchQuery,
  isBotActive,
  formatBotStatus,
  onBotSelect
}) {
  return (
    <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-1">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              <span>Asesores</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona un asesor para ver sus conversaciones.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {filteredBots.length} visibles
          </span>
        </div>
        
        {/* Buscador de asesores */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={botSearchQuery}
            onChange={(e) => setBotSearchQuery(e.target.value)}
            placeholder="Buscar asesor..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {botSearchQuery && (
            <button
              onClick={() => setBotSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {filteredBots.length === 0 ? (
        <div className="flex-1 px-6 py-12 text-center flex flex-col items-center justify-center">
          <Bot className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            No se encontraron asesores
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajusta los filtros para ver otros resultados.
          </p>
        </div>
      ) : (
        <div className="flex-1 max-h-[50vh] lg:max-h-[650px] overflow-y-auto divide-y divide-gray-100">
          {filteredBots.map((bot) => {
            const botIsActive = isBotActive(bot);
            const formattedStatus = formatBotStatus(bot);
            const isSelected = String(bot.id) === String(selectedBotId);
            const meta = parseBotSessionName(bot.session_name);

            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => onBotSelect(bot.id)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-500"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        botIsActive ? "bg-green-100" : "bg-gray-200"
                      }`}
                    >
                      <Bot
                        className={`h-5 w-5 ${
                          botIsActive ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    {botIsActive && (
                      <Circle
                        className="absolute -top-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate" translate="no">
                      {meta.fullName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                          botIsActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        <span translate="no">{formattedStatus}</span>
                      </span>
                      {meta.sedeLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span translate="no">{meta.sedeLabel}</span>
                        </span>
                      )}
                      {meta.leadLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span translate="no">{meta.leadLabel}</span>
                        </span>
                      )}
                      {meta.leaderLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <span translate="no">{meta.leaderLabel}</span>
                        </span>
                      )}
                      {bot.phone_number && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">
                            <span translate="no">{bot.phone_number}</span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/AdvisorsList.jsx
git commit -m "feat: crear componente AdvisorsList"
```

---

### Task 13: Integrar AdvisorsList en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:844-980`

- [ ] **Step 1: Agregar import de AdvisorsList**

```javascript
import AdvisorsList from '@/components/conversaciones/AdvisorsList'
```

- [ ] **Step 2: Reemplazar sección de lista de asesores (líneas 844-980)**

```javascript
// Antes: Todo el bloque de lista de asesores desde línea 844 hasta 980

// Después:
<AdvisorsList
  filteredBots={filteredBots}
  selectedBotId={selectedBotId}
  botSearchQuery={botSearchQuery}
  setBotSearchQuery={setBotSearchQuery}
  isBotActive={isBotActive}
  formatBotStatus={formatBotStatus}
  onBotSelect={handleBotSelect}
/>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: integrar componente AdvisorsList en page.js"
```

---

### Task 14: Crear componente GlobalSearchBar

**Files:**
- Create: `dashboard/src/components/conversaciones/GlobalSearchBar.jsx`

- [ ] **Step 1: Crear componente GlobalSearchBar**

```javascript
// dashboard/src/components/conversaciones/GlobalSearchBar.jsx
'use client'

import { Search, X, RefreshCw } from 'lucide-react'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'

export default function GlobalSearchBar({
  globalSearchQuery,
  onSearchChange,
  onClearSearch,
  loadingGlobalSearch,
  isGlobalSearchActive,
  globalSearchResults,
  lastChatId,
  onResultClick
}) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, teléfono o palabra clave..."
            className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          {globalSearchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {loadingGlobalSearch && (
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </div>
        )}
        {isGlobalSearchActive && !loadingGlobalSearch && (
          <div className="mt-2 text-sm text-gray-600">
            {globalSearchResults.length} resultado
            {globalSearchResults.length !== 1 ? "s" : ""} encontrado
            {globalSearchResults.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {isGlobalSearchActive && (
        <div className="flex-1">
          {loadingGlobalSearch ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Buscando conversaciones...
            </div>
          ) : globalSearchResults.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-6 py-12">
              <div>
                <Search className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">
                  No se encontraron resultados
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-md">
                  No hay conversaciones que coincidan con "
                  {globalSearchQuery}"
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
              {globalSearchResults.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onResultClick(chat)}
                  className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    lastChatId === String(chat.id)
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-4">
                    <ContactAvatar
                      profilePictureUrl={chat.contact_profile_picture_url}
                      contactName={chat.contact_name || "Sin nombre"}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        <HighlightText
                          text={chat.contact_name || "Sin nombre"}
                          searchQuery={globalSearchQuery}
                          className="text-gray-900"
                        />
                      </p>

                      {chat.match_message ? (
                        <div className="flex items-start gap-1 mt-0.5 text-xs text-gray-600">
                          <span className="truncate">
                            <HighlightText
                              text={chat.match_message}
                              searchQuery={globalSearchQuery}
                              className="text-gray-600"
                            />
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="truncate max-w-[120px]">
                            <HighlightText
                              text={chat.contact_phone}
                              searchQuery={globalSearchQuery}
                              className="text-gray-500"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500">
                    {chat.last_message_time && (
                      <span>
                        {new Date(
                          chat.last_message_time,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/GlobalSearchBar.jsx
git commit -m "feat: crear componente GlobalSearchBar"
```

---

### Task 15: Integrar GlobalSearchBar en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:1071-1202`

- [ ] **Step 1: Agregar import de GlobalSearchBar**

```javascript
import GlobalSearchBar from '@/components/conversaciones/GlobalSearchBar'
```

- [ ] **Step 2: Reemplazar sección de búsqueda global (líneas 1071-1202)**

```javascript
// Antes: Todo el bloque de búsqueda global desde línea 1071 hasta 1202

// Después:
<GlobalSearchBar
  globalSearchQuery={globalSearchQuery}
  onSearchChange={handleGlobalSearch}
  onClearSearch={handleClearGlobalSearch}
  loadingGlobalSearch={loadingGlobalSearch}
  isGlobalSearchActive={isGlobalSearchActive}
  globalSearchResults={globalSearchResults}
  lastChatId={lastChatId}
  onResultClick={handleGlobalSearchResultClick}
/>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: integrar componente GlobalSearchBar en page.js"
```

---

### Task 16: Crear componente ConversationsList

**Files:**
- Create: `dashboard/src/components/conversaciones/ConversationsList.jsx`

- [ ] **Step 1: Crear componente ConversationsList**

```javascript
// dashboard/src/components/conversaciones/ConversationsList.jsx
'use client'

import { MessageSquare, Phone, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import ContactAvatar from '@/components/ContactAvatar'
import { parseBotSessionName } from '@/lib/botNameParser'
import { formatBotStatus } from '@/hooks/useConversacionesFiltros'

export default function ConversationsList({
  selectedBot,
  selectedBotConversations,
  selectedBotPagination,
  loadingConversations,
  selectedBotId,
  lastChatId,
  onConversationClick,
  onPageChange,
  onGenerateReport
}) {
  if (!selectedBot) {
    return (
      <div className="h-full flex items-center justify-center text-center px-6 py-12">
        <div>
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            No hay asesor seleccionado
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md">
            Usa la lista de la izquierda para elegir un asesor y ver
            el detalle de sus conversaciones.
          </p>
        </div>
      </div>
    )
  }

  const meta = parseBotSessionName(selectedBot.session_name)

  return (
    <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-2">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            <span>Conversaciones de </span>
            <span translate="no">{meta.fullName}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {selectedBotPagination.total > 0 ? (
              <span translate="no">{selectedBotPagination.total}</span>
            ) : (
              <span translate="no">{selectedBot.conversation_count || 0}</span>
            )}
            <span> conversaciones totales</span>
            {selectedBotPagination.totalPages > 1 && (
              <>
                <span> • Mostrando página </span>
                <span translate="no">{selectedBotPagination.currentPage}</span>
                <span> de </span>
                <span translate="no">{selectedBotPagination.totalPages}</span>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600">
            {meta.sedeLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>Sede: </span>
                <span translate="no">{meta.sedeLabel}</span>
              </span>
            )}
            {meta.leadLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span>Lead: </span>
                <span translate="no">{meta.leadLabel}</span>
              </span>
            )}
            {meta.leaderLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                <span>Líder: </span>
                <span translate="no">{meta.leaderLabel}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end text-xs text-gray-500">
            <span>Estado: </span>
            <span translate="no">{formatBotStatus(selectedBot)}</span>
            {selectedBot.phone_number && (
              <span className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                <span translate="no">{selectedBot.phone_number}</span>
              </span>
            )}
          </div>
          <button
            onClick={onGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow"
          >
            Generar reporte
          </button>
        </div>
      </div>

      <div className="flex-1">
        {loadingConversations[selectedBotId] ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando conversaciones...
          </div>
        ) : selectedBotConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-6 py-12">
            <div>
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">
                No hay conversaciones para este asesor
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md">
                Las conversaciones aparecerán aquí cuando el bot reciba
                mensajes de clientes.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
              {selectedBotConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onConversationClick(selectedBot.id, conv.id)}
                  className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    lastChatId === String(conv.id)
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-4">
                    <ContactAvatar
                      profilePictureUrl={conv.contact_profile_picture_url}
                      contactName={conv.contact_name || "Sin nombre"}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.contact_name || "Sin nombre"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">
                          {conv.contact_phone || conv.remote_jid}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500 gap-1">
                    {conv.ai_analysis &&
                      conv.ai_analysis.sale_completed !== undefined && (
                        <div
                          className="mb-1"
                          title={
                            conv.ai_analysis.sale_completed
                              ? "Venta Probable"
                              : "Venta Improbable"
                          }
                        >
                          {conv.ai_analysis.sale_completed ? (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              <ArrowUp className="h-3 w-3" />
                              <span className="font-bold text-xs">
                                Venta
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              <ArrowDown className="h-3 w-3" />
                              <span className="font-bold text-xs">
                                No Venta
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {conv.last_message_time && (
                      <span className="mt-0.5">
                        {new Date(
                          conv.last_message_time,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de paginación */}
            {selectedBotPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Página {selectedBotPagination.currentPage} de{" "}
                    {selectedBotPagination.totalPages}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedBotPagination.total} conversaciones totales)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onPageChange(
                        selectedBotId,
                        selectedBotPagination.currentPage - 1,
                      )
                    }
                    disabled={
                      selectedBotPagination.currentPage === 1 ||
                      loadingConversations[selectedBotId]
                    }
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedBotPagination.currentPage === 1 ||
                      loadingConversations[selectedBotId]
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      onPageChange(
                        selectedBotId,
                        selectedBotPagination.currentPage + 1,
                      )
                    }
                    disabled={
                      selectedBotPagination.currentPage ===
                        selectedBotPagination.totalPages ||
                      loadingConversations[selectedBotId]
                    }
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedBotPagination.currentPage ===
                        selectedBotPagination.totalPages ||
                      loadingConversations[selectedBotId]
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/ConversationsList.jsx
git commit -m "feat: crear componente ConversationsList"
```

---

### Task 17: Integrar ConversationsList en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:982-1377`

- [ ] **Step 1: Agregar import de ConversationsList**

```javascript
import ConversationsList from '@/components/conversaciones/ConversationsList'
```

- [ ] **Step 2: Crear handler para abrir modal de reporte**

Agregar antes del return del componente:

```javascript
const handleOpenReportModal = () => {
  setReportData(null);
  setReportError(null);
  setReportModalOpen(true);
};
```

- [ ] **Step 3: Reemplazar sección de lista de conversaciones (líneas 982-1377)**

```javascript
// Antes: Todo el bloque de lista de conversaciones desde línea 982 hasta 1377

// Después:
<ConversationsList
  selectedBot={selectedBot}
  selectedBotConversations={selectedBotConversations}
  selectedBotPagination={selectedBotPagination}
  loadingConversations={loadingConversations}
  selectedBotId={selectedBotId}
  lastChatId={lastChatId}
  onConversationClick={handleConversationClick}
  onPageChange={handlePageChange}
  onGenerateReport={handleOpenReportModal}
/>
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: integrar componente ConversationsList en page.js"
```

---

## FASE 5: Limpieza Final

### Task 18: Eliminar imports no utilizados en page.js

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js:1-44`

- [ ] **Step 1: Revisar y eliminar imports no utilizados**

Después de la refactorización, algunos imports ya no son necesarios en page.js. Eliminar:
- `Filter, ChevronDown, ChevronUp, Trash2, Search` (ahora en ConversationsFiltersPanel)
- `Bot, MessageSquare, Phone, Circle, ChevronLeft, ChevronRight, ArrowUp, ArrowDown` (ahora en componentes hijos)
- `FileText` (ahora en ConversationsList)

Mantener solo:
- Imports de hooks y context
- Imports de componentes modales
- Imports de componentes nuevos creados
- Imports de utilidades necesarias

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor: eliminar imports no utilizados en page.js"
```

---

### Task 19: Verificar que la aplicación funciona correctamente

**Files:**
- Test: Manual verification

- [ ] **Step 1: Iniciar el servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

- [ ] **Step 2: Navegar a la página de conversaciones**

Abrir `http://localhost:3000/conversaciones` en el navegador

- [ ] **Step 3: Verificar funcionalidad**

- [ ] Stats cards se muestran correctamente
- [ ] Filtros funcionan (líderes, sedes, leads, estado)
- [ ] Lista de asesores se filtra correctamente
- [ ] Búsqueda global funciona
- [ ] Lista de conversaciones se carga al seleccionar asesor
- [ ] Paginación funciona
- [ ] Modal de reporte se abre correctamente
- [ ] Modo compacto funciona

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "refactor: completar refactorización del módulo de conversaciones"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Extraer números mágicos a constantes (Task 1, 4)
- ✅ Extraer strings hardcoded de líderes y sedes (Task 2, 5)
- ✅ Mover prompt del reporte a configuración (Task 3, 6)
- ✅ Corregir duplicación de lógica de filtros (Task 7)
- ✅ Extraer componente DashboardContent en partes más pequeñas (Tasks 8-17)

**2. Placeholder scan:**
- ✅ No hay placeholders "TBD", "TODO", "implement later"
- ✅ Todo el código está completo en cada paso
- ✅ Los comandos git son específicos y completos

**3. Type consistency:**
- ✅ Nombres de constantes consistentes (CONVERSATIONS_PAGE_SIZE, SALES_LIMIT, etc.)
- ✅ Nombres de componentes consistentes (StatsCards, ConversationsFiltersPanel, etc.)
- ✅ Props de componentes consistentes con su uso

---

Plan complete and saved to `docs/superpowers/plans/2025-06-08-refactorizacion-conversaciones.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
