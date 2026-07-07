# Plan de Implementación - Control de Emisiones (Fases Complementarias)

**Fecha:** 21 de Abril de 2026  
**Módulo:** Control de Emisiones - Fases 5, 6 y 7  
**Relacionado con:** `2026-04-21-control-emisiones-implementation.md`

---

## Índice de Fases Complementarias

- **FASE 5:** Frontend - Realtime Emissions Updates (Johan Emisor)
- **FASE 6:** Frontend - Debt Management UI (Admin)
- **FASE 7:** Testing y Validación

---

## FASE 5: Frontend - Realtime Emissions Updates (Johan Emisor)

### Objetivo

Implementar actualizaciones en tiempo real para que Johan (emisor) vea automáticamente cuando se autorizan vuelos, sin necesidad de refrescar la página.

### 5.1 Habilitar Realtime en Tabla `vuelos`

**Archivo:** SQL Editor en Supabase Dashboard

**Comando:**
```sql
-- Habilitar Realtime en tabla vuelos
ALTER PUBLICATION supabase_realtime ADD TABLE vuelos;

-- Verificar que está habilitada
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'vuelos';
```

**Testing:**
```bash
# Ejecutar en Supabase SQL Editor
# Debe retornar 1 fila con tablename = 'vuelos'
```

---

### 5.2 Crear Context para Vuelos Realtime

**Archivo:** `dashboard/src/contexts/VuelosEmisionContext.js`

**Contenido:**
```javascript
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const VuelosEmisionContext = createContext()

export function VuelosEmisionProvider({ children }) {
  const { user } = useAuth()
  const [vuelosPendientes, setVuelosPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [realtimeActivo, setRealtimeActivo] = useState(false)

  // Cargar vuelos pendientes de emisión del usuario
  const cargarVuelosPendientes = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vuelos')
        .select('*')
        .eq('created_by', user.id)
        .in('estado_emision', ['pendiente_autorizacion', 'autorizado_pendiente_emision'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando vuelos pendientes:', error)
        return
      }

      setVuelosPendientes(data || [])
    } catch (error) {
      console.error('Error en cargarVuelosPendientes:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Handler para cambios en tiempo real
  const handleVueloChange = useCallback((payload) => {
    const { eventType, new: nuevoVuelo, old: vueloAntiguo } = payload

    if (eventType === 'UPDATE' && nuevoVuelo) {
      // Verificar si el cambio es relevante para el emisor
      if (nuevoVuelo.created_by === user?.id) {
        
        // Actualizar estado local
        setVuelosPendientes(prev => {
          const index = prev.findIndex(v => v.id === nuevoVuelo.id)
          
          // Si cambió a autorizado, mostrar toast
          if (vueloAntiguo?.estado_emision === 'pendiente_autorizacion' && 
              nuevoVuelo.estado_emision === 'autorizado_pendiente_emision') {
            toast.success(
              `¡Vuelo ${nuevoVuelo.ruta || 'sin ruta'} autorizado para emisión!`,
              {
                duration: 5000,
                icon: '✅',
              }
            )
          }

          // Si cambió a rechazado, mostrar toast con motivo
          if (vueloAntiguo?.estado_emision === 'pendiente_autorizacion' && 
              nuevoVuelo.estado_emision === 'rechazado') {
            const motivo = nuevoVuelo.motivo_rechazo_emision || 'Sin motivo especificado'
            toast.error(
              `Vuelo ${nuevoVuelo.ruta || 'sin ruta'} rechazado: ${motivo}`,
              {
                duration: 8000,
                icon: '❌',
              }
            )
          }

          // Si ya estaba en la lista, actualizar
          if (index !== -1) {
            const nuevaLista = [...prev]
            nuevaLista[index] = nuevoVuelo
            return nuevaLista
          }

          // Si no estaba y es un estado relevante, agregarlo
          if (['pendiente_autorizacion', 'autorizado_pendiente_emision'].includes(nuevoVuelo.estado_emision)) {
            return [nuevoVuelo, ...prev]
          }

          // Si cambió a un estado que ya no es relevante, removerlo
          return prev.filter(v => v.id !== nuevoVuelo.id)
        })
      }
    }

    if (eventType === 'INSERT' && nuevoVuelo) {
      // Si el usuario crea un nuevo vuelo, agregarlo a la lista
      if (nuevoVuelo.created_by === user?.id &&
          ['pendiente_autorizacion', 'autorizado_pendiente_emision'].includes(nuevoVuelo.estado_emision)) {
        setVuelosPendientes(prev => {
          const existe = prev.some(v => v.id === nuevoVuelo.id)
          if (existe) return prev
          return [nuevoVuelo, ...prev]
        })
      }
    }

    if (eventType === 'DELETE' && vueloAntiguo) {
      // Remover de la lista si se elimina
      setVuelosPendientes(prev => prev.filter(v => v.id !== vueloAntiguo.id))
    }
  }, [user?.id])

  // Configurar suscripción a Realtime
  useEffect(() => {
    if (!user?.id) return

    // Cargar datos iniciales
    cargarVuelosPendientes()

    // Crear canal de Realtime
    const channel = supabase
      .channel(`vuelos-emision-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'vuelos',
          filter: `created_by=eq.${user.id}` // Solo vuelos del usuario
        },
        handleVueloChange
      )
      .subscribe((status) => {
        console.log('Estado de suscripción Realtime:', status)
        setRealtimeActivo(status === 'SUBSCRIBED')
      })

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
      setRealtimeActivo(false)
    }
  }, [user?.id, cargarVuelosPendientes, handleVueloChange])

  const value = {
    vuelosPendientes,
    loading,
    realtimeActivo,
    refetch: cargarVuelosPendientes
  }

  return (
    <VuelosEmisionContext.Provider value={value}>
      {children}
    </VuelosEmisionContext.Provider>
  )
}

