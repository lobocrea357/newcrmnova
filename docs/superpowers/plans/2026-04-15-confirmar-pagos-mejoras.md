# Vista de Confirmación de Pagos - Mejoras Completas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar mejoras críticas de seguridad (notificaciones y validaciones) y mejoras de UX/UI en la vista de confirmación de pagos administrativa.

**Architecture:** Arquitectura en capas: Backend (Express + Supabase) → Frontend (Next.js + React). Las mejoras se dividen en: (1) Backend crítico (notificaciones + validaciones), (2) Frontend UX/UI (rediseño + error handling), (3) Mejoras adicionales (helpers + métricas).

**Tech Stack:** Node.js, Express, Supabase (PostgreSQL), Next.js 14, React, TailwindCSS, Lucide Icons

---

## Estructura de Archivos

### Archivos a Modificar
- `src/services/notificacionesService.js` - Agregar función de notificación de pago confirmado
- `src/routes/vuelos.js` - Integrar notificación en endpoint de confirmación
- `src/services/vuelosService.js` - Agregar validación de estado antes de confirmar
- `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx` - Rediseño completo de UI
- `dashboard/src/helpers/dateHelpers.js` - Nuevo helper para formateo de fechas

### Archivos a Crear
- `dashboard/src/components/admin/PagoCard.jsx` - Nuevo componente card-based
- `dashboard/src/components/admin/PagoModal.jsx` - Modal mejorado con tabs
- `dashboard/src/components/admin/MetricasHeader.jsx` - Header con métricas

---

## FASE 1: Backend Crítico - Notificación de Confirmación de Pago

### Task 1: Agregar función notificarPagoConfirmado en notificacionesService.js

**Files:**
- Modify: `src/services/notificacionesService.js:140-147`

- [ ] **Step 1: Agregar función notificarPagoConfirmado antes del export default**

Insertar después de la función `notificarPagoObservado` (línea 140):

```javascript
/**
 * Notificar al asesor cuando el pago de su vuelo es confirmado
 */
export async function notificarPagoConfirmado(vuelo, adminNombre) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'pago_confirmado',
      titulo: '✅ Pago confirmado',
      descripcion: `${adminNombre} aprobó el pago del vuelo ${ruta}. Ya puedes proceder con la emisión.`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        monto: vuelo.monto_venta,
        estado_vuelo: 'PENDIENTE_EMISION',
        accion_requerida: 'Proceder con emisión del vuelo'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación de pago confirmado enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de confirmación:', err.message);
  }
}
```

- [ ] **Step 2: Actualizar export default para incluir la nueva función**

Modificar el export default (línea 142-147):

```javascript
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado,
  notificarPagoConfirmado
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/notificacionesService.js
git commit -m "feat(notificaciones): agregar notificarPagoConfirmado para avisar al asesor cuando se aprueba su pago"
```

---

### Task 2: Integrar notificación en endpoint de confirmación de pago

**Files:**
- Modify: `src/routes/vuelos.js:253-280`

- [ ] **Step 1: Importar notificarPagoConfirmado al inicio del archivo**

Agregar al import existente (línea 6):

```javascript
import { notificarNuevoVuelo, notificarVueloEmitido, notificarPagoObservado, notificarPagoConfirmado } from '../services/notificacionesService.js';
```

- [ ] **Step 2: Actualizar endpoint PATCH /:id/confirmar-pago para obtener nombre del admin y notificar**

Reemplazar todo el endpoint (líneas 253-280):

```javascript
/**
 * PATCH /api/vuelos/:id/confirmar-pago - Confirmar pago (Admin)
 */
router.patch('/:id/confirmar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    const vuelo = await vuelosService.confirmarPago(id, userId);

    // Obtener nombre del admin para notificación
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const adminNombre = adminProfile?.full_name || 'Administrador';

    // Notificar al creador del vuelo (async, no bloquea respuesta)
    notificarPagoConfirmado(vuelo, adminNombre).catch(err =>
      console.error('Error en notificación async:', err)
    );

    res.json({
      message: 'Pago confirmado exitosamente',
      vuelo
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/confirmar-pago:', error);
    res.status(500).json({
      error: 'Error al confirmar pago',
      details: error.message
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/vuelos.js
git commit -m "feat(vuelos): integrar notificación al asesor cuando se confirma pago"
```

