# Control de Emisiones - Interfaz Flexible con Edición Inline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la vista de Control de Emisiones en una interfaz flexible que permita visualizar toda la información crítica (método de pago, proveedor, forma de emisión) y editar cuentas de emisión inline sin salir de la vista.

**Architecture:** Sistema de componentes reutilizables con edición inline optimistic UI, nuevos endpoints REST para actualización granular, y agrupación dinámica inteligente que considera tanto cuenta_emision_asignada como metodo_pago.

**Tech Stack:** React (Next.js App Router), Supabase, Node.js/Express, TailwindCSS, Lucide Icons, SweetAlert2

---

## 🎯 Contexto del Proyecto

### Problema Actual
- La vista de Control de Emisiones solo muestra `cuenta_emision_asignada`
- No muestra `metodo_pago` ni `proveedor` del vuelo
- No permite cambiar la cuenta de emisión sin editar el vuelo completo
- Agrupación limitada que no considera el contexto completo

### Solución Propuesta
- Vista enriquecida con toda la información crítica visible
- Edición inline de `cuenta_emision_asignada` con validaciones
- Agrupación inteligente por cuenta/método de pago
- Componentes reutilizables y escalables

---

## 📋 Fases del Proyecto

### **FASE 1: Backend - Endpoints y Validaciones** ⚙️
- Nuevos endpoints REST para actualización granular
- Validaciones según forma_emision
- Endpoint de agrupación inteligente

### **FASE 2: Componentes UI - Design System** 🎨
- Componentes reutilizables con design principles
- Editor inline con estados
- Cards informativas

### **FASE 3: Integración Frontend** 🔗
- Actualización de página Control de Emisiones
- Optimistic UI y manejo de estados
- Filtros y agrupación dinámica

### **FASE 4: Testing y Refinamiento** ✅
- Testing de flujos completos
- Refinamiento UX
- Documentación

---

## FASE 1: Backend - Endpoints y Validaciones

### Task 1: Endpoint PATCH para Cambiar Cuenta de Emisión

**CHECKPOINT INICIAL:** Antes de iniciar, invocar `api-design-principles` para validar el diseño del endpoint

**Files:**
- Create: `src/routes/vuelos-emisiones.js`
- Modify: `src/server.js`
- Test: Manual con Postman/Thunder Client

- [ ] **Step 1: Invocar skill api-design-principles**

```bash
# En tu sesión de Cascade, ejecutar:
# /invoke-skill api-design-principles
```

Validar:
- Estructura del endpoint PATCH
- Formato de request/response
- Códigos de estado HTTP apropiados
- Manejo de errores

- [ ] **Step 2: Crear archivo de rutas específico para emisiones**

Create: `src/routes/vuelos-emisiones.js`

```javascript
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

/**
 * PATCH /api/vuelos-emisiones/:id/cambiar-cuenta
 * Actualizar solo cuenta_emision_asignada con validaciones
 */
router.patch('/:id/cambiar-cuenta', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, nueva_cuenta, observaciones } = req.body;

    // Validaciones de entrada
    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    if (!nueva_cuenta) {
      return res.status(400).json({
        error: 'nueva_cuenta es requerida'
      });
    }

    // Obtener el vuelo actual
    const { data: vuelo, error: fetchError } = await supabase
      .from('vuelos')
      .select('id, estado, forma_emision, cuenta_emision_asignada, autorizado_emision')
      .eq('id', id)
      .single();

    if (fetchError || !vuelo) {
      return res.status(404).json({
        error: 'Vuelo no encontrado',
        details: fetchError?.message
      });
    }

    // Validación: solo permitir si está en PENDIENTE_EMISION y no autorizado
    if (vuelo.estado !== 'PENDIENTE_EMISION') {
      return res.status(400).json({
        error: 'Solo se puede cambiar la cuenta en vuelos PENDIENTE_EMISION'
      });
    }

    if (vuelo.autorizado_emision) {
      return res.status(400).json({
        error: 'No se puede cambiar la cuenta de un vuelo ya autorizado'
      });
    }

    // Validación: Si es CONTADO y selecciona Servivuelo/Chase -> OK
    // Si es CONTADO y selecciona otros -> OK
    // Si es CREDITO y selecciona Servivuelo/Chase -> ERROR
    if (vuelo.forma_emision === 'CREDITO') {
      const cuentasContadoOnly = ['SERVIVUELO_1', 'SERVIVUELO_2', 'CHASE_NOVA', 'CHASE_APOLO'];
      if (cuentasContadoOnly.includes(nueva_cuenta)) {
        return res.status(400).json({
          error: 'Las cuentas Servivuelo y Chase solo permiten emisiones CONTADO',
          details: 'Este vuelo es a CREDITO. Seleccione otra cuenta de emisión.'
        });
      }
    }

    // Actualizar la cuenta
    const { data: vueloActualizado, error: updateError } = await supabase
      .from('vuelos')
      .update({
        cuenta_emision_asignada: nueva_cuenta,
        observaciones_emision: observaciones || vuelo.observaciones_emision,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Error al actualizar cuenta de emisión',
        details: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cuenta de emisión actualizada exitosamente',
      vuelo: vueloActualizado
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos-emisiones/:id/cambiar-cuenta:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
```

