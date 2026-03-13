# 📋 CONTEXTO COMPLETO DEL PROYECTO CRM WhatsApp - Para Asignación de Nombres

## 🎯 **OBJETIVO DE ESTE DOCUMENTO**

Este archivo contiene todo el contexto necesario para que ChatGPT te ayude a definir nombres coherentes y profesionales para cada módulo y página del sistema CRM WhatsApp.

---

## 🏗️ **ARQUITECTURA GENERAL DEL SISTEMA**

### **Descripción del Proyecto**
CRM interno para gestión de bots de WhatsApp con análisis de conversaciones mediante IA, sistema de cotización de vuelos, y gestión de rendimiento de asesores.

### **Stack Tecnológico**
- **Frontend**: Next.js 16 (App Router) - Puerto 3001
- **Backend**: Express.js - Puerto 4000  
- **WhatsApp**: WAHA Plus - Puerto 3000
- **Base de Datos**: Supabase (PostgreSQL)
- **Contenerización**: Docker con red interna

### **Flujo de Datos Clave**
```
Dashboard ↔ Supabase (acceso directo para lecturas/escrituras)
WAHA → Express → Supabase (webhooks de mensajes)
Dashboard → Supabase Storage (subida directa de archivos)
```

---

## 👥 **ROLES DEL SISTEMA**

### **Roles Definidos**
- **admin**: Acceso completo a todo el sistema
- **gerente**: Acceso limitado a sus bots asignados
- **administracion**: Acceso a funciones administrativas
- **asesor**: Acceso básico de consulta

---

## 📁 **ESTRUCTURA ACTUAL DE MÓDULOS Y PÁGINAS**

### **Módulos Principales (dashboard/src/app/(crm))**

#### **1. admin/**
- Propósito: Administración general del sistema
- Funcionalidades: Configuración global, gestión de usuarios

#### **2. anulables/**
- Propósito: Gestión de anulables de vuelos
- Funcionalidades: CRUD de anulables, asociación con vuelos

#### **3. configuracion/**
- Propósito: Configuración del sistema
- Funcionalidades: Ajustes generales, preferencias

#### **4. conversaciones/**
- Propósito: Visualización y gestión de conversaciones de WhatsApp
- Funcionalidades: Chat history, búsqueda, filtros

#### **5. cotizaciones/**
- Propósito: Sistema de cotización de vuelos
- Funcionalidades: Calculadora de precios, generación de PDFs

#### **6. inteligencia-artificial/**
- Propósito: Análisis con IA de conversaciones
- Funcionalidades: Evaluación automática, insights

#### **7. manual-ventas/**
- Propósito: Guía y procedimientos de ventas
- Funcionalidades: Documentación, procesos

#### **8. rendimiento/**
- Propósito: Análisis de rendimiento de asesores
- Funcionalidades: Métricas, reportes, estadísticas

#### **9. reportes/**
- Propósito: Generación de reportes
- Funcionalidades: Reportes personalizados, exportación

#### **10. rutas-riesgo/**
- Propósito: Gestión de rutas de riesgo
- Funcionalidades: Monitoreo, alertas

#### **11. vuelos/**
- Propósito: Gestión completa de vuelos
- Funcionalidades: CRUD de vuelos, asociaciones

---

## 🗄️ **TABLAS PRINCIPALES DE BASE DE DATOS**

### **Core del Sistema**
- `users` - Usuarios del sistema
- `profiles` - Perfiles con roles
- `workers` - Workers/Bots de WAHA
- `contacts` - Contactos de WhatsApp
- `chats` - Conversaciones
- `messages` - Mensajes

### **Módulo de Vuelos**
- `vuelos` - Gestión de vuelos
- `anulables` - Anulables de vuelos
- `cotizaciones` - Cotizaciones generadas
- `cotizaciones_pasajeros` - Pasajeros de cotizaciones

### **Análisis y Rendimiento**
- `conversation_evaluations` - Evaluaciones de IA
- `performance_analyses` - Análisis de rendimiento
- `performance_reports` - Reportes generados

### **Multimedia**
- `media_files` - Metadatos de archivos

---

## 🔧 **CARACTERÍSTICAS TÉCNICAS RELEVANTES**

