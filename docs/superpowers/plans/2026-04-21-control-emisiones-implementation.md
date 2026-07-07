# Control de Emisiones - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar módulo de Control de Emisiones que permite a administración autorizar emisiones de boletos con control de deudas a proveedores y notificaciones en tiempo real.

**Architecture:** Sistema de 3 capas - (1) Base de datos con nuevas tablas/columnas, (2) Backend API RESTful con endpoints de autorización y deudas, (3) Frontend con vistas para administración y emisor con Supabase Realtime.

**Tech Stack:** PostgreSQL, Supabase, Express.js, React, Next.js 14, TailwindCSS, Lucide Icons

---

## 📊 Estado de Implementación

**Fecha de última actualización:** 2026-04-22

- ✅ **FASE 1: Base de Datos y Migraciones** - COMPLETADA
- ✅ **FASE 2: Backend - Servicios y API** - COMPLETADA
- ✅ **FASE 3: Frontend - Formulario de Vuelo** - COMPLETADA
- ✅ **FASE 4: Frontend - Control de Emisiones** - COMPLETADA
- ✅ **FASE 5: Frontend - Emisiones Realtime** - COMPLETADA
- ✅ **FASE 6: Gestión de Deudas** - COMPLETADA
- ✅ **FASE 7: Testing y Documentación** - COMPLETADA

**⚠️ IMPORTANTE:** Los commits de las FASES 1 y 2 están pendientes. Se recomienda hacer commits antes de continuar con las fases siguientes.

---

## Índice de Fases

- **FASE 1:** Base de Datos y Migraciones (2 tareas)
- **FASE 2:** Backend - Servicios y API (4 tareas)
- **FASE 3:** Frontend - Formulario de Vuelo (2 tareas)
- **FASE 4:** Frontend - Control de Emisiones (3 tareas)
- **FASE 5:** Frontend - Emisiones Realtime (2 tareas)
- **FASE 6:** Gestión de Deudas (3 tareas)
- **FASE 7:** Testing y Documentación (2 tareas)

**Tiempo estimado total:** 8 días

---

# FASE 1: Base de Datos y Migraciones ✅

## Tarea 1.1: Migración - Nuevas Columnas en Tabla Vuelos ✅

**Files:**
- Create: `docs/05-base-de-datos/migrations/20260421_add_control_emisiones_fields.sql` ✅
- Modify: `docs/05-base-de-datos/esquemalocal.sql:619-670` ✅

- [x] **Step 1: Crear archivo de migración** ✅

```sql
-- Migration: Agregar campos de control de emisiones a tabla vuelos
-- Date: 2026-04-21
-- Author: Sistema

-- Agregar columnas de forma de emisión y cuenta
ALTER TABLE public.vuelos
ADD COLUMN IF NOT EXISTS forma_emision VARCHAR(10) CHECK (forma_emision IN ('CONTADO', 'CREDITO')),
ADD COLUMN IF NOT EXISTS cuenta_emision_original VARCHAR(50),
ADD COLUMN IF NOT EXISTS cuenta_emision_asignada VARCHAR(50);

-- Agregar columnas de control de autorización
ALTER TABLE public.vuelos
ADD COLUMN IF NOT EXISTS autorizado_emision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS autorizado_por UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS fecha_autorizacion_emision TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observaciones_emision TEXT;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_vuelos_autorizado_emision ON public.vuelos(autorizado_emision);
CREATE INDEX IF NOT EXISTS idx_vuelos_forma_emision ON public.vuelos(forma_emision);
CREATE INDEX IF NOT EXISTS idx_vuelos_cuenta_asignada ON public.vuelos(cuenta_emision_asignada);

-- Agregar foreign key para autorizado_por
ALTER TABLE public.vuelos
ADD CONSTRAINT vuelos_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.profiles(id);

-- Comentarios de documentación
COMMENT ON COLUMN public.vuelos.forma_emision IS 'CONTADO o CREDITO - forma de pago al proveedor';
COMMENT ON COLUMN public.vuelos.cuenta_emision_asignada IS 'Cuenta específica donde se emitirá (SERVIVUELO_1, CHASE_NOVA, etc)';
COMMENT ON COLUMN public.vuelos.autorizado_emision IS 'True cuando administración autoriza la emisión';
```

- [x] **Step 2: Ejecutar migración en Supabase** ✅

1. Abrir Supabase Dashboard → SQL Editor
2. Copiar contenido del archivo de migración
3. Ejecutar SQL
4. Verificar que no hay errores

- [x] **Step 3: Poblar datos iniciales para vuelos existentes** ✅

```sql
-- Marcar vuelos de Servivuelo como CONTADO
UPDATE public.vuelos 
SET forma_emision = 'CONTADO',
    cuenta_emision_original = 
      CASE 
        WHEN proveedor ILIKE '%servivuelo%' THEN 'SERVIVUELO_1'
        WHEN proveedor ILIKE '%chase%' THEN 'CHASE_NOVA'
        ELSE NULL
      END
WHERE proveedor ILIKE '%servivuelo%' OR proveedor ILIKE '%chase%';

-- Verificar actualización
SELECT COUNT(*), forma_emision 
FROM public.vuelos 
WHERE forma_emision IS NOT NULL
GROUP BY forma_emision;
```

- [x] **Step 4: Actualizar esquema local de documentación** ✅

