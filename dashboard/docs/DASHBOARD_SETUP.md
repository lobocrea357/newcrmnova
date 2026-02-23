# 📊 Dashboard de WhatsApp Bot con Supabase Auth

Dashboard completo para gestionar múltiples bots de WhatsApp con autenticación de Supabase.

## 🎯 Características

- ✅ **Autenticación con Supabase** - Login seguro con email/password
- ✅ **Vista de múltiples bots** - Gestiona todos tus bots desde un solo lugar
- ✅ **Lista de conversaciones** - Visualiza todas las conversaciones por bot
- ✅ **Vista de mensajes** - Lee los mensajes completos de cada conversación
- ✅ **Descarga en TXT** - Exporta conversaciones en formato texto plano
- ✅ **Descarga en Markdown** - Exporta conversaciones en formato Markdown
- ✅ **Búsqueda** - Busca conversaciones por nombre o número
- ✅ **Actualización en tiempo real** - Refresca los datos automáticamente
- ✅ **Responsive** - Funciona en desktop y móvil

## 📋 Requisitos Previos

1. Proyecto de Supabase configurado (ver `SUPABASE_SETUP.md` en el bot)
2. Tablas creadas en Supabase (`bots`, `conversations`, `messages`)
3. Node.js instalado

## 🚀 Configuración

### 1. Variables de Entorno

Crea o edita el archivo `.env.local` en la raíz del dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yibmuomckbaxdvawhdul.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Instalar Dependencias

```bash
npm install
```

Las dependencias necesarias ya están en `package.json`:
- `@supabase/supabase-js` - Cliente de Supabase
- `@supabase/ssr` - Soporte SSR para Supabase
- `lucide-react` - Iconos modernos
- `next` - Framework de React
- `tailwindcss` - Estilos

### 3. Crear Usuario en Supabase

1. Ve a tu proyecto en Supabase
2. En el menú lateral, haz clic en **Authentication**
3. Haz clic en **Users**
4. Haz clic en **Add User** > **Create new user**
5. Ingresa:
   - **Email**: tu@email.com
   - **Password**: tu_contraseña_segura
   - Marca **Auto Confirm User**
6. Haz clic en **Create user**

### 4. Iniciar el Dashboard

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

El dashboard estará disponible en: http://localhost:3000

## 📱 Estructura de Navegación

```
/ (Home)
├── Redirige a /login si no está autenticado
└── Redirige a /dashboard si está autenticado

/login
└── Página de inicio de sesión

/dashboard
├── Vista general de todos los bots
├── Estadísticas (total de bots, conversaciones, bots activos)
└── Lista de bots con cantidad de conversaciones

/dashboard/bot/[botId]
├── Lista de conversaciones del bot seleccionado
├── Búsqueda de conversaciones
└── Opción de descargar todas las conversaciones

/dashboard/bot/[botId]/conversation/[conversationId]
├── Vista completa de mensajes
├── Información de la conversación
└── Botones de descarga (TXT y Markdown)
```

## 🎨 Componentes Principales

### 1. Login (`/login`)
- Formulario de autenticación
- Validación de credenciales
- Redirección automática al dashboard

### 2. Dashboard Principal (`/dashboard`)
- **Estadísticas**:
  - Total de bots
  - Total de conversaciones
  - Bots activos
- **Lista de bots**:
  - Nombre del bot
  - Estado (activo/inactivo)
  - Número de teléfono
  - Cantidad de conversaciones
  - Click para ver conversaciones

### 3. Conversaciones por Bot (`/dashboard/bot/[botId]`)
- **Búsqueda**: Filtra por nombre o número
- **Lista de conversaciones**:
  - Nombre del contacto
  - Número de WhatsApp
  - Cantidad de mensajes
  - Última actividad
  - Click para ver mensajes

### 4. Vista de Mensajes (`/dashboard/bot/[botId]/conversation/[conversationId]`)
- **Información**:
  - Nombre del bot
  - Total de mensajes
  - Última actividad