---

## FASE 2: Backend Crítico - Validación de Estado

### Task 3: Agregar validación de estado en confirmarPago

**Files:**
- Modify: `src/services/vuelosService.js:340-371`

- [ ] **Step 1: Reemplazar método confirmarPago completo con validación de estado**

Reemplazar todo el método (líneas 340-371):

```javascript
/**
 * Confirmar pago de un vuelo (Admin)
 */
async confirmarPago(id, userId) {
  try {
    console.log(`[VuelosService] Confirmando pago del vuelo ${id}`);

    // Primero obtener el vuelo actual
    const { data: vueloActual, error: fetchError } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !vueloActual) {
      throw new Error('Vuelo no encontrado');
    }

    // Validar estado - solo permitir confirmar pagos en PENDIENTE_CONFIRMACION_PAGO
    if (vueloActual.estado !== 'PENDIENTE_CONFIRMACION_PAGO') {
      throw new Error(
        `El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO. Estado actual: ${vueloActual.estado}`
      );
    }

    // Actualizar estado
    const { data: vuelo, error } = await supabase
      .from('vuelos')
      .update({
        estado: 'PENDIENTE_EMISION',
        pago_confirmado_por: userId,
        pago_confirmado_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[VuelosService] Error confirmando pago:', error);
      throw error;
    }

    console.log('[VuelosService] Pago confirmado exitosamente');
    return vuelo;

  } catch (error) {
    console.error('[VuelosService] Error en confirmarPago:', error);
    throw error;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/vuelosService.js
git commit -m "fix(vuelos): agregar validación de estado antes de confirmar pago para evitar aprobaciones incorrectas"
```

---

## FASE 3: Frontend - Helper de Formateo de Fecha

### Task 4: Crear helper dateHelpers.js

**Files:**
- Create: `dashboard/src/helpers/dateHelpers.js`

- [ ] **Step 1: Crear archivo dateHelpers.js con funciones de formateo**

```javascript
/**
 * Formatear fecha de string YYYY-MM-DD a formato local español
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @param {Object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fechaString, options = {}) {
  if (!fechaString) return 'No especificada';

  const [year, month, day] = fechaString.split('-');
  const date = new Date(year, month - 1, day);

  const defaultOptions = {
    weekday: options.weekday || undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString('es-ES', defaultOptions);
}

/**
 * Formatear fecha corta (solo día/mes/año)
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada corta
 */
export function formatearFechaCorta(fechaString) {
  if (!fechaString) return 'N/A';
  return formatearFecha(fechaString);
}

/**
 * Formatear fecha larga con día de la semana
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada larga
 */
export function formatearFechaLarga(fechaString) {
  if (!fechaString) return 'No especificada';
  return formatearFecha(fechaString, { weekday: 'long' });
}

/**
 * Calcular tiempo relativo (hace X minutos, horas, días)
 * @param {string} dateString - Fecha ISO string
 * @returns {string} Tiempo relativo
 */
export function tiempoRelativo(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  return formatearFechaCorta(dateString);
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/helpers/dateHelpers.js
git commit -m "feat(helpers): crear dateHelpers con funciones de formateo de fecha reutilizables"
```

---

## FASE 4: Frontend - Componente PagoCard (Card-Based Layout)

### Task 5: Crear componente PagoCard.jsx

**Files:**
- Create: `dashboard/src/components/admin/PagoCard.jsx`

- [ ] **Step 1: Crear componente PagoCard con diseño card-based**

