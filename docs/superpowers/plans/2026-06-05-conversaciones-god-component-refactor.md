# Refactorización del God Component de Conversaciones

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Descomponer `conversaciones/page.js` (2667 líneas) en módulos enfocados, eliminando duplicación, corrigiendo autenticación y limpiando código de debug.

**Arquitectura:** Extraer lógica de negocio a hooks reutilizables, funciones utilitarias a `lib/`, modales a componentes independientes, y reemplazar autenticación manual por el patrón oficial del proyecto (`useRouteGuard`/`useAuth`).

**Tech Stack:** Next.js App Router, React hooks, jsPDF, Supabase Auth (via AuthContext/UserProfileContext)

---

## Contexto Crítico para el Implementador

### Patrón de Autenticación del Proyecto (Fuente de Verdad)

El proyecto ya tiene un sistema de autenticación centralizado. **NUNCA** llamar a `supabase.auth.getSession()` o `supabase.auth.getUser()` directamente en componentes de página. El flujo correcto es:

1. **Layout `(crm)/layout.js`** ya usa `useAuthRequired()` → protege TODAS las páginas bajo `(crm)/` automáticamente
2. **Páginas individuales** usan `useRouteGuard({ allowedRoles: [...] })` si necesitan roles específicos
3. **Session token** se obtiene de `useAuth().session.access_token` — NO crear estado separado

Archivos de referencia:
- `dashboard/src/hooks/useRouteGuard.js` — hook centralizado
- `dashboard/src/contexts/AuthContext.js` — provider con `session` accesible
- `dashboard/src/app/(crm)/layout.js` — ya llama `useAuthRequired()`
- `dashboard/src/app/(crm)/admin/deudas/page.jsx` — ejemplo de página con roles

### Archivo Existente: `lib/botNameParser.js`

Ya existe `dashboard/src/lib/botNameParser.js` con:
- `KNOWN_SEDES`, `KNOWN_LEADS`, `KNOWN_LEADERS` (exportados)
- `parseBotSessionName()` (exportada)
- `capitalizeWord()` (interna)

Este archivo se usa en **9 archivos** del proyecto. El `page.js` duplica toda esta lógica internamente en vez de importarla.

### Estructura Actual de `page.js` (2667 líneas)

| Líneas | Responsabilidad |
|--------|----------------|
| 1-48 | Imports (30 imports de lucide) |
| 49-118 | 30+ useState declarations |
| 120-261 | 8 useEffects (auth, bots, localStorage, búsqueda) |
| 263-331 | `syncBotData()` — sync individual con `alert()` |
| 333-358 | `fetchData()` — workers + sales |
| 360-458 | `handleSalesClick()`, `handleFullSync()`, sync logs |
| 460-485 | `fetchConversations()` |
| 487-530 | `parseBotSessionName()` DUPLICADA + helpers |
| 519-921 | `generatePdfReport()` — ~400 líneas de PDF |
| 923-966 | `handleGenerateReport()` con console.log de debug |
| 968-1225 | Funciones de filtrado (filterBots, formatBotStatus, pills, etc.) |
| 1226-1330 | Handlers de click y búsqueda global |
| 1332-1348 | Loading state + derived values |
| 1350-2651 | JSX: stats, filtros, modales, listas, paginación |

---

## FASE 1: Extraer `generatePdfReport` a `lib/`

**Objetivo:** Mover ~400 líneas de generación PDF fuera del componente.

**Root cause:** La función `generatePdfReport` (líneas 519-921) es una función pura que recibe datos y genera un PDF. No depende de estado React, solo de `jsPDF`. Incluye su propia copia de `STOP_WORDS` y `cleanAdvisorName` que duplican lógica de `botNameParser.js`.

**Files:**
- Create: `dashboard/src/lib/conversaciones/generatePdfReport.js`
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

### Task 1.1: Crear archivo `generatePdfReport.js`

- [ ] **Step 1: Crear el archivo con la función extraída**

