# Detección de cambios de nombre

Implementación de detección automática de cambios de nombre en contactos usando WAHA-plus

---

## Endpoints disponibles

### Obtener información del contacto

```
GET /api/{session}/contacts
```

Retorna información básica del contacto incluyendo nombre, pushname, verifiedName y flags de negocio

---

### Obtener "about" del contacto

```
GET /api/{session}/contacts/about
```

Retorna el estado o descripción del contacto (no incluye nombre)

---

### Obtener foto de perfil

```
GET /api/{session}/contacts/profile-picture
```

Retorna la URL de la foto de perfil del contacto

---

### Crear o actualizar contacto

```
PUT /api/{session}/contacts/{chatId}
```

Permite crear o actualizar información de un contacto en WAHA

---

## Lógica actual del proyecto

### Servicio de contactos WAHA

Ubicación: `src/services/wahaContactService.js`

El método `getFullContactData()` combina los tres endpoints GET para obtener:
- name (de basicInfo)
- push_name (de basicInfo)
- profile_picture_url (de profilePicture)
- is_business e is_enterprise (de basicInfo)

---

### Servicio de webhooks

Ubicación: `src/services/webhookService.js`

El método `getOrCreateContact()` actualmente:
- Solo consulta WAHA si el contacto NO tiene nombre o foto
- Si el contacto ya tiene datos completos, retorna sin verificar cambios
- Esto impide detectar cambios de nombre posteriores

---

## Implementación propuesta

### Modificar webhookService.js

En el método `getOrCreateContact()` (líneas ~374-387):

Cambiar la lógica condicional para:
1. Siempre consultar WAHA cuando llega un mensaje
2. Normalizar y comparar nombres (case-insensitive)
3. Actualizar si hay diferencia significativa

### Pseudocódigo

```javascript
if (existingContact) {
  // Siempre consultar WAHA
  const wahaContactData = await WahaContactService.getFullContactData(session, contactId)
  
  // Normalizar nombres para comparación
  const normalizeName = (name) => name?.toLowerCase().trim().replace(/\s+/g, '')
  const currentName = normalizeName(existingContact.name)
  const wahaName = normalizeName(wahaContactData.name)
  
  // Si el nombre cambió, actualizar
  if (wahaName && wahaName !== currentName) {
    return await contactService.getOrCreateContact(botId, contactNumber, {
      name: wahaContactData.name,
      push_name: wahaContactData.push_name,
      profile_picture_url: wahaContactData.profile_picture_url
    })
  }
  
  return existingContact
}
```

---

## Consideraciones importantes

### Evitar actualizaciones innecesarias

Normalizar nombres antes de comparar para evitar actualizaciones por:
- Diferencias de mayúsculas/minúsculas
- Espacios extra
- Cambios menores de formato

### Validar nombres inválidos

Usar la función `isInvalidName()` existente para evitar guardar el nombre del bot como nombre del contacto

### Performance

La consulta a WAHA se hace en paralelo con otras operaciones, por lo que el impacto en performance es mínimo

---

## Archivos involucrados

- `src/services/wahaContactService.js` - Cliente WAHA API
- `src/services/webhookService.js` - Procesamiento de webhooks
- `src/services/contactService.js` - Gestión de contactos en BD
- `src/services/chatService.js` - Actualización de chats con nuevo nombre
