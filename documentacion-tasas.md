# Documentación: Sistema de Tasas de Cambio - Refactorización

## 🎯 Objetivo

Refactorizar el sistema actual de tasas de cambio para permitir conversiones flexibles entre cualquier par de monedas, permitiendo que el usuario configure tasas personalizadas desde el frontend.

## 📊 Estado Actual

### Tabla Existente: `tasas_monedas`

```sql
CREATE TABLE public.tasas_monedas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moneda_codigo text NOT NULL UNIQUE,      -- USD, VES, EUR, COP
  moneda_nombre text NOT NULL,             -- Dólares, Bolívares, etc
  simbolo text NOT NULL DEFAULT '$'::text, -- $, Bs, €
  tasa_conversion numeric NOT NULL DEFAULT 1.0,  -- ❌ PROBLEMA: Solo una tasa
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_by uuid,
  CONSTRAINT tasas_monedas_pkey PRIMARY KEY (id),
  CONSTRAINT tasas_monedas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
```

### Datos Actuales (Ejemplo):
```
moneda_codigo | moneda_nombre     | simbolo | tasa_conversion
-------------+-------------------+---------+---------------
USD          | Dólares          | $       | 1.0
VES          | Bolívares         | Bs.     | 36.5
EUR          | Euros             | €       | 0.92
COP          | Pesos Colombianos | $       | 4100
```

### ❌ Problemas del Sistema Actual:

1. **Referencia Ambigua**: No se sabe respecto a qué moneda son las tasas
2. **Conversión Limitada**: Solo permite conversiones desde una moneda base implícita
3. **Flexibilidad Nula**: El usuario no puede configurar conversiones personalizadas
4. **Escalabilidad Pobre**: Difícil agregar nuevas monedas o conversiones

## 🔄 Uso Actual en el Sistema

### Componentes que usan la tabla:

#### 1. `TasasManager.jsx` (CRUD Completo)
```javascript
// LEER
const { data } = await supabase
  .from('tasas_monedas')
  .select('*')
  .order('moneda_codigo')

// CREAR
await supabase
  .from('tasas_monedas')
  .insert([{
    moneda_codigo: 'EUR',
    moneda_nombre: 'Euro',
    simbolo: '€',
    tasa_conversion: 0.92
  }])

// ACTUALIZAR
await supabase
  .from('tasas_monedas')
  .update({ tasa_conversion: 0.93 })
  .eq('id', id)

// BORRAR
await supabase
  .from('tasas_monedas')
  .delete()
  .eq('id', id)
```

#### 2. `CotizadorForm.jsx` (Solo Lectura)
```javascript
const { data, error } = await supabase
  .from('tasas_monedas')
  .select('moneda_codigo, tasa_conversion')
```

## 🎯 Requerimientos del Nuevo Sistema

### Funcionalidades Deseadas:

1. **Conversiones Flexibles**: Permitir cualquier par de monedas (USD→VES, EUR→VES, COP→VES, etc.)
2. **Configuración por Usuario**: Dashboard para que el usuario configure tasas personalizadas
3. **Interfaz Intuitiva**: Mostrar "1 dólar equivale a X bolívares"
4. **Escalabilidad**: Fácil agregar nuevas monedas y conversiones
5. **Compatibilidad**: Migración gradual sin romper el sistema actual

### Ejemplo de Tasas Deseadas:
```
1 USD = 36.50 VES
1 USD = 0.92 EUR
1 USD = 4100 COP

1 EUR = 39.67 VES
1 EUR = 4456 COP

1 COP = 0.0089 VES
```

## 🛠️ Propuestas de Solución

### Opción 1: Modificar Tabla Existente (Recomendada)

#### Cambios en la estructura:
```sql
ALTER TABLE public.tasas_monedas 
ADD COLUMN moneda_referencia text NOT NULL DEFAULT 'USD';

ALTER TABLE public.tasas_monedas 
DROP CONSTRAINT tasas_monedas_moneda_codigo_key;

ALTER TABLE public.tasas_monedas 
ADD CONSTRAINT tasas_monedas_unique UNIQUE (moneda_codigo, moneda_referencia);

ALTER TABLE public.tasas_monedas 
ADD CONSTRAINT tasas_monedas_no_misma CHECK (moneda_codigo != moneda_referencia);
```