```javascript
// dashboard/src/lib/conversaciones/generatePdfReport.js
import { jsPDF } from 'jspdf'
import { parseBotSessionName } from '@/lib/botNameParser'

/**
 * Genera un reporte PDF de auditoría comercial para un asesor.
 * @param {Object} payload — Datos del reporte (aiNarrative, audits, etc.)
 * @param {string} advisorSessionName — session_name del bot/asesor
 */
export function generatePdfReport(payload, advisorSessionName) {
  if (!payload) return

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const ML = 0, MR = 0
  const IX = 16
  const CW = PW - IX * 2
  let Y = 0

  /* ── PALETA EJECUTIVA ── */
  const NAVY   = [15,  31,  72]
  const BLUE   = [30,  80, 180]
  const GOLD   = [180,140,  30]
  const GREEN  = [22, 163, 104]
  const ORANGE = [234,130,  20]
  const RED    = [210,  40,  40]
  const G1     = [20,  20,  20]
  const G2     = [60,  60,  60]
  const G3     = [110, 110, 110]
  const G4     = [180, 180, 180]
  const G5     = [238, 240, 244]
  const WHITE  = [255, 255, 255]

  const scoreColor = s => s >= 8 ? GREEN : s >= 6 ? ORANGE : RED
  const scoreBg    = s => s >= 8 ? [230,248,240] : s >= 6 ? [255,243,215] : [254,226,226]

  /* ── HELPERS ── */
  let pageNum = 1

  const drawPageFooter = () => {
    doc.setFillColor(...G5)
    doc.rect(0, PH - 9, PW, 9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G3)
    doc.text('CONFIDENCIAL · USO INTERNO · VIAJES NOVA', IX, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: 'right' })
  }

  const newPage = () => {
    drawPageFooter()
    doc.addPage()
    pageNum++
    Y = 14
  }

  const need = space => { if (Y + space > PH - 14) newPage() }
  const hLine = (x1, x2, y, color = G4, lw = 0.2) => {
    doc.setDrawColor(...color); doc.setLineWidth(lw)
    doc.line(x1, y, x2, y)
  }

  /* ── DATOS ── */
  const narrative = payload.aiNarrative || {}
  const audits    = narrative.audits || []
  const N         = audits.length

  // Usar parseBotSessionName de botNameParser.js (fuente de verdad)
  const parsed = parseBotSessionName(advisorSessionName)
  const displayName = parsed.fullName || parsed.displayName || 'Asesor'

  if (N === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.setTextColor(...G2)
    doc.text('No se encontraron auditorías para las últimas 24 horas.', IX, 40)
    drawPageFooter()
    doc.save(`reporte_${advisorSessionName || 'asesor'}.pdf`)
    return
  }

  const KPI = {
    contact_time:        'Tiempo de contacto',
    response_time:       'Tiempo de respuesta',
    product_knowledge:   'Conocimiento del producto',
    customer_filtering:  'Filtrado del cliente',
    quote_quality:       'Cotización (tiempo + calidad)',
    options_presented:   'Opciones presentadas (+2)',
    financing_offered:   'Financiamiento / métodos pago',
    negotiation_closing: 'Negociación y cierre',
    objection_handling:  'Manejo de objeciones',
    follow_up:           'Seguimiento + asesoría',
  }
  const KEYS = Object.keys(KPI)

  let totalScore = 0, salesCount = 0
  const agg = {};  KEYS.forEach(k => agg[k] = 0)
  audits.forEach(a => {
    totalScore += a.score || 0
    if (a.sale_closed) salesCount++
    KEYS.forEach(k => { if ((a.kpis || {})[k]) agg[k]++ })
  })
  const avg = parseFloat((totalScore / N).toFixed(1))

  /* ══════════════════════════════════════════════════════
     PÁGINA 1 – PORTADA EJECUTIVA
  ══════════════════════════════════════════════════════ */

  /* --- Banda superior NAVY --- */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('VIAJES NOVA', IX, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 200, 240)
  doc.text('Agencia de Viajes', IX, 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text('REPORTE DE AUDITORÍA COMERCIAL', PW - IX, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text(`Período: Últimas 24 horas  ·  ${new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })}`, PW - IX, 19, { align: 'right' })

  doc.setFillColor(...GOLD)
  doc.rect(0, 36, PW, 1.5, 'F')

  /* --- Bloque asesor --- */
  Y = 46
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G3)
  doc.text('ASESOR EVALUADO', IX, Y)
  Y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...G1)
  doc.text(displayName, IX, Y)
  Y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G1)
  doc.text(`${N} conversaciones auditadas  ·  Generado el ${new Date().toLocaleDateString('es-ES')}`, IX, Y)
  Y += 10
  hLine(IX, PW - IX, Y, G4, 0.4)
  Y += 9

  /* --- 4 KPIs de resumen --- */
  const BW = (CW - 9) / 4
  const KPI_BOXES = [
    { label: 'PROM. 24H',    value: String(avg),         sub: '/ 10 puntos',      color: scoreColor(avg), bg: scoreBg(avg) },
    { label: 'EVALUADAS',    value: String(N),            sub: 'conversaciones',   color: BLUE,            bg: [234,242,255] },
    { label: 'VENTAS',       value: String(salesCount),   sub: `de ${N} chats`,    color: GREEN,           bg: [230,248,240] },
    { label: 'SIN VENTA',    value: String(N-salesCount), sub: `de ${N} chats`,    color: RED,             bg: [254,226,226] },
  ]
  KPI_BOXES.forEach((b, i) => {
    const bx = IX + i * (BW + 3)
    doc.setFillColor(...b.bg)
    doc.setDrawColor(...G4)
    doc.roundedRect(bx, Y, BW, 24, 2, 2, 'FD')
    doc.setFillColor(...b.color)
    doc.roundedRect(bx, Y, BW, 2.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...b.color)
    doc.text(b.label, bx + BW/2, Y + 7, { align:'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...b.color)
    doc.text(b.value, bx + BW/2, Y + 16, { align:'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...G3)
    doc.text(b.sub, bx + BW/2, Y + 21, { align:'center' })
  })
  Y += 33

  /* --- Tabla cumplimiento por criterio --- */
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...G1)
  doc.text('CUMPLIMIENTO POR CRITERIO', IX, Y)
  doc.setFillColor(...BLUE)
  doc.rect(IX, Y + 1.5, 55, 0.8, 'F')
  Y += 7

  const R = 7
  KEYS.forEach((key, idx) => {
    const v = agg[key] || 0
    const pct = N > 0 ? Math.round(v / N * 100) : 0
    if (idx % 2 === 0) { doc.setFillColor(...G5); doc.rect(IX, Y, CW, R, 'F') }
    else                { doc.setFillColor(...WHITE); doc.rect(IX, Y, CW, R, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...G2)
    doc.text(KPI[key], IX + 3, Y + R * 0.67)
    const barX = IX + CW * 0.55
    const barW = CW * 0.26
    doc.setFillColor(220, 225, 235)
    doc.roundedRect(barX, Y + R*0.25, barW, R*0.5, 1, 1, 'F')
    const fill = pct >= 80 ? GREEN : pct >= 50 ? ORANGE : RED
    doc.setFillColor(...fill)
    doc.roundedRect(barX, Y + R*0.25, Math.max(barW * pct / 100, 1), R*0.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...fill)
    doc.text(`${v}/${N} (${pct}%)`, IX + CW - 2, Y + R * 0.67, { align:'right' })
    Y += R
  })

  hLine(IX, IX + CW, Y, G4, 0.3)
  Y += 8

  /* ══════════════════════════════════════════════════════
     TARJETAS INDIVIDUALES
  ══════════════════════════════════════════════════════ */
  audits.forEach((audit, auditIdx) => {
    const kpis  = audit.kpis || {}
    const score = audit.score || 0
    const sc    = scoreColor(score)
    const scBg  = scoreBg(score)

    const rawClient = audit.client || 'Sin nombre'
    const slashIdx  = rawClient.indexOf('/')
    const clientName  = slashIdx !== -1 ? rawClient.slice(0, slashIdx).trim() : rawClient
    const clientPhone = slashIdx !== -1 ? rawClient.slice(slashIdx + 1).trim() : ''

    const rawAnal = (audit.analysis || '')
      .replace(/ \| /g, ' ')
      .replace(/Errores:/gi,       '\nErrores:')
      .replace(/Aciertos:/gi,      '\nAciertos:')
      .replace(/Recomendación:/gi, '\nRecomendación:')
    const analLines = doc.splitTextToSize(rawAnal, CW - 8)

    const KPI_H  = 6.8
    const cardH  = 34 + KEYS.length * KPI_H + analLines.length * 3.9 + 10
    need(cardH + 8)

    doc.setFillColor(215, 220, 230)
    doc.roundedRect(IX + 0.8, Y + 0.8, CW, cardH, 3, 3, 'F')
    doc.setFillColor(...WHITE)
    doc.setDrawColor(210, 218, 232)
    doc.setLineWidth(0.3)
    doc.roundedRect(IX, Y, CW, cardH, 3, 3, 'FD')

    doc.setFillColor(...sc)
    doc.rect(IX, Y + 3, 3, cardH - 6, 'F')

    let cy = Y + 7

    if (auditIdx === 0) {
      need(16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...G1)
      doc.text(`DETALLE DE EVALUACIONES (${N} CONVERSACIONES)`, IX, Y)
      doc.setFillColor(...BLUE)
      doc.rect(IX, Y + 1.5, 75, 0.8, 'F')
      Y += 8
      cy = Y + 7
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...G1)
    doc.text(`EVALUACIÓN #${auditIdx + 1}  ·  ${new Date().toLocaleDateString('es-ES')}  ·  ${displayName}`, IX + 6, cy)

    const BADGE_W = 24
    const scoreX = IX + CW - BADGE_W - 2
    doc.setFillColor(...scBg)
    doc.setDrawColor(...sc)
    doc.setLineWidth(0.5)
    doc.roundedRect(scoreX, cy - 5, BADGE_W, 10, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...sc)
    doc.text(String(score), scoreX + 6, cy + 2.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...sc)
    doc.text('/10', scoreX + 14, cy + 2.5)

    cy += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...G1)
    doc.text(clientName, IX + 6, cy)

    if (audit.type) {
      const typeLabel = (audit.type || '').toUpperCase()
      const tw = doc.getTextWidth(typeLabel) + 4
      const nameW = doc.getTextWidth(clientName)
      doc.setFillColor(...G5)
      doc.setDrawColor(...G4)
      doc.roundedRect(IX + 8 + nameW, cy - 4, tw, 5, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.setTextColor(...BLUE)
      doc.text(typeLabel, IX + 10 + nameW, cy - 0.5)
    }
    cy += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...G3)
    if (clientPhone) doc.text(clientPhone, IX + 6, cy)
    cy += 4

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    let tagX = IX + 6
    doc.setFillColor(230, 248, 240); doc.setDrawColor(...GREEN); doc.roundedRect(tagX - 1, cy - 4, 20, 5.5, 1.5, 1.5, 'FD')
    doc.setTextColor(...GREEN); doc.text('Respondió', tagX + 1, cy)
    tagX += 23
    if (audit.sale_closed) {
      doc.setFillColor(219, 234, 254); doc.setDrawColor(...BLUE); doc.roundedRect(tagX - 1, cy - 4, 16, 5.5, 1.5, 1.5, 'FD')
      doc.setTextColor(...BLUE); doc.text('Venta ✓', tagX + 1, cy)
    }
    cy += 8

    hLine(IX + 4, IX + CW - 4, cy, G4, 0.2)
    cy += 1

    KEYS.forEach((key, ki) => {
      const passed = kpis[key] === true
      cy += KPI_H
      if (ki % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(IX + 4, cy - KPI_H + 1, CW - 8, KPI_H, 'F') }
      if (passed) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...GREEN)
        doc.text('✓', IX + 7, cy - 1)
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 205, 215)
        doc.text('✗', IX + 7, cy - 1)
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...G2)
      doc.text(KPI[key], IX + 13, cy - 1)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      if (passed) { doc.setTextColor(...GREEN); doc.text('1', IX + CW - 7, cy - 1, { align:'right' }) }
      else        { doc.setTextColor(...RED);   doc.text('0', IX + CW - 7, cy - 1, { align:'right' }) }
      hLine(IX + 4, IX + CW - 4, cy + 1.5, G5, 0.15)
    })
    cy += 6

    hLine(IX + 4, IX + CW - 4, cy, G4, 0.25)
    cy += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    analLines.forEach(line => {
      if      (line.startsWith('Errores:'))        doc.setTextColor(...RED)
      else if (line.startsWith('Aciertos:'))       doc.setTextColor(...GREEN)
      else if (line.startsWith('Recomendación:'))  doc.setTextColor(...BLUE)
      else                                         doc.setTextColor(...G2)
      doc.text(line, IX + 6, cy)
      cy += 4
    })

    Y = cy + 10
  })

  drawPageFooter()
  doc.save(`reporte_${advisorSessionName || 'asesor'}.pdf`)
}
```

- [ ] **Step 2: Verificar que el archivo no tiene errores de sintaxis**

Abrir `dashboard/src/lib/conversaciones/generatePdfReport.js` y revisar visualmente que:
- Todos los paréntesis/llaves estén balanceados
- Los imports son correctos (`jsPDF` y `parseBotSessionName`)
- La función usa `parseBotSessionName` de `botNameParser.js` (NO duplica `STOP_WORDS`)

### Task 1.2: Actualizar `page.js` para usar la función extraída

- [ ] **Step 3: Reemplazar import de jsPDF por import de generatePdfReport**

En `dashboard/src/app/(crm)/conversaciones/page.js`:

Eliminar la línea:
```javascript
import { jsPDF } from 'jspdf'
```

Agregar en su lugar:
```javascript
import { generatePdfReport } from '@/lib/conversaciones/generatePdfReport'
```

- [ ] **Step 4: Eliminar la función `generatePdfReport` inline del componente**

Eliminar las líneas 519-921 completas (la función `generatePdfReport` y sus helpers internos: `cleanText`, `cleanAdvisorName`, la constante `STOP_WORDS`, etc.).

**Nota:** La función `cleanText` (línea 516-517) NO se usa en ningún otro lugar del componente después de eliminar `generatePdfReport`. Verificar con una búsqueda en el archivo antes de eliminar.

- [ ] **Step 5: Actualizar la llamada en `handleGenerateReport`**

La llamada en `handleGenerateReport` (línea ~953) ya es:
```javascript
generatePdfReport(data, selectedBot?.session_name)
```
Esta signatura es compatible con la función extraída. **No requiere cambios.**

La llamada en el botón de descarga (línea ~2619) también es:
```javascript
generatePdfReport(reportData, selectedBot?.session_name)
```
**Tampoco requiere cambios.**

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/lib/conversaciones/generatePdfReport.js dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): extraer generatePdfReport a lib/conversaciones/ (~400 líneas)"
```

