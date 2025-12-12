# Mejoras de Responsividad - Vista de Chat

Este documento describe las mejoras realizadas en los paneles de la vista de chat.

---

## Panel IA Coach

### ¿Qué es?
Un panel lateral que muestra insights sobre la conversación: prompt del asesor, mensajes destacados y momentos óptimos de respuesta.

### ¿Cómo funciona ahora?

**En móvil y tablet:**
- El panel siempre está visible
- Usa scroll horizontal junto con los demás paneles
- La descripción del header está oculta → toca el botón `⋮` para verla
- Cada sección tiene su propio botón `⋮` con su descripción

**En desktop (pantallas grandes):**
- Las descripciones se muestran inline, sin necesidad de popovers

### Botón de navegación flotante
Un botón circular azul (☰) en la esquina del panel que permite saltar rápidamente a:
- **Prompt** - Sección del prompt del asesor
- **Mensajes** - Mensajes destacados
- **Momentos** - Momentos destacados

---

## Panel de Resultados de Búsqueda

### ¿Qué cambió?
Se agregó un botón **X** para cerrar el panel cuando ya no se necesita.

---

## Anchos del Panel IA Coach

| Tamaño de pantalla | Ancho del panel |
|-------------------|-----------------|
| Móvil | 300px |
| Tablet | 340px |
| Desktop | 400px |
| Desktop grande | 440px |

---

## Archivos modificados

1. `src/components/MessageInsightsPanel.jsx` - Panel IA Coach
2. `src/app/dashboard/chat/[chatId]/page.js` - Vista de chat y panel de búsqueda
