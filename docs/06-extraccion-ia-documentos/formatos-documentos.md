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