#### Nueva estructura:
```sql
CREATE TABLE public.tasas_monedas (
  id uuid NOT NULL DEFAULT gen_gen_random_uuid(),
  moneda_codigo text NOT NULL,             -- Moneda origen
  moneda_referencia text NOT NULL,         -- Moneda destino
  moneda_nombre text NOT NULL,
  simbolo text NOT NULL DEFAULT '$'::text,
  tasa_conversion numeric NOT NULL DEFAULT 1.0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_by uuid,
  CONSTRAINT tasas_monedas_pkey PRIMARY KEY (id),
  CONSTRAINT tasas_monedas_unique UNIQUE (moneda_codigo, moneda_referencia),
  CONSTRAINT tasas_monedas_no_misma CHECK (moneda_codigo != moneda_referencia),
  CONSTRAINT tasas_monedas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
```

#### Datos después de la migración:
```
moneda_codigo | moneda_referencia | moneda_nombre     | simbolo | tasa_conversion
-------------+-------------------+-------------------+---------+---------------
USD          | VES               | Dólares          | $       | 36.50
USD          | EUR               | Dólares          | $       | 0.92
USD          | COP               | Dólares          | $       | 4100
EUR          | VES               | Euros            | €       | 39.67
EUR          | COP               | Euros            | €       | 4456
COP          | VES               | Pesos Colombianos | $       | 0.0089
```

### Opción 2: Sistema de 3 Tablas

#### Tabla 1: `monedas` (Catálogo)
```sql
CREATE TABLE public.monedas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,              -- USD, VES, EUR, COP
  nombre text NOT NULL,                     -- Dólares Americanos
  simbolo text NOT NULL,                    -- $, Bs, €
  activa boolean DEFAULT true,              -- ¿Se puede usar?
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monedas_pkey PRIMARY KEY (id)
);
```

#### Tabla 2: `tasas_conversion` (Relación M:M)
```sql
CREATE TABLE public.tasas_conversion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moneda_origen_id uuid NOT NULL REFERENCES monedas(id),
  moneda_destino_id uuid NOT NULL REFERENCES monedas(id),
  tasa numeric NOT NULL,                    -- 1 USD = 36.5 VES
  descripcion text,                         -- "1 dólar equivale a 36.5 bolívares"
  activa boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  actualizado_por uuid REFERENCES auth.users(id),
  CONSTRAINT tasas_conversion_pkey PRIMARY KEY (id),
  CONSTRAINT tasas_conversion_unique UNIQUE (moneda_origen_id, moneda_destino_id),
  CONSTRAINT tasas_conversion_no_misma CHECK (moneda_origen_id != moneda_destino_id)
);
```

## 🔄 Cambios en el Código

### Actualización de `TasasManager.jsx`

#### Consulta actual:
```javascript
const { data } = await supabase
  .from('tasas_monedas')
  .select('*')
  .order('moneda_codigo')
```

#### Nueva consulta (Opción 1):
```javascript
const { data } = await supabase
  .from('tasas_monedas')
  .select('*')
  .order('moneda_codigo, moneda_referencia')
```

#### Nueva consulta (Opción 2):
```javascript
const { data } = await supabase
  .from('tasas_conversion')
  .select(`
    *,
    moneda_origen:monedas(id, codigo, nombre, simbolo),
    moneda_destino:monedas(id, codigo, nombre, simbolo)
  `)
```

### Actualización de `CotizadorForm.jsx`

#### Búsqueda actual:
```javascript
const { data } = await supabase
  .from('tasas_monedas')
  .select('moneda_codigo, tasa_conversion')
```

#### Nueva búsqueda (Opción 1):
```javascript
const { data } = await supabase
  .from('tasas_monedas')
  .select('moneda_codigo, moneda_referencia, tasa_conversion')
  .eq('moneda_codigo', monedaOrigen)
  .eq('moneda_referencia', monedaDestino)
```

