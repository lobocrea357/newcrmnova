# Dashboard CRM WhatsApp

Dashboard web para gestión de bots de WhatsApp utilizando WAHA (WhatsApp HTTP API) y Supabase.

## 🚀 Características

- **Autenticación**: Sistema de login con Supabase Auth
- **Gestión de Workers**: Visualización de trabajadores y sus bots asignados
- **Gestión de Bots**: Monitoreo de sesiones de WhatsApp
- **Conversaciones**: Vista detallada de chats y mensajes
- **Multimedia**: Soporte para imágenes, videos, audios y documentos
- **Tiempo Real**: Actualización automática de mensajes con Supabase Realtime
- **Roles y Permisos**: Sistema de permisos basado en roles (admin, worker, viewer)

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada
- Backend Express corriendo (puerto 4000)
- WAHA configurado

## 🛠️ Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
El archivo `.env.local` ya está configurado con:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cfklyrpftknzhpkzqeme.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Ejecutar en desarrollo**:
```bash
npm run dev
```

4. **Abrir en el navegador**:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/          # Página principal del dashboard
│   │   │   └── chat/[chatId]/  # Vista de chat individual
│   │   ├── login/              # Página de login
│   │   ├── layout.js           # Layout principal
│   │   └── page.js             # Página de inicio (redirect)
│   ├── components/
│   │   ├── ChatView.js         # Componente de vista de chat
│   │   └── MessageBubble.js    # Componente de burbuja de mensaje
│   └── lib/
│       └── supabase.js         # Cliente y funciones de Supabase
├── .env.local                  # Variables de entorno
└── package.json
```

## 🔑 Usuarios de Prueba

### Admin
- Email: `admin@novapolointranet.xyz`
- Rol: Administrador (acceso total)

### Worker
- Email: `Moisesnova923@gmail.com`
- Rol: Worker (solo sus bots asignados)

## 🎨 Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Tiempo Real**: Supabase Realtime
- **Iconos**: Lucide React
- **Cliente HTTP**: Supabase JS Client

## 📊 Funcionalidades Principales

### Dashboard Principal
- Estadísticas generales (Workers, Bots, Conversaciones)
- Vista jerárquica: Workers → Bots → Conversaciones
- Expansión/colapso de secciones
- Indicadores de estado de bots

### Vista de Chat
- Mensajes en tiempo real
- Soporte multimedia completo
- Transcripción de audios
- Información del contacto y bot
- Scroll automático a nuevos mensajes

### Sistema de Permisos
- **Admin**: Ve todos los bots y conversaciones
- **Worker**: Solo ve sus bots asignados
- **Viewer**: Solo lectura

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## 🐛 Troubleshooting

### ⚠️ No se muestran Workers ni Bots (COMÚN)

**Causa**: Políticas RLS (Row Level Security) restrictivas en Supabase

**Solución**: Ver archivo `FIX_DASHBOARD.md` para instrucciones detalladas

**Solución Rápida**:
1. Ir a Supabase SQL Editor
2. Ejecutar el SQL del archivo `fix-rls-policies.sql`
3. Recargar el dashboard

### No se muestran los datos
1. Verificar que el backend Express esté corriendo
2. Verificar conexión a Supabase
3. Revisar permisos RLS en Supabase (ver `FIX_DASHBOARD.md`)

### Error de autenticación
1. Verificar que las credenciales sean correctas
2. Verificar que el usuario exista en `auth.users`
3. Verificar que tenga un perfil en la tabla `profiles`

### Imágenes no cargan
1. Verificar bucket de Supabase Storage
2. Verificar políticas de acceso público
3. Revisar URLs en `media_files`

## 📝 Notas Importantes

- El dashboard se conecta al backend Express en `http://localhost:4000`
- Requiere que Supabase esté configurado con el schema completo
- Las políticas RLS deben estar habilitadas
- Los workers deben estar asignados a los bots para que los usuarios worker puedan verlos

## 🔗 Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de WAHA](https://waha.devlike.pro/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
