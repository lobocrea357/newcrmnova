# Plan de Implementación: Módulo de Gestión de Vuelos + Anulables

## 📋 Resumen Ejecutivo

Módulo para gestionar vuelos pagados que permite a asesores y admins registrar toda la información del vuelo, adjuntar comprobantes de pago y pasaportes, y conectar automáticamente con el sistema de anulables según el tipo de vuelo.

### Requisitos Clave
- ✅ Todos los pagos están completos al momento del registro
- ✅ Clasificación por tipo de vuelo (determina si va a anulables)
- ✅ Adjuntar múltiples comprobantes de pago
- ✅ Adjuntar múltiples pasaportes
- ✅ Asesores y admins pueden crear/editar vuelos
- ✅ Estado de anulación: Anulado / No Anulado
- 🔜 Notificaciones (módulo posterior)

---

## 🗄️ PASO 1: Diseño de Base de Datos

### Tabla: `vuelos`
```sql
CREATE TABLE vuelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  
  -- Información del PAX
  pax_nombre TEXT NOT NULL,
  num_adultos INTEGER DEFAULT 0,
  num_ninos INTEGER DEFAULT 0,
  num_infantes INTEGER DEFAULT 0,
  contacto_nombre TEXT NOT NULL,
  contacto_telefono TEXT NOT NULL,
  
  -- Información del Vuelo
  fecha_vuelo DATE NOT NULL,
  ruta TEXT NOT NULL, -- ej: "BOG-MAD"
  horario TIME,
  aerolinea_codigo TEXT, -- código IATA (ej: "AV")
  aerolinea_nombre TEXT,
  localizador TEXT NOT NULL, -- LOC/PNR
  proveedor TEXT NOT NULL, -- ej: "SABRE VIRAMUNDO"
  
  -- Información Financiera
  monto_venta DECIMAL(10,2) NOT NULL,
  monto_sabre DECIMAL(10,2),
  monto_expedia DECIMAL(10,2),
  monto_emision DECIMAL(10,2),
  monto_fee DECIMAL(10,2), -- calculado
  metodo_pago TEXT, -- ej: "ZELLE", "TRANSFERENCIA"
  
  -- Control de Tipo y Anulables
  tipo_vuelo TEXT NOT NULL, -- "MIGRACION", "TURISMO", "NEGOCIOS", etc.
  requiere_anulable BOOLEAN DEFAULT FALSE,
  anulable_id UUID REFERENCES anulables(id),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Índices para búsqueda
  CONSTRAINT vuelos_localizador_unique UNIQUE(localizador)
);

CREATE INDEX idx_vuelos_fecha ON vuelos(fecha_vuelo);
CREATE INDEX idx_vuelos_created_by ON vuelos(created_by);
CREATE INDEX idx_vuelos_tipo ON vuelos(tipo_vuelo);
CREATE INDEX idx_vuelos_anulable ON vuelos(anulable_id);
```

### Tabla: `vuelos_adjuntos`
```sql
CREATE TABLE vuelos_adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE NOT NULL,
  tipo_adjunto TEXT NOT NULL, -- "COMPROBANTE_PAGO", "PASAPORTE"
  nombre_archivo TEXT NOT NULL,
  url_storage TEXT NOT NULL, -- URL en Supabase Storage
  mime_type TEXT,
  tamano_bytes INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) NOT NULL
);

CREATE INDEX idx_vuelos_adjuntos_vuelo ON vuelos_adjuntos(vuelo_id);
CREATE INDEX idx_vuelos_adjuntos_tipo ON vuelos_adjuntos(tipo_adjunto);
```

### Tabla: `anulables` (actualización)
```sql
-- Si no existe, crear tabla anulables
CREATE TABLE IF NOT EXISTS anulables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación con vuelo
  vuelo_id UUID REFERENCES vuelos(id),
  
  -- Información básica
  pax_nombre TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  fecha_vuelo DATE,
  ruta TEXT,
  localizador TEXT,
  
  -- Estado de anulación
  estado_anulacion TEXT DEFAULT 'PENDIENTE', -- "PENDIENTE", "ANULADO", "NO_ANULADO"
  fecha_limite DATE,
  fecha_anulacion DATE,
  monto_recuperado DECIMAL(10,2),
  
  -- Observaciones
  motivo_anulacion TEXT,
  observaciones TEXT,
  
  -- Asignación
  asignado_a UUID REFERENCES users(id)
);

CREATE INDEX idx_anulables_vuelo ON anulables(vuelo_id);
CREATE INDEX idx_anulables_estado ON anulables(estado_anulacion);
```

