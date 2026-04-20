# Refactorización de Métodos de Pago - Plan de Implementación

> **Para trabajadores agénticos:** REQUERIDO SUB-SKILL: Usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para seguimiento.

**Goal:** Refactorizar el sistema de métodos de pago para dividir "Cuenta en Euros" en BBVA/Revolut, crear variantes de Chase Bank por agencia, renombrar métodos de depósito a "Efectivo", y eliminar recargo erróneo de Chase Bank.

**Architecture:** Actualización de configuración centralizada en `paymentConfig.js`, extensión de lógica condicional por agencia en `getPaymentData()`, actualización de recargos en `conversorInteligente.js`, y migración de datos históricos en base de datos.

**Tech Stack:** React, JavaScript, Supabase (PostgreSQL)

---

## 📋 Resumen de Cambios

### Métodos a Crear
- `BBVA` (EUR) - Solo datos BBVA
- `REVOLUT` (EUR) - Solo datos Revolut + nota Bizum
- `CHASE_NOVA` (USD) - Cuenta Chase Nova
- `CHASE_APOLO` (USD) - Cuenta Chase Apolo

### Métodos a Eliminar
- `CUENTA_EUROS` → Reemplazado por BBVA y REVOLUT
- `CHASE` → Reemplazado por CHASE_NOVA y CHASE_APOLO

### Métodos a Renombrar
- `BNC_VES`: "BNC - Transferencia en Bs" → "Transferencia (BNC)"
- `BINANCE`: "Binance (USDT)" → "Binance"
- `DEPOSITO_VENEZUELA`: "Depósito oficina Venezuela (efectivo)" → "Efectivo (USD)"
- `DEPOSITO_COLOMBIA`: "Depósito oficina Colombia (efectivo)" → "Efectivo (COP)"
- `DEPOSITO_EUROPA`: "Depósito oficina Europa (efectivo)" → "Efectivo (EUR)"

### Restricciones
- **Scalapay**: Solo disponible en EUR (eliminar de USD)
- **Chase Bank**: Sin recargo (eliminar 5% de conversorInteligente.js)

---

## 🗂️ Estructura de Archivos

### Archivos a Modificar

| Archivo | Responsabilidad | Cambios |
|---------|----------------|---------|
| `dashboard/src/lib/cotizador/paymentConfig.js` | Configuración de métodos de pago | Agregar BBVA, REVOLUT, CHASE_NOVA, CHASE_APOLO. Renombrar métodos. Actualizar METHODS_BY_CURRENCY. Extender getPaymentData() |
| `dashboard/src/lib/cotizador/conversorInteligente.js` | Cálculo de recargos | Eliminar recargo de Chase Bank. Actualizar condición para Chase Nova/Apolo |
| `dashboard/src/components/cotizador/CotizadorForm.jsx` | Formulario de cotización | Verificar que no haya validaciones hardcodeadas con nombres antiguos |
| `dashboard/src/components/vuelos/VuelosList.jsx` | Lista de vuelos | Actualizar array METODOS_PAGO |
| `docs/05-base-de-datos/migraciones/2026-04-17-migracion-metodos-pago.sql` | Migración de datos | Actualizar registros históricos con nuevos nombres |

---

## Task 1: Crear Migración SQL para Datos Históricos

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-17-migracion-metodos-pago.sql`

- [ ] **Paso 1: Crear archivo de migración SQL**

```sql
-- Migración de Métodos de Pago Históricos
-- Fecha: 2026-04-17
-- Propósito: Actualizar nombres de métodos de pago en registros existentes

-- ============================================
-- 1. CUENTA EN EUROS → BBVA (por defecto)
-- ============================================
-- Nota: Asignamos BBVA como método principal para registros antiguos
-- Los usuarios pueden cambiar manualmente a Revolut si corresponde

UPDATE cotizaciones 
SET metodo_pago = 'BBVA' 
WHERE metodo_pago = 'Cuenta en Euros';

UPDATE vuelos 
SET metodo_pago = 'BBVA' 
WHERE metodo_pago = 'Cuenta en Euros';

-- ============================================
-- 2. CHASE BANK → CHASE BANK NOVA (por defecto)
-- ============================================
-- Nota: Asignamos Nova como método principal para registros antiguos

UPDATE cotizaciones 
SET metodo_pago = 'Chase Bank Nova' 
WHERE metodo_pago = 'Chase Bank (Estados Unidos)';

