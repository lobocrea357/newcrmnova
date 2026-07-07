# Mejoras en Extracción IA de Documentos (Pasaporte y Cédula)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar la alineación entre la extracción de datos con IA y el schema de la base de datos para pasaportes y cédulas de identidad, implementando normalización en frontend y validación flexible en backend.

**Architecture:** Implementar una solución híbrida donde el frontend normaliza los datos extraídos por la IA según el país, mientras el backend tiene validaciones flexibles que aceptan múltiples formatos y normalizan internamente. Esto garantiza datos consistentes en la BD con buena experiencia de usuario.

**Tech Stack:** React (frontend), Next.js API Routes, OpenAI GPT-4o-mini, Supabase (PostgreSQL), JavaScript/ES6+

---

## FASE 1: Preparación y Documentación

### Task 1: Crear documento de referencia de formatos de documentos

**Files:**
- Create: `docs/06-extraccion-ia-documentos/formatos-documentos.md`

- [ ] **Step 1: Write the documentation file**

```markdown
# Formatos de Documentos de Identidad

## Pasaportes (Documento Internacional)

### Nacionalidad
- **Formato en MRZ:** Código de 3 letras (VEN, COL, USA, etc.)
- **Formato en zona visual:** Nombre del país (Venezuela, Colombia, United States)
- **Campo en BD:** `nacionalidad` (almacena ambos formatos según lo extraído)

### Número de Pasaporte
- **Formato:** Alfanumérico, variable por país
- **Longitud típica:** 6-9 caracteres (puede variar)
- **Caracteres:** Letras mayúsculas A-Z y dígitos 0-9
- **Validación:** Mínimo 6 caracteres alfanuméricos, sin máximo estricto

### País de Emisión
- **Descripción:** País que emitió el pasaporte
- **Campo en BD:** `pais_emision_cedula` (reutilizar campo existente o crear nuevo)
- **Formato:** Nombre del país (Venezuela, Colombia, etc.)

---

## Cédulas de Identidad (Documento Nacional)

### Nacionalidad
- **Formato:** Adjetivo patrio o texto descriptivo
- **Ejemplos:** "Venezolano", "Venezolana", "Colombiano", "Colombiana"
- **Campo en BD:** `nacionalidad` (almacena formato de cédula)

### Número de Cédula por País

#### Venezuela
- **Formato estándar:** V-12345678 o E-12345678
- **Prefijos:** V (venezolano), E (extranjero)
- **Dígitos:** 7-8 dígitos numéricos
- **Validación backend:** Acepta V-12345678, E-12345678, V12345678, E12345678, o solo 12345678 (normaliza a V-12345678)

#### Colombia
- **Formato estándar:** 10 dígitos numéricos
- **Sin prefijos ni guiones en BD**
- **Validación backend:** Acepta 1234567890, 1.234.567.890, 123-456-7890 (normaliza a solo dígitos)

#### Perú
- **Formato estándar:** 8 dígitos numéricos (DNI)
- **Validación backend:** Acepta variaciones con separadores

#### Ecuador
- **Formato estándar:** 10 dígitos numéricos
- **Validación backend:** Acepta variaciones con separadores

#### Otros países LATAM
- **Formato:** Variable según país
- **Validación backend:** Flexible, acepta formato crudo de la IA

### País de Emisión
- **Descripción:** País que emitió la cédula
- **Campo en BD:** `pais_emision_cedula`
- **Formato:** Nombre del país (Venezuela, Colombia, etc.)

---

## Diferencias Clave

| Aspecto | Pasaporte | Cédula |
|---------|-----------|--------|
| Propósito | Viaje internacional | Identidad nacional |
| Nacionalidad | Código 3 letras o nombre país | Adjetivo patrio |
| Número | Alfanumérico variable | Numérico con prefijos (Venezuela) |
| País emisor | Campo adicional | Campo principal |
| Estándar | ICAO 9303 | Variable por país |

---

## Estrategia de Normalización

### Frontend (Después de extracción IA)
1. Recibir datos crudos de la IA
2. Normalizar número de cédula según país
3. Enviar datos normalizados al backend

### Backend (Validación y almacenamiento)
1. Aceptar múltiples formatos de entrada
2. Validar flexiblemente
3. Normalizar a formato estándar antes de guardar
4. Almacenar formato consistente en BD
```