### Bucket de Storage en Supabase
```
vuelos-adjuntos/
  ├── comprobantes/
  │   └── {vuelo_id}/
  │       ├── comprobante_1.pdf
  │       └── comprobante_2.jpg
  └── pasaportes/
      └── {vuelo_id}/
          ├── pasaporte_1.pdf
          └── pasaporte_2.jpg
```

---

## 🔧 PASO 2: Configuración de Supabase

### 2.1 Crear migraciones SQL
**Archivo**: `supabase/migrations/YYYYMMDDHHMMSS_create_vuelos_tables.sql`

### 2.2 Configurar Storage Bucket
- Crear bucket `vuelos-adjuntos`
- Configurar políticas RLS:
  - Asesores y admins pueden subir archivos
  - Todos los usuarios autenticados pueden ver archivos

### 2.3 Políticas RLS (Row Level Security)
```sql
-- Vuelos: Asesores y admins pueden ver/crear/editar
ALTER TABLE vuelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asesores y admins pueden ver vuelos"
  ON vuelos FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('asesor', 'admin')
  ));

CREATE POLICY "Asesores y admins pueden crear vuelos"
  ON vuelos FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('asesor', 'admin')
  ));

CREATE POLICY "Asesores y admins pueden editar vuelos"
  ON vuelos FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('asesor', 'admin')
  ));

-- Adjuntos: Seguir permisos del vuelo
ALTER TABLE vuelos_adjuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver adjuntos de vuelos accesibles"
  ON vuelos_adjuntos FOR SELECT
  USING (vuelo_id IN (
    SELECT id FROM vuelos WHERE auth.uid() IN (
      SELECT id FROM users WHERE role IN ('asesor', 'admin')
    )
  ));
```

---

## 💻 PASO 3: Estructura de Archivos

```
dashboard/
├── app/
│   ├── vuelos/
│   │   ├── page.tsx                    # Lista de vuelos
│   │   ├── nuevo/
│   │   │   └── page.tsx                # Formulario nuevo vuelo
│   │   └── [id]/
│   │       ├── page.tsx                # Detalle de vuelo
│   │       └── editar/
│   │           └── page.tsx            # Editar vuelo
│   └── api/
│       └── vuelos/
│           ├── route.ts                # GET (lista), POST (crear)
│           ├── [id]/
│           │   ├── route.ts            # GET, PUT, DELETE
│           │   └── adjuntos/
│           │       └── route.ts        # POST (subir), DELETE
│           └── [id]/anular/
│               └── route.ts            # POST (crear anulable)
├── components/
│   └── vuelos/
│       ├── VueloForm.tsx               # Formulario principal
│       ├── VueloCard.tsx               # Card en lista
│       ├── VueloDetail.tsx             # Vista detallada
│       ├── VuelosList.tsx              # Lista con filtros
│       ├── FileUpload.tsx              # Componente de upload
│       ├── AdjuntosList.tsx            # Lista de adjuntos
│       └── WhatsAppFormat.tsx          # Generador formato WA
└── lib/
    ├── types/
    │   └── vuelos.ts                   # Tipos TypeScript
    ├── validations/
    │   └── vuelos.ts                   # Schemas Zod
    └── utils/
        ├── vuelos-calculations.ts      # Cálculos de montos
        └── vuelos-storage.ts           # Helpers de storage
```

---

## 🎯 PASO 4: Implementación del Backend

### 4.1 Tipos TypeScript
**Archivo**: `lib/types/vuelos.ts`

