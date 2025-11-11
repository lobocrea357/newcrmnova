# 👋 ¡LÉEME PRIMERO!

## 🎯 ¿Qué es este proyecto?

Un **CRM completo para WhatsApp** que funciona con Docker. Todo se inicia con un solo comando y funciona perfectamente en un VPS.

## 🏗️ Arquitectura Simple

```
┌─────────────────────────────────────────────────────┐
│  WAHA Plus (Puerto 3000)                            │
│  → Crea workers y bots de WhatsApp                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓ Webhooks
┌─────────────────────────────────────────────────────┐
│  Express API (Puerto 4000)                          │
│  → Utiliza endpoints de WAHA                        │
│  → Alimenta la base de datos                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓ Almacena
┌─────────────────────────────────────────────────────┐
│  Supabase                                           │
│  → Almacena TODO en la base de datos                │
└────────────────┬────────────────────────────────────┘
                 │
                 ↑ Consulta
┌─────────────────────────────────────────────────────┐
│  Dashboard Next.js (Puerto 3001)                    │
│  → Consume toda la base de datos                    │
│  → Visualiza mensajes, contactos, estadísticas      │
└─────────────────────────────────────────────────────┘
```

## ⚡ Inicio Rápido (10 minutos)

### 1️⃣ Configurar Supabase (5 min)
```bash
1. Crear cuenta en supabase.com
2. Crear nuevo proyecto
3. Ejecutar SCHEMA_COMPLETO_LIMPIO.sql en SQL Editor
4. Copiar credenciales (URL, Service Role Key, Anon Key)
```

### 2️⃣ Configurar Proyecto (2 min)
```bash
# Copiar variables de entorno
cp .env.example .env

# Editar con tus credenciales de Supabase
nano .env
```

### 3️⃣ Iniciar Sistema (3 min)
```bash
# Opción A: Script automático (recomendado)
chmod +x deploy-vps.sh
./deploy-vps.sh

# Opción B: Manual
docker-compose up -d
```

### 4️⃣ Conectar WhatsApp
```
1. Ir a http://localhost:3000
2. Crear worker
3. Escanear QR con WhatsApp
4. ¡Listo!
```

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| **INICIO-RAPIDO.md** | Guía paso a paso detallada (10 min) |
| **RESUMEN-ARQUITECTURA.md** | Resumen técnico de la arquitectura |
| **ARQUITECTURA.md** | Documentación completa del sistema |
| **README.md** | Documentación general y API |
| **.env.example** | Todas las variables de entorno explicadas |

## 🔑 Variables Críticas en .env

```env
# WAHA - Genera una clave aleatoria
WAHA_API_KEY=tu_clave_secreta_aqui

# Supabase - Backend (Express)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Supabase - Frontend (Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## 🐳 Comandos Docker Esenciales

```bash
# Iniciar todo
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Reiniciar un servicio
docker-compose restart waha
```

## 🌐 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| WAHA Dashboard | http://localhost:3000 | Crear workers, ver QR |
| Express API | http://localhost:4000 | API REST del CRM |
| Dashboard CRM | http://localhost:3001 | Interfaz principal |

## ✅ Checklist de Verificación

- [ ] Docker y Docker Compose instalados
- [ ] Proyecto de Supabase creado
- [ ] Schema ejecutado en Supabase
- [ ] Archivo .env configurado con credenciales
- [ ] Servicios iniciados con docker-compose
- [ ] WAHA corriendo (puerto 3000)
- [ ] Express corriendo (puerto 4000)
- [ ] Dashboard corriendo (puerto 3001)
- [ ] Worker creado en WAHA
- [ ] QR escaneado con WhatsApp
- [ ] Mensajes llegando al Dashboard

## 🎯 Flujo de Trabajo Típico

1. **Usuario envía mensaje a WhatsApp**
   ```
   WhatsApp → WAHA → Webhook → Express → Supabase
   ```

2. **Dashboard muestra mensaje en tiempo real**
   ```
   Supabase Realtime → Dashboard
   ```

3. **Usuario responde desde Dashboard**
   ```
   Dashboard → Express → WAHA API → WhatsApp
   ```

## 🔧 Solución Rápida de Problemas

### Servicio no inicia
```bash
docker-compose logs nombre-servicio
docker-compose restart nombre-servicio
```

### Mensajes no aparecen
1. Verificar webhook configurado en WAHA
2. Ver logs de Express: `docker-compose logs -f express`
3. Verificar conexión a Supabase

### Error de Supabase
1. Verificar credenciales en .env
2. Usar SERVICE_ROLE_KEY (no ANON_KEY) en backend
3. Verificar que tablas existan

## 💡 Tips Importantes

1. **WAHA Plus** permite crear múltiples workers (bots)
2. **Express** se encarga de toda la lógica de negocio
3. **Supabase** almacena TODO (mensajes, contactos, chats, multimedia)
4. **Dashboard** solo consulta y visualiza datos
5. **Todo corre con Docker** - fácil de desplegar en VPS

## 🚀 Para Producción (VPS)

1. Cambiar `WAHA_BASE_URL` a tu dominio/IP pública
2. Configurar HTTPS con nginx o traefik
3. Configurar backups automáticos de Supabase
4. Monitorear logs regularmente
5. Actualizar imágenes de Docker periódicamente

## 📞 Soporte

Si tienes problemas:
1. Lee **INICIO-RAPIDO.md** para guía detallada
2. Revisa **ARQUITECTURA.md** para entender el sistema
3. Consulta **TROUBLESHOOTING.md** para problemas comunes
4. Revisa los logs: `docker-compose logs -f`

## 🎓 Conceptos Clave

- **Worker** = Sesión de WhatsApp = Bot = Número conectado
- **Webhook** = WAHA notifica a Express cuando hay eventos
- **Service Role Key** = Acceso completo (solo backend)
- **Anon Key** = Acceso limitado (frontend)
- **Realtime** = Actualizaciones automáticas en dashboard

---

## 🎉 ¡Empieza Ahora!

```bash
# 1. Configura Supabase (5 min)
# 2. Edita .env con tus credenciales
cp .env.example .env
nano .env

# 3. Inicia todo
./deploy-vps.sh

# 4. Accede a WAHA y crea tu primer bot
# http://localhost:3000

# 5. Accede al Dashboard
# http://localhost:3001
```

**¡Todo funciona con un comando de Docker y es perfecto para VPS!** 🚀

---

📖 **Siguiente paso**: Lee [INICIO-RAPIDO.md](./INICIO-RAPIDO.md) para una guía detallada paso a paso.