---

## FASE 2: Corregir Autenticación Duplicada

**Objetivo:** Eliminar `checkUser()` y el estado `sessionToken`, usar el patrón estándar del proyecto.

**Root cause:** El componente llama a `useAuth()` (línea 50) para obtener `user` Y ADEMÁS tiene su propia función `checkUser()` (líneas 131-149) que llama directamente a `supabase.auth.getSession()`. Esto crea dos fuentes de verdad para la autenticación.

El `checkUser()` existe porque necesita `session.access_token` para el header `Authorization: Bearer` al generar reportes. Pero `useAuth()` ya expone `session` con el `access_token`.

**El layout `(crm)/layout.js` ya usa `useAuthRequired()` que protege la ruta automáticamente** — la redirección a `/login` es innecesaria en `page.js`.

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

### Task 2.1: Reemplazar `checkUser` por `useAuth().session`

- [ ] **Step 1: Actualizar el destructuring de `useAuth()`**

Cambiar línea 50 de:
```javascript
const { user } = useAuth();
```
a:
```javascript
const { user, session } = useAuth();
```

- [ ] **Step 2: Eliminar el estado `sessionToken`**

Eliminar la línea:
```javascript
const [sessionToken, setSessionToken] = useState(null);
```

- [ ] **Step 3: Eliminar la función `checkUser` completa**