UPDATE vuelos 
SET metodo_pago = 'Chase Bank Nova' 
WHERE metodo_pago = 'Chase Bank (Estados Unidos)' 
   OR metodo_pago = 'Chase Bank';

-- ============================================
-- 3. RENOMBRAR DEPÓSITOS A EFECTIVO
-- ============================================

UPDATE cotizaciones 
SET metodo_pago = 'Efectivo (USD)' 
WHERE metodo_pago = 'Depósito oficina Venezuela (efectivo)';

UPDATE vuelos 
SET metodo_pago = 'Efectivo (USD)' 
WHERE metodo_pago = 'Depósito oficina Venezuela (efectivo)';

UPDATE cotizaciones 
SET metodo_pago = 'Efectivo (COP)' 
WHERE metodo_pago = 'Depósito oficina Colombia (efectivo)';

UPDATE vuelos 
SET metodo_pago = 'Efectivo (COP)' 
WHERE metodo_pago = 'Depósito oficina Colombia (efectivo)';

UPDATE cotizaciones 
SET metodo_pago = 'Efectivo (EUR)' 
WHERE metodo_pago = 'Depósito oficina Europa (efectivo)';

UPDATE vuelos 
SET metodo_pago = 'Efectivo (EUR)' 
WHERE metodo_pago = 'Depósito oficina Europa (efectivo)';

-- ============================================
-- 4. RENOMBRAR BNC TRANSFERENCIA
-- ============================================

UPDATE cotizaciones 
SET metodo_pago = 'Transferencia (BNC)' 
WHERE metodo_pago = 'BNC - Transferencia en Bs';

UPDATE vuelos 
SET metodo_pago = 'Transferencia (BNC)' 
WHERE metodo_pago = 'BNC - Transferencia en Bs';

-- ============================================
-- 5. RENOMBRAR BINANCE
-- ============================================

UPDATE cotizaciones 
SET metodo_pago = 'Binance' 
WHERE metodo_pago = 'Binance (USDT)';

UPDATE vuelos 
SET metodo_pago = 'Binance' 
WHERE metodo_pago = 'Binance (USDT)';

-- ============================================
-- VERIFICACIÓN: Contar registros actualizados
-- ============================================

SELECT 
  'cotizaciones' as tabla,
  metodo_pago,
  COUNT(*) as total
FROM cotizaciones
WHERE metodo_pago IN (
  'BBVA', 'Chase Bank Nova', 'Efectivo (USD)', 'Efectivo (COP)', 
  'Efectivo (EUR)', 'Transferencia (BNC)', 'Binance'
)
GROUP BY metodo_pago

UNION ALL

SELECT 
  'vuelos' as tabla,
  metodo_pago,
  COUNT(*) as total
FROM vuelos
WHERE metodo_pago IN (
  'BBVA', 'Chase Bank Nova', 'Efectivo (USD)', 'Efectivo (COP)', 
  'Efectivo (EUR)', 'Transferencia (BNC)', 'Binance'
)
GROUP BY metodo_pago
ORDER BY tabla, metodo_pago;
```

- [ ] **Paso 2: Documentar la migración**

Agregar nota en el archivo explicando que esta migración debe ejecutarse **ANTES** de desplegar los cambios de código.

- [ ] **Paso 3: Commit**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-17-migracion-metodos-pago.sql
git commit -m "docs: agregar migración SQL para refactorización de métodos de pago"
```

---

## Task 2: Actualizar Configuración de Métodos de Pago (paymentConfig.js)

**Files:**
- Modify: `dashboard/src/lib/cotizador/paymentConfig.js`

- [ ] **Paso 1: Actualizar constante PAYMENT_METHODS**

Reemplazar las líneas 10-28 con:

```javascript
export const PAYMENT_METHODS = {
  SCALAPAY: 'Scalapay',
  BNC_USD: 'Depósitos en dólares (BNC USD)',
  BINANCE: 'Binance',
  ARCADIA: 'Arcadia Service',
  ZELLE: 'Zelle',
  BANCACOLOMBIA: 'Bancacolombia',
  DAVIVIENDA: 'Davivienda',
  BBVA: 'BBVA',
  REVOLUT: 'Revolut',
  BANESCO_PANAMA: 'Banesco Panamá (ViajesNova)',
  BNC_VES: 'Transferencia (BNC)',
  PAGO_MOVIL: 'Pago móvil',
  EFECTIVO_USD: 'Efectivo (USD)',
  EFECTIVO_COP: 'Efectivo (COP)',
  EFECTIVO_EUR: 'Efectivo (EUR)',
  CHASE_NOVA: 'Chase Bank Nova',
  CHASE_APOLO: 'Chase Bank Apolo',
  BIZUM: 'Bizum (España)',
  TARJETA_CREDITO_USD: 'Tarjeta de Crédito (USD)'
}
```

