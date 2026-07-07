---
name: supabase-realtime-implementation
description: Cómo implementar Supabase Realtime en el proyecto ERP Nova CRM. Use esta skill siempre que necesites implementar actualizaciones en tiempo real usando Supabase Realtime, cuando el usuario mencione "realtime", "actualizaciones en vivo", "suscripciones", "websocket", "cambios en tiempo real", o necesite que el frontend se actualice automáticamente cuando la base de datos cambia. Esta skill cubre los patrones específicos del proyecto para chat, ranking, notificaciones y cualquier otra tabla que necesite sincronización en tiempo real.
---

# Supabase Realtime Implementation - ERP Nova CRM

Esta skill enseña cómo implementar Supabase Realtime en el proyecto ERP Nova CRM siguiendo los patrones establecidos en el código existente.

## Cuándo Usar Supabase Realtime

Usa Supabase Realtime cuando necesites:
- Que el frontend se actualice automáticamente cuando la base de datos cambia
- Sincronizar datos en tiempo real entre múltiples usuarios
- Mostrar notificaciones instantáneas
- Actualizar rankings o métricas en vivo
- Implementar chat o mensajería en tiempo real

**NO uses Realtime** para:
- Operaciones CRUD simples que no requieren actualización inmediata
- Datos que cambian muy raramente
- Cuando un refresh manual es aceptable

## Requisitos Previos

### 1. Cliente Supabase Configurado

El proyecto ya tiene un cliente Supabase configurado en `dashboard/src/lib/supabase.js`:

```javascript
import { supabase } from '@/lib/supabase'
```

**NO crees un nuevo cliente**. Usa siempre el import existente.

### 2. Habilitar Realtime en la Tabla

Antes de implementar la suscripción, debes habilitar Realtime en la tabla de Supabase:

**Opción A: SQL Editor**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE nombre_tabla;
```

**Opción B: Supabase Dashboard**
1. Ve a Database → Replication
2. Busca la tabla
3. Habilita "Realtime"
4. Guarda cambios

### 3. Verificar que la Tabla Está Habilitada

```sql
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'nombre_tabla';
```

## Patrón Base de Implementación

### Estructura General

Todas las implementaciones de Realtime en el proyecto siguen este patrón:

```javascript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MiComponente({ id }) {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Función para cargar datos iniciales
  const cargarDatos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('nombre_tabla')
        .select('*')
        .eq('columna_filtro', id)
      
      if (!error && data) {
        setDatos(data)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // 2. Handler para cambios en tiempo real
  const handleChange = (payload) => {
    const { eventType, new: nuevo, old: antiguo } = payload

    if (eventType === 'INSERT') {
      // Agregar nuevo dato al estado
      setDatos(prev => [...prev, nuevo])
    } else if (eventType === 'UPDATE') {
      // Actualizar dato existente
      setDatos(prev => prev.map(item => 
        item.id === nuevo.id ? nuevo : item
      ))
    } else if (eventType === 'DELETE') {
      // Eliminar dato del estado
      setDatos(prev => prev.filter(item => 
        item.id !== antiguo.id
      ))
    }
  }

  // 3. useEffect para configurar la suscripción
  useEffect(() => {
    // Cargar datos iniciales
    cargarDatos()

    // Crear canal con nombre único
    const channel = supabase
      .channel(`nombre-unico-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'nombre_tabla',
          filter: `columna=eq.${id}` // Filtro opcional
        },
        (payload) => handleChange(payload)
      )
      .subscribe()

    // Cleanup: desuscribirse al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      {/* Renderizar datos */}
      {datos.map(item => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  )
}
```

## Patrones Específicos del Proyecto

### Patrón 1: Chat con Datos Relacionales (ChatView.js)

**Cuándo usar:** Cuando necesitas sincronizar datos que tienen relaciones complejas (ej: mensajes con archivos multimedia).

**Características:**
- Doble suscripción para datos relacionados
- Handler con lógica específica por tipo de evento
- Recarga selectiva cuando hay relaciones

```javascript
useEffect(() => {
  loadConversation()

  // Suscripción principal a messages
  const messagesChannel = supabase
    .channel(`chat-messages-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => handleMessageChange(payload)
    )
    .subscribe()

  // Suscripción ADICIONAL a media_files como respaldo
  const mediaChannel = supabase
    .channel(`chat-media-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'media_files'
      },
      async (payload) => {
        const messageId = payload.new?.message_id
        if (messageId) {
          await refreshMessageWithMedia(messageId)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(messagesChannel)
    supabase.removeChannel(mediaChannel)
  }
}, [chatId])

// Handler con lógica específica
const handleMessageChange = async (payload) => {
  const { eventType, new: newMessage, old: oldMessage } = payload

  if (eventType === 'INSERT' && newMessage) {
    // Evitar duplicados
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id)
      if (exists) return prev
      return [...prev, newMessage]
    })
    // Auto-scroll
    setTimeout(() => scrollToBottomRef.current?.(), 100)
  } else if (eventType === 'UPDATE' && newMessage) {
    // Si tiene multimedia, recargar con relaciones
    if (newMessage.has_media) {
      await refreshMessageWithMedia(newMessage.id)
    } else {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? newMessage : msg
      ))
    }
  } else if (eventType === 'DELETE' && oldMessage) {
    setMessages(prev => prev.filter(msg => msg.id !== oldMessage.id))
  }
}
```

### Patrón 2: Ranking/Datos Agregados (RankingContext.js)

**Cuándo usar:** Cuando los datos son agregados/calculados y necesitas recargar todo al detectar cambios.

**Características:**
- Sin filtro (escucha toda la tabla)
- Recarga completa del estado
- Verificación de estado de suscripción

```javascript
useEffect(() => {
  cargarRanking(monedaVista)

  // Suscripción a toda la tabla de vuelos
  const channel = supabase
    .channel('ranking-vuelos-global')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vuelos'
        // SIN filtro - escucha todos los cambios
      },
      () => {
        // Recargar ranking completo
        cargarRanking(monedaVista)
      }
    )
    .subscribe((status) => {
      // Verificar estado de suscripción
      setRealtimeActivo(status === 'SUBSCRIBED')
    })

  return () => {
    supabase.removeChannel(channel)
    setRealtimeActivo(false)
  }
}, [cargarRanking, monedaVista])
```

### Patrón 3: Notificaciones por Usuario (NotificacionesContext.js)

**Cuándo usar:** Cuando necesitas mostrar notificaciones o eventos específicos por usuario.

**Características:**
- Solo INSERT (nuevos eventos)
- Filtro por user_id
- Actualización optimista + feedback visual (toast)

```javascript
useEffect(() => {
  if (!user?.id) return

  cargarNotificaciones()

  const channel = supabase
    .channel(`notificaciones-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Solo nuevos
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        const nueva = payload.new
        // Actualización optimista
        setNotificaciones(prev => {
          const existe = prev.some(n => n.id === nueva.id)
          if (existe) return prev
          return [nueva, ...prev]
        })
        // Mostrar feedback visual
        agregarToast(nueva)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user?.id, cargarNotificaciones, agregarToast])
```

## Guía de Decisión: Qué Patrón Usar

### Usa el Patrón Base cuando:
- Es una implementación simple de CRUD en tiempo real
- Los datos no tienen relaciones complejas
- No necesitas lógica especial por tipo de evento

### Usa el Patrón 1 (Chat) cuando:
- Los datos tienen relaciones (1:N, N:N)
- Necesitas sincronizar datos relacionados
- Hay campos que se actualizan después del INSERT (ej: transcripción async)
- Necesitas evitar duplicados

### Usa el Patrón 2 (Ranking) cuando:
- Los datos son agregados/calculados
- Un cambio en la tabla afecta todo el conjunto
- Es más eficiente recargar todo que hacer updates granulares
- Necesitas mostrar el estado de la suscripción

### Usa el Patrón 3 (Notificaciones) cuando:
- Solo te interesan nuevos registros (INSERT)
- Los datos son específicos por usuario
- Necesitas feedback visual inmediato (toasts, notificaciones)
- La actualización optimista es aceptable

## Configuración de Eventos

### Eventos Disponibles

```javascript
event: '*'  // Todos los eventos (INSERT, UPDATE, DELETE)
event: 'INSERT'  // Solo nuevos registros
event: 'UPDATE'  // Solo actualizaciones
event: 'DELETE'  // Solo eliminaciones
```

### Cuándo usar cada evento:

- **`*`**: Cuando necesitas reaccionar a cualquier cambio
- **`INSERT`**: Para notificaciones, logs, nuevos registros
- **`UPDATE`**: Para campos que cambian después del INSERT (transcripciones, estados)
- **`DELETE`**: Cuando necesitas limpiar el estado al eliminar

## Filtros

### Sintaxis de Filtros

```javascript
filter: `columna=eq.${valor}`           // Igualdad
filter: `columna=gt.${valor}`           // Mayor que
filter: `columna=lt.${valor}`           // Menor que
filter: `columna=gte.${valor}`          // Mayor o igual
filter: `columna=lte.${valor}`          // Menor o igual
filter: `columna=ilike.%${texto}%`     // Contiene (case insensitive)
```

### Cuándo usar filtros:

- **Siempre que sea posible**: Filtra en el servidor para reducir tráfico
- **Por user_id**: Para datos específicos por usuario
- **Por chat_id/entidad_id**: Para datos específicos por entidad
- **Sin filtro**: Solo cuando necesitas escuchar toda la tabla (Patrón Ranking)

## Nombres de Canales

Usa nombres descriptivos y únicos:

```javascript
// Buenas prácticas
.channel(`chat-messages-${chatId}`)
.channel(`notificaciones-${user.id}`)
.channel(`ranking-vuelos-global`)
.channel(`ventas-agencia-${agencyId}`)

// Evitar
.channel('channel1')
.channel('realtime')
.channel('data')
```

## Cleanup y Memory Leaks

**CRITICAL**: Siempre incluye cleanup en el useEffect:

```javascript
useEffect(() => {
  const channel = supabase
    .channel('nombre-unico')
    .on(...)
    .subscribe()

  // Cleanup obligatorio
  return () => {
    supabase.removeChannel(channel)
  }
}, [dependencias])
```

**Si tienes múltiples canales**:

```javascript
return () => {
  supabase.removeChannel(channel1)
  supabase.removeChannel(channel2)
  supabase.removeChannel(channel3)
}
```

## Debugging

### Verificar Suscripción en Consola

```javascript
.subscribe((status) => {
  console.log('Estado de suscripción:', status)
  // status puede ser: 'SUBSCRIBED', 'TIMED_OUT', 'CLOSED', 'CHANNEL_ERROR'
})
```

### Logs en el Handler

```javascript
const handleChange = (payload) => {
  console.log('Cambio detectado:', payload)
  // { eventType: 'INSERT', new: {...}, old: null }
}
```

### Verificar que Realtime Está Habilitado

```sql
-- En Supabase SQL Editor
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'nombre_tabla';
```

### Errores Comunes

1. **Tabla no habilitada para Realtime**
   - Error: No llegan eventos
   - Solución: Ejecutar `ALTER PUBLICATION supabase_realtime ADD TABLE nombre_tabla;`

2. **Filtro incorrecto**
   - Error: Llegan eventos de otros registros
   - Solución: Verificar sintaxis del filtro

3. **No hacer cleanup**
   - Error: Memory leaks, múltiples suscripciones
   - Solución: Siempre incluir `return () => supabase.removeChannel(channel)`

4. **Nombre de canal duplicado**
   - Error: Conflictos entre componentes
   - Solución: Usar nombres únicos con IDs

## Performance Considerations

### Optimizaciones Implementadas en el Proyecto

1. **Filtros en servidor**: Siempre filtra en el filtro, no en el handler
2. **Cleanup automático**: Desuscribirse al desmontar componentes
3. **Carga inicial + realtime**: Cargar datos iniciales, luego mantener sincronizado
4. **Actualizaciones optimistas**: Mostrar cambios antes de confirmar (Patrón Notificaciones)

### Cuándo Recargar vs Actualizar Localmente

- **Recargar**: Cuando los datos son agregados/calculados (Ranking)
- **Actualizar localmente**: Cuando es un update simple (Notificaciones)
- **Recargar selectivo**: Cuando hay relaciones (Chat con media_files)

## Ejemplo Completo: Nueva Implementación

Supongamos que necesitas implementar realtime para una tabla `ventas` filtrada por agencia:

```javascript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function VentasRealtime({ agencyId }) {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarVentas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setVentas(data)
      }
    } catch (error) {
      console.error('Error cargando ventas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVentaChange = (payload) => {
    const { eventType, new: nueva, old: antigua } = payload

    if (eventType === 'INSERT') {
      setVentas(prev => {
        const exists = prev.some(v => v.id === nueva.id)
        if (exists) return prev
        return [nueva, ...prev]
      })
    } else if (eventType === 'UPDATE') {
      setVentas(prev => prev.map(v => 
        v.id === nueva.id ? nueva : v
      ))
    } else if (eventType === 'DELETE') {
      setVentas(prev => prev.filter(v => v.id !== antigua.id))
    }
  }

  useEffect(() => {
    cargarVentas()

    const channel = supabase
      .channel(`ventas-agencia-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ventas',
          filter: `agency_id=eq.${agencyId}`
        },
        handleVentaChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agencyId])

  if (loading) return <div>Cargando ventas...</div>

  return (
    <div>
      <h2>Ventas en tiempo real</h2>
      {ventas.map(venta => (
        <div key={venta.id}>
          {venta.monto} - {venta.estado}
        </div>
      ))}
    </div>
  )
}
```

## Checklist de Implementación

Antes de considerar una implementación completa:

- [ ] Cliente Supabase importado desde `@/lib/supabase`
- [ ] Realtime habilitado en la tabla (SQL o Dashboard)
- [ ] Nombre de canal único y descriptivo
- [ ] Filtro configurado correctamente (si aplica)
- [ ] Handler implementado para cada tipo de evento necesario
- [ ] Cleanup en el return del useEffect
- [ ] Datos iniciales cargados antes de la suscripción
- [ ] Logs para debugging (opcional pero recomendado)
- [ ] Verificado que no hay memory leaks
- [ ] Probado con INSERT, UPDATE, DELETE

## Referencias en el Proyecto

- **ChatView.js**: `dashboard/src/components/ChatView.js` (líneas 255-302)
- **RankingContext.js**: `dashboard/src/contexts/RankingContext.js` (líneas 62-88)
- **NotificacionesContext.js**: `dashboard/src/contexts/NotificacionesContext.js` (líneas 102-135)
- **Documentación**: `docs/10-legacy/REALTIME_UPDATES.md`