- [ ] **Step 3: Registrar la ruta en server.js**

Modify: `src/server.js`

Agregar después de las otras rutas de vuelos:

```javascript
// Rutas de emisiones (nuevo)
const vuelosEmisionesRoutes = require('./routes/vuelos-emisiones');
app.use('/api/vuelos-emisiones', vuelosEmisionesRoutes);
```

- [ ] **Step 4: Probar endpoint con Thunder Client**

Request:
```http
PATCH http://localhost:3001/api/vuelos-emisiones/{vuelo-uuid}/cambiar-cuenta
Content-Type: application/json

{
  "userId": "user-uuid",
  "nueva_cuenta": "REVOLUT_GADDIEL",
  "observaciones": "Cambio solicitado por administración"
}
```

Expected Response (200):
```json
{
  "success": true,
  "message": "Cuenta de emisión actualizada exitosamente",
  "vuelo": {
    "id": "...",
    "cuenta_emision_asignada": "REVOLUT_GADDIEL",
    "observaciones_emision": "Cambio solicitado por administración",
    "updated_at": "2026-05-08T..."
  }
}
```

Expected Error Cases:
- 400 si vuelo no está en PENDIENTE_EMISION
- 400 si vuelo ya está autorizado
- 400 si es CREDITO y selecciona Servivuelo/Chase
- 404 si vuelo no existe

- [ ] **Step 5: Commit**

```bash
git add src/routes/vuelos-emisiones.js src/server.js
git commit -m "feat(backend): agregar endpoint para cambiar cuenta de emisión

- Nuevo endpoint PATCH /api/vuelos-emisiones/:id/cambiar-cuenta
- Validaciones según forma_emision (CONTADO/CREDITO)
- Validación de estado del vuelo
- Manejo de errores completo"
```

---

### Task 2: Endpoint GET para Agrupación Inteligente

**Files:**
- Modify: `src/routes/vuelos-emisiones.js`

- [ ] **Step 1: Agregar endpoint de agrupación**

Modify: `src/routes/vuelos-emisiones.js`

Agregar al final del archivo, antes de `module.exports`:

```javascript
/**
 * GET /api/vuelos-emisiones/pendientes/agrupados
 * Obtener vuelos pendientes agrupados por cuenta_emision_asignada
 * Query params: ?incluir_detalles=true
 */
router.get('/pendientes/agrupados', async (req, res) => {
  try {
    const { incluir_detalles = 'false' } = req.query;

    // Obtener todos los vuelos pendientes de emisión
    const { data: vuelos, error: fetchError } = await supabase
      .from('vuelos')
      .select(`
        id,
        pax_nombre,
        ruta,
        fecha_vuelo,
        localizador,
        proveedor,
        monto_venta,
        metodo_pago,
        forma_emision,
        cuenta_emision_original,
        cuenta_emision_asignada,
        autorizado_emision,
        observaciones_emision,
        created_at,
        pasajeros:vuelos_pasajeros(id, nombre, precio),
        adjuntos:vuelos_adjuntos(id, tipo_adjunto, url_storage)
      `)
      .eq('estado', 'PENDIENTE_EMISION')
      .eq('autorizado_emision', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return res.status(500).json({
        error: 'Error al obtener vuelos',
        details: fetchError.message
      });
    }

    // Agrupar por cuenta_emision_asignada
    const grupos = {};
    
    vuelos.forEach(vuelo => {
      const cuenta = vuelo.cuenta_emision_asignada || 'SIN_CUENTA';
      
      if (!grupos[cuenta]) {
        grupos[cuenta] = {
          vuelos: [],
          total_vuelos: 0,
          total_monto: 0,
          forma_emision: {
            CONTADO: 0,
            CREDITO: 0
          }
        };
      }

      grupos[cuenta].vuelos.push(vuelo);
      grupos[cuenta].total_vuelos += 1;
      grupos[cuenta].total_monto += parseFloat(vuelo.monto_venta || 0);
      
      if (vuelo.forma_emision === 'CONTADO') {
        grupos[cuenta].forma_emision.CONTADO += 1;
      } else if (vuelo.forma_emision === 'CREDITO') {
        grupos[cuenta].forma_emision.CREDITO += 1;
      }
    });

    // Calcular totales generales
    const total_general = vuelos.length;
    const monto_general = vuelos.reduce((sum, v) => sum + parseFloat(v.monto_venta || 0), 0);

    return res.status(200).json({
      success: true,
      grupos,
      total_general,
      monto_general: parseFloat(monto_general.toFixed(2))
    });

  } catch (error) {
    console.error('Error en GET /api/vuelos-emisiones/pendientes/agrupados:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});
```

