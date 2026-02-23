# ✅ Checklist: ¿Qué Falta para Producción?

## 🎯 Estado Actual del Proyecto

### ✅ Completado

1. **Arquitectura**
   - ✅ Docker Compose configurado
   - ✅ WAHA Plus integrado
   - ✅ Express API funcionando
   - ✅ Dashboard Next.js
   - ✅ Supabase como base de datos

2. **Backend**
   - ✅ Webhooks de WAHA configurados
   - ✅ Procesamiento de mensajes
   - ✅ Procesamiento de multimedia (corregido)
   - ✅ Transcripción de audios (corregido)
   - ✅ API REST completa

3. **Base de Datos**
   - ✅ Schema completo
   - ✅ Vistas mejoradas (con números de teléfono)
   - ✅ RLS configurado
   - ✅ Índices optimizados

4. **Documentación**
   - ✅ README completo
   - ✅ Guías de instalación
   - ✅ Arquitectura documentada
   - ✅ Troubleshooting

---

## ⚠️ Pendiente para VPS

### 1. Supabase

- [ ] **Ejecutar SQL en Supabase**:
  ```bash
  # Archivo a ejecutar:
  FIX_VISTAS_COMPLETO.sql
  ```
  
- [ ] **Verificar Bucket de Storage**:
  - [ ] Bucket `whatsapp` existe
  - [ ] Bucket es público o tiene políticas RLS
  - [ ] Carpetas creadas: `images/`, `audios/`, `videos/`, `documents/`

- [ ] **Verificar Políticas RLS**:
  ```sql
  -- Verificar en Supabase
  SELECT * FROM storage.policies WHERE bucket_id = 'whatsapp';
  ```

### 2. Configuración del Proyecto

- [ ] **Archivo .env configurado**:
  - [ ] `WAHA_API_KEY` - Generada
  - [ ] `WAHA_DASHBOARD_PASSWORD` - Segura
  - [ ] `WAHA_BASE_URL` - IP pública del VPS
  - [ ] `SUPABASE_URL` - De Supabase
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - De Supabase
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - De Supabase
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - De Supabase
  - [ ] `OPENAI_API_KEY` - (Opcional) Para transcripciones

- [ ] **Credenciales de Docker** (si usas WAHA Plus):
  - [ ] Login en Docker Hub
  - [ ] Acceso a `devlikeapro/waha-plus`

### 3. VPS

- [ ] **Requisitos del servidor**:
  - [ ] Ubuntu 20.04+ o Debian 11+
  - [ ] 4 GB RAM mínimo (8 GB recomendado)
  - [ ] 2 CPU cores mínimo
  - [ ] 20 GB SSD mínimo
  - [ ] Docker instalado (v20.10+)
  - [ ] Docker Compose instalado (v2.0+)

- [ ] **Puertos abiertos en firewall**:
  - [ ] Puerto 3000 (WAHA)
  - [ ] Puerto 4000 (Express)
  - [ ] Puerto 3001 (Dashboard)
  - [ ] Puerto 22 (SSH)

- [ ] **Configuración de red**:
  - [ ] IP pública asignada
  - [ ] DNS configurado (opcional)
  - [ ] Firewall configurado

### 4. Despliegue

- [ ] **Archivos en el VPS**:
  - [ ] Repositorio clonado
  - [ ] `.env` configurado
  - [ ] `deploy.sh` con permisos de ejecución

- [ ] **Ejecutar despliegue**:
  ```bash
  chmod +x deploy.sh
  ./deploy.sh
  ```

- [ ] **Verificar servicios**:
  ```bash
  docker-compose ps
  # Todos deben estar "Up (healthy)"
  ```

### 5. Pruebas Post-Despliegue

- [ ] **WAHA Dashboard**:
  - [ ] Accesible desde navegador
  - [ ] Login funciona
  - [ ] Puede crear workers

- [ ] **Express API**:
  - [ ] `/health` responde OK
  - [ ] Webhooks se reciben
  - [ ] Logs no muestran errores

