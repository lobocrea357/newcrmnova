# Commit Message

```
feat: Implementar sistema de sincronización completo (manual + automática) de datos WAHA

Implementa sistema completo de sincronización con dos componentes:
1. Sincronización manual bajo demanda desde el dashboard
2. Auto-sincronización periódica configurable

Incluye validaciones robustas, manejo de errores mejorado, recuperación automática de datos,
y UI intuitiva en el dashboard.

## Cambios principales:

Backend - Sincronización Manual:
- Nuevo servicio `wahaContactService` para consultar API de WAHA
- Nuevo servicio `syncService` con métodos de sincronización
- Nuevas rutas `/api/sync/:session/contacts|chats|all`
- Validación de sesiones activas antes de sincronizar
- Manejo de errores 404/422 con mensajes informativos
- Integración en webhooks para enriquecer datos de contactos

Backend - Auto-Sincronización (NUEVO):
- Nuevo servicio `autoSyncService` para sincronización periódica
- Nuevas rutas `/api/auto-sync/status|start|stop|force`
- Configurable via variables de entorno (intervalo, modo completo/básico)
- Inicio automático al arrancar Express
- Recuperación automática de datos después de truncar tablas
- Logs detallados de cada ciclo de sincronización

Frontend:
- Botón "Sincronizar Bot" en dashboard con loading state
- Alertas específicas para éxito/error/bot desconectado
- Recarga automática de datos tras sincronización exitosa

Documentación - Sincronización Manual:
- SYNC_GUIDE.md: Guía completa de uso
- FIX_SYNC_422.md: Análisis técnico de problemas 404/422
- SYNC_FIXES_SUMMARY.md: Resumen de correcciones

Documentación - Auto-Sincronización (NUEVO):
- AUTO_SYNC_GUIDE.md: Guía completa (400+ líneas)
- AUTO_SYNC_CONFIG.md: Configuración y variables de entorno (250+ líneas)
- IMPLEMENTACION_AUTO_SYNC.md: Resumen ejecutivo (600+ líneas)

Documentación General:
- PR_SYNC_FEATURE.md: Documentación completa del PR
- COMMIT_MESSAGE.md: Template para commit
- CHANGELOG_SYNC.md: Changelog detallado

## Problema resuelto:
1. Los campos name, push_name, profile_picture_url en contactos y last_message,
   contact_name, chat_id en chats se almacenaban como NULL porque los webhooks
   de WAHA no siempre incluyen toda la información.
2. Cuando se truncaban tablas, los datos solo se recuperaban cuando llegaban
   mensajes nuevos. Los contactos/chats históricos sin actividad reciente NO
   se recuperaban automáticamente.

Solución:
- Sincronización manual bajo demanda desde el dashboard
- Auto-sincronización periódica que recupera datos automáticamente

## Características:
### Sincronización Manual:
- ✅ Idempotente (no duplica datos)
- ✅ Conservador (solo actualiza campos NULL)
- ✅ Rate-limited (no satura WAHA API)
- ✅ Fail fast (valida sesión antes de sincronizar)
- ✅ Mensajes de error claros con sesiones disponibles
- ✅ Botón UI en dashboard con loading states

### Auto-Sincronización (NUEVO):
- ✅ Periódica y configurable (default: cada 30 minutos)
- ✅ Inicio automático al arrancar Express
- ✅ Recuperación automática después de truncar tablas
- ✅ Modo completo (bots + contactos + chats) o básico (solo bots)
- ✅ API de control (status, start, stop, force)
- ✅ Non-blocking (se ejecuta en background)

## Archivos nuevos:
Backend (5 archivos):
- src/services/wahaContactService.js (153 líneas)
- src/services/syncService.js (411 líneas)
- src/routes/sync.js (98 líneas)
- src/services/autoSyncService.js (254 líneas) 🆕
- src/routes/autoSync.js (90 líneas) 🆕

Documentación (10 archivos):
- SYNC_GUIDE.md
- FIX_SYNC_422.md
- SYNC_FIXES_SUMMARY.md
- AUTO_SYNC_GUIDE.md 🆕
- AUTO_SYNC_CONFIG.md 🆕
- IMPLEMENTACION_AUTO_SYNC.md 🆕
- PR_SYNC_FEATURE.md
- COMMIT_MESSAGE.md
- CHANGELOG_SYNC.md

## Archivos modificados:
- src/services/webhookService.js (integra wahaContactService)
- src/index.js (registra rutas sync + auto-sync, inicia auto-sync) 🆕
- dashboard/src/app/dashboard/page.js (botón de sincronización)

Breaking Changes: Ninguno

Closes: #[número-de-issue]
```