- [ ] **Step 2: Probar endpoint de agrupación**

Request:
```http
GET http://localhost:3001/api/vuelos-emisiones/pendientes/agrupados
```

Expected Response (200):
```json
{
  "success": true,
  "grupos": {
    "CHASE_NOVA": {
      "vuelos": [ /* array de vuelos */ ],
      "total_vuelos": 5,
      "total_monto": 4250.00,
      "forma_emision": {
        "CONTADO": 5,
        "CREDITO": 0
      }
    },
    "REVOLUT_GADDIEL": {
      "vuelos": [ /* array */ ],
      "total_vuelos": 3,
      "total_monto": 2100.00,
      "forma_emision": {
        "CONTADO": 2,
        "CREDITO": 1
      }
    }
  },
  "total_general": 8,
  "monto_general": 6350.00
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/vuelos-emisiones.js
git commit -m "feat(backend): agregar endpoint de agrupación inteligente

- Nuevo endpoint GET /api/vuelos-emisiones/pendientes/agrupados
- Agrupa vuelos por cuenta_emision_asignada
- Incluye métricas agregadas (total vuelos, monto, forma_emision)
- Incluye todos los datos necesarios para la UI"
```

---

### Task 3: Actualizar Configuración de API en Frontend

**Files:**
- Modify: `dashboard/src/config/apiConfig.js`

- [ ] **Step 1: Agregar endpoints de emisiones a configuración**

Modify: `dashboard/src/config/apiConfig.js`

Agregar en la sección correspondiente:

```javascript
// Emisiones
export const EMISIONES_API = {
  cambiarCuenta: (vueloId) => `${API_BASE_URL}/vuelos-emisiones/${vueloId}/cambiar-cuenta`,
  pendientesAgrupados: () => `${API_BASE_URL}/vuelos-emisiones/pendientes/agrupados`,
  autorizarEmision: (vueloId) => `${API_BASE_URL}/vuelos/${vueloId}/autorizar-emision`,
  autorizarBatch: () => `${API_BASE_URL}/vuelos/autorizar-emision-batch`
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "config(frontend): agregar endpoints de emisiones a configuración"
```

---

**CHECKPOINT FASE 1:** Invocar `code-review-excellence` para revisar todo el código backend antes de continuar a Fase 2

---

## FASE 2: Componentes UI - Design System

### Task 4: Componente InlineAccountEditor

**CHECKPOINT INICIAL:** Invocar `interface-design` para validar el diseño del componente de edición inline

**Files:**
- Create: `dashboard/src/components/admin/InlineAccountEditor.jsx`

- [ ] **Step 1: Invocar skill interface-design**

```bash
# Validar:
# - Diseño del componente de edición inline
# - Estados visuales (default, editing, saving, error)
# - Paleta de colores según contexto financiero
# - Jerarquía de información
```

- [ ] **Step 2: Crear componente InlineAccountEditor**

Create: `dashboard/src/components/admin/InlineAccountEditor.jsx`