- [ ] **Paso 2: Actualizar PAYMENT_DATA - Dividir Cuenta en Euros**

Reemplazar la sección de CUENTA_EUROS (líneas 97-111) con:

```javascript
  [PAYMENT_METHODS.BBVA]: {
    titulo: 'Transferencia BBVA (EUR)',
    descripcion: 'Transferencia SEPA en Euros a cuenta BBVA.',
    detalles: [
      'Banco: BBVA',
      'Titular: Grupo Travel BA',
      'IBAN: ES2301821876830201934375'
    ]
  },
  [PAYMENT_METHODS.REVOLUT]: {
    titulo: 'Transferencia Revolut (EUR)',
    descripcion: 'Transferencia SEPA en Euros a cuenta Revolut.',
    detalles: [
      'Banco: Revolut',
      'IBAN: ES5415830001169083916022',
      'Titular: Gaddiel Montero Yepez',
      '',
      '⚠️ Nota: Los pagos realizados por Bizum también caen en esta cuenta Revolut'
    ]
  },
```

- [ ] **Paso 3: Actualizar PAYMENT_DATA - Crear Chase Bank variantes**

Reemplazar la sección de CHASE (líneas 173-181) con:

```javascript
  [PAYMENT_METHODS.CHASE_NOVA]: {
    titulo: 'Transferencia Chase Bank Nova (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank de Nova.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: 900700953',
      'Número de tránsito interbancario (Routing): 267084131'
    ]
  },
  [PAYMENT_METHODS.CHASE_APOLO]: {
    titulo: 'Transferencia Chase Bank Apolo (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank de Apolo.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: [EJEMPLO-123456]',
      'Número de tránsito interbancario (Routing): [EJEMPLO-987654]',
      '',
      '⚠️ NOTA: Datos de ejemplo - Actualizar con información real de Apolo'
    ]
  },
```

- [ ] **Paso 4: Actualizar PAYMENT_DATA - Renombrar depósitos**

Reemplazar las secciones de DEPOSITO_VENEZUELA, DEPOSITO_COLOMBIA, DEPOSITO_EUROPA (líneas 142-172) con:

```javascript
  [PAYMENT_METHODS.EFECTIVO_USD]: {
    titulo: 'Pago en Efectivo (USD)',
    descripcion: 'Pago en dólares estadounidenses (USD) en efectivo en nuestras oficinas de Venezuela.',
    detalles: [
      'Oficinas disponibles:',
      '• San Cristóbal',
      '• Maracaibo',
      '• Caracas',
      '• Valencia (Parral)',
      '• Valencia (Torre de Seguro Los Andes)',
      'Consulta con tu asesor la dirección exacta de la oficina más cercana.'
    ]
  },
  [PAYMENT_METHODS.EFECTIVO_COP]: {
    titulo: 'Pago en Efectivo (COP)',
    descripcion: 'Pago en pesos colombianos (COP) en efectivo en nuestra oficina de Colombia.',
    detalles: [
      'Oficina disponible:',
      '• Medellín',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  [PAYMENT_METHODS.EFECTIVO_EUR]: {
    titulo: 'Pago en Efectivo (EUR)',
    descripcion: 'Pago en euros (EUR) en efectivo en nuestra oficina de Europa.',
    detalles: [
      'Oficina disponible:',
      '• Madrid, España',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
```

- [ ] **Paso 5: Actualizar PAYMENT_DATA - Renombrar BNC_VES y BINANCE**

Actualizar línea 50 (BINANCE):

```javascript
  [PAYMENT_METHODS.BINANCE]: {
    titulo: 'Pago con Binance',
    descripcion: 'Transferencia en USDT a través de Binance.',
    detalles: [
      'Correo: pagosvuelosnova@gmail.com',
      'ID de Usuario: 96985487',
      'Verifica siempre el monto final antes de enviar.'
    ]
  },
```

Actualizar línea 122 (BNC_VES):