export function useVuelosEmision() {
  const context = useContext(VuelosEmisionContext)
  if (!context) {
    throw new Error('useVuelosEmision debe usarse dentro de VuelosEmisionProvider')
  }
  return context
}
```

**Explicación:**
- Filtra vuelos por `created_by` igual al user actual
- Solo muestra estados `pendiente_autorizacion` y `autorizado_pendiente_emision`
- Muestra toasts cuando cambia el estado de emisión
- Usa Supabase Realtime para actualizaciones automáticas

---

### 5.3 Integrar Context en Layout de Emisor

**Archivo:** `dashboard/src/app/(crm)/layout.jsx` (o el layout que corresponda)

**Cambios:**
```javascript
import { VuelosEmisionProvider } from '@/contexts/VuelosEmisionContext'

export default function CRMLayout({ children }) {
  return (
    <AuthProvider>
      <AgenciaProvider>
        <NotificacionesProvider>
          <VuelosEmisionProvider>
            {/* Layout content */}
            {children}
          </VuelosEmisionProvider>
        </NotificacionesProvider>
      </AgenciaProvider>
    </AuthProvider>
  )
}
```

---

### 5.4 Crear Componente de Lista de Vuelos Pendientes

**Archivo:** `dashboard/src/components/emisiones/VuelosPendientesEmision.jsx`

**Contenido:**
```javascript
'use client'

import { useVuelosEmision } from '@/contexts/VuelosEmisionContext'
import { Plane, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function VuelosPendientesEmision() {
  const { vuelosPendientes, loading, realtimeActivo } = useVuelosEmision()

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con indicador de Realtime */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Vuelos Pendientes de Emisión
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${realtimeActivo ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500">
            {realtimeActivo ? 'Tiempo real activo' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Lista de vuelos */}
      {vuelosPendientes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No tienes vuelos pendientes de emisión</p>
          <p className="text-sm text-gray-500 mt-1">Los vuelos autorizados aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vuelosPendientes.map(vuelo => (
            <VueloCard key={vuelo.id} vuelo={vuelo} />
          ))}
        </div>
      )}
    </div>
  )
}