```jsx
'use client'
import { useState } from 'react'
import { Save, X, AlertCircle } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { EMISIONES_API } from '@/config/apiConfig'

const CUENTAS_EMISION = [
  { value: 'SERVIVUELO_1', label: 'Servivuelo 1 (Grupo Travel)', soloContado: true },
  { value: 'SERVIVUELO_2', label: 'Servivuelo 2 (Arcadia)', soloContado: true },
  { value: 'CHASE_NOVA', label: 'Chase Nova', soloContado: true },
  { value: 'CHASE_APOLO', label: 'Chase Apolo', soloContado: true },
  { value: 'KIU_ESTELAR_ARCADIA', label: 'KIU Estelar Arcadia', soloContado: false },
  { value: 'KIU_LASER_ARCADIA', label: 'KIU Laser Arcadia', soloContado: false },
  { value: 'SABRE', label: 'Sabre', soloContado: false },
  { value: 'AMADEUS', label: 'Amadeus', soloContado: false },
  { value: 'EXPEDIA', label: 'Expedia', soloContado: false },
  { value: 'KIWI', label: 'Kiwi', soloContado: false },
  { value: 'REVOLUT_GADDIEL', label: 'Revolut Gaddiel', soloContado: false },
  { value: 'REVOLUT_GRUPO_TRAVEL', label: 'Revolut Grupo Travel', soloContado: false }
]

export default function InlineAccountEditor({ 
  vueloId, 
  cuentaActual, 
  formaEmision,
  userId,
  onSave, 
  onCancel 
}) {
  const [nuevaCuenta, setNuevaCuenta] = useState(cuentaActual || '')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filtrar cuentas según forma_emision
  const cuentasDisponibles = CUENTAS_EMISION.filter(cuenta => {
    if (formaEmision === 'CREDITO') {
      return !cuenta.soloContado
    }
    return true // CONTADO puede usar todas
  })

  const handleGuardar = async () => {
    if (!nuevaCuenta) {
      setError('Debe seleccionar una cuenta')
      return
    }

    if (nuevaCuenta === cuentaActual) {
      toastError('La cuenta seleccionada es la misma que la actual')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(EMISIONES_API.cambiarCuenta(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          nueva_cuenta: nuevaCuenta,
          observaciones
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar cuenta')
      }

      toastSuccess(`Cuenta actualizada a ${cuentasDisponibles.find(c => c.value === nuevaCuenta)?.label}`)
      onSave(data.vuelo)

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      toastError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-3 animate-in slide-in-from-top duration-200">
      <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
        ✏️ Cambiar Cuenta de Emisión
      </h4>

      {/* Cuenta Actual */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">Cuenta Actual</label>
        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 font-medium">
          {CUENTAS_EMISION.find(c => c.value === cuentaActual)?.label || cuentaActual}
        </div>
      </div>

      {/* Nueva Cuenta */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">
          Nueva Cuenta {formaEmision === 'CREDITO' && <span className="text-amber-600">(Solo cuentas a crédito)</span>}
        </label>
        <select
          value={nuevaCuenta}
          onChange={(e) => setNuevaCuenta(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          disabled={saving}
        >
          <option value="">Seleccionar cuenta...</option>
          {cuentasDisponibles.map(cuenta => (
            <option key={cuenta.value} value={cuenta.value}>
              {cuenta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Observaciones */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">Observaciones (opcional)</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Motivo del cambio..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
          rows={2}
          disabled={saving}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={handleGuardar}
          disabled={saving || !nuevaCuenta}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambio
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/admin/InlineAccountEditor.jsx
git commit -m "feat(ui): crear componente InlineAccountEditor

- Editor inline para cambiar cuenta_emision_asignada
- Validación según forma_emision (filtrado dinámico)
- Estados: default, saving, error
- Optimistic UI con feedback visual
- Integración con API de emisiones"
```

---

### Task 5: Componente EmisionVueloCard

**CHECKPOINT INICIAL:** Invocar `frontend-design` para validar el diseño visual de la card

**Files:**
- Create: `dashboard/src/components/admin/EmisionVueloCard.jsx`

- [ ] **Step 1: Invocar skill frontend-design**

```bash
# Validar:
# - Diseño visual de la card con toda la información
# - Jerarquía visual de elementos
# - Estados de hover, expanded, editing
# - Paleta de colores distintiva (no genérica)
# - Badges para forma_emision
```

- [ ] **Step 2: Crear componente EmisionVueloCard**

Create: `dashboard/src/components/admin/EmisionVueloCard.jsx`