```javascript
  [PAYMENT_METHODS.BNC_VES]: {
    titulo: 'Transferencia (BNC)',
    descripcion: 'Transferencia en bolívares a Banco Nacional de Crédito.',
    detalles: [
      'Banco: BNC (Banco Nacional de Crédito)',
      'Tipo de Cuenta: Corriente',
      'Nro. de cuenta: 0191-0022-78-2122023900',
      'Titular: Bonito Alvarado Josni Gamaliet'
    ]
  },
```

- [ ] **Paso 6: Actualizar METHODS_BY_CURRENCY**

Reemplazar líneas 209-237 con:

```javascript
export const METHODS_BY_CURRENCY = {
  USD: [
    PAYMENT_METHODS.BNC_USD,
    PAYMENT_METHODS.ZELLE,
    PAYMENT_METHODS.BANESCO_PANAMA,
    PAYMENT_METHODS.CHASE_NOVA,
    PAYMENT_METHODS.CHASE_APOLO,
    PAYMENT_METHODS.EFECTIVO_USD,
    PAYMENT_METHODS.ARCADIA,
    PAYMENT_METHODS.TARJETA_CREDITO_USD
  ],
  EUR: [
    PAYMENT_METHODS.BBVA,
    PAYMENT_METHODS.REVOLUT,
    PAYMENT_METHODS.BIZUM,
    PAYMENT_METHODS.EFECTIVO_EUR,
    PAYMENT_METHODS.SCALAPAY
  ],
  VES: [
    PAYMENT_METHODS.BNC_VES,
    PAYMENT_METHODS.PAGO_MOVIL
  ],
  COP: [
    PAYMENT_METHODS.BANCACOLOMBIA,
    PAYMENT_METHODS.DAVIVIENDA,
    PAYMENT_METHODS.EFECTIVO_COP
  ],
  USDT: [
    PAYMENT_METHODS.BINANCE
  ]
}
```

- [ ] **Paso 7: Actualizar ALL_PAYMENT_METHODS**

Reemplazar líneas 239-257 con:

```javascript
export const ALL_PAYMENT_METHODS = [
  PAYMENT_METHODS.SCALAPAY,
  PAYMENT_METHODS.BNC_USD,
  PAYMENT_METHODS.BINANCE,
  PAYMENT_METHODS.ARCADIA,
  PAYMENT_METHODS.ZELLE,
  PAYMENT_METHODS.BANCACOLOMBIA,
  PAYMENT_METHODS.DAVIVIENDA,
  PAYMENT_METHODS.BBVA,
  PAYMENT_METHODS.REVOLUT,
  PAYMENT_METHODS.BANESCO_PANAMA,
  PAYMENT_METHODS.BNC_VES,
  PAYMENT_METHODS.PAGO_MOVIL,
  PAYMENT_METHODS.EFECTIVO_USD,
  PAYMENT_METHODS.EFECTIVO_COP,
  PAYMENT_METHODS.EFECTIVO_EUR,
  PAYMENT_METHODS.CHASE_NOVA,
  PAYMENT_METHODS.CHASE_APOLO,
  PAYMENT_METHODS.BIZUM,
  PAYMENT_METHODS.TARJETA_CREDITO_USD
]
```

- [ ] **Paso 8: Extender función getPaymentData() con lógica Chase**

Reemplazar líneas 263-270 con:

```javascript
/**
 * Obtener datos de pago según método y agencia
 * Zelle y Chase tienen lógica condicional por agencia
 */
export function getPaymentData(metodo, agencia) {
  // Zelle: variante por agencia
  if (metodo === PAYMENT_METHODS.ZELLE) {
    return agencia === 'apolo' 
      ? PAYMENT_DATA_ZELLE_APOLO 
      : PAYMENT_DATA[PAYMENT_METHODS.ZELLE]
  }
  
  // Chase Bank: variante por agencia
  if (metodo === PAYMENT_METHODS.CHASE_NOVA || metodo === PAYMENT_METHODS.CHASE_APOLO) {
    return agencia === 'apolo'
      ? PAYMENT_DATA[PAYMENT_METHODS.CHASE_APOLO]
      : PAYMENT_DATA[PAYMENT_METHODS.CHASE_NOVA]
  }
  
  return PAYMENT_DATA[metodo] || null
}
```

- [ ] **Paso 9: Verificar sintaxis del archivo**

Ejecutar:
```bash
cd dashboard
npm run lint src/lib/cotizador/paymentConfig.js
```