Modificar `docs/05-base-de-datos/esquemalocal.sql` agregando las nuevas columnas después de la línea 664:

```sql
  fecha_regreso date,
  hora_salida_regreso time without time zone,
  hora_llegada_regreso time without time zone,
  forma_emision character varying CHECK (forma_emision IN ('CONTADO', 'CREDITO')),
  cuenta_emision_original character varying,
  cuenta_emision_asignada character varying,
  autorizado_emision boolean DEFAULT false,
  autorizado_por uuid,
  fecha_autorizacion_emision timestamp with time zone,
  observaciones_emision text,
  CONSTRAINT vuelos_pkey PRIMARY KEY (id),
```

- [ ] **Step 5: Commit** ⏳ (PENDIENTE)

```bash
git add docs/05-base-de-datos/migrations/20260421_add_control_emisiones_fields.sql
git add docs/05-base-de-datos/migrations/20260421_populate_vuelos_data.sql
git add docs/05-base-de-datos/migrations/20260421_cleanup_failed_migration.sql
git add docs/05-base-de-datos/esquemalocal.sql
git commit -m "feat(db): agregar campos de control de emisiones a tabla vuelos"
```

---

## Tarea 1.2: Crear Tablas de Deudas con Proveedores ✅

**Files:**
- Create: `docs/05-base-de-datos/migrations/20260421_create_deudas_tables.sql` ✅

- [x] **Step 1: Crear migración para tabla deudas_proveedores** ✅

```sql
-- Migration: Crear tablas para control de deudas con proveedores
-- Date: 2026-04-21

-- Tabla de deudas con proveedores
CREATE TABLE IF NOT EXISTS public.deudas_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID NOT NULL REFERENCES public.vuelos(id) ON DELETE CASCADE,
  proveedor VARCHAR(50) NOT NULL,
  cuenta_emision VARCHAR(50) NOT NULL,
  monto_deuda NUMERIC(10, 2) NOT NULL CHECK (monto_deuda >= 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
    CHECK (estado IN ('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO_TOTAL')),
  saldo_pendiente NUMERIC(10, 2) NOT NULL CHECK (saldo_pendiente >= 0),
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_deudas_estado ON public.deudas_proveedores(estado);
CREATE INDEX idx_deudas_proveedor ON public.deudas_proveedores(proveedor);
CREATE INDEX idx_deudas_vuelo ON public.deudas_proveedores(vuelo_id);
CREATE INDEX idx_deudas_fecha_vencimiento ON public.deudas_proveedores(fecha_vencimiento);

-- Comentarios
COMMENT ON TABLE public.deudas_proveedores IS 'Control de deudas generadas por emisiones a crédito';
COMMENT ON COLUMN public.deudas_proveedores.saldo_pendiente IS 'Monto que falta por pagar después de pagos parciales';
```

- [x] **Step 2: Crear tabla pagos_deudas** ✅

```sql
-- Tabla de pagos de deudas
CREATE TABLE IF NOT EXISTS public.pagos_deudas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deuda_id UUID NOT NULL REFERENCES public.deudas_proveedores(id) ON DELETE CASCADE,
  monto_pagado NUMERIC(10, 2) NOT NULL CHECK (monto_pagado > 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(100),
  comprobante_url TEXT,
  fecha_pago DATE NOT NULL,
  registrado_por UUID NOT NULL REFERENCES public.profiles(id),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pagos_deuda ON public.pagos_deudas(deuda_id);
CREATE INDEX idx_pagos_fecha ON public.pagos_deudas(fecha_pago);
CREATE INDEX idx_pagos_registrado_por ON public.pagos_deudas(registrado_por);

-- Comentarios
COMMENT ON TABLE public.pagos_deudas IS 'Registro de pagos realizados a proveedores';
```

- [x] **Step 3: Habilitar Realtime en tabla vuelos** ✅

```sql
-- Habilitar Realtime para que Johan vea autorizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.vuelos;
```

- [x] **Step 4: Ejecutar migración en Supabase** ✅

1. Abrir Supabase Dashboard → SQL Editor
2. Copiar contenido completo del archivo
3. Ejecutar SQL
4. Verificar que las tablas se crearon correctamente

- [x] **Step 5: Verificar Realtime habilitado** ✅

```sql
-- Verificar que vuelos está en realtime
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'vuelos';

-- Debe retornar 1 fila
```

- [ ] **Step 6: Commit** ⏳ (PENDIENTE)

```bash
git add docs/05-base-de-datos/migrations/20260421_create_deudas_tables.sql
git add docs/05-base-de-datos/migrations/20260421_verify_realtime.sql
git commit -m "feat(db): crear tablas de control de deudas con proveedores"
```

---

# FASE 2: Backend - Servicios y API ✅

## Tarea 2.1: Servicio de Autorización de Emisiones ✅

**Files:**
- Modify: `src/services/vuelosService.js`
- Create: `src/services/emisionesService.js` ✅

- [x] **Step 1: Crear servicio de emisiones** ✅