### **Patrones de Nombres Actuales**
- **Componentes**: PascalCase (`UserProfile.js`)
- **Páginas**: kebab-case (`user-profile/page.js`)
- **Hooks**: camelCase (`useAuth.js`)
- **Utils**: camelCase/kebab-case (`formatDate.js`)

### **Convenciones de Rutas**
- **Autenticación**: `/auth/login`, `/auth/register`
- **CRM**: `/crm/nombre-modulo`
- **API**: `/api/nombre-recurso`

### **Estructura de Componentes**
```
dashboard/src/components/
├── cotizador/          # Módulo de cotización
├── ui/                 # Componentes genéricos
├── forms/              # Formularios reutilizables
└── [otros módulos]/
```

---

## 🎯 **FUNCIONALIDADES POR MÓDULO**

### **Módulo WhatsApp/Core**
- Gestión de conversaciones
- Análisis de mensajes con IA
- Manejo de archivos multimedia
- Configuración de bots

### **Módulo de Ventas/Vuelos**
- Cotización de vuelos (individual y múltiple)
- Gestión de reservas
- Anulables y modificaciones
- PDF generation

### **Módulo de Análisis/Rendimiento**
- Evaluación automática de conversaciones
- Métricas de asesores
- Reportes personalizados
- Insights con IA

### **Módulo Administrativo**
- Gestión de usuarios y roles
- Configuración del sistema
- Manuales y procedimientos
- Monitoreo de riesgos

---

## 🚀 **REQUISITOS PARA NUEVOS NOMBRES**

### **Principios Guiadores**
1. **Coherencia**: Todos los nombres deben seguir la misma lógica
2. **Claridad**: El nombre debe indicar claramente su función
3. **Profesionalismo**: Nombres adecuados para entorno empresarial
4. **Escalabilidad**: Nombres que permitan futuras expansiones
5. **Intuición**: Fáciles de entender para nuevos usuarios

### **Idioma y Tono**
- **Idioma principal**: Español
- **Tono**: Profesional pero accesible
- **Terminología**: Consistente con industria de viajes/CRM

### **Formato Técnico**
- **URLs**: kebab-case (`/modulo-accion`)
- **Componentes**: PascalCase (`ModuloAccion.js`)
- **Páginas**: kebab-case (`modulo-accion/page.js`)

---

## ❓ **PREGUNTAS CLAVE PARA CHATGPT**

### **Para Nombres de Módulos**
1. ¿Qué nombre describe mejor la función principal de este módulo?
2. ¿Es intuitivo para un usuario nuevo?
3. ¿Permite futuras expansiones?
4. ¿Es coherente con los demás módulos?

### **Para Nombres de Páginas**
1. ¿La acción principal está clara en el nombre?
2. ¿Sigue la convención kebab-case?
3. ¿Evita ambigüedades?

### **Para Nombres de Componentes**
1. ¿Describe correctamente su responsabilidad?
2. ¿Sigue PascalCase?
3. ¿Es reutilizable?

---

## 📋 **EJEMPLOS DE RENOMBRADO POTENCIAL**

### **Nombres Actuales → Sugeridos**
```
conversaciones/ → whatsapp/conversaciones/
rendimiento/ → analisis/rendimiento/
inteligencia-artificial/ -> ia/analisis-conversaciones/
manual-ventas/ → recursos/manuales-ventas/
rutas-riesgo/ → monitoreo/rutas-riesgo/
```

---

## 🎯 **OBJETIVO FINAL**

Lograr una estructura de nombres que sea:
- **Intuitiva** para cualquier usuario que ingrese al sistema
- **Profesional** y coherente con estándares empresariales
- **Escalable** para futuros módulos y funcionalidades
- **Técnicamente consistente** con las convenciones del proyecto

---

## 📝 **INSTRUCCIONES PARA CHATGPT**

Basado en este contexto, por favor:
1. Analiza la estructura actual de módulos y páginas
2. Propone nombres coherentes para cada módulo principal
3. Sugiere nombres para las páginas dentro de cada módulo
4. Recomienda nombres para componentes clave
5. Justifica cada sugerencia basándote en los principios mencionados
6. Proporciona una estructura completa renombrada

**Considera siempre:**
- El flujo de trabajo real de los usuarios
- La jerarquía de información
- La experiencia de usuario (UX)
- La mantenibilidad técnica del código