Esperado: Sin errores de sintaxis

- [ ] **Paso 10: Commit**

```bash
git add dashboard/src/lib/cotizador/paymentConfig.js
git commit -m "refactor: actualizar configuración de métodos de pago

- Dividir Cuenta en Euros en BBVA y Revolut
- Crear variantes Chase Bank Nova y Chase Bank Apolo
- Renombrar depósitos a Efectivo (USD/COP/EUR)
- Renombrar BNC VES a Transferencia (BNC)
- Renombrar Binance (USDT) a Binance
- Eliminar Scalapay de métodos USD (solo EUR)
- Extender getPaymentData() con lógica Chase por agencia"
```

---

## Task 3: Eliminar Recargo de Chase Bank (conversorInteligente.js)

**Files:**
- Modify: `dashboard/src/lib/cotizador/conversorInteligente.js`

- [ ] **Paso 1: Eliminar condición de recargo Chase Bank**

Eliminar líneas 82-85:

```javascript
    } else if (metodoPago === 'Chase Bank (Estados Unidos)') {
      recargos = baseConvertida * 0.05 // 5%
      descripcionRecargos = `+5% Chase Bank`
      montoConvertido = baseConvertida + recargos
```

- [ ] **Paso 2: Verificar que no haya otras referencias a Chase**

Buscar en el archivo cualquier otra mención a "Chase" y confirmar que no hay más lógica de recargos.

- [ ] **Paso 3: Verificar sintaxis**

Ejecutar:
```bash
cd dashboard
npm run lint src/lib/cotizador/conversorInteligente.js
```

Esperado: Sin errores

- [ ] **Paso 4: Commit**

```bash
git add dashboard/src/lib/cotizador/conversorInteligente.js
git commit -m "fix: eliminar recargo incorrecto de Chase Bank

Chase Bank no tiene recargo asociado, eliminada condición errónea del 5%"
```

---

## Task 4: Actualizar Lista de Métodos en VuelosList.jsx

**Files:**
- Modify: `dashboard/src/components/vuelos/VuelosList.jsx`

- [ ] **Paso 1: Actualizar array METODOS_PAGO**

Reemplazar líneas 22-28 con:

```javascript
const METODOS_PAGO = [
  { value: 'Efectivo (USD)', label: 'Efectivo (USD)' },
  { value: 'Efectivo (COP)', label: 'Efectivo (COP)' },
  { value: 'Efectivo (EUR)', label: 'Efectivo (EUR)' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' },
  { value: 'Scalapay', label: 'Scalapay' },
  { value: 'Chase Bank Nova', label: 'Chase Bank Nova' },
  { value: 'Chase Bank Apolo', label: 'Chase Bank Apolo' },
  { value: 'Zelle', label: 'Zelle' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'Revolut', label: 'Revolut' },
  { value: 'Transferencia (BNC)', label: 'Transferencia (BNC)' },
  { value: 'Binance', label: 'Binance' }
]
```

- [ ] **Paso 2: Verificar sintaxis**

Ejecutar:
```bash
cd dashboard
npm run lint src/components/vuelos/VuelosList.jsx
```

Esperado: Sin errores

- [ ] **Paso 3: Commit**

```bash
git add dashboard/src/components/vuelos/VuelosList.jsx
git commit -m "refactor: actualizar métodos de pago en filtros de vuelos"
```

---

## Task 5: Actualizar Validación en CotizadorForm.jsx

**Files:**
- Modify: `dashboard/src/components/cotizador/CotizadorForm.jsx`

- [ ] **Paso 1: Buscar referencias hardcodeadas a métodos antiguos**

Ejecutar búsqueda en el archivo:
```bash
grep -n "Cuenta en Euros\|Chase Bank (Estados Unidos)\|Depósito oficina" dashboard/src/components/cotizador/CotizadorForm.jsx
```

- [ ] **Paso 2: Actualizar condición de validación de moneda (si existe)**

Buscar línea 1254 y actualizar:

```javascript
{(metodoPago === 'Zelle' || metodoPago === 'Banesco Panamá (ViajesNova)' || metodoPago === 'Chase Bank Nova' || metodoPago === 'Chase Bank Apolo') && (
```

- [ ] **Paso 3: Verificar sintaxis**

Ejecutar:
```bash
cd dashboard
npm run lint src/components/cotizador/CotizadorForm.jsx
```

Esperado: Sin errores