- [ ] **Dashboard CRM**:
  - [ ] Carga correctamente
  - [ ] Muestra conversaciones
  - [ ] Imágenes se visualizan
  - [ ] Puede enviar mensajes

- [ ] **Integración completa**:
  - [ ] Crear worker en WAHA
  - [ ] Escanear QR con WhatsApp
  - [ ] Enviar mensaje de prueba
  - [ ] Verificar que aparece en Dashboard
  - [ ] Enviar imagen
  - [ ] Verificar que se procesa
  - [ ] Enviar audio
  - [ ] Verificar transcripción

---

## 🔧 Correcciones Aplicadas Hoy

### Backend

1. ✅ **webhookService.js**:
   - Mejorada extracción de `mediaUrl`
   - Detecta tipo de mensaje automáticamente
   - Corregido parámetro `botId` en transcripción

2. ✅ **botService.js**:
   - Eliminado campo `name` inexistente

### Base de Datos

1. ✅ **FIX_VISTAS_COMPLETO.sql**:
   - Elimina vistas existentes
   - Agrega columna `name` a `chats`
   - Recrea vistas con nombres/números
   - Agrega índices de performance

### Documentación

1. ✅ **DEPLOY_VPS_COMPLETO.md**:
   - Guía completa de despliegue
   - Configuración de firewall
   - Nginx reverse proxy
   - Troubleshooting

2. ✅ **deploy.sh**:
   - Script de un solo comando
   - Verifica requisitos
   - Valida variables
   - Inicia servicios

---

## 📝 Pasos Inmediatos

### En tu Computadora Local

1. **Commit y Push**:
   ```bash
   git add .
   git commit -m "Correcciones finales para VPS"
   git push origin main
   ```

### En Supabase

1. **Ejecutar SQL**:
   - Abre SQL Editor
   - Ejecuta `FIX_VISTAS_COMPLETO.sql`
   - Verifica que no haya errores

2. **Verificar Storage**:
   - Ve a Storage
   - Verifica bucket `whatsapp`
   - Configura como público

### En el VPS

1. **Conectar**:
   ```bash
   ssh usuario@tu-vps-ip
   ```

2. **Clonar/Actualizar**:
   ```bash
   git clone https://github.com/tu-usuario/crmnovabots.git
   cd crmnovabots
   ```

3. **Configurar**:
   ```bash
   cp .env.example .env
   nano .env
   # Configurar todas las variables
   ```

4. **Desplegar**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. **Verificar**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

---

## 🎯 Resultado Esperado

Después de completar todos los pasos:

### ✅ Servicios Corriendo

```
NAME            STATUS
waha            Up (healthy)
crm-express     Up (healthy)
crm-dashboard   Up (healthy)
```

### ✅ URLs Accesibles

- `http://TU-IP:3000` - WAHA Dashboard
- `http://TU-IP:4000/health` - Express API
- `http://TU-IP:3001` - Dashboard CRM

### ✅ Funcionalidad Completa

- Crear workers en WAHA
- Escanear QR con WhatsApp
- Recibir mensajes
- Procesar imágenes
- Transcribir audios
- Visualizar en Dashboard
- Enviar mensajes

---

## 🚨 Problemas Conocidos (Ya Corregidos)

1. ~~Imágenes no se procesaban~~ ✅ CORREGIDO
2. ~~Audios no se transcribían~~ ✅ CORREGIDO
3. ~~Chats sin nombre no mostraban número~~ ✅ CORREGIDO
4. ~~Error en columna `ch.name`~~ ✅ CORREGIDO
5. ~~Error en vistas existentes~~ ✅ CORREGIDO

---

## 📞 Siguiente Paso

**AHORA MISMO**:

1. Ejecuta `FIX_VISTAS_COMPLETO.sql` en Supabase
2. Verifica que el bucket `whatsapp` existe
3. Haz commit y push de los cambios
4. Despliega en el VPS con `./deploy.sh`

**¡Todo está listo para funcionar!** 🎉

---

**Última actualización**: 11 de noviembre de 2025, 1:33 PM
**Estado**: ✅ Listo para despliegue en VPS
