# Sistema de Notificación de Pagos Observados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema que permite a administradores notificar a asesores cuando un pago registrado no ha caído o es insuficiente, con notificaciones en tiempo real.

**Architecture:** Modal de observación en vista de confirmación de pagos que envía notificaciones a través del sistema existente de Supabase Realtime, sin requerir cambios en el schema de base de datos.

**Tech Stack:** Next.js, React, Supabase, Tailwind CSS, Express.js

---

## File Structure

```
Backend:
- src/routes/vuelos.js (modify) - Agregar endpoint POST /:id/observar-pago
- src/services/notificacionesService.js (modify) - Agregar notificarPagoObservado()

Frontend:
- dashboard/src/components/vuelos/ModalObservacionPago.jsx (create) - Componente modal
- dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx (modify) - Integrar modal
- dashboard/src/config/apiConfig.js (modify) - Agregar endpoint URL
- dashboard/src/components/ui/NotificacionesCampana.jsx (modify) - Agregar icono

Testing:
- Manual testing workflow
```

---

### Task 1: Backend - Agregar Endpoint de Observación

**Files:**
- Modify: `src/routes/vuelos.js`

- [ ] **Step 1: Add import for notificarPagoObservado**

```javascript
// Agregar después de línea 5
import { notificarNuevoVuelo, notificarVueloEmitido, notificarPagoObservado } from '../services/notificacionesService.js';
```

- [ ] **Step 2: Add POST endpoint for observation**

```javascript
// Agregar después de línea 260 (después del endpoint confirmar-pago)
/**
 * POST /api/vuelos/:id/observar-pago - Reportar observación en pago
 */
router.post('/:id/observar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, motivo, montoFaltante, observaciones } = req.body;

    // Validaciones básicas
    if (!adminId || !motivo || !observaciones) {
      return res.status(400).json({
        error: 'Campos requeridos: adminId, motivo, observaciones'
      });
    }

    // Validar motivo
    const motivosValidos = ['pago_no_recibido', 'monto_insuficiente', 'requiere_aclaracion'];
    if (!motivosValidos.includes(motivo)) {
      return res.status(400).json({
        error: 'Motivo inválido',
        motivosValidos
      });
    }

    // Validar observaciones mínimas
    if (observaciones.length < 20) {
      return res.status(400).json({
        error: 'Las observaciones deben tener al menos 20 caracteres'
      });
    }

    // Obtener vuelo y asesor
    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .select('id, created_by, pax_nombre, ruta, monto_venta, estado')
      .eq('id', id)
      .single();

    if (vueloError || !vuelo) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    if (vuelo.estado !== 'PENDIENTE_CONFIRMACION_PAGO') {
      return res.status(400).json({
        error: 'El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO'
      });
    }

    // Obtener nombre del admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', adminId)
      .single();

    const adminNombre = adminProfile?.full_name || 'Administrador';

    // Enviar notificación
    await notificarPagoObservado(
      vuelo,
      adminNombre,
      motivo,
      montoFaltante,
      observaciones
    );

    res.json({
      message: 'Observación registrada y notificación enviada',
      vuelo_id: id,
      asesor_id: vuelo.created_by
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/:id/observar-pago:', error);
    res.status(500).json({
      error: 'Error al registrar observación',
      details: error.message
    });
  }
});
```

- [ ] **Step 3: Commit backend changes**

```bash
git add src/routes/vuelos.js
git commit -m "feat: add endpoint for payment observation notifications"
```

---

### Task 2: Backend - Implementar Función de Notificación

**Files:**
- Modify: `src/services/notificacionesService.js`

- [ ] **Step 1: Add notificarPagoObservado function**

```javascript
// Agregar después de línea 95 (después de notificarVueloEmitido)
/**
 * Notificar al asesor sobre observación en pago de vuelo
 */
export async function notificarPagoObservado(vuelo, adminNombre, motivo, montoFaltante, observaciones) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const motivosTexto = {
      'pago_no_recibido': 'El pago aún no ha sido recibido',
      'monto_insuficiente': `Falta dinero por cubrir${montoFaltante ? `: $${montoFaltante.toFixed(2)}` : ''}`,
      'requiere_aclaracion': 'Se requiere aclaración sobre el pago'
    };

    const ruta = vuelo.ruta || 'sin ruta';
    const descripcionMotivo = motivosTexto[motivo] || motivo;

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'pago_observado',
      titulo: '¡Observación en pago de vuelo!',
      descripcion: `${adminNombre} revisó el pago del vuelo ${ruta}. ${descripcionMotivo}. ${observaciones}`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        motivo,
        monto_esperado: vuelo.monto_venta,
        monto_faltante: montoFaltante || null,
        observaciones,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        estado_vuelo: vuelo.estado,
        accion_requerida: 'Contactar al cliente para verificar el pago'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`Notificación de observación de pago enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de observación:', err.message);
  }
}
```

- [ ] **Step 2: Update exports**

```javascript
// Reemplazar líneas 97-100
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado
};
```

- [ ] **Step 3: Commit notification service changes**

```bash
git add src/services/notificacionesService.js
git commit -m "feat: implement payment observation notification function"
```

---

### Task 3: Frontend - Actualizar Configuración API

**Files:**
- Modify: `dashboard/src/config/apiConfig.js`

- [ ] **Step 1: Add observarPago endpoint**

```javascript
// Agregar después de línea 50 (después de confirmarPago)
  observarPago: (id) => buildApiUrl(`/api/vuelos/${id}/observar-pago`),