```javascript
// src/services/emisionesService.js
import { supabase } from '../config/supabase.js';
import { notificarEmisionAutorizada, notificarDeudaGenerada } from './notificacionesService.js';

/**
 * Autorizar emisión de un vuelo
 */
export async function autorizarEmision(vueloId, userId, cuentaEmision, observaciones) {
  try {
    // 1. Obtener vuelo
    const { data: vuelo, error: errorVuelo } = await supabase
      .from('vuelos')
      .select('*, created_by, forma_emision')
      .eq('id', vueloId)
      .single();

    if (errorVuelo) throw new Error('Vuelo no encontrado');

    // 2. Validar estado
    if (vuelo.estado !== 'PENDIENTE_EMISION') {
      throw new Error('El vuelo no está en estado PENDIENTE_EMISION');
    }

    // 3. Actualizar vuelo con autorización
    const { data: vueloActualizado, error: errorUpdate } = await supabase
      .from('vuelos')
      .update({
        autorizado_emision: true,
        autorizado_por: userId,
        fecha_autorizacion_emision: new Date().toISOString(),
        cuenta_emision_asignada: cuentaEmision,
        observaciones_emision: observaciones
      })
      .eq('id', vueloId)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    // 4. Si es a crédito, crear deuda
    let deudaCreada = null;
    if (vuelo.forma_emision === 'CREDITO') {
      deudaCreada = await crearDeudaProveedor(vuelo, cuentaEmision);
    }

    // 5. Obtener nombre del admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const adminNombre = admin?.full_name || 'Administración';

    // 6. Notificar a emisor (rol: emisor)
    await notificarEmisionAutorizada(vueloActualizado, adminNombre);

    // 7. Si creó deuda, notificar a administración
    if (deudaCreada) {
      await notificarDeudaGenerada(deudaCreada, vueloActualizado);
    }

    return {
      vuelo: vueloActualizado,
      deuda: deudaCreada
    };
  } catch (error) {
    console.error('Error autorizando emisión:', error);
    throw error;
  }
}

/**
 * Crear deuda con proveedor
 */
async function crearDeudaProveedor(vuelo, cuentaEmision) {
  try {
    // Calcular monto de la deuda (suma de precios_pantalla de pasajeros)
    const { data: pasajeros } = await supabase
      .from('vuelos_pasajeros')
      .select('precio_pantalla')
      .eq('vuelo_id', vuelo.id);

    const montoDeuda = pasajeros.reduce((sum, p) => sum + parseFloat(p.precio_pantalla || 0), 0);

    // Determinar proveedor según cuenta
    const proveedorMap = {
      'SABRE': 'SABRE',
      'AMADEUS': 'AMADEUS',
      'EXPEDIA': 'EXPEDIA'
    };

    const proveedor = Object.keys(proveedorMap).find(key => 
      cuentaEmision.includes(key)
    ) || 'OTRO';

    // Fecha de vencimiento: 30 días desde hoy
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    const { data: deuda, error } = await supabase
      .from('deudas_proveedores')
      .insert({
        vuelo_id: vuelo.id,
        proveedor,
        cuenta_emision: cuentaEmision,
        monto_deuda: montoDeuda,
        saldo_pendiente: montoDeuda,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Deuda creada con ${proveedor}: $${montoDeuda}`);
    return deuda;
  } catch (error) {
    console.error('Error creando deuda:', error);
    return null;
  }
}

/**
 * Autorizar múltiples vuelos en batch
 */
export async function autorizarEmisionBatch(vueloIds, userId, cuentaEmision, observaciones) {
  const resultados = [];
  
  for (const vueloId of vueloIds) {
    try {
      const resultado = await autorizarEmision(vueloId, userId, cuentaEmision, observaciones);
      resultados.push({ vueloId, success: true, ...resultado });
    } catch (error) {
      resultados.push({ vueloId, success: false, error: error.message });
    }
  }

  return resultados;
}

export default {
  autorizarEmision,
  autorizarEmisionBatch
};
```

- [ ] **Step 2: Commit** ⏳ (PENDIENTE)

```bash
git add src/services/emisionesService.js
git commit -m "feat(services): agregar servicio de autorización de emisiones"
```

---

## Tarea 2.2: Funciones de Notificación ✅

**Files:**
- Modify: `src/services/notificacionesService.js` ✅

- [x] **Step 1: Agregar función notificarEmisionAutorizada** ✅

Agregar al final del archivo antes del `export default`:

```javascript
/**
 * Notificar a emisor sobre autorización de emisión
 */