- [ ] **Paso 4: Commit**

```bash
git add dashboard/src/components/cotizador/CotizadorForm.jsx
git commit -m "refactor: actualizar validaciones de métodos de pago en cotizador"
```

---

## Task 6: Actualizar Validación en VueloFormNuevo.jsx

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

- [ ] **Paso 1: Buscar condición de archivos ilimitados**

Buscar línea 1525 y actualizar:

```javascript
unlimited={formData.metodo_pago?.includes('Efectivo')}
```

- [ ] **Paso 2: Verificar sintaxis**

Ejecutar:
```bash
cd dashboard
npm run lint src/components/vuelos/VueloFormNuevo.jsx
```

Esperado: Sin errores

- [ ] **Paso 3: Commit**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "refactor: actualizar condición de archivos ilimitados para Efectivo"
```

---

## Task 7: Pruebas de Integración

**Files:**
- Test: Todo el flujo de cotización

- [ ] **Paso 1: Iniciar servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

Esperado: Servidor corriendo en http://localhost:3000

- [ ] **Paso 2: Probar selección de métodos de pago en cotizador**

1. Navegar a página de cotizador
2. Seleccionar moneda EUR
3. Verificar que aparecen: BBVA, Revolut, Bizum, Efectivo (EUR), Scalapay
4. Verificar que NO aparece Scalapay en USD

- [ ] **Paso 3: Probar generación de PDF con BBVA**

1. Crear cotización con método BBVA
2. Generar PDF
3. Verificar que muestra datos bancarios de BBVA correctamente

- [ ] **Paso 4: Probar generación de PDF con Revolut**

1. Crear cotización con método Revolut
2. Generar PDF
3. Verificar que muestra datos bancarios de Revolut + nota de Bizum

- [ ] **Paso 5: Probar Chase Bank por agencia**

1. Cambiar agencia a Nova
2. Verificar que Chase Bank Nova muestra datos correctos
3. Cambiar agencia a Apolo
4. Verificar que Chase Bank Apolo muestra datos de ejemplo

- [ ] **Paso 6: Probar conversión sin recargo Chase**

1. Crear cotización con Chase Bank Nova
2. Verificar que NO se aplica recargo del 5%
3. Comparar con Scalapay que SÍ debe tener 11.3%

- [ ] **Paso 7: Probar métodos renombrados**

1. Seleccionar "Transferencia (BNC)" en VES
2. Seleccionar "Binance" en USDT
3. Seleccionar "Efectivo (USD)", "Efectivo (COP)", "Efectivo (EUR)"
4. Verificar que todos muestran datos correctos

- [ ] **Paso 8: Documentar resultados de pruebas**

Crear archivo de resultados:

```markdown
# Resultados de Pruebas - Refactorización Métodos de Pago

## ✅ Pruebas Exitosas
- [ ] BBVA muestra datos correctos en PDF
- [ ] Revolut muestra datos + nota Bizum
- [ ] Chase Nova/Apolo cambian según agencia
- [ ] Scalapay solo en EUR
- [ ] Sin recargo en Chase Bank
- [ ] Métodos renombrados funcionan

## ❌ Problemas Encontrados
(Documentar aquí cualquier problema)