- [ ] **Step 2: Commit**

```bash
git add docs/06-extraccion-ia-documentos/formatos-documentos.md
git commit -m "docs: agregar referencia de formatos de documentos de identidad"
```

---

## FASE 2: API de Extracción de Pasaportes

### Task 2: Agregar campo pais_emision en API de extracción de pasaportes

**Files:**
- Modify: `dashboard/src/app/api/extract-passport/route.js:20-55`

- [ ] **Step 1: Update the system prompt to include pais_emision**

```javascript
    // Construct prompt for passport data extraction
    const systemPrompt = `Eres un experto en extracción de datos de pasaportes internacionales.

Tu tarea es analizar la imagen del pasaporte y extraer ÚNICAMENTE los datos que sean claramente visibles y legibles.

IMPORTANTE:
- Si un campo NO es visible o NO es legible, devuelve null para ese campo
- NO inventes datos
- NO hagas suposiciones
- La zona MRZ (Machine Readable Zone) en la parte inferior del pasaporte contiene la información más importante
- Los nombres suelen estar en el orden: APELLIDOS<<NOMBRES
- La nacionalidad viene en código de 3 letras (VEN = Venezuela, COL = Colombia, USA = Estados Unidos, etc.)
- El sexo es M (masculino) o F (femenino)
- La fecha de nacimiento suele estar en formato YYMMDD en la MRZ
- El país de emisión suele estar visible en la portada o en la página de datos

FORMATO DE RESPUESTA (JSON estricto):
{
  "nombres": string | null,
  "apellidos": string | null,
  "numero_pasaporte": string | null,
  "nacionalidad": string | null,
  "sexo": "M" | "F" | null,
  "fecha_nacimiento": string | null,
  "pais_emision": string | null,
  "confidence": "high" | "medium" | "low",
  "notes": string
}

Donde:
- nombres: Nombres del titular (pueden ser uno o dos nombres)
- apellidos: Apellidos del titular (pueden ser uno o dos apellidos)
- numero_pasaporte: Número del pasaporte (alfanumérico)
- nacionalidad: Nacionalidad en código de 3 letras o nombre completo (ej: "VEN" o "Venezuela")
- sexo: "M" o "F"
- fecha_nacimiento: Fecha en formato YYYY-MM-DD (convierte desde el formato del pasaporte)
- pais_emision: País que emitió el pasaporte (ej: "Venezuela", "Colombia", "United States")
- confidence: Nivel de confianza en la extracción (high si todo es claro, medium si hay dudas, low si la imagen es borrosa)
- notes: Notas adicionales o advertencias (ej: "Imagen borrosa, verificar manualmente", "Algunos campos no visibles")`
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/api/extract-passport/route.js
git commit -m "feat: agregar campo pais_emision en API de extracción de pasaportes"
```

### Task 3: Actualizar frontend para mapear pais_emision de pasaportes

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:315-325`

- [ ] **Step 1: Update passport data mapping to include pais_emision**

```javascript
        } else {
        // Para pasaportes
          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_pasaporte: extracted.numero_pasaporte || updated[index].numero_pasaporte,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision || updated[index].pais_emision_cedula
          }
        }
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat: mapear campo pais_emision de pasaportes a pais_emision_cedula"
```

### Task 4: Actualizar VueloFormEditar.jsx con el mismo mapeo

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormEditar.jsx` (buscar sección similar de mapeo de pasaportes)

- [ ] **Step 1: Find the passport mapping section in VueloFormEditar.jsx**