```

- [ ] **Step 2: Commit API config changes**

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "feat: add observarPago endpoint to API config"
```

---

### Task 4: Frontend - Crear Componente Modal de Observación

**Files:**
- Create: `dashboard/src/components/vuelos/ModalObservacionPago.jsx`

- [ ] **Step 1: Create modal component file**

```jsx
'use client'
import { useState } from 'react'
import { AlertTriangle, DollarSign, FileText, Send, X, Loader2 } from 'lucide-react'

export default function ModalObservacionPago({ 
  vuelo, 
  isOpen, 
  onClose, 
  onSubmit 
}) {
  const [motivo, setMotivo] = useState('')
  const [montoFaltante, setMontoFaltante] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!motivo) {
      alert('Selecciona un motivo')
      return
    }

    if (observaciones.length < 20) {
      alert('Las observaciones deben tener al menos 20 caracteres para dar contexto al asesor')
      return
    }

    if (motivo === 'monto_insuficiente' && !montoFaltante) {
      alert('Ingresa el monto faltante')
      return
    }

    setEnviando(true)
    try {
      await onSubmit({
        motivo,
        montoFaltante: montoFaltante ? parseFloat(montoFaltante) : null,
        observaciones
      })
      
      // Limpiar form
      setMotivo('')
      setMontoFaltante('')
      setObservaciones('')
      onClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setEnviando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Reportar Observación de Pago
              </h2>
              <p className="text-amber-100 text-sm">
                Vuelo {vuelo.ruta} - {vuelo.pax_nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={enviando}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info del vuelo */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Información del vuelo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-amber-700">Monto esperado:</span>
                <span className="ml-2 font-semibold text-amber-900">
                  ${vuelo.monto_venta?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-amber-700">Estado:</span>
                <span className="ml-2 font-medium text-amber-900">
                  {vuelo.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Motivo de la observación *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="pago_no_recibido"
                  checked={motivo === 'pago_no_recibido'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Pago no recibido
                  </div>
                  <div className="text-xs text-gray-500">
                    El pago aún no ha caído en la cuenta
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="monto_insuficiente"
                  checked={motivo === 'monto_insuficiente'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Monto insuficiente
                  </div>
                  <div className="text-xs text-gray-500">
                    Falta dinero para completar el pago
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="requiere_aclaracion"
                  checked={motivo === 'requiere_aclaracion'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Requiere aclaración
                  </div>
                  <div className="text-xs text-gray-500">
                    Hay inconsistencias que necesitan verificación
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Monto faltante - solo si aplica */}
          {motivo === 'monto_insuficiente' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto faltante *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoFaltante}
                  onChange={(e) => setMontoFaltante(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="0.00"
                  required
                />
              </div>
              {montoFaltante && (
                <p className="mt-2 text-sm text-amber-600">
                  Se notificará al asesor que faltan <strong>${parseFloat(montoFaltante).toFixed(2)}</strong>
                </p>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones para el asesor *
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              placeholder="Describe qué debe hacer el asesor: verificar con el cliente, solicitar nuevo comprobante, etc. (mínimo 20 caracteres)"
              required
              minLength={20}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Mínimo 20 caracteres para dar contexto claro
              </p>
              <p className={`text-xs ${observaciones.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {observaciones.length}/20
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !motivo || observaciones.length < 20}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Notificar Asesor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit modal component**

```bash
git add dashboard/src/components/vuelos/ModalObservacionPago.jsx
git commit -m "feat: create ModalObservacionPago component with gradient design"
```

---

### Task 5: Frontend - Integrar Modal en Vista de Confirmación

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx`

- [ ] **Step 1: Add imports**

```javascript
// Agregar después de línea 7
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'
import { AlertTriangle } from 'lucide-react'
```

- [ ] **Step 2: Add state for observation modal**

```javascript
// Agregar después de línea 16
  const [observacionModalOpen, setObservacionModalOpen] = useState(false)
```

- [ ] **Step 3: Add observation modal functions**

```javascript
// Agregar después de línea 89 (después de confirmarPago)
  const abrirModalObservacion = (vuelo) => {
    setSelectedVuelo(vuelo)
    setObservacionModalOpen(true)
  }

  const cerrarModalObservacion = () => {
    setObservacionModalOpen(false)
  }

  const enviarObservacion = async (datos) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      const response = await fetch(VUELOS_API.observarPago(selectedVuelo.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: user.id,
          ...datos
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar observación')
      }

      toastSuccess('Observación enviada al asesor exitosamente')
      cerrarModalObservacion()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error enviando observación:', error)
      toastError(error.message)
    }
  }