```typescript
export type TipoVuelo = 'MIGRACION' | 'TURISMO' | 'NEGOCIOS' | 'OTRO';
export type TipoAdjunto = 'COMPROBANTE_PAGO' | 'PASAPORTE';
export type EstadoAnulacion = 'PENDIENTE' | 'ANULADO' | 'NO_ANULADO';

export interface Vuelo {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // PAX
  pax_nombre: string;
  num_adultos: number;
  num_ninos: number;
  num_infantes: number;
  contacto_nombre: string;
  contacto_telefono: string;
  
  // Vuelo
  fecha_vuelo: string;
  ruta: string;
  horario?: string;
  aerolinea_codigo?: string;
  aerolinea_nombre?: string;
  localizador: string;
  proveedor: string;
  
  // Financiero
  monto_venta: number;
  monto_sabre?: number;
  monto_expedia?: number;
  monto_emision?: number;
  monto_fee?: number;
  metodo_pago?: string;
  
  // Control
  tipo_vuelo: TipoVuelo;
  requiere_anulable: boolean;
  anulable_id?: string;
  observaciones?: string;
}

export interface VueloAdjunto {
  id: string;
  vuelo_id: string;
  tipo_adjunto: TipoAdjunto;
  nombre_archivo: string;
  url_storage: string;
  mime_type?: string;
  tamano_bytes?: number;
  uploaded_at: string;
  uploaded_by: string;
}

export interface CreateVueloInput {
  pax_nombre: string;
  num_adultos: number;
  num_ninos: number;
  num_infantes: number;
  contacto_nombre: string;
  contacto_telefono: string;
  fecha_vuelo: string;
  ruta: string;
  horario?: string;
  aerolinea_codigo?: string;
  aerolinea_nombre?: string;
  localizador: string;
  proveedor: string;
  monto_venta: number;
  monto_sabre?: number;
  monto_expedia?: number;
  monto_emision?: number;
  metodo_pago?: string;
  tipo_vuelo: TipoVuelo;
  requiere_anulable: boolean;
  observaciones?: string;
}
```

### 4.2 Validaciones Zod
**Archivo**: `lib/validations/vuelos.ts`

```typescript
import { z } from 'zod';

export const vueloSchema = z.object({
  pax_nombre: z.string().min(1, 'Nombre del PAX requerido'),
  num_adultos: z.number().min(0),
  num_ninos: z.number().min(0),
  num_infantes: z.number().min(0),
  contacto_nombre: z.string().min(1, 'Contacto requerido'),
  contacto_telefono: z.string().min(1, 'Teléfono requerido'),
  fecha_vuelo: z.string().min(1, 'Fecha requerida'),
  ruta: z.string().min(1, 'Ruta requerida'),
  horario: z.string().optional(),
  aerolinea_codigo: z.string().optional(),
  aerolinea_nombre: z.string().optional(),
  localizador: z.string().min(1, 'Localizador requerido'),
  proveedor: z.string().min(1, 'Proveedor requerido'),
  monto_venta: z.number().positive('Monto de venta debe ser positivo'),
  monto_sabre: z.number().optional(),
  monto_expedia: z.number().optional(),
  monto_emision: z.number().optional(),
  metodo_pago: z.string().optional(),
  tipo_vuelo: z.enum(['MIGRACION', 'TURISMO', 'NEGOCIOS', 'OTRO']),
  requiere_anulable: z.boolean(),
  observaciones: z.string().optional(),
});
```

### 4.3 API Routes

**Archivo**: `app/api/vuelos/route.ts`
- `GET`: Lista de vuelos con filtros
- `POST`: Crear nuevo vuelo (+ crear anulable si aplica)

**Archivo**: `app/api/vuelos/[id]/route.ts`
- `GET`: Obtener vuelo por ID
- `PUT`: Actualizar vuelo
- `DELETE`: Eliminar vuelo

**Archivo**: `app/api/vuelos/[id]/adjuntos/route.ts`
- `POST`: Subir adjunto (comprobante o pasaporte)
- `DELETE`: Eliminar adjunto

---

## 🎨 PASO 5: Implementación del Frontend

### 5.1 Formulario de Vuelo
**Componente**: `VueloForm.tsx`

**Secciones del formulario:**

1. **Información del PAX**
   - Nombre del PAX (text)
   - Adultos (number)
   - Niños (number)
   - Infantes (number)
   - Contacto nombre (text)
   - Contacto teléfono (text)

2. **Detalles del Vuelo**
   - Fecha del vuelo (date)
   - Ruta (text) ej: "BOG-MAD"
   - Horario (time)
   - Código aerolínea IATA (text)
   - Nombre aerolínea (text)
   - Localizador/PNR (text)
   - Proveedor (select/text)

3. **Información Financiera**
   - Monto venta (number)
   - Monto Sabre (number)
   - Monto Expedia (number)
   - Monto emisión (number)
   - **Fee (calculado automáticamente)**: Venta - Sabre - Expedia - Emisión
   - Método de pago (select)