Eliminar las líneas 131-149:
```javascript
const checkUser = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  // ...
  setSessionToken(session.access_token || null);
  fetchData();
};
```

- [ ] **Step 4: Reemplazar el useEffect de `checkUser` por fetchData directo**

Cambiar:
```javascript
useEffect(() => {
  checkUser();
}, []);
```

Por:
```javascript
useEffect(() => {
  if (user) {
    fetchData();
  }
}, [user]);
```

**Justificación:** `useAuthRequired()` en el layout ya maneja la redirección si no hay sesión. `fetchData` solo necesita ejecutarse cuando hay un usuario autenticado.

- [ ] **Step 5: Actualizar `handleGenerateReport` para usar `session.access_token`**

Cambiar la validación:
```javascript
if (!sessionToken) {
  setReportError(
    "No se pudo validar la sesión actual. Vuelve a iniciar sesión e inténtalo de nuevo.",
  );
  return;
}
```

Por:
```javascript
if (!session?.access_token) {
  setReportError(
    "No se pudo validar la sesión actual. Vuelve a iniciar sesión e inténtalo de nuevo.",
  );
  return;
}
```

Y cambiar el header:
```javascript
Authorization: `Bearer ${sessionToken}`,
```

Por:
```javascript
Authorization: `Bearer ${session.access_token}`,
```