- **Mensajes**:
  - Diferenciación visual (bot vs usuario)
  - Timestamp de cada mensaje
  - Scroll automático
- **Descargas**:
  - Botón TXT: Descarga en texto plano
  - Botón Markdown: Descarga en formato Markdown

## 📥 Formatos de Descarga

### Formato TXT
```
Conversación con Juan Pérez
ID: 5491112345678@s.whatsapp.net
Fecha: 25/10/2025, 16:30:00
Total de mensajes: 15

============================================================

[25/10/2025, 14:20:15] Juan Pérez:
Hola, buenos días

[25/10/2025, 14:20:30] Bot:
¡Hola! ¿En qué puedo ayudarte?
```

### Formato Markdown
```markdown
# Conversación con Juan Pérez

**Bot:** WhatsApp Bot - Viajes Nova
**ID de WhatsApp:** `5491112345678@s.whatsapp.net`
**Fecha de descarga:** 25/10/2025, 16:30:00
**Total de mensajes:** 15

---

### 👤 **Juan Pérez**
*25/10/2025, 14:20:15*

Hola, buenos días

---

### 🤖 **Bot**
*25/10/2025, 14:20:30*

¡Hola! ¿En qué puedo ayudarte?

---
```

## 🔐 Seguridad

### Autenticación
- Todas las rutas del dashboard requieren autenticación
- Redirección automática a `/login` si no está autenticado
- Sesión persistente con Supabase Auth

### Variables de Entorno
- Las credenciales están en `.env.local` (no se suben a Git)
- Solo se usa la `anon key` pública de Supabase
- Las políticas RLS de Supabase protegen los datos

## 🎨 Personalización

### Colores
Los colores principales están en Tailwind CSS:
- **Primario**: `indigo-600`
- **Secundario**: `gray-600`
- **Éxito**: `green-600`
- **Error**: `red-600`

Para cambiarlos, edita las clases en los componentes.

### Logo
Puedes agregar un logo en el login editando:
```jsx
// src/app/login/page.js
<div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
  <LogIn className="h-8 w-8 text-white" />
</div>
```

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` existe
- Verifica que las variables están correctamente escritas
- Reinicia el servidor de desarrollo

### No aparecen los bots
- Verifica que el bot está guardando datos en Supabase
- Verifica que la tabla `bots` tiene registros
- Revisa la consola del navegador para errores

### No puedo iniciar sesión
- Verifica que el usuario existe en Supabase Authentication
- Verifica que el usuario está confirmado
- Verifica las credenciales (email y contraseña)

### Las conversaciones no se actualizan
- Haz clic en el botón "Actualizar"
- Verifica que el servicio de sincronización está corriendo
- Verifica que los datos están en Supabase

## 📊 Flujo de Datos

```
Bot de WhatsApp
    ↓
Guarda en db.json
    ↓
message-sync.js detecta cambios
    ↓
Sincroniza a Supabase
    ↓
Dashboard lee desde Supabase
    ↓
Usuario visualiza en el navegador
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube el código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Despliega

### Docker

```bash
# Construir imagen
docker build -t whatsapp-dashboard .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=tu_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key \
  whatsapp-dashboard
```

## 📝 Notas Adicionales

- El dashboard es **solo lectura** - no permite enviar mensajes
- Los datos se actualizan en tiempo real desde Supabase
- Puedes tener múltiples usuarios con diferentes permisos
- Las descargas se generan en el cliente (no en el servidor)

## ✅ Checklist de Configuración

- [ ] Supabase configurado con tablas creadas
- [ ] Usuario creado en Supabase Authentication
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Dependencias instaladas (`npm install`)
- [ ] Dashboard iniciado (`npm run dev`)
- [ ] Login exitoso
- [ ] Bots visibles en el dashboard
- [ ] Conversaciones visibles
- [ ] Mensajes visibles
- [ ] Descargas funcionando

## 🎉 ¡Listo!

Tu dashboard está configurado y listo para usar. Ahora puedes:
- Ver todos tus bots
- Explorar conversaciones
- Leer mensajes
- Descargar conversaciones en TXT o Markdown
