# 📋 Plan de Implementación: Sistema de Notificación de Observaciones de Pago

**Feature:** Notificar asesores sobre pagos observados desde vista de confirmación  
**Fecha:** 9 de Abril, 2026  
**Complejidad:** Media  
**Tiempo estimado:** 4-6 horas

---

## 🎯 Objetivo

Permitir que administradores notifiquen a asesores cuando:
- El pago registrado no ha caído en cuenta
- El monto recibido es menor al esperado
- Se requiere aclaración adicional

---

## 🏗️ Arquitectura de la Solución

### Componentes Nuevos

```
Backend:
└── src/
    ├── routes/vuelos.js
    │   └── POST /api/vuelos/:id/observar-pago        [NUEVO]
    └── services/notificacionesService.js
        └── notificarPagoObservado()                   [NUEVO]

Frontend:
└── dashboard/src/
    ├── components/vuelos/
    │   └── ModalObservacionPago.jsx                   [NUEVO]
    └── config/apiConfig.js
        └── VUELOS_API.observarPago()                  [NUEVO]
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│  Admin abre modal de detalle de vuelo                       │
│  Estado: PENDIENTE_CONFIRMACION_PAGO                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin hace clic en "Reportar Observación"                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Se abre ModalObservacionPago                               │
│  - Selecciona motivo                                        │
│  - Ingresa monto faltante (opcional)                        │
│  - Escribe observaciones                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/vuelos/:id/observar-pago                         │
│  Body: {                                                    │
│    adminId: uuid,                                           │
│    motivo: 'pago_no_recibido' | 'monto_insuficiente',      │
│    montoFaltante: number?,                                  │
│    observaciones: string                                    │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend:                                                    │
│  1. Valida permisos (solo admin)                           │
│  2. Obtiene vuelo y created_by (asesor)                    │
│  3. Inserta notificación en tabla notificaciones           │
│  4. Opcionalmente registra en historial                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Realtime dispara evento INSERT                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  NotificacionesContext (Asesor) recibe notificación         │
│  - Actualiza estado                                         │
│  - Muestra toast                                            │
│  - Badge en campana                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Cambios en Base de Datos

### Opción 1: Sin Cambios de Schema (Más rápido)

Usar tabla `notificaciones` existente con `datos` jsonb:

```sql
-- No requiere migración, solo insertar con estructura específica
INSERT INTO notificaciones (user_id, tipo, titulo, descripcion, datos)
VALUES (
  'asesor-uuid',
  'pago_observado',
  '⚠️ Observación en pago de vuelo',
  'El admin reportó que el pago...',
  '{
    "vuelo_id": "uuid",
    "motivo": "pago_no_recibido",
    "monto_faltante": 150.00,
    "observaciones": "...",
    "monto_esperado": 1500.00,
    "admin_nombre": "...",
    "ruta": "LIM-MIA"
  }'
);
```

### Opción 2: Con Nueva Tabla (Más robusto)

```sql
CREATE TABLE vuelos_observaciones_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID NOT NULL REFERENCES vuelos(id),
  observado_por UUID NOT NULL REFERENCES profiles(id),
  observado_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  motivo TEXT NOT NULL CHECK (motivo IN ('pago_no_recibido', 'monto_insuficiente', 'requiere_aclaracion')),
  monto_esperado NUMERIC NOT NULL,
  monto_recibido NUMERIC,
  monto_faltante NUMERIC,
  observaciones TEXT NOT NULL,
  resuelto BOOLEAN DEFAULT false,
  resuelto_at TIMESTAMP WITH TIME ZONE,
  resuelto_por UUID REFERENCES profiles(id)
);

CREATE INDEX idx_vuelos_observaciones_vuelo ON vuelos_observaciones_pago(vuelo_id);
CREATE INDEX idx_vuelos_observaciones_resuelto ON vuelos_observaciones_pago(resuelto);
```

**Recomendación:** Empezar con Opción 1 (sin migración), evaluar Opción 2 si se necesita reporting complejo.

---

## 💻 Implementación Backend

### 1. Nuevo Endpoint en `src/routes/vuelos.js`

```javascript
/**
 * POST /api/vuelos/:id/observar-pago - Reportar observación en pago
 */
router.post('/:id/observar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, motivo, montoFaltante, observaciones } = req.body;

    // Validaciones
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

    // TODO: Validar que adminId sea realmente admin
    // const { data: admin } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', adminId)
    //   .single();
    // if (!['admin', 'super_admin'].includes(admin?.role)) {
    //   return res.status(403).json({ error: 'No autorizado' });
    // }

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

### 2. Nueva Función en `src/services/notificacionesService.js`

```javascript
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
      titulo: '⚠️ Observación en pago de vuelo',
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
    console.log(`✅ Notificación de observación de pago enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de observación:', err.message);
  }
}
```

### 3. Actualizar Exports en `notificacionesService.js`

```javascript
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado  // AGREGAR
};
```

---

## 🎨 Implementación Frontend

### 1. Actualizar `dashboard/src/config/apiConfig.js`

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  confirmarPago: (id) => buildApiUrl(`/api/vuelos/${id}/confirmar-pago`),
  observarPago: (id) => buildApiUrl(`/api/vuelos/${id}/observar-pago`),  // NUEVO
  marcarEmitido: (id) => buildApiUrl(`/api/vuelos/${id}/marcar-emitido`),
  // ... resto
}
```