export async function notificarEmisionAutorizada(vuelo, adminNombre) {
  try {
    // Obtener usuarios con rol 'emisor'
    const { data: emisores } = await supabase
      .from('profiles')
      .select('id')
      .eq('role.name', 'emisor');

    if (!emisores || emisores.length === 0) {
      console.warn('No hay usuarios con rol emisor');
      return;
    }

    // Calcular precio base total
    const { data: pasajeros } = await supabase
      .from('vuelos_pasajeros')
      .select('precio_pantalla')
      .eq('vuelo_id', vuelo.id);

    const precioBase = pasajeros?.reduce((sum, p) => sum + parseFloat(p.precio_pantalla || 0), 0) || 0;

    const notificaciones = emisores.map(emisor => ({
      user_id: emisor.id,
      tipo: 'emision_autorizada',
      titulo: '✅ Vuelo autorizado para emisión',
      descripcion: `${adminNombre} autorizó el vuelo ${vuelo.ruta}. Puedes proceder a emitir.`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        ruta: vuelo.ruta,
        cuenta_emision: vuelo.cuenta_emision_asignada,
        precio_base: precioBase,
        localizador: vuelo.localizador,
        pax_nombre: vuelo.pax_nombre,
        accion_requerida: 'Proceder con emisión del vuelo'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones de emisión enviadas a ${emisores.length} emisores`);
  } catch (err) {
    console.error('Error enviando notificación de emisión:', err.message);
  }
}

/**
 * Notificar a administración sobre deuda generada
 */
export async function notificarDeudaGenerada(deuda, vuelo) {
  try {
    // Obtener usuarios con rol 'administracion'
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, role(name)')
      .or('role.name.eq.administracion,role.name.eq.admin,role.name.eq.super_admin');

    if (!admins || admins.length === 0) {
      console.warn('No hay usuarios administradores');
      return;
    }

    const notificaciones = admins.map(admin => ({
      user_id: admin.id,
      tipo: 'deuda_generada',
      titulo: '💳 Nueva deuda generada con proveedor',
      descripcion: `Se generó una deuda de $${deuda.monto_deuda.toFixed(2)} USD con ${deuda.proveedor} por el vuelo ${vuelo.ruta}.`,
      datos: {
        deuda_id: deuda.id,
        proveedor: deuda.proveedor,
        monto_deuda: deuda.monto_deuda,
        vuelo_id: vuelo.id,
        ruta: vuelo.ruta,
        fecha_vencimiento: deuda.fecha_vencimiento,
        accion_requerida: 'Planificar pago antes del vencimiento'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones de deuda enviadas a ${admins.length} administradores`);
  } catch (err) {
    console.error('Error enviando notificación de deuda:', err.message);
  }
}
```

- [x] **Step 2: Actualizar exports** ✅

Modificar el `export default` al final del archivo:

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

- [ ] **Step 3: Commit** ⏳ (PENDIENTE)

```bash
git add src/services/notificacionesService.js
git commit -m "feat(notifications): agregar notificaciones de emisión autorizada y deuda generada"
```

---

## Tarea 2.3: Endpoints de Autorización de Emisiones ✅

**Files:**
- Modify: `src/routes/vuelos.js` ✅

- [x] **Step 1: Importar servicio de emisiones** ✅

Agregar al inicio del archivo después de otros imports:

```javascript
import emisionesService from '../services/emisionesService.js';
```

- [x] **Step 2: Endpoint para autorizar emisión individual** ✅

Agregar antes del `export default router`:

```javascript
/**
 * PATCH /api/vuelos/:id/autorizar-emision - Autorizar emisión (Solo administracion, admin, super_admin)
 */
router.patch('/:id/autorizar-emision', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, cuenta_emision_asignada, observaciones_emision } = req.body;

    // Validar userId
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Validar cuenta de emisión
    if (!cuenta_emision_asignada) {
      return res.status(400).json({ error: 'cuenta_emision_asignada es requerida' });
    }

    // Validar rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Usuario no encontrado' });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administración puede autorizar emisiones'
      });
    }

    // Autorizar emisión
    const resultado = await emisionesService.autorizarEmision(
      id,
      userId,
      cuenta_emision_asignada,
      observaciones_emision
    );

    res.json({
      message: 'Vuelo autorizado para emisión',
      vuelo: resultado.vuelo,
      deuda_creada: resultado.deuda
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/autorizar-emision:', error);
    res.status(500).json({
      error: 'Error al autorizar emisión',
      details: error.message
    });
  }
});
```

- [x] **Step 3: Endpoint para autorizar batch** ✅

```javascript
/**
 * POST /api/vuelos/autorizar-emision-batch - Autorizar múltiples emisiones
 */
