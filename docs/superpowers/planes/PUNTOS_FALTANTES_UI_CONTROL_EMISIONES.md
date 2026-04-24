# Puntos Faltantes UI - Control de Emisiones

**Fecha:** 2026-04-22
**Contexto:** Fases 1-5 del plan de Control de Emisiones han sido implementadas en backend y parcialmente en frontend. Este documento especifica los puntos que faltan de UI para completar la funcionalidad.

---

## 1. Historial de Auditoría de Cambios de Estado

**Estado Backend:** ✅ COMPLETO
- Tabla `auditoria_cambios_estado` creada
- Servicio `auditoriaService.js` implementado
- Integración en `emisionesService.js` (autorizarEmision, rechazarEmision, marcarComoEmitido)
- Endpoint `GET /api/vuelos/:id/historial` creado

**Estado Frontend:** ❌ FALTA UI
- No existe componente para visualizar el historial de cambios de estado
- El endpoint del backend no está consumido por ninguna vista

**Requisitos de Implementación:**

### 1.1 Agregar endpoint a apiConfig.js
**Archivo:** `dashboard/src/config/apiConfig.js`

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  historialCambios: (id) => buildApiUrl(`/api/vuelos/${id}/historial`),
}
```

### 1.2 Crear componente HistorialCambiosEstado.jsx
**Archivo:** `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx`

Debe ser similar a `HistorialEdiciones.jsx` pero mostrando:
- Campo cambiado (ej: estado, estado_emision, autorizado_emision)
- Valor anterior
- Valor nuevo
- Usuario que hizo el cambio
- Fecha/hora del cambio
- Razón del cambio (si existe)
- IP address (si existe)

**Campos a mostrar:**
- `entidad_tipo`: 'vuelo'
- `campo_cambiado`: nombre del campo
- `valor_anterior`: valor antes del cambio
- `valor_nuevo`: valor después del cambio
- `usuario_nombre`: nombre del usuario
- `fecha_cambio`: timestamp
- `razon_cambio`: motivo del cambio

### 1.3 Integrar en página de detalle de vuelo
**Archivo:** Probablemente `dashboard/src/app/(crm)/emisiones/[id]/page.jsx` o similar

Agregar el componente `<HistorialCambiosEstado vueloId={vueloId} />` en la sección de detalles del vuelo.

---

## 2. Solicitud de Autorización de Emisión

**Estado Backend:** ✅ COMPLETO
- Función `notificarRecordatorioAutorizacion()` implementada en `notificacionesService.js`
- Endpoint `POST /api/vuelos/:id/solicitar-autorizacion` creado
- Notificación enviada a todos los admins cuando emisor solicita

**Estado Frontend:** ❌ FALTA UI
- No existe botón/form para solicitar autorización
- El endpoint del backend no está consumido por ninguna vista

**Requisitos de Implementación:**

### 2.1 Agregar endpoint a apiConfig.js
**Archivo:** `dashboard/src/config/apiConfig.js`

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  solicitarAutorizacion: (id) => buildApiUrl(`/api/vuelos/${id}/solicitar-autorizacion`),
}
```

### 2.2 Agregar botón "Solicitar Autorización"
**Ubicación:** Probablemente en:
- `dashboard/src/app/(crm)/emisiones/[id]/page.jsx` - página de detalle de vuelo
- O en `dashboard/src/components/vuelos/VueloDetail.jsx`

**Requisitos del botón:**
- Solo visible para usuarios con rol `emisor`
- Solo visible cuando el vuelo está en estado `PENDIENTE_EMISION`
- Al hacer click, enviar POST al endpoint con `userId` del usuario actual
- Mostrar confirmación (SweetAlert2 o similar)
- Mostrar toast de éxito/error después de la solicitud

**Payload esperado:**
```javascript
{
  userId: user.id
}
```

**Response esperada:**
```javascript
{
  message: "Solicitud de autorización enviada a administración",
  vuelo_id: "uuid"
}
```

### 2.3 Validaciones
- Verificar que el usuario tenga rol `emisor`
- Verificar que el vuelo esté en estado `PENDIENTE_EMISION`
- Verificar que no esté ya autorizado

---

## 3. Notificación Tipo pago_confirmado

**Nota:** Este tipo de notificación ya existe en el catálogo, pero verificar que esté correctamente implementado en el frontend.

**Estado Backend:** ✅ Probablemente completo (verificar)
- Función `notificarPagoConfirmado()` debería existir en `notificacionesService.js`

**Estado Frontend:** ⚠️ VERIFICAR
- Verificar que el icono esté mapeado en `NotificacionesCampana.jsx`
- Verificar que el tipo esté en el catálogo

---

## 4. Verificación de Integración de Notificaciones

**Requisitos:**
- Verificar que todos los tipos de notificaciones del catálogo tengan:
  - ✅ Función en backend
  - ✅ Icono en frontend
  - ✅ Tipo en catálogo

**Tipos a verificar:**
1. `vuelo_creado` - ✅ probablemente completo
2. `vuelo_emitido` - ✅ probablemente completo
3. `pago_observado` - ✅ probablemente completo
4. `pago_confirmado` - ⚠️ verificar
5. `recordatorio_autorizacion` - ✅ completo (FASE 2)

---

## Prioridad de Implementación

1. **ALTA:** Historial de Auditoría de Cambios de Estado (necesario para trazabilidad)
2. **ALTA:** Solicitud de Autorización (necesario para flujo de emisiones)
3. **MEDIA:** Verificación de pago_confirmado (si falta)
4. **BAJA:** Verificación general de notificaciones

---

## Archivos a Modificar

1. `dashboard/src/config/apiConfig.js` - agregar endpoints faltantes
2. `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx` - NUEVO
3. `dashboard/src/app/(crm)/emisiones/[id]/page.jsx` - integrar componentes
4. `dashboard/src/components/vuelos/VueloDetail.jsx` - posible ubicación alternativa

---

## Notas Adicionales

- Considerar reutilizar el diseño de `HistorialEdiciones.jsx` para mantener consistencia visual
- El componente de historial debería ser colapsable como el de ediciones
- Usar los mismos iconos de Lucide React para consistencia
- Validar permisos de acceso al historial (solo admins y super_admins deberían verlo)
