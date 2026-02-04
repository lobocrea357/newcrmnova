# 🚀 Guía de Build y Producción
## Sistema de Análisis de Ventas con IA

## ✅ ¿Funcionará en producción después del build?

**SÍ, el sistema funcionará completamente después del build**, incluyendo:
- ✅ Sistema de cron automático (análisis diario)
- ✅ Análisis IA de conversaciones
- ✅ Panel de administración
- ✅ Dashboard de métricas
- ✅ APIs de control

## 🔧 Configuración para Producción

### **1. Variables de Entorno Requeridas**
```bash
# .env.production (crear este archivo)
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima_supabase

# OpenAI (CRÍTICO)
OPENAI_API_KEY=sk-proj-tu-key-openai-aqui

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Configuración de cron (IMPORTANTE)
ENABLE_CRON_IN_PRODUCTION=true
```

### **2. Build para Producción**
```bash
# Instalar dependencias
npm install

# Build optimizado
npm run build

# Iniciar en producción
npm start
```

### **3. Verificación Post-Build**
```bash
# Verificar que todo esté instalado
npm run verify

# Probar cron después del build
node -e "
  const { getCronStatus } = require('./src/lib/cronJobs');
  console.log('Cron status:', getCronStatus());
"
```

## ⚙️ Consideraciones Específicas de Producción

### **🕛 Sistema de Cron Automático**
- **Se ACTIVA automáticamente** en producción
- **Se ejecuta a las 24:00** según configuración
- **Logs completos** en tabla `sales_analysis_logs`
- **Panel de control** en `/admin` funcional

### **🧠 Análisis IA**
- **OpenAI API** debe estar configurada
- **Fallback local** si OpenAI falla
- **Cache inteligente** para optimizar costos
- **Rate limiting** automático

### **📊 Base de Datos**
- **Migración SQL** debe ejecutarse antes del primer uso
- **RLS policies** activas para seguridad
- **Índices optimizados** para performance

## 🏗️ Arquitectura en Producción

```
┌─────────────────────────────────────────┐
│                FRONTEND                 │
│  Next.js App (Dashboard + Admin)       │
│  - Dashboard: /rendimiento              │
│  - Admin: /admin                        │
│  - APIs: /api/*                         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│               BACKEND                   │
│  Node.js + Next.js API Routes          │
│  - Cron Jobs (auto-inicializa)         │
│  - Análisis IA (OpenAI + Local)        │
│  - Gestión de reportes                 │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            BASE DE DATOS                │
│  Supabase (PostgreSQL)                 │
│  - Tablas existentes + nuevas          │
│  - RLS + Triggers + Vistas             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            SERVICIOS IA                 │
│  OpenAI GPT-3.5 Turbo                  │
│  - Análisis de conversaciones          │
│  - Detección de ventas                 │
│  - Generación de reportes              │
└─────────────────────────────────────────┘
```

## 📋 Checklist Pre-Producción

### **Antes del Build**
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas
- [ ] Migración SQL ejecutada en Supabase
- [ ] OpenAI API key válida y con créditos
- [ ] Prueba local exitosa (`npm run dev:cron`)

### **Durante el Build**
- [ ] `npm run build` sin errores
- [ ] Archivos estáticos generados (/.next)
- [ ] APIs compiladas correctamente
- [ ] Dependencias de producción incluidas

### **Después del Deploy**
- [ ] `npm start` ejecuta sin errores
- [ ] Cron se inicializa automáticamente
- [ ] Panel `/admin` accesible
- [ ] Dashboard `/rendimiento` funcional
- [ ] Análisis manual funciona

## 🚨 Problemas Comunes y Soluciones

### **Error: "Cannot find module 'node-cron'"**
```bash
# Solución
npm install node-cron@^3.0.3 --save
```

### **Error: Cron no se ejecuta en producción**
```bash
# Verificar variable de entorno
echo $NODE_ENV  # Debe ser 'production'

# Verificar configuración en BD
SELECT * FROM sales_analysis_config WHERE config_key = 'cron_settings';

# Forzar inicialización manual
curl -X POST https://tu-dominio.com/api/cron/configure -d '{"action":"start"}'
```

### **Error: OpenAI timeout o límites**
```bash
# El sistema usa fallback automático a análisis local
# Verificar logs en sales_analysis_logs
SELECT * FROM sales_analysis_logs WHERE success = false;
```

### **Error: Puppeteer en servidor**
```bash
# Para servidores sin interfaz gráfica
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm install

# O usar Docker con dependencias
FROM node:18-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 🐳 Deploy con Docker (Opcional)

### **Dockerfile optimizado**
```dockerfile
FROM node:18-alpine

# Dependencias del sistema para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### **docker-compose.yml para producción**
```yaml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
      - OPENAI_API_KEY=${OPENAI_KEY}
      - ENABLE_CRON_IN_PRODUCTION=true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 📊 Monitoreo en Producción

### **Endpoints de Salud**
- `GET /api/cron/daily-analysis` - Estado del sistema
- `POST /api/cron/daily-analysis` - Trigger manual
- `GET /api/cron/configure` - Configuración actual

### **Logs a Monitorear**
```sql
-- Logs de errores críticos
SELECT * FROM sales_analysis_logs 
WHERE success = false 
ORDER BY created_at DESC LIMIT 10;

-- Análisis ejecutados hoy
SELECT * FROM daily_sales_reports 
WHERE report_date = CURRENT_DATE;

-- Performance del sistema
SELECT 
  event_type,
  COUNT(*) as total,
  AVG(execution_time_ms) as avg_time
FROM sales_analysis_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY event_type;
```

## 🔧 Mantenimiento

### **Tareas Diarias Automáticas**
- ✅ Análisis de rendimiento a las 24:00
- ✅ Generación de reportes automática
- ✅ Limpieza de logs antiguos (>30 días)
- ✅ Verificación de salud del sistema

### **Tareas Manuales Recomendadas**
- **Semanal**: Revisar logs de errores
- **Mensual**: Verificar costos de OpenAI
- **Trimestral**: Optimizar configuración según uso

## 💰 Costos Estimados

### **OpenAI (GPT-3.5 Turbo)**
- **10 asesores diarios**: ~$0.30/mes
- **50 asesores diarios**: ~$1.50/mes
- **100 asesores diarios**: ~$3.00/mes

### **Servidor (mínimo recomendado)**
- **CPU**: 1 vCPU
- **RAM**: 1GB
- **Storage**: 10GB
- **Ancho de banda**: Mínimo

## ✅ Confirmación Final

**SÍ, después del build funcionará:**
1. ✅ Sistema cron se auto-inicializa
2. ✅ Análisis diario automático a las 24:00
3. ✅ Panel de administración `/admin`
4. ✅ Dashboard de métricas `/rendimiento`
5. ✅ APIs de control y configuración
6. ✅ Análisis manual bajo demanda
7. ✅ Generación de reportes automática

**El sistema está diseñado para ser completamente autónomo en producción.**

---

## 🚀 Comandos de Deploy Rápido

```bash
# Deploy completo en 4 comandos
npm install
npm run build
npm start

# Verificar funcionamiento
curl http://localhost:3000/api/cron/daily-analysis
```

**¡El sistema estará funcionando completamente en producción!** 🎉