router.post('/autorizar-emision-batch', async (req, res) => {
  try {
    const { userId, vuelo_ids, cuenta_emision_asignada, observaciones_emision } = req.body;

    // Validaciones
    if (!userId || !vuelo_ids || !Array.isArray(vuelo_ids)) {
      return res.status(400).json({ 
        error: 'userId y vuelo_ids (array) son requeridos' 
      });
    }

    if (!cuenta_emision_asignada) {
      return res.status(400).json({ error: 'cuenta_emision_asignada es requerida' });
    }

    // Validar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', userId)
      .single();

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Autorizar batch
    const resultados = await emisionesService.autorizarEmisionBatch(
      vuelo_ids,
      userId,
      cuenta_emision_asignada,
      observaciones_emision
    );

    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;

    res.json({
      message: `${exitosos} vuelos autorizados`,
      vuelos_autorizados: exitosos,
      vuelos_fallidos: fallidos,
      resultados
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/autorizar-emision-batch:', error);
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 4: Commit** ⏳ (PENDIENTE)

```bash
git add src/routes/vuelos.js
git commit -m "feat(api): agregar endpoints de autorización de emisiones"
```

---

## Tarea 2.4: Endpoints de Deudas con Proveedores ✅

**Files:**
- Create: `src/routes/deudas.js` ✅
- Modify: `src/server.js` ✅

- [x] **Step 1: Crear archivo de rutas de deudas** ✅

```javascript
// src/routes/deudas.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/deudas-proveedores - Listar deudas con proveedores
 */
router.get('/', async (req, res) => {
  try {
    const { proveedor, estado } = req.query;

    let query = supabase
      .from('deudas_proveedores')
      .select(`
        *,
        vuelo:vuelos(id, ruta, pax_nombre, localizador),
        pagos:pagos_deudas(*)
      `)
      .order('created_at', { ascending: false });

    if (proveedor) {
      query = query.eq('proveedor', proveedor);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data: deudas, error } = await query;

    if (error) throw error;

    // Calcular resumen
    const resumen = {
      total_adeudado: deudas.reduce((sum, d) => sum + parseFloat(d.monto_deuda), 0),
      total_pagado: deudas.reduce((sum, d) => 
        sum + (parseFloat(d.monto_deuda) - parseFloat(d.saldo_pendiente)), 0
      ),
      total_pendiente: deudas.reduce((sum, d) => sum + parseFloat(d.saldo_pendiente), 0)
    };

    res.json({
      deudas,
      resumen
    });

  } catch (error) {
    console.error('Error en GET /api/deudas-proveedores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pagos-deudas - Registrar pago de deuda
 */
router.post('/pagos', async (req, res) => {
  try {
    const {
      deuda_id,
      monto_pagado,
      moneda,
      metodo_pago,
      referencia_pago,
      comprobante_url,
      fecha_pago,
      registrado_por,
      observaciones
    } = req.body;

    // Validaciones
    if (!deuda_id || !monto_pagado || !fecha_pago || !registrado_por) {
      return res.status(400).json({
        error: 'deuda_id, monto_pagado, fecha_pago y registrado_por son requeridos'
      });
    }

    // Validar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', registrado_por)
      .single();

    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];
    if (!rolesPermitidos.includes(profile?.role?.name)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener deuda actual
    const { data: deuda, error: errorDeuda } = await supabase
      .from('deudas_proveedores')
      .select('*')
      .eq('id', deuda_id)
      .single();

    if (errorDeuda) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    // Registrar pago
    const { data: pago, error: errorPago } = await supabase
      .from('pagos_deudas')
      .insert({
        deuda_id,
        monto_pagado: parseFloat(monto_pagado),
        moneda: moneda || 'USD',
        metodo_pago,
        referencia_pago,
        comprobante_url,
        fecha_pago,
        registrado_por,
        observaciones
      })
      .select()
      .single();

    if (errorPago) throw errorPago;

    // Actualizar saldo de deuda
    const nuevoSaldo = parseFloat(deuda.saldo_pendiente) - parseFloat(monto_pagado);
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO_TOTAL' : 'PAGADO_PARCIAL';

    const { data: deudaActualizada, error: errorUpdate } = await supabase
      .from('deudas_proveedores')
      .update({
        saldo_pendiente: nuevoSaldo > 0 ? nuevoSaldo : 0,
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', deuda_id)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      pago,
      deuda_actualizada: deudaActualizada
    });

  } catch (error) {
    console.error('Error en POST /api/pagos-deudas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

- [x] **Step 2: Registrar rutas en server.js** ✅

Agregar import:
```javascript
import deudasRoutes from './routes/deudas.js';
```

Agregar ruta:
```javascript
app.use('/api/deudas-proveedores', deudasRoutes);
```

- [ ] **Step 3: Commit** ⏳ (PENDIENTE)

```bash
git add src/routes/deudas.js
git add src/index.js
git commit -m "feat(api): agregar endpoints de gestión de deudas con proveedores"
```

---

# FASE 3: Frontend - Formulario de Vuelo ✅

## Tarea 3.1: Agregar Campos de Forma de Emisión ✅

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx` ✅

- [x] **Step 1: Agregar estados para forma de emisión** ✅

Buscar la línea donde se define `formData` y agregar los nuevos campos:

```javascript
const [formData, setFormData] = useState({
  // ... campos existentes
  forma_emision: 'CONTADO',
  cuenta_emision_asignada: ''
})
```

- [x] **Step 2: Agregar handler para cambio de cuenta** ✅

Después de la función `handleChange`:

```javascript
const handleCuentaChange = (e) => {
  const cuenta = e.target.value

  // Auto-marcar como contado si es Servivuelo o Chase
  if (cuenta.includes('SERVIVUELO') || cuenta.includes('CHASE')) {
    setFormData(prev => ({
      ...prev,
      cuenta_emision_asignada: cuenta,
      forma_emision: 'CONTADO'
    }))
  } else {
    setFormData(prev => ({
      ...prev,
      cuenta_emision_asignada: cuenta
    }))
  }
}
```

- [x] **Step 3: Agregar sección de Información de Emisión en el JSX** ✅

Buscar la sección de "Observaciones" y agregar ANTES de ella:

```jsx
{/* Sección: Información de Emisión */}
<div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
  <div className="flex items-center gap-2 mb-4">
    <CreditCard className="w-6 h-6 text-purple-600" />
    <h3 className="text-lg font-bold text-gray-900">Información de Emisión</h3>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Cuenta de Emisión */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cuenta de Emisión *
      </label>
      <select
        name="cuenta_emision_asignada"
        value={formData.cuenta_emision_asignada}
        onChange={handleCuentaChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Seleccionar cuenta...</option>
        <option value="SERVIVUELO_1">Servivuelo 1 (Contado)</option>
        <option value="SERVIVUELO_2">Servivuelo 2 (Contado)</option>
        <option value="CHASE_NOVA">Chase Bank Nova (Contado)</option>
        <option value="CHASE_APOLO">Chase Bank Apolo (Contado)</option>
        <option value="SABRE">Sabre (Crédito/Contado)</option>
        <option value="AMADEUS">Amadeus (Crédito/Contado)</option>
        <option value="EXPEDIA">Expedia (Crédito/Contado)</option>
      </select>

      {/* Nota automática para Servivuelo */}
      {formData.cuenta_emision_asignada?.includes('SERVIVUELO') && (
        <p className="mt-2 text-sm text-indigo-600">
          ℹ️ Servivuelo siempre es al contado
        </p>
      )}
    </div>

    {/* Forma de Emisión */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Forma de Emisión *
      </label>
      <div className="flex gap-4 mt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="forma_emision"
            value="CONTADO"
            checked={formData.forma_emision === 'CONTADO'}
            onChange={handleChange}
            disabled={formData.cuenta_emision_asignada?.includes('SERVIVUELO') ||
                      formData.cuenta_emision_asignada?.includes('CHASE')}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-900">Contado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="forma_emision"
            value="CREDITO"
            checked={formData.forma_emision === 'CREDITO'}
            onChange={handleChange}
            disabled={formData.cuenta_emision_asignada?.includes('SERVIVUELO') ||
                      formData.cuenta_emision_asignada?.includes('CHASE')}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-900">Crédito</span>
        </label>
      </div>

      {formData.forma_emision === 'CREDITO' && (
        <p className="mt-2 text-sm text-amber-600">
          ⚠️ Se generará una deuda con el proveedor
        </p>
      )}
    </div>
  </div>
</div>
```

- [x] **Step 4: Agregar import de CreditCard** ✅

Al inicio del archivo, agregar `CreditCard` al import de lucide-react:

```javascript
import { ... , CreditCard } from 'lucide-react'
```

- [x] **Step 5: Incluir campos en el envío al backend** ✅

Buscar la función `handleSubmit` y verificar que `formData` completo se envía (ya debería incluir los nuevos campos automáticamente).

- [ ] **Step 6: Commit** ⏳ (PENDIENTE)

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat(vuelos): agregar campos de forma y cuenta de emisión en formulario"
```

---

## Tarea 3.2: Actualizar Configuración de API ✅

**Files:**
- Modify: `dashboard/src/config/apiConfig.js` ✅

- [x] **Step 1: Agregar endpoints de emisiones** ✅

Buscar el objeto `VUELOS_API` y agregar:

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  autorizarEmision: (id) => `${API_BASE_URL}/vuelos/${id}/autorizar-emision`,
  autorizarEmisionBatch: () => `${API_BASE_URL}/vuelos/autorizar-emision-batch`
}
```

- [x] **Step 2: Agregar API de deudas** ✅

Después del objeto `VUELOS_API`:

```javascript
export const DEUDAS_API = {
  listar: () => `${API_BASE_URL}/deudas-proveedores`,
  registrarPago: () => `${API_BASE_URL}/deudas-proveedores/pagos`
}
```

- [ ] **Step 3: Commit** ⏳ (PENDIENTE)

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "feat(config): agregar endpoints de emisiones y deudas"
```

---

# FASE 4: Frontend - Control de Emisiones ✅

## Tarea 4.1: Crear Vista de Control de Emisiones ✅

**Files:**
- Create: `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx` ✅

- [x] **Step 1: Crear componente base** ✅

```jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Loader2, Package, AlertTriangle, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'

export default function ControlEmisionesPage() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [autorizando, setAutorizando] = useState(false)
  const [seleccionados, setSeleccionados] = useState(new Set())

  useEffect(() => {
    if (user) {
      cargarVuelosPendientes()
    }
  }, [user])

  const cargarVuelosPendientes = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('vuelos')
        .select(`
          *,
          pasajeros:vuelos_pasajeros(*)
        `)
        .eq('estado', 'PENDIENTE_EMISION')
        .eq('autorizado_emision', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVuelos(data || [])
    } catch (error) {
      console.error('Error cargando vuelos:', error)
      toastError('Error al cargar vuelos pendientes')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar vuelos por cuenta de emisión
  const vuelosPorCuenta = useMemo(() => {
    const agrupados = {}
    
    vuelos.forEach(vuelo => {
      const cuenta = vuelo.cuenta_emision_asignada || 'SIN_CUENTA'
      if (!agrupados[cuenta]) {
        agrupados[cuenta] = []
      }
      agrupados[cuenta].push(vuelo)
    })

    return agrupados
  }, [vuelos])

  const toggleSeleccion = (vueloId) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(vueloId)) {
        nuevo.delete(vueloId)
      } else {
        nuevo.add(vueloId)
      }
      return nuevo
    })
  }

  const autorizarSeleccionados = async (cuenta) => {
    const vuelosDeEstaCuenta = vuelosPorCuenta[cuenta]
      .filter(v => seleccionados.has(v.id))
      .map(v => v.id)

    if (vuelosDeEstaCuenta.length === 0) {
      toastError('No hay vuelos seleccionados para esta cuenta')
      return
    }

    try {
      setAutorizando(true)

      const response = await fetch(VUELOS_API.autorizarEmisionBatch(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          vuelo_ids: vuelosDeEstaCuenta,
          cuenta_emision_asignada: cuenta,
          observaciones_emision: `Autorizado en batch desde control de emisiones`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al autorizar emisiones')
      }

      const data = await response.json()
      toastSuccess(`${data.vuelos_autorizados} vuelos autorizados exitosamente`)
      
      // Limpiar selección
      setSeleccionados(new Set())
      
      // Recargar lista
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error autorizando emisiones:', error)
      toastError(error.message)
    } finally {
      setAutorizando(false)
    }
  }

  const calcularTotal = (vuelosCuenta) => {
    return vuelosCuenta.reduce((sum, vuelo) => {
      const totalPasajeros = vuelo.pasajeros?.reduce((s, p) => 
        s + parseFloat(p.precio_pantalla || 0), 0
      ) || 0
      return sum + totalPasajeros
    }, 0)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando control de emisiones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Control de Emisiones</h1>
          <p className="text-gray-600 mt-2">
            Vuelos pendientes de autorización para emisión
          </p>
        </div>

        {/* Lista agrupada por cuenta */}
        {Object.keys(vuelosPorCuenta).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay vuelos pendientes de autorización
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido autorizados o no hay vuelos con pago confirmado
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(vuelosPorCuenta).map(([cuenta, vuelosCuenta]) => {
              const total = calcularTotal(vuelosCuenta)
              const seleccionadosCuenta = vuelosCuenta.filter(v => seleccionados.has(v.id)).length
              const esCredito = vuelosCuenta.some(v => v.forma_emision === 'CREDITO')

              return (
                <div key={cuenta} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header de cuenta */}
                  <div className={`p-4 ${esCredito ? 'bg-amber-50 border-b border-amber-200' : 'bg-indigo-50 border-b border-indigo-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {esCredito ? (
                          <CreditCard className="w-6 h-6 text-amber-600" />
                        ) : (
                          <Package className="w-6 h-6 text-indigo-600" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {cuenta.replace(/_/g, ' ')}
                            {esCredito && <span className="ml-2 text-sm font-normal text-amber-600">- A Crédito</span>}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {vuelosCuenta.length} vuelos • Total: ${total.toFixed(2)} USD
                          </p>
                        </div>
                      </div>
                      {seleccionadosCuenta > 0 && (
                        <button
                          onClick={() => autorizarSeleccionados(cuenta)}
                          disabled={autorizando}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {autorizando ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Autorizando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Autorizar Seleccionados ({seleccionadosCuenta})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {esCredito && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Generará deuda con proveedor</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de vuelos */}
                  <div className="divide-y divide-gray-200">
                    {vuelosCuenta.map(vuelo => {
                      const precioBase = vuelo.pasajeros?.reduce((s, p) => 
                        s + parseFloat(p.precio_pantalla || 0), 0
                      ) || 0

                      return (
                        <div key={vuelo.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={seleccionados.has(vuelo.id)}
                              onChange={() => toggleSeleccion(vuelo.id)}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <div className="flex-1 grid grid-cols-5 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.ruta}</p>
                                <p className="text-xs text-gray-500">Ruta</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">${precioBase.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Precio Base</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 font-mono">{vuelo.localizador || 'N/A'}</p>
                                <p className="text-xs text-gray-500">Localizador</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.pax_nombre}</p>
                                <p className="text-xs text-gray-500">Pasajero</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.proveedor}</p>
                                <p className="text-xs text-gray-500">Proveedor</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit** ⏳ (PENDIENTE)

```bash
git add dashboard/src/app/(crm)/admin/control-emisiones/page.jsx
git commit -m "feat(admin): crear vista de control de emisiones"
```

---

# FASE 5: Frontend - Emisiones Realtime ✅

## Tarea 5.1: Implementar Supabase Realtime en VuelosList ✅

**Files:**
- Modify: `dashboard/src/components/vuelos/VuelosList.jsx` ✅

- [x] **Step 1: Implementar suscripción Supabase Realtime** ✅

Agregado useEffect con suscripción a la tabla `vuelos` para detectar cambios en `autorizado_emision`. Cuando administración autoriza una emisión, la página del emisor se actualiza automáticamente.

**Implementación:**
- Import de `supabase` desde `@/lib/supabase`
- Import de `useEffect` desde React
- Suscripción a evento `UPDATE` en tabla `vuelos` con filtro `autorizado_emision=eq.true`
- Recarga automática de vuelos cuando se detecta una autorización
- Cleanup correcto del canal al desmontar

- [ ] **Step 2: Commit** ⏳ (PENDIENTE)

```bash
git add dashboard/src/components/vuelos/VuelosList.jsx
git commit -m "feat(vuelos): agregar supabase realtime para autorizaciones de emisiones"
```

---

# FASE 6: Gestión de Deudas ✅

## Tarea 6.1: Crear Vista de Gestión de Deudas ✅

**Files:**
- Create: `dashboard/src/app/(crm)/admin/deudas/page.jsx` ✅

- [x] **Step 1: Crear vista de gestión de deudas con proveedores** ✅

Creada vista completa de gestión de deudas con:
- Resumen financiero (total adeudado, total pagado, saldo pendiente)
- Lista de deudas con información de vuelos asociados
- Filtros por proveedor, estado y búsqueda
- Indicadores visuales de estado (PENDIENTE, PAGADO_PARCIAL, PAGADO_TOTAL)
- Alertas de deudas vencidas
- Modal de registro de pagos integrado

## Tarea 6.2: Formulario de Registro de Pagos ✅

**Files:**
- Integrado en `dashboard/src/app/(crm)/admin/deudas/page.jsx` ✅

- [x] **Step 1: Crear formulario de registro de pagos** ✅

Formulario de registro de pagos integrado en la vista de deudas:
- Modal con información de la deuda seleccionada
- Campos: monto a pagar, método de pago, referencia, fecha, observaciones
- Validación de monto máximo (saldo pendiente)
- Integración con API de pagos de deudas
- Actualización automática de la lista después de registrar pago

- [ ] **Step 2: Commit** ⏳ (PENDIENTE)

```bash
git add dashboard/src/app/(crm)/admin/deudas/page.jsx
git commit -m "feat(admin): crear vista de gestión de deudas con proveedores"
```

---

# FASE 7: Testing y Documentación ✅

## Tarea 7.1: Documentación de Usuario ✅

**Files:**
- Create: `docs/control-emisiones/usuario.md` ✅

- [x] **Step 1: Crear documentación de usuario** ✅

Creada guía completa de usuario con:
- Introducción al sistema
- Flujo de trabajo detallado
- Roles y permisos
- Funcionalidades por rol
- Guías paso a paso para escenarios comunes
- Preguntas frecuentes

## Tarea 7.2: Documentación Técnica ✅

**Files:**
- Create: `docs/control-emisiones/tecnica.md` ✅

- [x] **Step 1: Crear documentación técnica** ✅

Creada documentación técnica completa con:
- Arquitectura del sistema
- Esquema de base de datos
- Endpoints de API
- Componentes de frontend
- Configuración de Supabase Realtime
- Flujo de datos
- Seguridad y autorización
- Consideraciones de performance
- Troubleshooting

## Tarea 7.3: Testing ✅

**Estado:** Completado por el usuario

- [x] **Testing manual de todas las funcionalidades** ✅
- [x] **Verificación de flujo completo** ✅
- [x] **Pruebas de autorización de emisiones** ✅
- [x] **Pruebas de gestión de deudas** ✅
- [x] **Pruebas de Supabase Realtime** ✅

- [ ] **Step 2: Commit** ⏳ (PENDIENTE)

```bash
git add docs/control-emisiones/
git commit -m "docs: agregar documentación completa del sistema de control de emisiones"
```

---

## 🎉 Implementación Completada

### Resumen del Proyecto

El Sistema de Control de Emisiones ha sido implementado exitosamente en el ERP Nova CRM. El sistema permite:

1. **Control de Autorizaciones**: Administración debe autorizar cada emisión antes de procesarla
2. **Gestión de Cuentas**: Asignación de cuentas específicas para cada emisión
3. **Control de Deudas**: Registro automático de deudas cuando se emite a crédito
4. **Sincronización en Tiempo Real**: Actualización automática entre administración y emisor
5. **Gestión Financiera**: Vista completa de deudas con proveedores y registro de pagos

### Fases Completadas

- ✅ **FASE 1**: Base de Datos y Migraciones - COMPLETADA
- ✅ **FASE 2**: Backend - Servicios y API - COMPLETADA
- ✅ **FASE 3**: Frontend - Formulario de Vuelo - COMPLETADA
- ✅ **FASE 4**: Frontend - Control de Emisiones - COMPLETADA
- ✅ **FASE 5**: Frontend - Emisiones Realtime - COMPLETADA
- ✅ **FASE 6**: Gestión de Deudas - COMPLETADA
- ✅ **FASE 7**: Testing y Documentación - COMPLETADA

### Archivos Creados/Modificados

**Base de Datos:**
- `migrations/2026-04-21-control-emisiones.sql` - Migraciones SQL

**Backend:**
- `src/routes/vuelos.js` - Endpoints de autorización de emisiones
- `src/routes/deudas.js` - Endpoints de gestión de deudas
- `src/services/vuelosService.js` - Lógica de autorización
- `src/services/deudasService.js` - Lógica de deudas
- `src/services/emisionesService.js` - Servicio de emisiones
- `src/services/notificacionesService.js` - Servicio de notificaciones

**Frontend:**
- `dashboard/src/components/vuelos/VueloFormNuevo.jsx` - Formulario con campos de emisión
- `dashboard/src/components/vuelos/VuelosList.jsx` - Lista con Supabase Realtime
- `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx` - Vista de control de emisiones
- `dashboard/src/app/(crm)/admin/deudas/page.jsx` - Vista de gestión de deudas
- `dashboard/src/config/apiConfig.js` - Configuración de endpoints

**Documentación:**
- `docs/control-emisiones/usuario.md` - Guía de usuario
- `docs/control-emisiones/tecnica.md` - Documentación técnica
- `docs/superpowers/plans/2026-04-21-control-emisiones-implementation.md` - Plan de implementación

### Próximos Pasos Recomendados

1. **Commits Pendientes**: Realizar commits de todas las fases
2. **Despliegue**: Desplegar a producción después de revisión
3. **Capacitación**: Capacitar a usuarios (asesores, emisores, administración)
4. **Monitoreo**: Monitorear el uso y performance del sistema
5. **Mejoras Futuras**:
   - Historial de pagos de deudas
   - Reportes de deudas por período
   - Notificaciones de vencimiento de deudas
   - Exportación de reportes a PDF/Excel

---

**Fecha de finalización:** 2026-04-22
**Estado del proyecto:** ✅ COMPLETADO
**Versión:** 1.0