### 2. Crear Componente `dashboard/src/components/vuelos/ModalObservacionPago.jsx`

**Diseño basado en Interface Design principles:**

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

### 3. Modificar `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx`

**Cambios necesarios:**

```jsx
// IMPORTS - Agregar al inicio
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'

// ESTADO - Agregar después de línea 16
const [observacionModalOpen, setObservacionModalOpen] = useState(false)

// FUNCIÓN - Agregar después de confirmarPago (línea 89)
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

// UI - Modificar el footer del modal (línea 339)
// Reemplazar:
<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-4 justify-end">
  <button
    onClick={cerrarModal}
    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
  >
    Cancelar
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

// Por:
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

// AGREGAR AL FINAL - Antes del cierre del div principal (después de línea 376)
{/* Modal de Observación */}
<ModalObservacionPago
  vuelo={selectedVuelo}
  isOpen={observacionModalOpen}
  onClose={cerrarModalObservacion}
  onSubmit={enviarObservacion}
/>
```

### 4. Actualizar Icono en `NotificacionesCampana.jsx`

```jsx
// Línea 18-22
function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4 text-blue-500" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4 text-green-500" />
  if (tipo === 'pago_observado') return <AlertTriangle className="w-4 h-4 text-amber-500" />  // NUEVO
  return <Info className="w-4 h-4 text-gray-400" />
}
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Agregar endpoint `POST /api/vuelos/:id/observar-pago` en `src/routes/vuelos.js`
- [ ] Crear función `notificarPagoObservado()` en `src/services/notificacionesService.js`
- [ ] Actualizar exports del servicio
- [ ] Importar `notificarPagoObservado` en routes
- [ ] (Opcional) Agregar validación de permisos middleware

### Frontend
- [ ] Crear componente `ModalObservacionPago.jsx`
- [ ] Actualizar `apiConfig.js` con nuevo endpoint
- [ ] Modificar `confirmar-pagos/page.jsx` para integrar modal
- [ ] Actualizar iconos en `NotificacionesCampana.jsx`
- [ ] Agregar import de `AlertTriangle` donde falta

### Testing Manual
- [ ] Login como admin
- [ ] Ir a /admin/confirmar-pagos
- [ ] Abrir detalle de vuelo pendiente
- [ ] Hacer clic en "Reportar Observación"
- [ ] Llenar formulario con cada tipo de motivo
- [ ] Verificar validaciones (observaciones < 20 chars)
- [ ] Enviar observación
- [ ] Login como asesor (created_by del vuelo)
- [ ] Verificar que llegó notificación en campana
- [ ] Verificar que se muestra toast
- [ ] Marcar como leída
- [ ] Verificar badge actualizado

---

## 🎨 Decisiones de Diseño

### Color Palette
- **Verde:** Confirmación (flujo correcto) - `bg-green-600`
- **Ámbar/Naranja:** Observación (requiere atención) - `from-amber-500 to-orange-500`
- **Rojo:** (Futuro) Rechazo definitivo

### Typography
- **Títulos modales:** `text-xl font-bold`
- **Labels:** `text-sm font-medium text-gray-700`
- **Helper text:** `text-xs text-gray-500`

### Spacing
- **Card padding:** `p-6`
- **Button padding:** `px-6 py-3`
- **Gap entre elementos:** `gap-3` o `gap-4`

### Depth System
- **Modal backdrop:** `bg-black bg-opacity-50`
- **Modal card:** `shadow-2xl` con `rounded-2xl`
- **Borders:** `border-2` para elementos interactivos, `border` para divisiones

### Motion
- **Transitions:** `transition-colors` en hover states
- **Loading:** `animate-spin` en Loader2
- **Gradient hover:** `hover:from-amber-600 hover:to-orange-600`

---

## 📊 Métricas de Éxito

1. **Tiempo de notificación:** < 5 segundos desde envío hasta recepción
2. **Tasa de adopción:** 100% de admins usan función en primera semana
3. **Reducción de consultas:** -30% de mensajes "¿ya revisaste mi pago?"
4. **Claridad:** Asesores resuelven observación sin preguntar detalles

---

## 🔮 Mejoras Futuras

### Corto plazo (1-2 semanas)
- Agregar filtros en vista de confirmación (por fecha, asesor, monto)
- Mostrar badge en lista de vuelos si tiene observación pendiente
- Permitir que asesor "marque como resuelto" la observación

### Mediano plazo (1 mes)
- Dashboard de observaciones: % resueltas, tiempo promedio de resolución
- Implementar tabla `vuelos_observaciones_pago` para analytics
- Notificaciones por email si observación no se atiende en 24h

### Largo plazo (3 meses)
- IA que detecta patrones: "Este cliente siempre paga menos"
- Automatización: Generar mensaje predefinido para asesor
- Integración con WhatsApp: Enviar mensaje automático al cliente

---

**Próximo paso:** Implementar backend primero, luego frontend, testing, deploy.