```javascript
'use client'
import { Eye, CheckCircle, AlertTriangle, Clock, DollarSign, Users } from 'lucide-react'
import { formatearFechaCorta, tiempoRelativo } from '@/helpers/dateHelpers'

export default function PagoCard({ vuelo, onVerDetalles, onConfirmarPago, onReportarObservacion }) {
  const comprobantes = vuelo.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_PAGO') || []
  const tieneComprobante = comprobantes.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Header con info principal */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {vuelo.pax_nombre}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-400">ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {vuelo.id.substring(0, 8)}
              </code>
              <span className="text-gray-300">•</span>
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{tiempoRelativo(vuelo.created_at)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${vuelo.monto_venta?.toFixed(2)}
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              {vuelo.metodo_pago || 'N/A'}
            </span>
          </div>
        </div>

        {/* Ruta y fecha */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block text-xs mb-1">Ruta</span>
            <p className="font-medium text-gray-900">{vuelo.ruta}</p>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-1">Fecha vuelo</span>
            <p className="font-medium text-gray-900">{formatearFechaCorta(vuelo.fecha_vuelo)}</p>
          </div>
        </div>
      </div>

      {/* Info de pasajeros y comprobantes */}
      <div className="p-5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{vuelo.pasajeros?.length || 0}</span> pasajeros
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${tieneComprobante ? 'text-green-600' : 'text-amber-600'}`}>
                {tieneComprobante ? 'Comprobante adjunto' : 'Sin comprobante'}
              </span>
            </div>
          </div>
          {tieneComprobante && (
            <div className="flex -space-x-2">
              {comprobantes.slice(0, 3).map((comp, idx) => (
                <img
                  key={idx}
                  src={comp.url_storage}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
              {comprobantes.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{comprobantes.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => onVerDetalles(vuelo)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Ver Detalles
        </button>
        <button
          onClick={() => onConfirmarPago(vuelo.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar
        </button>
        <button
          onClick={() => onReportarObservacion(vuelo)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          title="Reportar observación"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/admin/PagoCard.jsx
git commit -m "feat(admin): crear componente PagoCard con diseño card-based para mejor visualización de vuelos pendientes"
```

---

### Task 6: Crear componente MetricasHeader.jsx

**Files:**
- Create: `dashboard/src/components/admin/MetricasHeader.jsx`

- [ ] **Step 1: Crear componente MetricasHeader con métricas rápidas**

```javascript
'use client'
import { Clock, DollarSign, FileText, TrendingUp } from 'lucide-react'

export default function MetricasHeader({ vuelos }) {
  const totalPendientes = vuelos.length
  const montoTotal = vuelos.reduce((sum, v) => sum + (v.monto_venta || 0), 0)
  const conComprobante = vuelos.filter(v => 
    v.adjuntos?.some(a => a.tipo_adjunto === 'COMPROBANTE_PAGO')
  ).length
  const sinComprobante = totalPendientes - conComprobante

  const metricas = [
    {
      label: 'Pendientes',
      valor: totalPendientes,
      icono: FileText,
      color: 'bg-indigo-100 text-indigo-700',
      sublabel: 'vuelos'
    },
    {
      label: 'Monto Total',
      valor: `$${montoTotal.toFixed(2)}`,
      icono: DollarSign,
      color: 'bg-green-100 text-green-700',
      sublabel: 'en validación'
    },
    {
      label: 'Con Comprobante',
      valor: conComprobante,
      icono: CheckCircle,
      color: 'bg-blue-100 text-blue-700',
      sublabel: 'listos para revisar'
    },
    {
      label: 'Sin Comprobante',
      valor: sinComprobante,
      icono: AlertTriangle,
      color: 'bg-amber-100 text-amber-700',
      sublabel: 'requieren atención'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricas.map((metrica, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{metrica.label}</span>
            <div className={`p-2 rounded-lg ${metrica.color}`}>
              <metrica.icono className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
          <p className="text-xs text-gray-500 mt-1">{metrica.sublabel}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Agregar imports faltantes al inicio del archivo**

El archivo necesita los imports de CheckCircle y AlertTriangle. Actualizar el import:

```javascript
'use client'
import { Clock, DollarSign, FileText, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/admin/MetricasHeader.jsx
git commit -m "feat(admin): crear MetricasHeader con métricas rápidas de pagos pendientes"
```

---

### Task 7: Actualizar page.jsx para usar nuevos componentes

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx`

- [ ] **Step 1: Actualizar imports al inicio del archivo**

Reemplazar imports existentes (líneas 1-8):

```javascript
'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import ImageModal from '@/components/shared/ImageModal'
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'
import PagoCard from '@/components/admin/PagoCard'
import MetricasHeader from '@/components/admin/MetricasHeader'
```

- [ ] **Step 2: Reemplazar el return completo con nuevo diseño card-based**

Reemplazar todo el return (líneas 137-435):

```javascript
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Confirmación de Pagos</h1>
          <p className="text-gray-600 mt-2">
            Revisa y aprueba los pagos de vuelos pendientes
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando vuelos...</p>
            </div>
          </div>
        ) : vuelos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pagos pendientes
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido confirmados
            </p>
          </div>
        ) : (
          <>
            {/* Métricas */}
            <MetricasHeader vuelos={vuelos} />

            {/* Grid de cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vuelos.map((vuelo) => (
                <PagoCard
                  key={vuelo.id}
                  vuelo={vuelo}
                  onVerDetalles={verDetalles}
                  onConfirmarPago={confirmarPago}
                  onReportarObservacion={abrirModalObservacion}
                />
              ))}
            </div>
          </>
        )}

        {/* Modal de Detalles */}
        {modalOpen && selectedVuelo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalles del Vuelo
                </h2>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Info Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedVuelo.pax_nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <p className="text-gray-900">{selectedVuelo.contacto_nombre}</p>
                    <p className="text-sm text-gray-600">{selectedVuelo.contacto_telefono}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                    <p className="text-gray-900">{selectedVuelo.ruta}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vuelo</label>
                    <p className="text-gray-900">
                      {(() => {
                        const [year, month, day] = selectedVuelo.fecha_vuelo.split('-')
                        const date = new Date(year, month - 1, day)
                        return date.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedVuelo.monto_venta?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedVuelo.metodo_pago || 'No especificado'}
                    </span>
                  </div>
                </div>

                {/* Pasajeros */}
                {selectedVuelo.pasajeros && selectedVuelo.pasajeros.length > 0 && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">
                        Pasajeros ({selectedVuelo.pasajeros.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selectedVuelo.pasajeros.map((pasajero, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                          <div className="font-semibold text-gray-900">
                            {pasajero.nombre_completo || `${pasajero.nombres || ''} ${pasajero.apellidos || ''}`.trim() || `Pasajero #${idx + 1}`}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            {pasajero.tipo} • {pasajero.numero_pasaporte ? `Pasaporte: ${pasajero.numero_pasaporte}` : 'Sin pasaporte'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comprobantes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">
                      Comprobantes de Pago ({comprobantes.length})
                    </h3>
                  </div>
                  {comprobantes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comprobantes.map((comprobante, idx) => (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedImage({ url: comprobante.url_storage, name: comprobante.nombre_archivo })
                              setImageModalOpen(true)
                            }}
                          >
                            <img
                              src={comprobante.url_storage}
                              alt={comprobante.nombre_archivo}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                console.error('Error cargando imagen:', comprobante.url_storage)
                                e.target.src = '/placeholder-image.png'
                                e.target.alt = 'Imagen no disponible'
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {comprobante.nombre_archivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comprobante.uploaded_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-amber-700 text-sm">
                        No se han subido comprobantes de pago
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => abrirModalObservacion(selectedVuelo)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Reportar Observación
                </button>
                <button
                  onClick={() => confirmarPago(selectedVuelo.id)}
                  disabled={confirmingPago}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {confirmingPago ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Imagen */}
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
        />

        {/* Modal de Observación */}
        <ModalObservacionPago
          vuelo={selectedVuelo}
          isOpen={observacionModalOpen}
          onClose={cerrarModalObservacion}
          onSubmit={enviarObservacion}
        />
      </div>
    </div>
  )
```

- [ ] **Step 3: Agregar imports faltantes de iconos usados en el modal**

Agregar al import existente:

```javascript
import { CheckCircle, Loader2, Users, FileText, AlertTriangle } from 'lucide-react'
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx
git commit -m "refactor(admin): actualizar vista de confirmación de pagos a diseño card-based con métricas"
```

---

## FASE 5: Frontend - Mejora de Error Handling

### Task 8: Mejorar error handling en confirmarPago

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx:59-91`

- [ ] **Step 1: Reemplazar función confirmarPago con mejor error handling**

Reemplazar toda la función (líneas 59-91):

```javascript
  const confirmarPago = async (vueloId) => {
    try {
      setConfirmingPago(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('Usuario no autenticado. Inicia sesión nuevamente.')
        return
      }

      const response = await fetch(VUELOS_API.confirmarPago(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Manejar errores específicos
        if (errorData.error?.includes('no está en estado PENDIENTE_CONFIRMACION_PAGO')) {
          toastError('Este vuelo ya fue procesado. Actualiza la página.')
          await cargarVuelosPendientes()
          return
        }
        
        if (errorData.error?.includes('Vuelo no encontrado')) {
          toastError('El vuelo no existe. Actualiza la página.')
          await cargarVuelosPendientes()
          return
        }
        
        throw new Error(errorData.error || 'Error al confirmar pago')
      }

      const data = await response.json()
      toastSuccess('Pago confirmado exitosamente')
      cerrarModal()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error confirmando pago:', error)
      
      // Diferenciar tipos de error
      if (error.message?.includes('Failed to fetch')) {
        toastError('Error de conexión. Verifica tu internet e intenta nuevamente.')
      } else if (error.message?.includes('timeout')) {
        toastError('La operación tardó demasiado. Intenta nuevamente.')
      } else {
        toastError(error.message || 'Error al confirmar pago. Intenta nuevamente.')
      }
    } finally {
      setConfirmingPago(false)
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx
git commit -m "fix(admin): mejorar error handling en confirmarPago con mensajes específicos por tipo de error"
```

---

## FASE 6: Testing Manual

### Task 9: Probar notificación de confirmación de pago

**Files:**
- Test: Manual testing en entorno de desarrollo

- [ ] **Step 1: Iniciar backend en modo desarrollo**

```bash
cd src
node index.js
```

Expected: Backend iniciado en puerto configurado

- [ ] **Step 2: Iniciar frontend en modo desarrollo**

```bash
cd dashboard
npm run dev
```

Expected: Frontend iniciado en http://localhost:3000

- [ ] **Step 3: Crear un vuelo de prueba como asesor**

1. Iniciar sesión como usuario con rol 'asesor'
2. Navegar a la página de creación de vuelos
3. Crear un vuelo con todos los datos requeridos
4. Subir un comprobante de pago
5. El vuelo debe quedar en estado PENDIENTE_CONFIRMACION_PAGO

Expected: Vuelo creado exitosamente

- [ ] **Step 4: Iniciar sesión como admin**

1. Cerrar sesión del asesor
2. Iniciar sesión como usuario con rol 'admin' o 'super_admin'
3. Navegar a /admin/confirmar-pagos

Expected: Ver el vuelo creado en la lista de pendientes

- [ ] **Step 5: Confirmar el pago**

1. Hacer clic en "Aprobar" en la card del vuelo
2. Confirmar la acción en el modal
3. Verificar que aparezca toast de éxito

Expected: Toast "Pago confirmado exitosamente"

- [ ] **Step 6: Verificar notificación recibida por el asesor**

1. Cerrar sesión del admin
2. Iniciar sesión nuevamente como el asesor que creó el vuelo
3. Verificar la campana de notificaciones en el navbar
4. Hacer clic para ver las notificaciones

Expected: Notificación con título "✅ Pago confirmado" y descripción mencionando el admin que aprobó

- [ ] **Step 7: Verificar que el vuelo cambió de estado**

1. Navegar a la lista de vuelos del asesor
2. Buscar el vuelo confirmado
3. Verificar que ahora esté en estado PENDIENTE_EMISION

Expected: Estado actualizado a PENDIENTE_EMISION

---

### Task 10: Probar validación de estado

**Files:**
- Test: Manual testing en entorno de desarrollo

- [ ] **Step 1: Intentar confirmar un vuelo ya emitido**

1. Como admin, navegar a un vuelo que ya esté en estado EMITIDO
2. Usar Postman o curl para intentar llamar al endpoint directamente:

```bash
curl -X PATCH http://localhost:3001/api/vuelos/[VUELO_ID_EMITIDO]/confirmar-pago \
  -H "Content-Type: application/json" \
  -d '{"userId": "[ADMIN_ID]"}'
```

Expected: Error 500 con mensaje "El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO"

- [ ] **Step 2: Intentar confirmar un vuelo cancelado**

1. Usar Postman o curl para intentar confirmar un vuelo cancelado:

```bash
curl -X PATCH http://localhost:3001/api/vuelos/[VUELO_ID_CANCELADO]/confirmar-pago \
  -H "Content-Type: application/json" \
  -d '{"userId": "[ADMIN_ID]"}'
```

Expected: Error 500 con mensaje indicando estado incorrecto

- [ ] **Step 3: Verificar que la validación no bloquea confirmaciones válidas**

1. Crear un nuevo vuelo como asesor
2. Confirmarlo como admin
3. Verificar que la confirmación funcione normalmente

Expected: Confirmación exitosa sin errores

---

### Task 11: Probar nuevo diseño card-based

**Files:**
- Test: Manual testing en entorno de desarrollo

- [ ] **Step 1: Verificar métricas en header**

1. Navegar a /admin/confirmar-pagos como admin
2. Verificar que aparezcan las 4 métricas en el header
3. Verificar que los números sean correctos

Expected: Métricas mostradas con valores correctos

- [ ] **Step 2: Verificar diseño de cards**

1. Verificar que los vuelos se muestren como cards (no tabla)
2. Verificar que el layout sea responsivo (1 columna en móvil, 2 en desktop)
3. Verificar hover effects en cards

Expected: Cards con hover shadow y border color change

- [ ] **Step 3: Verificar información en cards**

1. Verificar que se muestre: nombre cliente, ID, tiempo relativo, monto, método pago, ruta, fecha, pasajeros, estado de comprobante
2. Verificar thumbnails de comprobantes si existen
3. Verificar indicador visual cuando no hay comprobante

Expected: Toda la información relevante visible en la card

- [ ] **Step 4: Verificar acciones rápidas**

1. Hacer clic en "Ver Detalles" - debe abrir modal
2. Hacer clic en "Aprobar" - debe confirmar directamente
3. Hacer clic en ícono de advertencia - debe abrir modal de observación

Expected: Cada acción funciona correctamente

---

## Resumen de Cambios

### Backend
1. ✅ Función `notificarPagoConfirmado` en notificacionesService.js
2. ✅ Integración de notificación en endpoint de confirmación
3. ✅ Validación de estado en `confirmarPago` para evitar aprobaciones incorrectas

### Frontend
1. ✅ Helper `dateHelpers.js` con funciones de formateo reutilizables
2. ✅ Componente `PagoCard.jsx` con diseño card-based moderno
3. ✅ Componente `MetricasHeader.jsx` con métricas rápidas
4. ✅ Rediseño completo de `page.jsx` usando nuevos componentes
5. ✅ Mejora de error handling con mensajes específicos por tipo de error

### Impacto
- **Seguridad**: Validación de estado previene aprobaciones incorrectas
- **Comunicación**: Notificaciones automáticas al asesor cuando se aprueba su pago
- **UX**: Diseño card-based más visual y fácil de escanear
- **Eficiencia**: Métricas rápidas dan contexto inmediato
- **Mantenibilidad**: Helpers reutilizables reducen duplicación de código