4. **Control de Anulables**
   - Tipo de vuelo (select): Migración, Turismo, Negocios, Otro
   - ¿Requiere anulable? (toggle)
   - Observaciones (textarea)

5. **Adjuntos**
   - **Comprobantes de Pago** (file upload múltiple)
     - Formatos: PDF, JPG, PNG
     - Vista previa de archivos subidos
   - **Pasaportes** (file upload múltiple)
     - Formatos: PDF, JPG, PNG
     - Vista previa de archivos subidos

### 5.2 Lista de Vuelos
**Componente**: `VuelosList.tsx`

**Características:**
- Tabla con columnas:
  - Fecha vuelo
  - PAX
  - Ruta
  - Aerolínea
  - Localizador
  - Tipo vuelo
  - Badge si tiene anulable
  - Acciones (Ver, Editar, Eliminar)
- Filtros:
  - Por fecha (rango)
  - Por tipo de vuelo
  - Por aerolínea
  - Por asesor
  - Con/sin anulable
- Búsqueda por:
  - Nombre PAX
  - Localizador
  - Ruta
- Paginación

### 5.3 Vista de Detalle
**Componente**: `VueloDetail.tsx`

**Secciones:**
1. **Card principal** con toda la info del vuelo
2. **Formato WhatsApp** (botón copiar)
3. **Adjuntos**:
   - Lista de comprobantes de pago (descargar/ver)
   - Lista de pasaportes (descargar/ver)
4. **Información del anulable** (si existe)
   - Link al caso de anulable
   - Estado actual
5. **Timeline de actividad**
   - Creación
   - Ediciones
   - Adjuntos agregados
   - Anulable creado

### 5.4 Componente de Upload
**Componente**: `FileUpload.tsx`

**Funcionalidad:**
- Drag & drop
- Click para seleccionar
- Múltiples archivos
- Vista previa
- Validación de tipo y tamaño
- Progress bar durante upload
- Eliminar archivo antes de guardar

---

## 🔗 PASO 6: Integración con Anulables

### Lógica de Integración

**Cuando se crea un vuelo con `requiere_anulable = true`:**

1. Crear registro en tabla `vuelos`
2. Crear automáticamente registro en tabla `anulables`:
   ```typescript
   {
     vuelo_id: vuelo.id,
     pax_nombre: vuelo.pax_nombre,
     contacto_nombre: vuelo.contacto_nombre,
     contacto_telefono: vuelo.contacto_telefono,
     fecha_vuelo: vuelo.fecha_vuelo,
     ruta: vuelo.ruta,
     localizador: vuelo.localizador,
     estado_anulacion: 'PENDIENTE',
     fecha_limite: calcularFechaLimite(vuelo.fecha_vuelo), // ej: 7 días antes
     observaciones: `Vuelo tipo ${vuelo.tipo_vuelo} - ${vuelo.observaciones}`
   }
   ```
3. Actualizar `vuelo.anulable_id` con el ID del anulable creado
4. Mostrar confirmación al usuario

**Función helper:**
```typescript
// lib/utils/vuelos-calculations.ts
export function calcularFechaLimite(fechaVuelo: string): string {
  const fecha = new Date(fechaVuelo);
  fecha.setDate(fecha.getDate() - 7); // 7 días antes del vuelo
  return fecha.toISOString().split('T')[0];
}

export function calcularFee(venta: number, sabre?: number, expedia?: number, emision?: number): number {
  const costos = (sabre || 0) + (expedia || 0) + (emision || 0);
  return venta - costos;
}
```

---

## 🎯 PASO 7: Navegación y Menú

### Actualizar Menú Lateral
**Archivo**: `components/Sidebar.tsx` o similar

Agregar ítem de menú:
```typescript
{
  name: 'Vuelos',
  href: '/vuelos',
  icon: Plane, // de lucide-react
  badge: cantidadVuelosProximos, // opcional
}
```

### Rutas
- `/vuelos` → Lista de vuelos
- `/vuelos/nuevo` → Crear vuelo
- `/vuelos/[id]` → Ver detalle
- `/vuelos/[id]/editar` → Editar vuelo

---

## ✅ PASO 8: Testing y Validación

### Casos de Prueba

1. **Crear vuelo sin anulable**
   - Llenar formulario
   - Subir comprobantes y pasaportes
   - Verificar que se guarda correctamente
   - Verificar que NO se crea anulable

