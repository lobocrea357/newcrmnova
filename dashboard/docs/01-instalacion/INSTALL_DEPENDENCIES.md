# 📦 Guía de Instalación de Dependencias
## Sistema de Análisis de Ventas con IA - Completo

### 🚀 Instalación Rápida

Ejecuta los siguientes comandos en el directorio `crmnovabots/dashboard`:

```bash
# 1. Instalar todas las dependencias
npm install

# 2. Instalar dependencias adicionales específicas
npm install node-cron@^3.0.3 puppeteer@^21.6.1 html2canvas@^1.4.1 recharts@^2.8.0

# 3. Verificar instalación
npm list
```

### 📋 Lista Completa de Dependencias

#### **Dependencias de Producción:**
- `@supabase/supabase-js@^2.39.0` - Cliente de Supabase
- `html2canvas@^1.4.1` - Captura HTML para PDF
- `jspdf@^2.5.1` - Generación de PDF
- `lucide-react@^0.468.0` - Iconos
- `next@^16.0.10` - Framework React
- `node-cron@^3.0.3` - **Tareas programadas automáticas**
- `openai@^6.9.1` - API de OpenAI para IA
- `puppeteer@^21.6.1` - **Generación PDF avanzada**
- `react@19.2.0` - Biblioteca React
- `react-dom@19.2.0` - DOM React
- `recharts@^2.8.0` - **Gráficos para reportes**

#### **Dependencias de Desarrollo:**
- `@tailwindcss/postcss@^4` - PostCSS para Tailwind
- `@types/node@^20.10.5` - Tipos TypeScript para Node.js
- `babel-plugin-react-compiler@1.0.0` - Compilador React
- `eslint@^9` - Linter JavaScript
- `eslint-config-next@16.0.1` - Configuración ESLint para Next.js
- `tailwindcss@^4` - Framework CSS

### 🔧 Configuración Post-Instalación

#### 1. **Variables de Entorno**
Asegúrate de tener estas variables en tu `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key

# OpenAI para análisis de IA
OPENAI_API_KEY=sk-proj-...

# Configuración de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Jobs (opcional)
ENABLE_CRON_IN_DEV=true  # Solo para desarrollo
```

#### 2. **Puppeteer (Linux/Docker)**
Si estás en Linux o Docker, instala dependencias del sistema:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# CentOS/RHEL
sudo yum install -y alsa-lib.x86_64 atk.x86_64 cups-libs.x86_64 gtk3.x86_64 ipa-gothic-fonts libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXrandr.x86_64 libXScrnSaver.x86_64 libXtst.x86_64 pango.x86_64 xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic xorg-x11-fonts-misc xorg-x11-fonts-Type1 xorg-x11-utils
```

#### 3. **Verificar Instalación de Puppeteer**
```bash
npx puppeteer browsers install chrome
```

### 🧪 Verificación de Funcionalidades

#### **Verificar Node-Cron:**
```bash
node -e "const cron = require('node-cron'); console.log('✅ node-cron instalado correctamente');"
```

#### **Verificar Puppeteer:**
```bash
node -e "const puppeteer = require('puppeteer'); console.log('✅ Puppeteer instalado correctamente');"
```

#### **Verificar OpenAI:**
```bash
node -e "const OpenAI = require('openai'); console.log('✅ OpenAI SDK instalado correctamente');"
```

### 🚨 Solución de Problemas Comunes

#### **Error: "Cannot find module 'node-cron'"**
```bash
npm install node-cron@^3.0.3 --save
```

#### **Error: Puppeteer no puede ejecutar Chrome**
```bash
# Opción 1: Instalar Chrome manualmente
npx puppeteer browsers install chrome

# Opción 2: Usar Chrome del sistema
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

#### **Error: Memory issues con Puppeteer**
Agregar al `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  }
};
export default nextConfig;
```

#### **Error: ESLint warnings**
```bash
npm run lint -- --fix
```

### 🎯 Funcionalidades por Dependencia

| Dependencia | Funcionalidad | Estado |
|-------------|---------------|---------|
| `node-cron` | Análisis diario automático a las 24:00 | ✅ FASE 2 |
| `openai` | Análisis IA de conversaciones y ventas | ✅ FASE 1 |
| `puppeteer` | Generación PDF profesional | 🟡 FASE 3 |
| `html2canvas` | Captura de gráficos para PDF | 🟡 FASE 3 |
| `jspdf` | PDFs básicos y fallback | 🟡 FASE 3 |
| `recharts` | Gráficos en dashboard | 🟡 FASE 4 |
| `@supabase/supabase-js` | Base de datos y autenticación | ✅ Base |

### 📊 Tamaños de Instalación

```
node_modules estimado: ~850MB
- puppeteer: ~280MB (incluye Chromium)
- next: ~180MB
- react: ~120MB
- otros: ~270MB
```

### 🔄 Scripts de Desarrollo

Agrega estos scripts a tu workflow:

```bash
# Desarrollo con cron habilitado
ENABLE_CRON_IN_DEV=true npm run dev

# Construcción para producción
npm run build

# Iniciar en producción
npm start

# Linter
npm run lint
```

### ⚡ Optimizaciones de Rendimiento

#### **Para Producción:**
1. **Desactivar Puppeteer innecesario:**
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --production
```

2. **Usar CDN para librerías grandes:**
En `next.config.mjs`:
```javascript
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
}
```

### ✅ Checklist de Instalación

- [ ] `npm install` ejecutado sin errores
- [ ] Variables de entorno configuradas
- [ ] Puppeteer puede ejecutar Chrome
- [ ] OpenAI API key válida
- [ ] Base de datos migrada
- [ ] `npm run dev` funciona correctamente
- [ ] Panel admin accesible en `/admin`
- [ ] Cron job se inicializa automáticamente

### 🆘 Soporte

Si encuentras problemas:

1. **Revisar logs:** `npm run dev` y ver consola
2. **Verificar versiones:** `node --version` (requiere Node.js 18+)
3. **Limpiar cache:** `rm -rf node_modules package-lock.json && npm install`
4. **Verificar permisos:** Puppeteer necesita permisos para ejecutar Chrome

---

**🎉 Una vez instalado todo correctamente, tendrás:**
- ✅ Sistema de cron automático (análisis diario)
- ✅ Análisis IA de ventas
- 🟡 Generación PDF (FASE 3)
- 🟡 Dashboard con gráficos (FASE 4)

**Total estimado de instalación: 5-10 minutos**