#### Nueva búsqueda (Opción 2):
```javascript
const { data } = await supabase
  .from('tasas_conversion')
  .select('tasa')
  .eq('moneda_origen.codigo', monedaOrigen)
  .eq('moneda_destino.codigo', monedaDestino)
```

## 🎛️ Interfaz de Usuario Deseada

### Dashboard de Configuración:
```
┌─────────────────────────────────────────────────┐
│           CONFIGURACIÓN DE TASAS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Monedas Disponibles:                        │
│  ☑ USD - Dólares Americanos ($)                │
│  ☑ VES - Bolívares Venezolanos (Bs.)           │
│  ☑ EUR - Euros (€)                             │
│  ☑ COP - Pesos Colombianos ($)                 │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ CONVERSIONES CONFIGURADAS              │    │
│  ├─────────────────────────────────────────┤    │
│  │ 1 USD = [36.50] VES  [Editar] [Borrar] │    │
│  │ 1 USD = [0.92] EUR   [Editar] [Borrar] │    │
│  │ 1 USD = [4100] COP  [Editar] [Borrar] │    │
│  │ 1 EUR = [39.67] VES  [Editar] [Borrar] │    │
│  │ 1 EUR = [4456] COP  [Editar] [Borrar] │    │
│  │ 1 COP = [0.0089] VES [Editar] [Borrar] │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ➕ AGREGAR NUEVA CONVERSIÓN                    │
│  [De: USD ▼] [a: VES ▼] [= 36.50] [Agregar]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 📋 Plan de Migración

### Fase 1: Preparación
1. Respaldo de datos existentes
2. Creación de scripts de migración
3. Testing en ambiente de desarrollo

### Fase 2: Cambios en Base de Datos
1. Ejecutar ALTER TABLE (Opción 1) o crear nuevas tablas (Opción 2)
2. Migrar datos existentes
3. Validar integridad de datos

### Fase 3: Actualización de Código
1. Modificar `TasasManager.jsx`
2. Actualizar `CotizadorForm.jsx`
3. Testing de funcionalidades

### Fase 4: Despliegue
1. Deploy a producción
2. Monitoreo de errores
3. Rollback si es necesario

## 🤔 Preguntas para ChatGPT

1. **¿Cuál opción recomiendas?** ¿Modificar tabla existente o crear sistema de 3 tablas?

2. **¿Cómo manejarías la migración de datos?** ¿Qué estrategias sugieres para evitar pérdida de datos?

3. **¿Qué validaciones adicionales recomiendas?** ¿Para evitar tasas inconsistentes o duplicadas?

4. **¿Cómo optimizarías las consultas?** ¿Para búsquedas frecuentes de tasas de conversión

5. **¿Qué patrón de diseño sugieres?** Para el CRUD y la lógica de conversión

6. **¿Cómo manejarías el versionamiento?** Para cambios en tasas y auditoría

7. **¿Qué consideraciones de rendimiento?** Para manejar múltiples conversiones simultáneas

## 📝 Contexto Adicional

- **Base de Datos**: PostgreSQL con Supabase
- **Frontend**: React/Next.js
- **Backend**: Supabase (PostgreSQL + Auth)
- **Framework**: TailwindCSS para UI
- **Estado**: Actualmente en producción con usuarios activos

## 🎯 Objetivos de Negocio

1. **Flexibilidad Total**: Permitir cualquier conversión entre monedas
2. **Autogestión**: Usuario configura sus propias tasas
3. **Transparencia**: Mostrar conversiones claras ("1 USD = 36.5 VES")
4. **Escalabilidad**: Fácil agregar nuevas monedas (USDT, etc.)
5. **Compatibilidad**: Sin interrupciones del servicio actual

---

**Nota**: Este documento está diseñado para ser compartido con ChatGPT o cualquier asistente de IA para obtener orientación técnica sobre la mejor arquitectura y estrategia de implementación para este refactorización del sistema de tasas.