2. **Crear vuelo con anulable**
   - Marcar "Requiere anulable"
   - Verificar que se crea vuelo
   - Verificar que se crea anulable automáticamente
   - Verificar vinculación entre ambos

3. **Editar vuelo existente**
   - Modificar datos
   - Agregar/eliminar adjuntos
   - Verificar actualización

4. **Cálculo automático de Fee**
   - Ingresar montos
   - Verificar que Fee se calcula correctamente

5. **Upload de archivos**
   - Subir múltiples comprobantes
   - Subir múltiples pasaportes
   - Verificar almacenamiento en Supabase Storage
   - Verificar descarga

6. **Permisos**
   - Verificar que asesores pueden crear/editar
   - Verificar que admins pueden crear/editar
   - Verificar que otros roles NO pueden acceder

---

## 📊 PASO 9: Dashboard y Reportes (Opcional)

### Métricas a Mostrar
- Total de vuelos del mes
- Vuelos próximos (7 días)
- Vuelos con anulables pendientes
- Fee total generado
- Distribución por aerolínea
- Distribución por tipo de vuelo

---

## 🚀 Orden de Implementación

### Sprint 1: Base de Datos y Backend
1. ✅ Crear migraciones SQL
2. ✅ Configurar Storage bucket
3. ✅ Implementar RLS policies
4. ✅ Crear tipos TypeScript
5. ✅ Crear validaciones Zod
6. ✅ Implementar API routes básicos

### Sprint 2: Formulario y Creación
1. ✅ Crear componente VueloForm
2. ✅ Implementar FileUpload component
3. ✅ Conectar formulario con API
4. ✅ Implementar lógica de creación de anulable
5. ✅ Testing de creación

### Sprint 3: Lista y Detalle
1. ✅ Crear VuelosList component
2. ✅ Implementar filtros y búsqueda
3. ✅ Crear VueloDetail component
4. ✅ Implementar visualización de adjuntos
5. ✅ Agregar generador de formato WhatsApp

### Sprint 4: Edición y Refinamiento
1. ✅ Implementar edición de vuelos
2. ✅ Agregar/eliminar adjuntos en vuelos existentes
3. ✅ Actualizar menú de navegación
4. ✅ Testing completo
5. ✅ Ajustes de UX

---

## 📝 Notas Importantes

- **Todos los pagos están completos**: No necesitamos estados de pago
- **Tipos de vuelo**: Determina si va o no a anulables
- **Adjuntos múltiples**: Comprobantes y pasaportes pueden ser varios
- **Permisos**: Solo asesores y admins
- **Estado anulable**: Simple (Anulado / No Anulado / Pendiente)
- **Notificaciones**: Módulo futuro, no implementar ahora

---

## 🎨 Consideraciones de UX

1. **Cálculo automático**: El fee se calcula automáticamente
2. **Validación en tiempo real**: Mostrar errores mientras se escribe
3. **Vista previa de archivos**: Antes de subir
4. **Confirmaciones**: Al crear anulable automático
5. **Feedback visual**: Loading states, success/error messages
6. **Responsive**: Funcional en mobile y desktop
7. **Accesibilidad**: Labels, ARIA, keyboard navigation

---

## 🔐 Seguridad

1. **RLS en Supabase**: Solo usuarios autorizados
2. **Validación backend**: Nunca confiar en frontend
3. **Storage privado**: Archivos solo accesibles por autenticados
4. **Sanitización**: Limpiar inputs antes de guardar
5. **Rate limiting**: Prevenir abuso de uploads

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0", // Ya existe
    "zod": "^3.22.4", // Para validaciones
    "react-dropzone": "^14.2.3", // Para file upload
    "date-fns": "^3.0.0" // Para manejo de fechas
  }
}
```

---

## ✨ Mejoras Futuras (Post-MVP)

1. ✅ Notificaciones por WhatsApp/Email
2. ✅ Dashboard con métricas
3. ✅ Exportar reportes (Excel/PDF)
4. ✅ Historial de cambios detallado
5. ✅ Integración con calendario
6. ✅ Alertas automáticas (7 días antes del vuelo)
7. ✅ Búsqueda avanzada con filtros complejos
8. ✅ Bulk operations (editar múltiples vuelos)

---

**¿Listo para empezar? 🚀**