```

- [ ] **Step 4: Replace modal footer buttons**

```javascript
// Reemplazar líneas 339-363 (footer del modal) con:
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
```

- [ ] **Step 5: Add observation modal at the end**

```javascript
// Agregar después de línea 376 (antes del cierre del div principal)
        {/* Modal de Observación */}
        <ModalObservacionPago
          vuelo={selectedVuelo}
          isOpen={observacionModalOpen}
          onClose={cerrarModalObservacion}
          onSubmit={enviarObservacion}
        />
```

- [ ] **Step 6: Commit confirmation page changes**

```bash
git add dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx
git commit -m "feat: integrate observation modal in payment confirmation page"
```

---

### Task 6: Frontend - Actualizar Icono de Notificaciones

**Files:**
- Modify: `dashboard/src/components/ui/NotificacionesCampana.jsx`

- [ ] **Step 1: Add import for AlertTriangle**

```javascript
// Agregar después de línea 4
import { Bell, X, CheckCheck, Trash2, Plane, Info, AlertCircle, AlertTriangle } from 'lucide-react'
```

- [ ] **Step 2: Add pago_observado icon**

```javascript
// Reemplazar líneas 18-22 con:
function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4 text-blue-500" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4 text-green-500" />
  if (tipo === 'pago_observado') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <Info className="w-4 h-4 text-gray-400" />
}
```

- [ ] **Step 3: Commit notification icon changes**

```bash
git add dashboard/src/components/ui/NotificacionesCampana.jsx
git commit -m "feat: add observation icon to notifications"
```

---

### Task 7: Testing Manual del Flujo Completo

**Files:**
- No code files - manual testing workflow

- [ ] **Step 1: Test backend endpoint**

```bash
# Iniciar servidor backend
npm run dev

# Probar endpoint con curl (reemplazar VUELO_ID y ADMIN_ID)
curl -X POST http://localhost:4000/api/vuelos/VUELO_ID/observar-pago \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "ADMIN_ID",
    "motivo": "pago_no_recibido",
    "observaciones": "El cliente dice que hizo transferencia pero no aparece en cuenta. Por favor verificar con banco."
  }'
```

Expected: `200 OK` con mensaje "Observación registrada y notificación enviada"

- [ ] **Step 2: Test frontend modal**

```bash
# Iniciar frontend
cd dashboard
npm run dev

# Navegar a http://localhost:3000/admin/confirmar-pagos
# 1. Login como admin
# 2. Abrir detalle de vuelo pendiente
# 3. Hacer clic en "Reportar Observación"
# 4. Llenar formulario con cada tipo de motivo
# 5. Verificar validaciones (observaciones < 20 chars)
# 6. Enviar observación
```

Expected: Modal se cierra, toast de éxito, lista se recarga

- [ ] **Step 3: Test notification reception**

```bash
# En otra ventana/sesión:
# 1. Login como asesor (created_by del vuelo)
# 2. Verificar badge en campana de notificaciones
# 3. Abrir campana y ver notificación con icono ámbar
# 4. Verificar toast automático
# 5. Marcar como leída
# 6. Verificar badge actualizado
```

Expected: Notificación recibida en <5 segundos, toast visible, badge actualizado

- [ ] **Step 4: Test edge cases**

```bash
# Probar casos límite:
# 1. Motivo monto_insuficiente sin monto faltante
# 2. Observaciones con menos de 20 caracteres
# 3. Vuelo en estado diferente a PENDIENTE_CONFIRMACION_PAGO
# 4. ID de vuelo inexistente
# 5. AdminId inválido
```

Expected: Mensajes de error apropiados, validaciones funcionando

- [ ] **Step 5: Test responsive design**

```bash
# Probar en diferentes tamaños de pantalla:
# 1. Mobile (< 768px)
# 2. Tablet (768px - 1024px)
# 3. Desktop (> 1024px)
```

Expected: Modal responsive, botones accesibles, texto legible

- [ ] **Step 6: Commit final implementation**

```bash
git add .
git commit -m "feat: complete payment observation notification system

- Backend endpoint for observation reporting
- Modal component with gradient design
- Real-time notifications to advisors
- Validation and error handling
- Manual testing workflow verified

Closes: #payment-observation-notifications"
```

---

## Self-Review Checklist

**1. Spec coverage:** 
- [x] Admin can report payment observations
- [x] Three observation reasons supported
- [x] Real-time notifications to advisors
- [x] Validation for observations length
- [x] Conditional monto faltante field
- [x] Integration with existing notification system

**2. Placeholder scan:** 
- [x] No "TODO" or "TBD" found
- [x] All code steps include actual implementation
- [x] Exact file paths provided
- [x] Complete test commands with expected outputs

**3. Type consistency:**
- [x] Function names consistent across tasks
- [x] Variable names match between frontend and backend
- [x] API endpoint URL matches configuration
- [x] Modal props match component interface

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-notificacion-pagos-observados.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