function VueloCard({ vuelo }) {
  const estadoConfig = {
    pendiente_autorizacion: {
      color: 'bg-amber-100 border-amber-300',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      text: 'Pendiente de Autorización',
      textColor: 'text-amber-700'
    },
    autorizado_pendiente_emision: {
      color: 'bg-green-100 border-green-300',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: 'Autorizado - Listo para Emitir',
      textColor: 'text-green-700'
    },
    rechazado: {
      color: 'bg-red-100 border-red-300',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      text: 'Rechazado',
      textColor: 'text-red-700'
    }
  }

  const config = estadoConfig[vuelo.estado_emision] || estadoConfig.pendiente_autorizacion

  return (
    <div className={`border-2 rounded-lg p-4 ${config.color} transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {config.icon}
            <span className={`font-semibold ${config.textColor}`}>
              {config.text}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="font-bold text-gray-800 text-lg">
              {vuelo.ruta || 'Sin ruta'}
            </p>
            <p className="text-sm text-gray-600">
              Pasajero: <span className="font-medium">{vuelo.pax_nombre || 'N/A'}</span>
            </p>
            <p className="text-sm text-gray-600">
              Cuenta: <span className="font-medium">{vuelo.cuenta_emision || 'N/A'}</span>
            </p>
            
            {vuelo.estado_emision === 'autorizado_pendiente_emision' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Puedes emitir este vuelo ahora</span>
              </div>
            )}

            {vuelo.estado_emision === 'rechazado' && vuelo.motivo_rechazo_emision && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>{vuelo.motivo_rechazo_emision}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">
            {new Date(vuelo.created_at).toLocaleDateString('es-PE')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(vuelo.created_at).toLocaleTimeString('es-PE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Explicación:**
- Consume el context `VuelosEmisionContext`
- Muestra indicador visual de conexión Realtime
- Agrupa vuelos por estado de emisión
- UI con colores diferenciados por estado

---

### 5.5 Integrar en Página de Emisión de Johan

**Archivo:** `dashboard/src/app/(crm)/emisor/page.jsx` (o la ruta que corresponda)

**Cambios:**
```javascript
import VuelosPendientesEmision from '@/components/emisiones/VuelosPendientesEmision'

export default function EmisorDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard de Emisión</h1>
      
      {/* Componente con Realtime */}
      <VuelosPendientesEmision />

      {/* Otros componentes del dashboard */}
    </div>
  )
}
```

---

### 5.6 Notificación Realtime de Autorización

**Archivo:** `src/services/notificacionesService.js`

**Nueva función:**
```javascript
/**
 * Notificar al emisor cuando su vuelo es autorizado para emisión
 */
export async function notificarEmisionAutorizada(vuelo, adminNombre) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';
    const cuentaEmision = vuelo.cuenta_emision || 'N/A';

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'emision_autorizada',
      titulo: '✅ Vuelo autorizado para emisión',
      descripcion: `${adminNombre} autorizó el vuelo ${ruta}. Puedes proceder con la emisión en la cuenta ${cuentaEmision}.`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        cuenta_emision: cuentaEmision,
        fecha_autorizacion: new Date().toISOString(),
        accion_requerida: 'Emitir el vuelo en la cuenta autorizada'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación de autorización enviada al emisor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de autorización:', err.message);
  }
}

/**
 * Notificar al administrador cuando se genera una deuda con proveedor
 */