- [ ] **Step 6: Eliminar el import directo de supabase si ya no se usa**

Verificar si `supabase` se usa en otro lugar del componente. Si solo se usaba en `checkUser`, eliminar `supabase` del import:
```javascript
import {
  supabase, // ← VERIFICAR si se usa en otro lugar
  getAllWorkers,
  // ...
} from '@/lib/supabase'
```

**PRECAUCIÓN:** `supabase` NO se usa en ningún otro lugar del componente `DashboardContent` después de eliminar `checkUser`. Las funciones `getAllWorkers`, `getConversationsByBot`, etc. son imports nombrados que no dependen de `supabase` directamente. **Se puede eliminar `supabase` del import.**

- [ ] **Step 7: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): eliminar checkUser duplicado, usar useAuth().session"
```

---

## FASE 3: Comentar Debug Logs

**Objetivo:** Eliminar los `console.log` con prefijo `[PDF-DEBUG]` que están en producción.

**Root cause:** Se dejaron 3 líneas de debug en `handleGenerateReport` que exponen datos sensibles al console del navegador.

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

### Task 3.1: Comentar los 3 console.log de debug

- [ ] **Step 1: Localizar y comentar los debug logs**

Las 3 líneas están dentro de `handleGenerateReport`, justo después de `setReportData(data)`:

```javascript
// console.log('[PDF-DEBUG] API response aiNarrative:', JSON.stringify(data.aiNarrative));
// console.log('[PDF-DEBUG] _debug field:', JSON.stringify(data._debug));
// console.log('[PDF-DEBUG] audits count:', data.aiNarrative?.audits?.length ?? 'UNDEFINED');
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "fix(conversaciones): comentar console.log de debug en producción"
```

---

## FASE 4: Reemplazar `parseBotSessionName` Duplicado por Import de `botNameParser.js`

**Objetivo:** Eliminar la función `parseBotSessionName` local (líneas 968-1029) y las constantes hardcodeadas (líneas 497-499), usar el import existente de `lib/botNameParser.js`.

**Root cause:** `dashboard/src/lib/botNameParser.js` ya existe con la misma lógica y se usa en 9 archivos del proyecto. El `page.js` tiene su propia copia que puede diverger de la fuente de verdad.

**Files:**
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

### Task 4.1: Agregar import y eliminar código duplicado

- [ ] **Step 1: Agregar import de `botNameParser`**

Agregar al bloque de imports del archivo:
```javascript
import { parseBotSessionName, KNOWN_SEDES, KNOWN_LEADS, KNOWN_LEADERS } from '@/lib/botNameParser'
```

- [ ] **Step 2: Eliminar constantes locales**

Eliminar las líneas dentro del componente `DashboardContent`:
```javascript
const KNOWN_SEDES = ["nova", "apolo", "flash"];
const KNOWN_LEADS = ["colombia", "venezuela"];
const KNOWN_LEADERS = ["moises", "jesus", "endry"];
```

- [ ] **Step 3: Eliminar la función `capitalizeWord` local**

Eliminar:
```javascript
const capitalizeWord = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
```

**PRECAUCIÓN:** Verificar que `capitalizeWord` no se usa en otro lugar del componente fuera de `parseBotSessionName` y `getActiveFilterPills`. 

En `getActiveFilterPills` (líneas 1146-1186) se llama `capitalizeWord(leaderFilter)`, `capitalizeWord(leadFilter)`, `capitalizeWord(sedeFilter)`. Necesitamos importar `capitalizeWord` o usar una alternativa.

`botNameParser.js` NO exporta `capitalizeWord`. Opciones:
- **Opción A (recomendada):** Exportar `capitalizeWord` desde `botNameParser.js` y usarla aquí
- **Opción B:** Crear una función inline simple para los pills

Tomar **Opción A**: Agregar export en `botNameParser.js`:

En `dashboard/src/lib/botNameParser.js`, cambiar:
```javascript
const capitalizeWord = (str) => {
```
por:
```javascript
export const capitalizeWord = (str) => {
```

Y actualizar el import:
```javascript
import { parseBotSessionName, KNOWN_SEDES, KNOWN_LEADS, KNOWN_LEADERS, capitalizeWord } from '@/lib/botNameParser'
```

- [ ] **Step 4: Eliminar la función `parseBotSessionName` local**

Eliminar toda la función local `parseBotSessionName` (líneas ~968-1029 del componente).

**NOTA:** La función local devuelve `displayName`, pero la de `botNameParser.js` devuelve `displayName` Y `fullName`. Verificar que el componente solo usa `displayName`, `sedeKey`, `sedeLabel`, `leadKey`, `leadLabel`, `leaderKey`, `leaderLabel`. Estos campos existen en ambas versiones. ✅

- [ ] **Step 5: Reemplazar `meta.displayName` por `meta.fullName` en el JSX**

**⚠️ DIFERENCIA CRÍTICA entre versiones:**
- **Local (page.js):** `displayName` = TODOS los tokens unidos (ej: "María Aular") 
- **botNameParser.js:** `displayName` = solo PRIMER token (ej: "María"), `fullName` = todos los tokens (ej: "María Aular")

Por lo tanto, donde el JSX usa `meta.displayName`, debe cambiarse a `meta.fullName` para mantener el mismo comportamiento visual.

Líneas a cambiar:
1. Línea ~1919 (lista de bots): `{meta.displayName}` → `{meta.fullName}`
2. Línea ~1993 (header de conversaciones): `{meta.displayName}` → `{meta.fullName}`
3. En `filterBots()` línea ~1040: `meta.displayName.toLowerCase()` → `meta.fullName.toLowerCase()`
4. En `filterBots()` línea ~1052: `meta.displayName.toLowerCase()` → `meta.fullName.toLowerCase()`

Las propiedades `sedeKey`, `sedeLabel`, `leadKey`, `leadLabel`, `leaderKey`, `leaderLabel` son idénticas en ambas versiones. ✅

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/lib/botNameParser.js dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar parseBotSessionName de lib/botNameParser (DRY)"
```

---

## FASE 5: Extraer Modales a Componentes Independientes

**Objetivo:** Extraer los 3 modales principales del JSX a componentes separados, reduciendo ~500 líneas del archivo principal.

**Root cause:** Los modales están embebidos directamente en el JSX del componente, inflando el archivo y mezclando responsabilidades.

**Files:**
- Create: `dashboard/src/components/conversaciones/SalesModal.jsx`
- Create: `dashboard/src/components/conversaciones/SyncModal.jsx`
- Create: `dashboard/src/components/conversaciones/ReportModal.jsx`
- Modify: `dashboard/src/app/(crm)/conversaciones/page.js`

### Task 5.1: Extraer `SalesModal`

- [ ] **Step 1: Crear el componente SalesModal**

```jsx
// dashboard/src/components/conversaciones/SalesModal.jsx
'use client'

import { RefreshCw, X, ArrowUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Modal que muestra las ventas concretadas (sale_completed = true)
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Array} props.conversations — lista de ventas
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
export default function SalesModal({ isOpen, onClose, conversations, loading, error }) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Ventas Concretadas
            </h3>
            <p className="text-sm text-gray-500">
              Conversaciones con venta confirmada por IA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total: <strong>{conversations.length}</strong> ventas registradas
          </span>
          <span className="text-gray-500 flex items-center gap-1">
            <ArrowUp className="h-4 w-4 text-green-500" />
            Actualizado en tiempo real con IA
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
              <RefreshCw className="h-6 w-6 animate-spin" />
              Cargando ventas...
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-red-600">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No se encontraron ventas concretadas todavía.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((sale) => (
                <li
                  key={sale.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {sale.displayName} · {sale.displayPhone}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      <span>Asesor: {sale.advisorName}</span>
                      <span className="text-gray-300">•</span>
                      <span>{sale.formattedDate}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push(
                          `/conversaciones/chat/${sale.id}?botId=${sale.bot?.id || sale.bot_id}`,
                        )
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"
                    >
                      Ver conversación
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Mostrando las conversaciones donde la IA marcó{' '}
            <strong>sale_completed = true</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/conversaciones/SalesModal.jsx
git commit -m "refactor(conversaciones): extraer SalesModal a componente independiente"
```

### Task 5.2: Extraer `SyncModal`

- [ ] **Step 3: Crear el componente SyncModal**

```jsx
// dashboard/src/components/conversaciones/SyncModal.jsx
'use client'

import { X } from 'lucide-react'

/**
 * Modal que muestra el progreso de sincronización completa con WAHA
 * @param {Object} props
 * @param {Object|null} props.syncProgress — { percent, status }
 * @param {Array} props.syncLogs — [{ message, type, time }]
 * @param {boolean} props.syncing — si la sincronización está en progreso
 * @param {Function} props.onClose
 */
export default function SyncModal({ syncProgress, syncLogs, syncing, onClose }) {
  if (!syncProgress) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Sincronización Completa
            </h3>
            <p className="text-sm text-gray-500">
              Conectando con Express y WAHA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 ${syncing ? 'pointer-events-none opacity-50' : ''}`}
            disabled={syncing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {syncProgress.status}
          </p>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(syncProgress.percent, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-sm max-h-64 overflow-y-auto">
            {syncLogs.length === 0 ? (
              <p className="text-gray-500 text-center">
                Esperando actualizaciones...
              </p>
            ) : (
              <ul className="space-y-2">
                {syncLogs.map((log, index) => (
                  <li
                    key={`${log.time}-${index}`}
                    className="flex items-start gap-2"
                  >
                    <span className="text-[11px] text-gray-400">
                      {log.time}
                    </span>
                    <span
                      className={`text-sm ${log.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      {log.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            La sincronización puede tardar varios minutos dependiendo de la
            cantidad de bots.
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={syncing}
            className={`px-4 py-2 rounded-lg border text-sm transition ${
              syncing
                ? 'border-gray-300 text-gray-400'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/conversaciones/SyncModal.jsx
git commit -m "refactor(conversaciones): extraer SyncModal a componente independiente"
```

### Task 5.3: Extraer `ReportModal`

- [ ] **Step 5: Crear el componente ReportModal**

```jsx
// dashboard/src/components/conversaciones/ReportModal.jsx
'use client'

import { X, Edit3, Download, Sparkles, Loader2 } from 'lucide-react'

/**
 * Modal para generar reportes de auditoría con IA
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.prompt — texto del prompt personalizable
 * @param {Function} props.onPromptChange — (newPrompt) => void
 * @param {boolean} props.loading — si está generando el reporte
 * @param {Object|null} props.reportData — datos del reporte generado
 * @param {string|null} props.error
 * @param {Function} props.onGenerate — handler para generar PDF
 * @param {Function} props.onDownload — handler para descargar PDF nuevamente
 */
export default function ReportModal({
  isOpen,
  onClose,
  prompt,
  onPromptChange,
  loading,
  reportData,
  error,
  onGenerate,
  onDownload,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
              Reporte IA
            </p>
            <h3 className="text-2xl font-semibold text-slate-900">
              Generar reporte del asesor
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Analizaremos todas las conversaciones recientes para
              identificar aciertos, riesgos y oportunidades.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              <Edit3 className="h-4 w-4 text-purple-600" />
              Prompt para IA
            </div>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:ring-4 focus:ring-purple-100 focus:border-purple-300"
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes personalizar el enfoque del reporte agregando
              instrucciones específicas (productos, campañas, etc.).
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Conversaciones
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.summary?.totalChats ?? '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Ventas logradas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {reportData.summary?.salesCompleted ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Promedio respuesta
                  </p>
                  <p className="mt-2 text-2xl font-bold text-indigo-700">
                    {reportData.summary?.averageResponseMinutes
                      ? `${reportData.summary.averageResponseMinutes} min`
                      : 'N/D'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2 uppercase tracking-[0.2em]">
                    Momentos destacados
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    {reportData.evidence?.highlightedWins?.length ? (
                      reportData.evidence.highlightedWins.map((item, idx) => (
                        <div
                          key={`win-${idx}`}
                          className="rounded-xl border border-white/70 bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.contact} · {item.responseMinutes} min
                          </p>
                          <p className="text-xs text-slate-500">
                            Cliente: {item.clientSnippet}
                          </p>
                          <p className="text-xs text-slate-500">
                            Asesor: {item.advisorSnippet}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Aún no hay registros.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2 uppercase tracking-[0.2em]">
                    Respuestas tardías
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    {reportData.evidence?.lateResponses?.length ? (
                      reportData.evidence.lateResponses.map((item, idx) => (
                        <div
                          key={`late-${idx}`}
                          className="rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.contact} · {item.responseMinutes} min
                          </p>
                          <p className="text-xs text-slate-500">
                            Cliente: {item.clientSnippet}
                          </p>
                          <p className="text-xs text-slate-500">
                            Asesor: {item.advisorSnippet}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Sin demoras relevantes.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-[0.2em]">
                  Motivos de mejora detectados
                </h4>
                <div className="space-y-2 text-sm text-slate-700">
                  {reportData.evidence?.improvementReasons?.length ? (
                    reportData.evidence.improvementReasons.map((item, idx) => (
                      <p key={`improve-${idx}`}>
                        <span className="font-semibold text-slate-900">
                          {item.contact}:
                        </span>{' '}
                        {item.reason}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      Sin observaciones registradas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            El reporte se descargará en PDF automáticamente al generarse.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            {reportData && (
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            )}
            <button
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/components/conversaciones/ReportModal.jsx
git commit -m "refactor(conversaciones): extraer ReportModal a componente independiente"
```

### Task 5.4: Reemplazar modales inline en `page.js` por los componentes

- [ ] **Step 7: Agregar imports de los 3 modales**

Al inicio de `page.js`:
```javascript
import SalesModal from '@/components/conversaciones/SalesModal'
import SyncModal from '@/components/conversaciones/SyncModal'
import ReportModal from '@/components/conversaciones/ReportModal'
```

- [ ] **Step 8: Reemplazar el JSX del modal de Ventas**

Reemplazar todo el bloque `{salesModalOpen && ( ... )}` (líneas ~1353-1452) por:
```jsx
<SalesModal
  isOpen={salesModalOpen}
  onClose={handleCloseSalesModal}
  conversations={salesConversations}
  loading={salesModalLoading}
  error={salesModalError}
/>
```

- [ ] **Step 9: Reemplazar el JSX del modal de Sincronización**

Reemplazar todo el bloque `{syncProgress && ( ... )}` (líneas ~1455-1537) por:
```jsx
<SyncModal
  syncProgress={syncProgress}
  syncLogs={syncLogs}
  syncing={syncingAll}
  onClose={handleCloseSyncModal}
/>
```

- [ ] **Step 10: Reemplazar el JSX del modal de Reporte**

Reemplazar todo el bloque `{reportModalOpen && ( ... )}` (líneas ~2431-2648) por:
```jsx
<ReportModal
  isOpen={reportModalOpen}
  onClose={closeReportModal}
  prompt={reportPrompt}
  onPromptChange={setReportPrompt}
  loading={reportLoading}
  reportData={reportData}
  error={reportError}
  onGenerate={handleGenerateReport}
  onDownload={() => generatePdfReport(reportData, selectedBot?.session_name)}
/>
```

- [ ] **Step 11: Eliminar imports de lucide que ya no se usan en page.js**

Después de extraer los modales, los siguientes iconos de lucide ya se importan dentro de los componentes modales y pueden no necesitarse más en `page.js`. **Verificar antes de eliminar** que no se usan en otro lugar del archivo:
- `Edit3` — solo se usaba en ReportModal ✅ eliminar
- `Loader2` — solo se usaba en ReportModal ✅ eliminar

Los demás iconos (`X`, `ArrowUp`, `ArrowRight`, `Download`, `Sparkles`, `RefreshCw`) se siguen usando en otros lugares del JSX. **No eliminar.**

- [ ] **Step 12: Verificar que el archivo compila sin errores**

Ejecutar:
```bash
cd dashboard && npx next lint --file src/app/(crm)/conversaciones/page.js
```

- [ ] **Step 13: Commit final**

```bash
git add dashboard/src/app/(crm)/conversaciones/page.js
git commit -m "refactor(conversaciones): usar SalesModal, SyncModal y ReportModal como componentes"
```

---

## Resumen de Reducción de Líneas

| Fase | Líneas eliminadas (aprox) | Archivos nuevos |
|------|---------------------------|-----------------|
| FASE 1: PDF | ~400 | `lib/conversaciones/generatePdfReport.js` |
| FASE 2: Auth | ~30 | — |
| FASE 3: Debug | ~3 | — |
| FASE 4: Bot parser | ~50 | — (mod `botNameParser.js`) |
| FASE 5: Modales | ~500 | 3 componentes en `components/conversaciones/` |
| **TOTAL** | **~983** | **4 archivos nuevos** |

El archivo `page.js` pasa de **~2667 líneas** a **~1684 líneas** — una reducción del **37%** en esta primera ronda.