Run: `grep -n "Para pasaportes" dashboard/src/components/vuelos/VueloFormEditar.jsx`
Expected: Line number where passport mapping occurs

- [ ] **Step 2: Update passport data mapping in VueloFormEditar.jsx**

```javascript
        } else {
        // Para pasaportes
          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_pasaporte: extracted.numero_pasaporte || updated[index].numero_pasaporte,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision || updated[index].pais_emision_cedula
          }
        }
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/vuelos/VueloFormEditar.jsx
git commit -m "feat: mapear campo pais_emision de pasaportes en VueloFormEditar"
```

---

## FASE 3: API de Extracción de Cédulas

### Task 5: Renombrar campo pais_emision a pais_emision_cedula en API de cédulas

**Files:**
- Modify: `dashboard/src/app/api/extract-cedula/route.js:47-58`

- [ ] **Step 1: Update the response format in system prompt**

```javascript
FORMATO DE RESPUESTA (JSON estricto):
{
  "nombres": string | null,
  "apellidos": string | null,
  "numero_cedula": string | null,
  "nacionalidad": string | null,
  "sexo": "M" | "F" | null,
  "fecha_nacimiento": string | null,
  "pais_emision_cedula": string | null,
  "confidence": "high" | "medium" | "low",
  "notes": string
}

Donde:
- nombres: Nombres del titular (pueden ser uno o dos nombres)
- apellidos: Apellidos del titular (pueden ser uno o dos apellidos)
- numero_cedula: Número de la cédula tal como aparece (con prefijos y guiones si los tiene)
- nacionalidad: Nacionalidad del titular (ej: "Venezolana", "Colombiana")
- sexo: "M" o "F"
- fecha_nacimiento: Fecha en formato YYYY-MM-DD (convierte desde el formato de la cédula)
- pais_emision_cedula: País que emitió la cédula (ej: "Venezuela", "Colombia")
- confidence: Nivel de confianza en la extracción (high si todo es claro, medium si hay dudas, low si la imagen es borrosa)
- notes: Notas adicionales o advertencias (ej: "Imagen borrosa, verificar manualmente", "Cédula antigua, formato diferente")`
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/api/extract-cedula/route.js
git commit -m "refactor: renombrar pais_emision a pais_emision_cedula en API de cédulas"
```

---

## FASE 4: Validación Backend Flexible

### Task 6: Hacer validación de pasaporte más flexible en backend

**Files:**
- Modify: `src/services/vuelosService.js:852-855`

- [ ] **Step 1: Update passport validation to be more flexible**

```javascript
      // Validación de formato básico para pasaportes (generalmente alfanumérico)
      // Longitud variable por país, mínimo 6 caracteres
      if (!/^[A-Z0-9]{6,}$/.test(pasajero.numero_pasaporte.trim().toUpperCase())) {
        throw new Error('El formato del pasaporte parece inválido. Debe tener al menos 6 caracteres alfanuméricos');
      }
