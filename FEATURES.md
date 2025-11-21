# Nuevas Funcionalidades - Dashboard de Conversaciones

## 📸 Fotos de Perfil de Contactos

### Componente `ContactAvatar`
Componente reutilizable que muestra la foto de perfil del contacto con fallback inteligente.

**Características:**
- Carga fotos desde `contacts.profile_picture_url`
- Fallback a **iniciales del nombre** (ej: "Luis Guerra" → "LG")
- **Colores dinámicos** consistentes por contacto (10 colores disponibles)
- Múltiples tamaños: `sm`, `md`, `lg`, `xl`
- Manejo de errores de carga

**Ubicación:**
- Lista de conversaciones en dashboard
- Header de vista de chat
- Resultados de búsqueda global
- Sidebar de búsqueda

---

## 🔍 Búsqueda Global

### Funcionalidad tipo WhatsApp
Buscador global que permite encontrar conversaciones por múltiples criterios.

**Criterios de búsqueda:**
1. **Nombre de contacto** - Busca por nombre del contacto
2. **Número de teléfono** - Busca por número completo o parcial
3. **Contenido de mensajes** - Busca palabras clave en el historial

**Características:**
- Búsqueda en tiempo real
- **Resaltado de coincidencias** en azul (#2563EB)
- **Preview de mensajes** cuando hay coincidencia en contenido
- Filtrado automático de estados y canales de WhatsApp
- Persistencia de búsqueda al navegar

### Componente `HighlightText`
Resalta las coincidencias de búsqueda en los resultados.

**Comportamiento:**
- Detecta primera coincidencia (case-insensitive)
- Colorea en azul las letras/números que coinciden
- Funciona en nombres, teléfonos y mensajes

---

## 💬 Preview de Mensajes en Búsqueda

Similar a WhatsApp, muestra un fragmento del mensaje que contiene la coincidencia.

**Visualización:**
```
Franco Puglisi
✓✓ prueba numero 99099088999
```

**Lógica:**
- Si coincide por **mensaje**: Muestra preview con ✓✓
- Si coincide por **nombre/teléfono**: Muestra teléfono y bot
- Resalta la palabra buscada dentro del preview

---

## 🚫 Filtrado de Estados y Canales

Excluye automáticamente contenido no deseado de WhatsApp.

**Filtros aplicados:**
- `%status%` - Estados de WhatsApp
- `%@broadcast%` - Listas de difusión
- `%@newsletter%` - Canales/Newsletters

**Afecta a:**
- Lista de conversaciones por bot
- Resultados de búsqueda global
- Conteo de conversaciones
- Paginación

---

## 🧭 Navegación con Sidebar de Búsqueda

Cuando accedes a un chat desde búsqueda, aparece un **sidebar izquierdo**.

**Funcionalidades del sidebar:**
- Lista de resultados de búsqueda
- Buscador funcional para nuevas búsquedas
- Navegación entre chats sin perder contexto
- Resalta el chat actual
- Muestra fotos/iniciales, nombres y previews

**Preservación de estado:**
- Al regresar al dashboard, se restaura la búsqueda
- Mantiene último bot y conversación visitada
- Preserva página del paginador

---

## 🗂️ Archivos Principales

### Nuevos
- `dashboard/src/components/ContactAvatar.js` - Avatar con iniciales
- `dashboard/src/components/HighlightText.js` - Resaltado de texto

### Modificados
- `dashboard/src/lib/supabase.js` - Función `globalSearchChats()` + filtros
- `dashboard/src/app/dashboard/page.js` - Búsqueda global en dashboard
- `dashboard/src/app/dashboard/chat/[chatId]/page.js` - Sidebar de búsqueda
- `dashboard/src/components/ChatView.js` - Integración de avatar

---

## 📊 Función de Búsqueda Global

```javascript
globalSearchChats(searchQuery, limit = 50)
```

**Proceso:**
1. Busca en tabla `chats` por nombre/teléfono
2. Busca en tabla `contacts` directamente
3. Busca en tabla `messages` por contenido
4. Combina resultados eliminando duplicados
5. Agrega información de mensaje coincidente (`match_message`)
6. Ordena por última actividad
7. Excluye estados y canales

**Retorna:**
```javascript
{
  id, contact_name, contact_phone, 
  contact_profile_picture_url, bot_name,
  match_message, // Si hay coincidencia en mensaje
  match_timestamp, // Timestamp del mensaje
  ...resto_de_datos
}
```

---

## 🎨 Sistema de Colores para Avatares

**Paleta de 10 colores:**
- Blue, Green, Yellow, Red, Purple
- Pink, Indigo, Teal, Orange, Cyan

**Asignación:**
- Hash del nombre → Índice consistente
- Mismo nombre = Mismo color siempre
- Distribución uniforme de colores

---

## ✨ Experiencia de Usuario

La implementación replica fielmente el comportamiento de búsqueda de WhatsApp:
- ✅ Búsqueda instantánea
- ✅ Resaltado visual de coincidencias
- ✅ Preview contextual de mensajes
- ✅ Navegación fluida con sidebar
- ✅ Avatares personalizados por iniciales
- ✅ Colores consistentes y atractivos