export async function notificarDeudaGenerada(vuelo, deuda, emisorNombre) {
  try {
    // Obtener usuarios con rol administracion, admin o super_admin
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('rol', ['administracion', 'admin', 'super_admin']);

    if (error || !admins || admins.length === 0) {
      console.warn('No se encontraron administradores para notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';
    const proveedor = deuda.proveedor || 'N/A';
    const monto = deuda.monto || 0;

    const notificaciones = admins.map(admin => ({
      user_id: admin.id,
      tipo: 'deuda_generada',
      titulo: '💳 Nueva deuda con proveedor',
      descripcion: `${emisorNombre} generó una deuda de $${monto.toFixed(2)} con ${proveedor} por el vuelo ${ruta}.`,
      datos: {
        vuelo_id: vuelo.id,
        deuda_id: deuda.id,
        emisor_nombre: emisorNombre,
        proveedor,
        monto,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        cuenta_emision: vuelo.cuenta_emision,
        fecha_generacion: new Date().toISOString()
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificación de deuda enviada a ${admins.length} administradores`);
  } catch (err) {
    console.error('Error enviando notificación de deuda:', err.message);
  }
}
```

**Actualizar exports:**
```javascript
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado,
  notificarPagoConfirmado,
  notificarEmisionAutorizada,
  notificarDeudaGenerada
};
```

---

### 5.7 Integrar Notificación en Endpoint de Autorización

**Archivo:** `src/routes/vuelos.js`

**Modificar endpoint:**
```javascript
import { notificarEmisionAutorizada } from '../services/notificacionesService.js';

// Endpoint PATCH /api/vuelos/:id/autorizar-emision
router.patch('/:id/autorizar-emision', async (req, res) => {
  try {
    const { id } = req.params;
    const { autorizado_por, observaciones } = req.body;

    // ... validaciones ...

    // Autorizar vuelo
    const vueloAutorizado = await emisionesService.autorizarEmision(id, autorizado_por, observaciones);

    // Obtener nombre del admin que autorizó
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', autorizado_por)
      .single();

    const adminNombre = adminProfile?.full_name || 'Administrador';

    // Notificar al emisor
    await notificarEmisionAutorizada(vueloAutorizado, adminNombre);

    res.json({
      message: 'Vuelo autorizado para emisión',
      vuelo: vueloAutorizado
    });
  } catch (error) {
    console.error('Error autorizando emisión:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### Testing FASE 5

#### Unit Tests
```javascript
// tests/contexts/VuelosEmisionContext.test.js
describe('VuelosEmisionContext', () => {
  test('carga vuelos pendientes del usuario', async () => {
    // Mock Supabase query
    // Verificar que solo trae vuelos del usuario actual
  })

  test('actualiza lista cuando llega evento UPDATE', () => {
    // Simular evento Realtime UPDATE
    // Verificar que actualiza el vuelo en el estado
  })

  test('muestra toast cuando se autoriza vuelo', () => {
    // Simular cambio de estado a autorizado
    // Verificar que se llama a toast.success
  })
})
```

#### Integration Tests
```javascript
// tests/integration/realtime-emissions.test.js
describe('Realtime Emissions Flow', () => {
  test('emisor recibe actualización cuando admin autoriza vuelo', async () => {
    // 1. Login como admin
    // 2. Autorizar vuelo de emisor
    // 3. Verificar que emisor recibe evento Realtime
    // 4. Verificar que estado se actualiza en UI
  })

  test('emisor recibe notificación cuando vuelo es autorizado', async () => {
    // 1. Autorizar vuelo
    // 2. Verificar que se inserta notificación en BD
    // 3. Verificar que emisor recibe notificación via Realtime
  })
})
```

#### Manual Testing
1. **Login como Johan (emisor)**
2. **Crear vuelo con cuenta de emisión**
3. **En otra pestaña, login como admin**
4. **Autorizar el vuelo desde panel de control**
5. **Verificar en pestaña de Johan:**
   - Lista se actualiza automáticamente
   - Aparece toast de autorización
   - Indicador de Realtime está en verde
   - Notificación aparece en campana

---

### Commit FASE 5

```bash
git add dashboard/src/contexts/VuelosEmisionContext.js
git add dashboard/src/components/emisiones/VuelosPendientesEmision.jsx
git add dashboard/src/app/(crm)/layout.jsx
git add dashboard/src/app/(crm)/emisor/page.jsx
git add src/services/notificacionesService.js
git add src/routes/vuelos.js
git commit -m "feat(emissions): Implementar Realtime updates para emisor

- Crear VuelosEmisionContext con suscripción Realtime
- Componente VuelosPendientesEmision con UI por estado
- Toasts automáticos para autorizaciones y rechazos
- Notificaciones de emisión autorizada y deuda generada
- Indicador visual de conexión Realtime
- Filtrado por created_by para mostrar solo vuelos del usuario"
```

---

## FASE 6: Frontend - Debt Management UI (Admin)

### Objetivo

Crear interfaz para que administradores gestionen las deudas con proveedores generadas por las emisiones.

### 6.1 Crear Página de Gestión de Deudas

**Archivo:** `dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx`

**Contenido:**
```javascript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeudasProveedoresPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroProveedor, setFiltroProveedor] = useState('')

  // Validar acceso
  useEffect(() => {
    if (!profile) return

    const rolesPermitidos = ['administracion', 'admin', 'super_admin']
    if (!rolesPermitidos.includes(profile.rol)) {
      toast.error('No tienes permisos para acceder a esta página')
      router.push('/')
    }
  }, [profile, router])

  // Cargar deudas
  const cargarDeudas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/deudas-proveedores')
      if (!response.ok) throw new Error('Error cargando deudas')

      const data = await response.json()
      setDeudas(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error cargando deudas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDeudas()
  }, [])

  // Filtrar deudas
  const deudasFiltradas = deudas.filter(deuda => {
    const coincideEstado = filtroEstado === 'todas' || deuda.estado === filtroEstado
    const coincideProveedor = !filtroProveedor || 
      deuda.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())
    return coincideEstado && coincideProveedor
  })

  // Calcular totales
  const totalDeudas = deudasFiltradas.reduce((sum, d) => sum + (d.monto || 0), 0)
  const totalPagado = deudasFiltradas
    .filter(d => d.estado === 'pagada')
    .reduce((sum, d) => sum + (d.monto || 0), 0)
  const totalPendiente = deudasFiltradas
    .filter(d => d.estado === 'pendiente')
    .reduce((sum, d) => sum + (d.monto || 0), 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Deudas con Proveedores</h1>
        <p className="text-gray-600 mt-1">Gestión de deudas generadas por emisiones</p>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium opacity-80">Total</span>
          </div>
          <p className="text-3xl font-bold">${totalDeudas.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">{deudasFiltradas.length} deudas</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium opacity-80">Pendiente</span>
          </div>
          <p className="text-3xl font-bold">${totalPendiente.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            {deudasFiltradas.filter(d => d.estado === 'pendiente').length} deudas
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium opacity-80">Pagado</span>
          </div>
          <p className="text-3xl font-bold">${totalPagado.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            {deudasFiltradas.filter(d => d.estado === 'pagada').length} deudas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagada">Pagadas</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar proveedor
          </label>
          <input
            type="text"
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            placeholder="Nombre del proveedor..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Tabla de Deudas */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {deudasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No hay deudas que mostrar</p>
            <p className="text-sm text-gray-500 mt-1">
              Las deudas generadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vuelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deudasFiltradas.map(deuda => (
                  <DeudaRow key={deuda.id} deuda={deuda} onUpdate={cargarDeudas} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DeudaRow({ deuda, onUpdate }) {
  const [registrandoPago, setRegistrandoPago] = useState(false)

  const registrarPago = async () => {
    if (!confirm(`¿Confirmar pago de $${deuda.monto.toFixed(2)} a ${deuda.proveedor}?`)) {
      return
    }

    setRegistrandoPago(true)
    try {
      const response = await fetch(`/api/deudas-proveedores/${deuda.id}/registrar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: deuda.monto,
          metodo_pago: 'transferencia',
          observaciones: 'Pago registrado desde panel de administración'
        })
      })

      if (!response.ok) throw new Error('Error registrando pago')

      toast.success('Pago registrado exitosamente')
      onUpdate()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error registrando pago')
    } finally {
      setRegistrandoPago(false)
    }
  }

  const estadoConfig = {
    pendiente: {
      color: 'bg-amber-100 text-amber-800',
      icon: <Clock className="w-4 h-4" />
    },
    pagada: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-4 h-4" />
    }
  }

  const config = estadoConfig[deuda.estado] || estadoConfig.pendiente

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">{deuda.proveedor}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{deuda.vuelo?.ruta || 'N/A'}</p>
        <p className="text-xs text-gray-500">{deuda.vuelo?.pax_nombre || 'N/A'}</p>
      </td>
      <td className="px-6 py-4">
        <p className="font-bold text-gray-900">${deuda.monto.toFixed(2)}</p>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon}
          {deuda.estado}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(deuda.created_at).toLocaleDateString('es-PE')}
      </td>
      <td className="px-6 py-4">
        {deuda.estado === 'pendiente' && (
          <button
            onClick={registrarPago}
            disabled={registrandoPago}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
          </button>
        )}
        {deuda.estado === 'pagada' && (
          <span className="text-sm text-gray-500">Pagado</span>
        )}
      </td>
    </tr>
  )
}
```

**Explicación:**
- Valida rol del usuario (solo administración)
- Muestra resumen de deudas con cards
- Permite filtrar por estado y proveedor
- Tabla con acciones para registrar pagos

---

### 6.2 Agregar Ruta en Navegación

**Archivo:** `dashboard/src/components/Sidebar.jsx` (o el componente de navegación)

**Agregar:**
```javascript
{
  label: 'Deudas Proveedores',
  href: '/admin/deudas-proveedores',
  icon: <DollarSign className="w-5 h-5" />,
  roles: ['administracion', 'admin', 'super_admin']
}
```

---

### Testing FASE 6

#### E2E Tests
```javascript
// tests/e2e/debt-management.spec.js
test('admin puede ver y gestionar deudas', async ({ page }) => {
  // 1. Login como admin
  await loginAsAdmin(page)
  
  // 2. Navegar a deudas
  await page.goto('/admin/deudas-proveedores')
  
  // 3. Verificar que se muestran deudas
  await expect(page.locator('table tbody tr')).toHaveCount(greaterThan(0))
  
  // 4. Filtrar por pendiente
  await page.selectOption('select', 'pendiente')
  
  // 5. Registrar pago de primera deuda
  await page.click('button:has-text("Registrar Pago")')
  await page.click('button:has-text("Aceptar")')
  
  // 6. Verificar toast de éxito
  await expect(page.locator('.toast:has-text("Pago registrado")')).toBeVisible()
})
```

---

### Commit FASE 6

```bash
git add dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx
git add dashboard/src/components/Sidebar.jsx
git commit -m "feat(debts): Implementar UI de gestión de deudas con proveedores

- Página de deudas con cards de resumen
- Filtros por estado y proveedor
- Tabla con listado de deudas
- Acción para registrar pagos
- Validación de roles (solo admin)
- UI responsiva con TailwindCSS"
```

---

## FASE 7: Testing y Validación

### 7.1 Tests Unitarios Backend

**Archivo:** `tests/unit/emisionesService.test.js`

```javascript
import { describe, test, expect, beforeEach } from '@jest/globals'
import emisionesService from '../../src/services/emisionesService.js'

describe('emisionesService', () => {
  test('autorizarEmision actualiza estado correctamente', async () => {
    const vueloId = 'test-uuid'
    const autorizadoPor = 'admin-uuid'
    const observaciones = 'Test autorización'

    const resultado = await emisionesService.autorizarEmision(
      vueloId,
      autorizadoPor,
      observaciones
    )

    expect(resultado.estado_emision).toBe('autorizado_pendiente_emision')
    expect(resultado.fecha_autorizacion_emision).toBeDefined()
    expect(resultado.autorizado_por_emision).toBe(autorizadoPor)
  })

  test('rechazarEmision requiere motivo', async () => {
    const vueloId = 'test-uuid'
    const rechazadoPor = 'admin-uuid'

    await expect(
      emisionesService.rechazarEmision(vueloId, rechazadoPor, '')
    ).rejects.toThrow('Motivo es requerido')
  })

  test('crearDeudaProveedor valida monto positivo', async () => {
    const vueloId = 'test-uuid'
    const datos = {
      proveedor: 'Test Provider',
      monto: -100,
      descripcion: 'Test'
    }

    await expect(
      emisionesService.crearDeudaProveedor(vueloId, datos)
    ).rejects.toThrow('Monto debe ser mayor a 0')
  })
})
```

---

### 7.2 Tests de Integración

**Archivo:** `tests/integration/control-emisiones.test.js`

```javascript
import { describe, test, expect } from '@jest/globals'
import request from 'supertest'
import app from '../../src/server.js'

describe('Control de Emisiones API', () => {
  let authToken
  let vueloId

  beforeEach(async () => {
    // Setup: Login y crear vuelo de prueba
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test123' })
    
    authToken = loginRes.body.token
    
    const vueloRes = await request(app)
      .post('/api/vuelos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ruta: 'LIM-MIA',
        pax_nombre: 'Test Pax',
        cuenta_emision: 'LATAM'
      })
    
    vueloId = vueloRes.body.id
  })

  test('POST /api/vuelos/:id/autorizar-emision autoriza correctamente', async () => {
    const res = await request(app)
      .patch(`/api/vuelos/${vueloId}/autorizar-emision`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        autorizado_por: 'admin-uuid',
        observaciones: 'Test observación'
      })

    expect(res.status).toBe(200)
    expect(res.body.vuelo.estado_emision).toBe('autorizado_pendiente_emision')
  })

  test('POST /api/deudas-proveedores crea deuda correctamente', async () => {
    const res = await request(app)
      .post('/api/deudas-proveedores')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vuelo_id: vueloId,
        proveedor: 'Test Provider',
        monto: 500,
        descripcion: 'Test deuda'
      })

    expect(res.status).toBe(201)
    expect(res.body.proveedor).toBe('Test Provider')
    expect(res.body.monto).toBe(500)
  })
})
```

---

### 7.3 Tests E2E

**Archivo:** `tests/e2e/control-emisiones-flow.spec.js`

```javascript
import { test, expect } from '@playwright/test'

test.describe('Control de Emisiones - Flujo Completo', () => {
  test('flujo completo desde creación hasta autorización', async ({ page, context }) => {
    // Paso 1: Login como asesor
    await page.goto('/login')
    await page.fill('input[name="email"]', 'asesor@test.com')
    await page.fill('input[name="password"]', 'test123')
    await page.click('button[type="submit"]')

    // Paso 2: Crear vuelo con cuenta de emisión
    await page.goto('/vuelos/nuevo')
    await page.fill('input[name="ruta"]', 'LIM-MIA')
    await page.fill('input[name="pax_nombre"]', 'Juan Pérez')
    await page.selectOption('select[name="cuenta_emision"]', 'LATAM')
    await page.click('button[type="submit"]')

    // Paso 3: Verificar que vuelo requiere autorización
    await expect(page.locator('text=Pendiente de Autorización')).toBeVisible()

    // Paso 4: Abrir nueva pestaña como admin
    const adminPage = await context.newPage()
    await adminPage.goto('/login')
    await adminPage.fill('input[name="email"]', 'admin@test.com')
    await adminPage.fill('input[name="password"]', 'admin123')
    await adminPage.click('button[type="submit"]')

    // Paso 5: Ir a panel de control de emisiones
    await adminPage.goto('/admin/control-emisiones')

    // Paso 6: Autorizar vuelo
    await adminPage.click('button:has-text("Autorizar")')
    await adminPage.fill('textarea[name="observaciones"]', 'OK para emitir')
    await adminPage.click('button:has-text("Confirmar Autorización")')

    // Paso 7: Verificar en pestaña del asesor que llega actualización
    await page.waitForTimeout(2000) // Esperar Realtime
    await expect(page.locator('text=Autorizado para Emisión')).toBeVisible()
    
    // Paso 8: Verificar notificación
    await page.click('[data-testid="notifications-bell"]')
    await expect(page.locator('text=Vuelo autorizado para emisión')).toBeVisible()
  })

  test('rechazar emisión muestra motivo al asesor', async ({ page }) => {
    // Similar al anterior pero con rechazo
    // ...
  })
})
```

---

### 7.4 Plan de Testing Manual

**Documento:** `docs/testing/control-emisiones-manual-tests.md`

```markdown
# Plan de Testing Manual - Control de Emisiones

## Caso 1: Autorización Exitosa

### Precondiciones
- Usuario asesor logueado
- Usuario admin logueado en otra pestaña

### Pasos
1. Como asesor, crear vuelo con cuenta_emision = "LATAM"
2. Verificar que estado_emision = "pendiente_autorizacion"
3. Como admin, ir a /admin/control-emisiones
4. Verificar que vuelo aparece en lista de pendientes
5. Click en "Autorizar", agregar observaciones
6. Confirmar autorización
7. Como asesor, verificar que:
   - Estado cambia a "autorizado_pendiente_emision" sin refrescar
   - Aparece toast de autorización
   - Llega notificación en campana

### Resultado Esperado
✅ Vuelo autorizado, asesor notificado en tiempo real

---

## Caso 2: Rechazo de Emisión

### Pasos
1-3. Igual que Caso 1
4. Click en "Rechazar", ingresar motivo
5. Confirmar rechazo
6. Como asesor, verificar que:
   - Estado cambia a "rechazado"
   - Aparece toast con motivo
   - No puede emitir el vuelo

### Resultado Esperado
✅ Vuelo rechazado, motivo visible para asesor

---

## Caso 3: Creación de Deuda

### Pasos
1. Como emisor, emitir vuelo autorizado
2. Indicar que se generó deuda con proveedor
3. Ingresar monto y proveedor
4. Confirmar emisión
5. Como admin, ir a /admin/deudas-proveedores
6. Verificar que aparece nueva deuda
7. Verificar que llega notificación

### Resultado Esperado
✅ Deuda creada, admin notificado

---

## Caso 4: Registro de Pago

### Pasos
1. Desde /admin/deudas-proveedores
2. Filtrar por estado "pendiente"
3. Click en "Registrar Pago" de una deuda
4. Confirmar pago
5. Verificar que:
   - Estado cambia a "pagada"
   - Se crea registro en pagos_deudas
   - Totales se actualizan

### Resultado Esperado
✅ Pago registrado correctamente
```

---

### 7.5 Validación de Seguridad

**Checklist de Seguridad:**

- [ ] **Validación de Roles:**
  - Solo admin/super_admin puede autorizar/rechazar
  - Solo admin puede ver panel de deudas
  - Emisor solo ve sus propios vuelos

- [ ] **Validación de Datos:**
  - Monto de deuda > 0
  - Motivo de rechazo no vacío
  - Cuenta de emisión es valor válido

- [ ] **SQL Injection:**
  - Todos los queries usan prepared statements
  - No hay concatenación de strings en queries

- [ ] **XSS:**
  - Todos los inputs sanitizados
  - No se usa dangerouslySetInnerHTML

- [ ] **CSRF:**
  - Endpoints críticos requieren autenticación
  - Tokens de sesión validados

---

### Commit FASE 7

```bash
git add tests/unit/emisionesService.test.js
git add tests/integration/control-emisiones.test.js
git add tests/e2e/control-emisiones-flow.spec.js
git add docs/testing/control-emisiones-manual-tests.md
git commit -m "test(emissions): Implementar suite completa de tests

- Tests unitarios para emisionesService
- Tests de integración para API endpoints
- Tests E2E para flujo completo con Playwright
- Plan de testing manual documentado
- Checklist de validación de seguridad"
```

---

## Resumen Final de Fases Complementarias

### FASE 5: Frontend Realtime ✅
- Context para vuelos en tiempo real
- Componente con indicador de conexión
- Toasts automáticos para cambios de estado
- Notificaciones de autorización y deuda

### FASE 6: Debt Management UI ✅
- Página de administración de deudas
- Filtros y resumen de totales
- Registro de pagos
- Validación de roles

### FASE 7: Testing ✅
- Tests unitarios backend
- Tests de integración API
- Tests E2E con Playwright
- Plan de testing manual
- Checklist de seguridad

---

## Próximos Pasos

Una vez completadas estas fases complementarias, el sistema de Control de Emisiones estará completo. Se recomienda:

1. **Ejecutar todos los tests** antes de merge a producción
2. **Validar manualmente** cada caso de uso
3. **Documentar** en README del proyecto
4. **Capacitar** a usuarios (Johan y admins)
5. **Monitorear** logs de Realtime en primeros días
6. **Considerar roadmap** para Enfoque C (límites por proveedor)

---

**Documento relacionado:** `2026-04-21-control-emisiones-implementation.md` (Fases 1-4)  
**Spec de diseño:** `2026-04-21-control-emisiones-design.md`