```jsx
'use client'
import { useState } from 'react'
import { 
  Eye, 
  CheckCircle, 
  CreditCard, 
  Package, 
  Zap, 
  Edit2,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react'
import { formatearFechaCorta } from '@/helpers/dateHelpers'
import InlineAccountEditor from './InlineAccountEditor'

export default function EmisionVueloCard({ 
  vuelo, 
  userId,
  onCuentaChanged,
  onAutorizar, 
  onVerDetalles 
}) {
  const [isEditingCuenta, setIsEditingCuenta] = useState(false)

  const handleCuentaGuardada = (vueloActualizado) => {
    setIsEditingCuenta(false)
    onCuentaChanged(vueloActualizado)
  }

  // Determinar color según forma_emision
  const formaEmisionColor = vuelo.forma_emision === 'CONTADO' 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-amber-100 text-amber-800 border-amber-200'

  const formaEmisionIcon = vuelo.forma_emision === 'CONTADO' ? '💵' : '📋'

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Header: Info Principal */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {vuelo.pax_nombre}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                {vuelo.localizador || 'Sin LOC'}
              </code>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">{vuelo.ruta}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${parseFloat(vuelo.monto_venta || 0).toFixed(2)}
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${formaEmisionColor}`}>
              <span>{formaEmisionIcon}</span>
              {vuelo.forma_emision || 'N/A'}
            </span>
          </div>
        </div>

        {/* Ruta y Fecha */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500 text-xs block">Fecha vuelo</span>
              <p className="font-medium text-gray-900">{formatearFechaCorta(vuelo.fecha_vuelo)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500 text-xs block">Pasajeros</span>
              <p className="font-medium text-gray-900">{vuelo.pasajeros?.length || 0} PAX</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Detalles Clave */}
      <div className="p-5 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-4">
          {/* Método de Pago */}
          <div className="flex items-start gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Método Pago Cliente</span>
              <p className="text-sm font-semibold text-gray-900">{vuelo.metodo_pago || 'N/A'}</p>
            </div>
          </div>

          {/* Proveedor */}
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Proveedor Reserva</span>
              <p className="text-sm font-semibold text-gray-900">{vuelo.proveedor || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cuenta Section: Editable */}
      <div className="p-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Cuenta de Emisión Asignada</span>
            <p className="text-sm font-bold text-indigo-900">{vuelo.cuenta_emision_asignada || 'Sin asignar'}</p>
          </div>
          {!isEditingCuenta && (
            <button 
              onClick={() => setIsEditingCuenta(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        {vuelo.cuenta_emision_original && vuelo.cuenta_emision_original !== vuelo.cuenta_emision_asignada && (
          <p className="text-xs text-gray-500">
            Original: <span className="font-medium">{vuelo.cuenta_emision_original}</span>
          </p>
        )}

        {/* Editor Inline */}
        {isEditingCuenta && (
          <InlineAccountEditor
            vueloId={vuelo.id}
            cuentaActual={vuelo.cuenta_emision_asignada}
            formaEmision={vuelo.forma_emision}
            userId={userId}
            onSave={handleCuentaGuardada}
            onCancel={() => setIsEditingCuenta(false)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 flex gap-2 border-t border-gray-100">
        <button
          onClick={() => onAutorizar(vuelo.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar Emisión
        </button>
        <button
          onClick={() => onVerDetalles(vuelo)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Ver Detalles
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/admin/EmisionVueloCard.jsx
git commit -m "feat(ui): crear componente EmisionVueloCard

- Card completa con toda la información del vuelo
- Muestra método_pago, proveedor, forma_emision
- Integración con InlineAccountEditor
- Estados visuales distintivos según forma_emision
- Acciones: aprobar y ver detalles"
```

---

**CHECKPOINT FASE 2:** Invocar `interface-design` para revisar coherencia del design system antes de continuar

---

## FASE 3: Integración Frontend

### Task 6: Actualizar Vista de Control de Emisiones

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx`

- [ ] **Step 1: Reemplazar implementación actual con nueva arquitectura**

Modify: `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx`

Reemplazar contenido completo:

```jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { Package, Filter } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { EMISIONES_API } from '@/config/apiConfig'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
import EmisionVueloCard from '@/components/admin/EmisionVueloCard'
import VueloDetail from '@/components/vuelos/VueloDetail'

export default function ControlEmisionesPage() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null)
  const [filtroFormaEmision, setFiltroFormaEmision] = useState('TODOS')

  // Cargar vuelos pendientes agrupados
  const cargarVuelos = async () => {
    setLoading(true)
    try {
      const response = await fetch(EMISIONES_API.pendientesAgrupados())
      if (!response.ok) throw new Error('Error cargando vuelos')

      const data = await response.json()
      setDatos(data)
    } catch (error) {
      console.error('Error:', error)
      toastError('Error cargando vuelos pendientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      cargarVuelos()
    }
  }, [user])

  // Filtrar grupos según forma_emision
  const gruposFiltrados = useMemo(() => {
    if (!datos?.grupos) return {}

    if (filtroFormaEmision === 'TODOS') {
      return datos.grupos
    }

    const filtrados = {}
    Object.entries(datos.grupos).forEach(([cuenta, grupo]) => {
      const vuelosFiltrados = grupo.vuelos.filter(
        v => v.forma_emision === filtroFormaEmision
      )
      if (vuelosFiltrados.length > 0) {
        filtrados[cuenta] = {
          ...grupo,
          vuelos: vuelosFiltrados,
          total_vuelos: vuelosFiltrados.length,
          total_monto: vuelosFiltrados.reduce((sum, v) => sum + parseFloat(v.monto_venta || 0), 0)
        }
      }
    })
    return filtrados
  }, [datos, filtroFormaEmision])

  const handleCuentaChanged = (vueloActualizado) => {
    // Optimistic UI: Actualizar en el estado local
    cargarVuelos() // Recargar para obtener agrupación actualizada
  }

  const handleAutorizar = async (vueloId) => {
    try {
      const response = await fetch(EMISIONES_API.autorizarEmision(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          cuenta_emision_asignada: datos.grupos[Object.keys(datos.grupos).find(k => 
            datos.grupos[k].vuelos.some(v => v.id === vueloId)
          )].vuelos.find(v => v.id === vueloId).cuenta_emision_asignada
        })
      })

      if (!response.ok) throw new Error('Error al autorizar')

      toastSuccess('Emisión autorizada exitosamente')
      cargarVuelos()
    } catch (error) {
      console.error('Error:', error)
      toastError(error.message)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando vuelos pendientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Control de Emisiones</h1>
              </div>
              <p className="text-gray-600">
                {datos?.total_general || 0} vuelos pendientes de autorización
              </p>
            </div>

            {/* Filtro Forma Emisión */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filtroFormaEmision}
                onChange={(e) => setFiltroFormaEmision(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="TODOS">Todas las formas</option>
                <option value="CONTADO">Solo CONTADO</option>
                <option value="CREDITO">Solo CREDITO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <AdminFinanceNav />

        {/* Grupos de Vuelos */}
        {Object.keys(gruposFiltrados).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay vuelos pendientes
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido autorizados
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(gruposFiltrados)
              .sort(([, a], [, b]) => b.total_vuelos - a.total_vuelos)
              .map(([cuenta, grupo]) => (
                <div key={cuenta} className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* Header del Grupo */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{cuenta.replace(/_/g, ' ')}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {grupo.total_vuelos} vuelos • ${grupo.total_monto.toFixed(2)} total
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {grupo.forma_emision.CONTADO > 0 && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                          💵 {grupo.forma_emision.CONTADO} Contado
                        </span>
                      )}
                      {grupo.forma_emision.CREDITO > 0 && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                          📋 {grupo.forma_emision.CREDITO} Crédito
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cards de Vuelos */}
                  <div className="grid grid-cols-1 gap-4">
                    {grupo.vuelos.map(vuelo => (
                      <EmisionVueloCard
                        key={vuelo.id}
                        vuelo={vuelo}
                        userId={user.id}
                        onCuentaChanged={handleCuentaChanged}
                        onAutorizar={handleAutorizar}
                        onVerDetalles={setVueloSeleccionado}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {vueloSeleccionado && (
        <VueloDetail
          vuelo={vueloSeleccionado}
          onClose={() => setVueloSeleccionado(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Probar la nueva vista**

Verificar:
1. Navegación a `/admin/control-emisiones`
2. Carga de vuelos agrupados correctamente
3. Filtro por forma_emision funciona
4. Click en "Editar" abre InlineAccountEditor
5. Cambio de cuenta se guarda y recarga
6. Click en "Aprobar" autoriza el vuelo
7. Click en "Ver Detalles" abre modal

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/control-emisiones/page.jsx
git commit -m "feat(frontend): rediseñar vista de Control de Emisiones

- Nueva arquitectura con EmisionVueloCard
- Muestra método_pago, proveedor, forma_emision
- Edición inline de cuenta_emision_asignada
- Filtro dinámico por forma_emision
- Agrupación inteligente con métricas
- Optimistic UI en actualizaciones"
```

---

**CHECKPOINT FASE 3:** Invocar `frontend-design` para revisar la integración completa y coherencia visual

---

## FASE 4: Testing y Refinamiento

### Task 7: Testing de Flujos Completos

**Files:**
- Create: `docs/testing/control-emisiones-test-cases.md`

- [ ] **Step 1: Documentar casos de prueba**

Create: `docs/testing/control-emisiones-test-cases.md`

```markdown
# Casos de Prueba - Control de Emisiones

## Flujo 1: Cambiar Cuenta de Emisión (CONTADO)
1. Crear vuelo de prueba: CONTADO, cuenta_emision_asignada = SABRE
2. Navegar a /admin/control-emisiones
3. Encontrar el vuelo en el grupo "SABRE"
4. Click en "Editar" en la sección de cuenta
5. Seleccionar "Servivuelo 1" del dropdown
6. Escribir observación: "Cambio para pruebas"
7. Click en "Guardar Cambio"
8. Verificar:
   - Toast success aparece
   - Vuelo desaparece del grupo "SABRE"
   - Vuelo aparece en grupo "SERVIVUELO_1"
   - cuenta_emision_asignada actualizada en BD

## Flujo 2: Validación CREDITO → Servivuelo (Error)
1. Crear vuelo de prueba: CREDITO, cuenta_emision_asignada = SABRE
2. Navegar a /admin/control-emisiones
3. Click en "Editar"
4. Verificar: Dropdown NO muestra opciones Servivuelo/Chase
5. Intentar vía API directa (bypass):
   ```
   PATCH /api/vuelos-emisiones/{id}/cambiar-cuenta
   { nueva_cuenta: "SERVIVUELO_1" }
   ```
6. Verificar: Response 400 con error "solo permiten CONTADO"

## Flujo 3: Autorización Masiva
1. Seleccionar 3 vuelos del mismo grupo
2. Click en "Aprobar Emisión" en cada uno
3. Verificar:
   - Autorizaciones se procesan
   - Vuelos desaparecen de la vista
   - Contador de pendientes se actualiza

## Flujo 4: Filtros Dinámicos
1. Vista con vuelos CONTADO y CREDITO mezclados
2. Seleccionar filtro "Solo CONTADO"
3. Verificar: Solo grupos con vuelos CONTADO visibles
4. Seleccionar filtro "Solo CREDITO"
5. Verificar: Solo grupos con vuelos CREDITO visibles

## Edge Cases
- Vuelo sin cuenta_emision_asignada (NULL)
- Vuelo ya autorizado (no debe aparecer)
- Vuelo con estado != PENDIENTE_EMISION
- Cambio de cuenta durante autorización concurrente
```

- [ ] **Step 2: Ejecutar casos de prueba manualmente**

Para cada flujo documentado:
1. Ejecutar paso a paso
2. Documentar resultados
3. Si hay bug, crear issue y corregir

- [ ] **Step 3: Commit documentación**

```bash
git add docs/testing/control-emisiones-test-cases.md
git commit -m "docs: agregar casos de prueba de Control de Emisiones"
```

---

### Task 8: Refinamiento UX

**CHECKPOINT:** Invocar `interface-design` para crítica final de la implementación

**Files:**
- Modify: `dashboard/src/components/admin/EmisionVueloCard.jsx`
- Modify: `dashboard/src/components/admin/InlineAccountEditor.jsx`

- [ ] **Step 1: Invocar skill interface-design con comando /critique**

```bash
# Ejecutar crítica sobre los componentes implementados
# Identificar defaulting en diseño
# Revisar paleta de colores, spacing, typography
```

- [ ] **Step 2: Aplicar mejoras identificadas**

Basado en la crítica del skill, aplicar refinamientos:
- Ajustar spacing según sistema
- Refinar colores si hay defaulting
- Mejorar transiciones y animaciones
- Pulir estados de hover/focus

- [ ] **Step 3: Agregar animaciones suaves**

Modify: `dashboard/src/components/admin/EmisionVueloCard.jsx`

Agregar en el return principal:

```jsx
// Agregar clase de animación al contenedor principal
<div className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
```

- [ ] **Step 4: Commit refinamientos**

```bash
git add dashboard/src/components/admin/EmisionVueloCard.jsx dashboard/src/components/admin/InlineAccountEditor.jsx
git commit -m "refactor(ui): refinamientos UX según interface-design critique

- Ajustes de spacing según sistema
- Animaciones suaves en entrada
- Mejoras en estados hover/focus
- Paleta de colores refinada"
```

---

### Task 9: Documentación Final

**Files:**
- Create: `docs/features/control-emisiones-flexible.md`

- [ ] **Step 1: Crear documentación de feature**

Create: `docs/features/control-emisiones-flexible.md`

```markdown
# Control de Emisiones - Interfaz Flexible

## Descripción
Vista administrativa que permite visualizar y gestionar vuelos pendientes de autorización con capacidad de edición inline de cuentas de emisión.

## Características

### Visualización Completa
- **Método de Pago**: Cómo pagó el cliente
- **Proveedor**: Plataforma de reserva (Sabre, Servivuelo, etc.)
- **Forma de Emisión**: CONTADO o CREDITO con badges visuales
- **Cuenta Original vs Asignada**: Trazabilidad de cambios

### Edición Inline
- Cambiar `cuenta_emision_asignada` sin salir de la vista
- Validaciones dinámicas según `forma_emision`
- Observaciones opcionales para auditoría
- Optimistic UI con feedback inmediato

### Agrupación Inteligente
- Grupos por `cuenta_emision_asignada`
- Métricas agregadas (total vuelos, monto, distribución CONTADO/CREDITO)
- Filtros dinámicos por forma de emisión

## Endpoints

### PATCH /api/vuelos-emisiones/:id/cambiar-cuenta
Actualizar cuenta de emisión asignada

**Request:**
```json
{
  "userId": "uuid",
  "nueva_cuenta": "REVOLUT_GADDIEL",
  "observaciones": "Cambio solicitado por administración"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cuenta de emisión actualizada exitosamente",
  "vuelo": { ... }
}
```

**Validaciones:**
- Solo vuelos en `PENDIENTE_EMISION`
- Solo vuelos no autorizados
- CREDITO no puede usar Servivuelo/Chase

### GET /api/vuelos-emisiones/pendientes/agrupados
Obtener vuelos agrupados por cuenta

**Response 200:**
```json
{
  "grupos": {
    "CHASE_NOVA": {
      "vuelos": [...],
      "total_vuelos": 5,
      "total_monto": 4250.00,
      "forma_emision": { "CONTADO": 5, "CREDITO": 0 }
    }
  },
  "total_general": 8,
  "monto_general": 6350.00
}
```

## Componentes

### EmisionVueloCard
Card completa con información del vuelo y acciones

**Props:**
- `vuelo`: Objeto con datos del vuelo
- `userId`: ID del usuario actual
- `onCuentaChanged`: Callback al cambiar cuenta
- `onAutorizar`: Callback al aprobar
- `onVerDetalles`: Callback al ver detalles

### InlineAccountEditor
Editor inline para cambiar cuenta de emisión

**Props:**
- `vueloId`: UUID del vuelo
- `cuentaActual`: Cuenta actual asignada
- `formaEmision`: CONTADO o CREDITO
- `userId`: ID del usuario
- `onSave`: Callback al guardar
- `onCancel`: Callback al cancelar

## Flujos de Usuario

### Cambiar Cuenta de Emisión
1. Usuario ve vuelo en grupo actual
2. Click en "Editar" en sección de cuenta
3. Card expande `InlineAccountEditor`
4. Selecciona nueva cuenta del dropdown (filtrado según forma_emision)
5. Opcionalmente escribe observación
6. Click en "Guardar Cambio"
7. Optimistic UI actualiza inmediatamente
8. Backend valida y confirma
9. Vuelo se reagrupa automáticamente

### Aprobar Emisión
1. Usuario revisa información completa del vuelo
2. Confirma que cuenta asignada es correcta
3. Click en "Aprobar Emisión"
4. Vuelo se marca como autorizado
5. Desaparece de la vista de pendientes

## Validaciones

### Frontend
- Campo `nueva_cuenta` requerido
- Dropdown dinámico según `forma_emision`
- Deshabilitar botones durante guardado

### Backend
- Estado debe ser `PENDIENTE_EMISION`
- No puede estar autorizado previamente
- CREDITO no puede usar cuentas solo-contado
- UserId válido y con permisos

## Seguridad
- Solo roles: administracion, admin, super_admin
- Validación de permisos en backend
- Auditoría de cambios en `observaciones_emision`

## Performance
- Agrupación en backend (evitar N queries)
- Optimistic UI reduce latencia percibida
- Lazy loading de detalles de vuelo
```

- [ ] **Step 2: Commit documentación**

```bash
git add docs/features/control-emisiones-flexible.md
git commit -m "docs: agregar documentación completa de Control de Emisiones

- Descripción de características
- Endpoints y contratos API
- Componentes y props
- Flujos de usuario
- Validaciones y seguridad"
```

---

### Task 10: Checkpoint Final

**CHECKPOINT FINAL:** Invocar `code-review-excellence` para revisión completa del proyecto

- [ ] **Step 1: Invocar skill code-review-excellence**

```bash
# Revisar:
# - Arquitectura general del proyecto
# - Calidad de código backend
# - Calidad de código frontend
# - Patrones de diseño aplicados
# - Seguridad y validaciones
# - Testing coverage
# - Documentación
```

- [ ] **Step 2: Aplicar recomendaciones finales**

Basado en la revisión:
- Corregir issues críticos identificados
- Refactorizar código según best practices
- Agregar tests faltantes
- Mejorar documentación

- [ ] **Step 3: Commit final**

```bash
git add .
git commit -m "refactor: aplicar recomendaciones de code-review final

- Correcciones según revisión de code-review-excellence
- Mejoras de seguridad
- Refactorizaciones de código
- Tests adicionales"
```

---

## 🎯 Resumen de Fases

| Fase | Descripción | Checkpoints | Resultado |
|------|-------------|-------------|-----------|
| **1** | Backend - Endpoints | api-design-principles, code-review-excellence | 2 endpoints REST funcionales con validaciones |
| **2** | Componentes UI | interface-design, frontend-design | 2 componentes reutilizables con design system |
| **3** | Integración | frontend-design | Vista completa funcional |
| **4** | Testing | interface-design, code-review-excellence | Feature completa, testeada, documentada |

## ✅ Criterios de Aceptación

- [ ] Usuario puede ver método_pago, proveedor, forma_emision en cada vuelo
- [ ] Usuario puede cambiar cuenta_emision_asignada inline
- [ ] Validaciones funcionan según forma_emision
- [ ] Agrupación dinámica muestra métricas correctas
- [ ] Filtros funcionan correctamente
- [ ] Optimistic UI actualiza inmediatamente
- [ ] Todos los endpoints responden correctamente
- [ ] Documentación completa
- [ ] Tests manuales ejecutados
- [ ] Code review aprobado

---

**Plan completo y guardado. Listo para ejecución.**
