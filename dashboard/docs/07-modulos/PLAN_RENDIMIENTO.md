# Plan de Implementación Maestro - Rediseño Módulo Rendimiento

## Contexto del Proyecto
El objetivo es reestructurar completamente la interfaz de usuario del módulo de desempeño (`/rendimiento`) en el dashboard CRM. La nueva UI debe permitir un seguimiento diario y automatizado del rendimiento de los asesores, basado en análisis de IA.

**Fuente de Verdad Lógica:** `src/lib/aiPerformance.js`

## Especificaciones Técnicas

### 1. Métricas de Evaluación (Hard Requirements)
El sistema debe visualizar obligatoriamente estos 7 parámetros booleanos que definen el éxito de una conversación:
1.  **Tiempo de contacto adecuado** (¿Contactó rápido al lead?)
2.  **Tiempo de respuesta rápido** (¿Mantuvo fluidez?)
3.  **Tiempo de cotización eficiente** (¿Dio precio a tiempo?)
4.  **Cierre con intención de compra** (¿Intentó cerrar?)
5.  **Ofrecimiento de Scalapay** (¿Ofreció financiamiento?)
6.  **Más de dos opciones presentadas** (¿Variedad de catálogo?)
7.  **Seguimiento de intención** (¿Insistió si hubo interés?)

### 2. Estructura de Equipos
El dashboard debe permitir filtrar o agrupar asesores por los siguientes equipos predefinidos:
-   Equipo **Endry**
-   Equipo **Moises**
-   Equipo **Jesus**

### 3. Arquitectura de Componentes

#### A. Página Principal (`src/app/(crm)/rendimiento/page.js`)
-   **Layout:** Debe usar el layout existente del dashboard.
-   **Header:**
    -   Título: "Control de Rendimiento".
    -   Selector de Fecha: Por defecto "Hoy".
    -   Botón: "Actualizar Análisis" (Trigger manual).
-   **KPIs Globales (Top Row):**
    -   Promedio General de Rendimiento (0-10).
    -   Total Conversaciones Analizadas Hoy.
    -   Alertas Críticas (Asesores con score < 5).
-   **Tabs de Navegación:** Componente visual para cambiar vistas entre "Vista General" y cada Equipo (Endry, Moises, Jesus).

#### B. Componentes Nuevos

**1. `AdvisorPerformanceCard.jsx` (Tarjeta de Asesor)**
-   **Ubicación:** `src/components/performance/AdvisorPerformanceCard.jsx`
-   **Visual:** Tarjeta compacta tipo "Dashboard Widget".
-   **Datos a mostrar:**
    -   Avatar y Nombre del Asesor.
    -   Score del Día (Círculo de progreso o Badge de color: Verde >8, Amarillo 5-7, Rojo <5).
    -   Tendencia (Icono flecha arriba/abajo vs ayer).
    -   Resumen rápido de fallos (ej: "⚠️ No ofreció Scalapay").
-   **Interacción:** Al hacer clic, abre el `PerformanceDetailView`.

**2. `PerformanceDetailView.jsx` (Panel de Detalle)**
-   **Ubicación:** `src/components/performance/PerformanceDetailView.jsx`
-   **Tipo:** Modal Grande o "Sheet" (Panel lateral deslizante).
-   **Secciones:**
    -   **Encabezado:** Perfil del asesor y Score grande.
    -   **Checklist Diario:** Lista vertical de los 7 parámetros con Check (✅) o X (❌).
    -   **Gráfico Histórico:** Gráfico de línea simple mostrando el Score de los últimos 7 días.
    -   **Feedback IA:** Bloque de texto con "Fortalezas" y "Áreas de Mejora" (generado por `generatePerformanceReport` en `aiPerformance.js`).

### 4. Modelo de Datos (Mock Data Structure)
Para prototipado, se debe crear `src/lib/mockPerformanceData.js` con esta estructura exacta para garantizar compatibilidad futura:

```javascript
export const MOCK_PERFORMANCE_DATA = {
  date: "2024-05-20",
  teams: {
    "Endry": [
      {
        id: "adv_1",
        name: "Ana García",
        avatar: "/avatars/ana.png",
        dailyScore: 8.5,
        trend: "up", // or 'down', 'stable'
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: false, // Falló aquí
          mas_dos_opciones: true,
          seguimiento_intencion: true
        },
        aiFeedback: {
          strengths: ["Excelente tiempo de respuesta", "Cierre agresivo"],
          improvements: ["Recordar ofrecer Scalapay siempre"]
        },
        history: [7.5, 8.0, 8.2, 8.5, 8.5, 7.8, 8.5] // Últimos 7 días
      },
      // ... más asesores
    ],
    "Moises": [ ... ],
    "Jesus": [ ... ]
  }
};
```

## Plan de Ejecución Paso a Paso
1.  **Crear Mock Data:** Implementar `src/lib/mockPerformanceData.js` con datos variados (casos buenos y malos).
2.  **Crear Componentes Base:** Desarrollar `AdvisorPerformanceCard` y `PerformanceDetailView` usando Tailwind CSS para estilos modernos (glassmorphism/clean design).
3.  **Ensamblar Página:** Reemplazar `src/app/(crm)/rendimiento/page.js` conectando los componentes con el Mock Data y los Tabs de equipos.
4.  **Validación Visual:** Verificar que la navegación entre equipos sea fluida y que el modal de detalle muestre la info correcta.