## 📝 Notas
(Observaciones adicionales)
```

---

## Task 8: Ejecutar Migración SQL en Base de Datos

**Files:**
- Execute: `docs/05-base-de-datos/migraciones/2026-04-17-migracion-metodos-pago.sql`

⚠️ **IMPORTANTE**: Esta tarea debe ejecutarse en producción DESPUÉS de verificar que todo funciona en desarrollo.

- [x] **Paso 1: Backup de base de datos**

```bash
# Conectar a Supabase y crear backup
# (Comando específico depende de tu configuración)
```

- [x] **Paso 2: Ejecutar migración en ambiente de desarrollo/staging**

```bash
# Ejecutar SQL en Supabase Dashboard o CLI
psql -h [host] -U [user] -d [database] -f docs/05-base-de-datos/migraciones/2026-04-17-migracion-metodos-pago.sql
```

- [x] **Paso 3: Verificar resultados**

Ejecutar query de verificación incluida en el archivo SQL y revisar conteos.

- [x] **Paso 4: Probar cotizaciones antiguas**

1. Abrir cotización antigua que tenía "Cuenta en Euros"
2. Verificar que ahora muestra "BBVA"
3. Verificar que PDF se genera correctamente

- [x] **Paso 5: Documentar ejecución**

**EJECUTADO: 2026-04-20**
**AMBIENTE: Desarrollo**
**REGISTROS ACTUALIZADOS:**
- cotizaciones: 66 registros (35 BBVA, 2 Binance, 29 Efectivo USD)
- vuelos: 26 registros (22 BBVA, 3 Binance, 1 Efectivo COP)
**TOTAL: 92 registros actualizados**
**ESTADO: Exitoso**

- [ ] **Paso 6: Ejecutar en producción (cuando esté listo)**

Repetir pasos 1-5 en ambiente de producción.

---

## Task 9: Actualizar Documentación

**Files:**
- Modify: `docs/07-modulos/SISTEMA_COTIZADOR_COMPLETO.md`

- [ ] **Paso 1: Actualizar lista de métodos de pago en documentación**

Buscar sección de métodos de pago y actualizar con la nueva lista.

- [ ] **Paso 2: Documentar lógica condicional por agencia**

Agregar sección explicando que Zelle y Chase Bank tienen variantes por agencia.

- [ ] **Paso 3: Documentar recargos actualizados**

Confirmar que Chase Bank no tiene recargo y Scalapay es 11.3%.

- [ ] **Paso 4: Commit**

```bash
git add docs/07-modulos/SISTEMA_COTIZADOR_COMPLETO.md
git commit -m "docs: actualizar documentación de métodos de pago"
```

---

## Task 10: Code Review Final

**Files:**
- Review: Todos los archivos modificados

- [ ] **Paso 1: Revisar checklist de seguridad**

- [ ] No hay datos sensibles hardcodeados
- [ ] Validaciones de entrada mantienen integridad
- [ ] No hay SQL injection (migración usa UPDATE directo)

- [ ] **Paso 2: Revisar checklist de mantenibilidad**

- [ ] Nombres de variables son claros
- [ ] Código sigue patrones existentes
- [ ] No hay duplicación innecesaria
- [ ] Funciones tienen responsabilidad única

- [ ] **Paso 3: Revisar checklist de funcionalidad**

- [ ] Todos los métodos antiguos tienen migración
- [ ] Lógica condicional por agencia funciona
- [ ] Recargos son correctos
- [ ] PDFs se generan correctamente

- [ ] **Paso 4: Crear PR o merge a main**

```bash
git checkout -b refactor/metodos-pago
git push origin refactor/metodos-pago
# Crear Pull Request en GitHub/GitLab
```

---

## 📊 Resumen de Verificación

### Archivos Modificados (7)
- [ ] `paymentConfig.js` - Configuración actualizada
- [ ] `conversorInteligente.js` - Recargo Chase eliminado
- [ ] `CotizadorForm.jsx` - Validaciones actualizadas
- [ ] `VuelosList.jsx` - Filtros actualizados
- [ ] `VueloFormNuevo.jsx` - Condición archivos actualizada
- [ ] `SISTEMA_COTIZADOR_COMPLETO.md` - Documentación actualizada
- [x] `2026-04-17-migracion-metodos-pago.sql` - Migración creada y ejecutada

### Métodos de Pago Final (20)
1. Scalapay (EUR)
2. Depósitos en dólares (BNC USD)
3. Binance
4. Arcadia Service
5. Zelle
6. Bancacolombia
7. Davivienda
8. BBVA (EUR)
9. Revolut (EUR)
10. Banesco Panamá
11. Transferencia (BNC)
12. Pago móvil
13. Efectivo (USD)
14. Efectivo (COP)
15. Efectivo (EUR)
16. Chase Bank Nova
17. Chase Bank Apolo
18. Bizum (España)
19. Tarjeta de Crédito (USD)

### Recargos Confirmados
- Scalapay: 11.3%
- Arcadia: 5.6% + $10
- BNC USD: 4.5%
- Tarjeta Crédito USD: 5%
- Chase Bank: **0%** (sin recargo)

---

## 🎯 Próximos Pasos Recomendados

1. **Actualizar datos de Chase Bank Apolo**: Reemplazar datos de ejemplo con información real
2. **Monitorear métricas**: Verificar que reportes y estadísticas funcionan correctamente
3. **Capacitar usuarios**: Informar sobre nuevos nombres de métodos
4. **Considerar centralizar recargos**: Crear `PAYMENT_FEES` object para mejor mantenibilidad

---

**Plan completado. Listo para ejecución.**