```

- [ ] **Step 2: Commit**

```bash
git add src/services/vuelosService.js
git commit -m "refactor: hacer validación de pasaporte más flexible (mínimo 6 caracteres)"
```

### Task 7: Implementar validación flexible para cédulas en backend

**Files:**
- Modify: `src/services/vuelosService.js:858-878`

- [ ] **Step 1: Replace strict validation with flexible validation**

```javascript
    else if (pasajero.tipo_documento === 'CEDULA') {
      if (!pasajero.numero_cedula || pasajero.numero_cedula.trim() === '') {
        throw new Error('El número de cédula es requerido para tipo CEDULA');
      }
      
      if (!pasajero.pais_emision_cedula || pasajero.pais_emision_cedula.trim() === '') {
        throw new Error('El país de emisión es requerido para cédulas');
      }
      
      // Validación flexible para cédulas (acepta múltiples formatos y normaliza)
      const cedula = pasajero.numero_cedula.trim().toUpperCase();
      const pais = pasajero.pais_emision_cedula;
      
      if (pais === 'Venezuela') {
        // Aceptar: 12345678, V-12345678, E-12345678, V12345678, E12345678
        const match = cedula.match(/^(?:[VE]-?)?(\d{7,8})$/);
        if (!match) {
          throw new Error('Formato de cédula venezolana inválido. Use V-12345678, E-12345678, o solo los dígitos');
        }
        // Normalizar a V-12345678 (por defecto V si no hay prefijo)
        const prefijo = cedula.startsWith('E') ? 'E' : 'V';
        pasajero.numero_cedula = `${prefijo}-${match[1]}`;
      }
      
      else if (pais === 'Colombia') {
        // Aceptar: 1234567890, 1.234.567.890, 123-456-7890
        const limpio = cedula.replace(/[^0-9]/g, '');
        if (!/^\d{8,10}$/.test(limpio)) {
          throw new Error('Formato de cédula colombiana inválido. Use 8-10 dígitos numéricos');
        }
        // Normalizar a solo dígitos
        pasajero.numero_cedula = limpio;
      }
      
      else {
        // Para otros países, validar que tenga al menos 6 caracteres alfanuméricos
        if (!/^[A-Z0-9-]{6,}$/.test(cedula)) {
          throw new Error('Formato de cédula inválido. Debe tener al menos 6 caracteres');
        }
        // Mantener formato original para otros países
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/services/vuelosService.js
git commit -m "feat: implementar validación flexible para cédulas con normalización"
```

---

## FASE 5: Normalización en Frontend

### Task 8: Crear utilidad de normalización de cédulas en frontend

**Files:**
- Create: `dashboard/src/lib/documentos/normalizarCedula.js`

- [ ] **Step 1: Create the normalization utility**

```javascript
/**
 * Normaliza el número de cédula según el país de emisión
 * @param {string} numero - Número de cédula crudo (extraído por IA)
 * @param {string} pais - País de emisión (Venezuela, Colombia, etc.)
 * @returns {string} Número de cédula normalizado
 */
export const normalizarCedula = (numero, pais) => {
  if (!numero) return '';
  
  const limpio = numero.replace(/[^0-9]/g, ''); // Extraer solo números
  
  switch (pais) {
    case 'Venezuela':
      // Determinar prefijo (V por defecto, E si empieza con E)
      const prefijo = numero.toUpperCase().startsWith('E') ? 'E' : 'V';
      // Tomar hasta 8 dígitos
      const digitos = limpio.slice(0, 8);
      return `${prefijo}-${digitos}`;
    
    case 'Colombia':
      // Solo dígitos, hasta 10 caracteres
      return limpio.slice(0, 10);
    
    case 'Perú':
    case 'Ecuador':
      // Solo dígitos, hasta 10 caracteres
      return limpio.slice(0, 10);
    
    default:
      // Para otros países, mantener formato original pero limpiar espacios
      return numero.trim().toUpperCase();
  }
};

/**
 * Valida si un número de cédula tiene formato válido según el país
 * @param {string} numero - Número de cédula a validar
 * @param {string} pais - País de emisión
 * @returns {boolean} True si el formato es válido
 */
export const validarFormatoCedula = (numero, pais) => {
  if (!numero) return false;
  
  switch (pais) {
    case 'Venezuela':
      return /^[VE]-?\d{7,8}$/.test(numero.trim().toUpperCase());
    
    case 'Colombia':
      return /^\d{8,10}$/.test(numero.replace(/[^0-9]/g, ''));
    
    case 'Perú':
    case 'Ecuador':
      return /^\d{8,10}$/.test(numero.replace(/[^0-9]/g, ''));
    
    default:
      return /^[A-Z0-9-]{6,}$/.test(numero.trim().toUpperCase());
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/lib/documentos/normalizarCedula.js
git commit -m "feat: crear utilidad de normalización de cédulas"
```

### Task 9: Integrar normalización en VueloFormNuevo.jsx

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:1-10` (agregar import)
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:302-313` (usar normalización)

- [ ] **Step 1: Add import for normalization utility**

```javascript
import { normalizarCedula } from '@/lib/documentos/normalizarCedula'
```

- [ ] **Step 2: Apply normalization after extracting cedula data**

```javascript
        if (esCedula) {
          // Para cédulas
          const cedulaNormalizada = normalizarCedula(
            extracted.numero_cedula || updated[index].numero_cedula,
            extracted.pais_emision_cedula || updated[index].pais_emision_cedula
          );
          
          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_cedula: cedulaNormalizada,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision || updated[index].pais_emision_cedula
          }
        }
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat: integrar normalización de cédulas en VueloFormNuevo"
```

### Task 10: Integrar normalización en VueloFormEditar.jsx

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormEditar.jsx:1-10` (agregar import)
- Modify: `dashboard/src/components/vuelos/VueloFormEditar.jsx` (buscar sección de cédulas y aplicar normalización)

- [ ] **Step 1: Add import for normalization utility**

```javascript
import { normalizarCedula } from '@/lib/documentos/normalizarCedula'
```

- [ ] **Step 2: Find the cedula mapping section in VueloFormEditar.jsx**

Run: `grep -n "Para cédulas" dashboard/src/components/vuelos/VueloFormEditar.jsx`
Expected: Line number where cedula mapping occurs

- [ ] **Step 3: Apply normalization after extracting cedula data**

```javascript
        if (esCedula) {
          // Para cédulas
          const cedulaNormalizada = normalizarCedula(
            extracted.numero_cedula || updated[index].numero_cedula,
            extracted.pais_emision_cedula || updated[index].pais_emision_cedula
          );
          
          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_cedula: cedulaNormalizada,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision_cedula || updated[index].pais_emision_cedula
          }
        }
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/vuelos/VueloFormEditar.jsx
git commit -m "feat: integrar normalización de cédulas en VueloFormEditar"
```

---

## FASE 6: Mejoras en Prompts de IA

### Task 11: Actualizar prompt de cédulas con instrucciones específicas por país

**Files:**
- Modify: `dashboard/src/app/api/extract-cedula/route.js:71-77`

- [ ] **Step 1: Update user message with country-specific instructions**

```javascript
    const userMessage = `Analiza esta imagen de cédula de identidad${pais ? ` de ${pais}` : ''} y extrae los datos solicitados.

INSTRUCCIONES ESPECÍFICAS POR PAÍS:
${pais === 'Venezuela' ? `
- El número de cédula venezolana DEBE incluir el prefijo V o E
- Formato típico: V-12345678 (venezolano) o E-12345678 (extranjero)
- Si solo ves números, asume prefijo V
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Colombia' ? `
- El número de cédula colombiana es solo numérico (8-10 dígitos)
- No incluye prefijos ni letras
- Si hay separadores (puntos, guiones), inclúyelos como aparecen
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Perú' ? `
- El DNI peruano tiene 8 dígitos numéricos
- No incluye prefijos ni letras
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Ecuador' ? `
- La cédula ecuatoriana tiene 10 dígitos numéricos
- No incluye prefijos ni letras
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${!pais ? `
- Para países no especificados, extrae el número tal como aparece
- Incluye cualquier prefijo, letra o separador que veas en el documento
` : ''}

RECUERDA: 
- Si un campo no es visible o legible, devuelve null. NO inventes información.
- Convierte la fecha de nacimiento a formato YYYY-MM-DD
- Identifica el país de emisión si es visible en el documento`
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/api/extract-cedula/route.js
git commit -m "feat: agregar instrucciones específicas por país en prompt de cédulas"
```

### Task 12: Actualizar prompt de pasaportes con instrucciones más claras

**Files:**
- Modify: `dashboard/src/app/api/extract-passport/route.js:57-59`

- [ ] **Step 1: Update user message with clearer instructions**

```javascript
    const userMessage = `Analiza esta imagen de pasaporte y extrae los datos solicitados.

INSTRUCCIONES ESPECÍFICAS:
- Prioriza la información de la zona MRZ (Machine Readable Zone) en la parte inferior
- La nacionalidad en MRZ es código de 3 letras (VEN, COL, USA, etc.)
- El país de emisión suele estar visible en la portada del pasaporte
- Si el país de emisión no es visible, infiérelo de la nacionalidad si es posible

RECUERDA: Si un campo no es visible o legible, devuelve null. NO inventes información.`
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/api/extract-passport/route.js
git commit -m "feat: mejorar instrucciones en prompt de pasaportes"
```

---

## FASE 7: Pruebas y Verificación

### Task 13: Crear casos de prueba manuales

**Files:**
- Create: `docs/06-extraccion-ia-documentos/casos-prueba.md`

- [ ] **Step 1: Create test cases document**

```markdown
# Casos de Prueba - Extracción IA de Documentos

## Pasaportes

### Caso 1: Pasaporte Venezolano
- **Entrada:** Imagen de pasaporte venezolano válido
- **Esperado:**
  - numero_pasaporte: alfanumérico 6-9 caracteres
  - nacionalidad: "VEN" o "Venezuela"
  - pais_emision: "Venezuela"
  - confidence: "high" o "medium"
- **Validación:** Backend acepta el número (mínimo 6 caracteres)

### Caso 2: Pasaporte Colombiano
- **Entrada:** Imagen de pasaporte colombiano válido
- **Esperado:**
  - numero_pasaporte: alfanumérico 6-9 caracteres
  - nacionalidad: "COL" o "Colombia"
  - pais_emision: "Colombia"
  - confidence: "high" o "medium"
- **Validación:** Backend acepta el número

### Caso 3: Pasaporte con imagen borrosa
- **Entrada:** Imagen de pasaporte borrosa
- **Esperado:**
  - confidence: "low"
  - notes: "Imagen borrosa, verificar manualmente"
  - Campos no legibles: null
- **Validación:** Usuario puede corregir manualmente

---

## Cédulas

### Caso 1: Cédula Venezolana (formato V-12345678)
- **Entrada:** Imagen de cédula venezolana con prefijo V
- **Esperado IA:**
  - numero_cedula: "V-12345678" (o "V12345678")
  - pais_emision_cedula: "Venezuela"
  - nacionalidad: "Venezolano" o "Venezolana"
- **Normalización Frontend:** "V-12345678"
- **Validación Backend:** Acepta y normaliza a "V-12345678"

### Caso 2: Cédula Venezolana (solo números)
- **Entrada:** Imagen de cédula venezolana sin prefijo visible
- **Esperado IA:**
  - numero_cedula: "12345678" (solo números)
  - pais_emision_cedula: "Venezuela"
- **Normalización Frontend:** "V-12345678"
- **Validación Backend:** Acepta y normaliza a "V-12345678"

### Caso 3: Cédula Venezolana (extranjero)
- **Entrada:** Imagen de cédula venezolana con prefijo E
- **Esperado IA:**
  - numero_cedula: "E-12345678" (o "E12345678")
  - pais_emision_cedula: "Venezuela"
- **Normalización Frontend:** "E-12345678"
- **Validación Backend:** Acepta y normaliza a "E-12345678"

### Caso 4: Cédula Colombiana
- **Entrada:** Imagen de cédula colombiana
- **Esperado IA:**
  - numero_cedula: "1234567890" (puede tener separadores)
  - pais_emision_cedula: "Colombia"
  - nacionalidad: "Colombiano" o "Colombiana"
- **Normalización Frontend:** "1234567890" (solo dígitos)
- **Validación Backend:** Acepta y normaliza a solo dígitos

### Caso 5: Cédula Peruana
- **Entrada:** Imagen de DNI peruano
- **Esperado IA:**
  - numero_cedula: "12345678" (8 dígitos)
  - pais_emision_cedula: "Perú"
- **Normalización Frontend:** "12345678"
- **Validación Backend:** Acepta formato peruano

---

## Escenarios Edge

### Caso 1: Cédula con formato inválido
- **Entrada:** "ABC123" (formato no reconocido)
- **Esperado:** Error de validación en backend
- **Mensaje:** "Formato de cédula inválido"

### Caso 2: Pasaporte con menos de 6 caracteres
- **Entrada:** "AB123" (5 caracteres)
- **Esperado:** Error de validación en backend
- **Mensaje:** "El formato del pasaporte parece inválido. Debe tener al menos 6 caracteres alfanuméricos"

### Caso 3: País no soportado
- **Entrada:** Cédula de país no listado (ej: Argentina)
- **Esperado:** Validación flexible acepta formato crudo
- **Comportamiento:** Normalización mínima, se mantiene formato original
```

- [ ] **Step 2: Commit**

```bash
git add docs/06-extraccion-ia-documentos/casos-prueba.md
git commit -m "docs: agregar casos de prueba para extracción de documentos"
```

### Task 14: Verificar integración completa

**Files:**
- Test: Manual testing in browser

- [ ] **Step 1: Test passport extraction with country field**

1. Abrir formulario de vuelo nuevo
2. Agregar pasajero
3. Seleccionar tipo documento: PASAPORTE
4. Cargar imagen de pasaporte válido
5. Clic en "Extraer datos con IA"
6. Verificar que se extrae campo `pais_emision_cedula`
7. Verificar que el número de pasaporte se guarda correctamente
8. Verificar que no hay errores de validación

- [ ] **Step 2: Test Venezuelan ID card normalization**

1. Abrir formulario de vuelo nuevo
2. Agregar pasajero
3. Seleccionar tipo documento: CEDULA
4. Seleccionar país: Venezuela
5. Cargar imagen de cédula venezolana
6. Clic en "Extraer datos con IA"
7. Verificar que el número se normaliza a formato V-12345678
8. Verificar que el backend acepta el número normalizado
9. Verificar que se guarda correctamente en BD

- [ ] **Step 3: Test Colombian ID card normalization**

1. Abrir formulario de vuelo nuevo
2. Agregar pasajero
3. Seleccionar tipo documento: CEDULA
4. Seleccionar país: Colombia
5. Cargar imagen de cédula colombiana
6. Clic en "Extraer datos con IA"
7. Verificar que el número se normaliza a solo dígitos
8. Verificar que el backend acepta el número normalizado
9. Verificar que se guarda correctamente en BD

- [ ] **Step 4: Test flexible validation**

1. Intentar ingresar cédula venezolana sin prefijo manualmente
2. Verificar que backend normaliza a V-12345678
3. Intentar ingresar cédula colombiana con puntos manualmente
4. Verificar que backend normaliza a solo dígitos

- [ ] **Step 5: Test passport flexible validation**

1. Intentar ingresar pasaporte con 10 caracteres
2. Verificar que backend acepta (validación flexible)
3. Intentar ingresar pasaporte con 5 caracteres
4. Verificar que backend rechaza (mínimo 6 caracteres)

- [ ] **Step 6: Commit**

```bash
git add docs/06-extraccion-ia-documentos/
git commit -m "test: documentar verificación de integración completa"
```

---

## FASE 8: Documentación Final

### Task 15: Actualizar README del proyecto con cambios

**Files:**
- Modify: `README.md` (o crear CHANGELOG.md si existe)

- [ ] **Step 1: Add changelog entry**

```markdown
## [2026-05-05] Mejoras en Extracción IA de Documentos

### Cambios Realizados

#### API de Extracción
- **Pasaportes:** Agregado campo `pais_emision` en respuesta de extracción
- **Cédulas:** Renombrado campo `pais_emision` a `pais_emision_cedula` para consistencia con schema
- **Prompts:** Mejoradas instrucciones específicas por país para mejor extracción

#### Frontend
- **Normalización:** Creada utilidad `normalizarCedula.js` para normalizar números de cédula según país
- **VueloFormNuevo:** Integrada normalización después de extracción IA
- **VueloFormEditar:** Integrada normalización después de extracción IA
- **Mapeo:** Actualizado mapeo de `pais_emision` de pasaportes a `pais_emision_cedula`

#### Backend
- **Validación Pasaportes:** Cambiada de 6-9 caracteres a mínimo 6 caracteres (más flexible)
- **Validación Cédulas:** Implementada validación flexible que acepta múltiples formatos
- **Normalización Backend:** Cédulas se normalizan internamente antes de guardar en BD
  - Venezuela: Acepta V-12345678, E-12345678, V12345678, E12345678, o solo dígitos → normaliza a V-12345678
  - Colombia: Acepta con separadores → normaliza a solo dígitos
  - Otros países: Validación flexible, mantiene formato original

#### Documentación
- Creado `docs/06-extraccion-ia-documentos/formatos-documentos.md` con referencia de formatos
- Creado `docs/06-extraccion-ia-documentos/casos-prueba.md` con casos de prueba

### Impacto
- Mejor alineación entre extracción IA y schema de BD
- Experiencia de usuario mejorada con normalización automática
- Validaciones más robustas y flexibles
- Soporte para múltiples formatos de cédula por país
- Datos consistentes en base de datos

### Archivos Modificados
- `dashboard/src/app/api/extract-passport/route.js`
- `dashboard/src/app/api/extract-cedula/route.js`
- `dashboard/src/components/vuelos/VueloFormNuevo.jsx`
- `dashboard/src/components/vuelos/VueloFormEditar.jsx`
- `dashboard/src/lib/documentos/normalizarCedula.js` (nuevo)
- `src/services/vuelosService.js`
- `docs/06-extraccion-ia-documentos/formatos-documentos.md` (nuevo)
- `docs/06-extraccion-ia-documentos/casos-prueba.md` (nuevo)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: actualizar changelog con mejoras en extracción IA de documentos"
```

---

## Resumen de Cambios

### Archivos Creados
1. `docs/06-extraccion-ia-documentos/formatos-documentos.md` - Referencia de formatos
2. `docs/06-extraccion-ia-documentos/casos-prueba.md` - Casos de prueba
3. `dashboard/src/lib/documentos/normalizarCedula.js` - Utilidad de normalización
4. `docs/06-extraccion-ia-documentos/2026-05-05-mejoras-extraccion-ia-documentos.md` - Este plan

### Archivos Modificados
1. `dashboard/src/app/api/extract-passport/route.js` - Agregar campo pais_emision
2. `dashboard/src/app/api/extract-cedula/route.js` - Renombrar campo, mejorar prompt
3. `dashboard/src/components/vuelos/VueloFormNuevo.jsx` - Integrar normalización
4. `dashboard/src/components/vuelos/VueloFormEditar.jsx` - Integrar normalización
5. `src/services/vuelosService.js` - Validaciones flexibles
6. `README.md` - Documentar cambios

### Estrategia de Implementación
- **Fase 1:** Documentación de referencia
- **Fase 2:** API de pasaportes (agregar campo)
- **Fase 3:** API de cédulas (renombrar campo)
- **Fase 4:** Validación backend flexible
- **Fase 5:** Normalización frontend
- **Fase 6:** Mejoras en prompts IA
- **Fase 7:** Pruebas y verificación
- **Fase 8:** Documentación final

### Principios Aplicados
- **DRY:** Lógica de normalización centralizada en utilidad reutilizable
- **YAGNI:** Solo implementar normalización para países soportados actualmente
- **TDD:** Casos de prueba definidos antes de implementación
- **Frequent Commits:** Cada tarea es un commit independiente
- **API Design:** Nombres consistentes con schema de BD
- **Code Review:** Validaciones flexibles pero robustas
