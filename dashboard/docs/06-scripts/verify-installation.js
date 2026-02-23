#!/usr/bin/env node

/**
 * Script de Verificación de Instalación
 * Sistema de Análisis de Ventas con IA
 *
 * Ejecutar: node verify-installation.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`),
};

// Configuración de verificación
const checks = {
  // Dependencias principales
  dependencies: [
    { name: 'node-cron', version: '^3.0.3', critical: true },
    { name: 'openai', version: '^6.9.1', critical: true },
    { name: 'puppeteer', version: '^21.6.1', critical: false },
    { name: 'html2canvas', version: '^1.4.1', critical: false },
    { name: 'jspdf', version: '^2.5.1', critical: false },
    { name: 'recharts', version: '^2.8.0', critical: false },
    { name: '@supabase/supabase-js', version: '^2.39.0', critical: true },
    { name: 'next', version: '^16.0.10', critical: true },
    { name: 'react', version: '19.2.0', critical: true },
  ],

  // Archivos críticos del sistema
  files: [
    'src/lib/cronJobs.js',
    'src/lib/salesDetection.js',
    'src/lib/salesRendimiento.js',
    'src/lib/cronInitializer.js',
    'src/app/api/cron/daily-analysis/route.js',
    'src/app/api/analyze-sales/route.js',
    'src/components/admin/CronManager.jsx',
    'src/components/ventas/SalesMetricsCard.jsx',
  ],

  // Variables de entorno requeridas
  envVars: [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
    { name: 'OPENAI_API_KEY', required: true },
    { name: 'NEXT_PUBLIC_APP_URL', required: false },
    { name: 'ENABLE_CRON_IN_DEV', required: false },
  ]
};

async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       VERIFICACIÓN DE INSTALACIÓN                       ║');
  console.log('║       Sistema de Análisis de Ventas con IA              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  let totalChecks = 0;
  let passedChecks = 0;
  let criticalErrors = 0;

  // 1. Verificar Node.js y npm
  log.header('1. Verificando entorno de Node.js');
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

    log.info(`Node.js: ${nodeVersion}`);
    log.info(`npm: ${npmVersion}`);

    const majorVersion = parseInt(nodeVersion.slice(1));
    if (majorVersion >= 18) {
      log.success('Versión de Node.js compatible (18+)');
      passedChecks++;
    } else {
      log.error(`Versión de Node.js muy antigua (${nodeVersion}). Se requiere 18+`);
      criticalErrors++;
    }
    totalChecks++;
  } catch (error) {
    log.error('Error verificando Node.js/npm');
    criticalErrors++;
    totalChecks++;
  }

  // 2. Verificar package.json
  log.header('2. Verificando package.json');
  totalChecks++;
  try {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      log.success('package.json encontrado');
      passedChecks++;
    } else {
      log.error('package.json no encontrado');
      criticalErrors++;
    }
  } catch (error) {
    log.error('Error leyendo package.json');
    criticalErrors++;
  }

  // 3. Verificar dependencias instaladas
  log.header('3. Verificando dependencias instaladas');
  for (const dep of checks.dependencies) {
    totalChecks++;
    try {
      require.resolve(dep.name);

      // Verificar versión si es posible
      try {
        const packageJson = require(path.join(__dirname, 'node_modules', dep.name, 'package.json'));
        log.success(`${dep.name}@${packageJson.version} - ✓`);
        passedChecks++;
      } catch {
        log.success(`${dep.name} - Instalado (versión no verificable)`);
        passedChecks++;
      }
    } catch (error) {
      if (dep.critical) {
        log.error(`${dep.name} - CRÍTICO: No instalado`);
        criticalErrors++;
      } else {
        log.warning(`${dep.name} - Opcional: No instalado`);
        passedChecks++; // No afecta el resultado
      }
    }
  }

  // 4. Verificar archivos del sistema
  log.header('4. Verificando archivos del sistema');
  for (const file of checks.files) {
    totalChecks++;
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log.success(`${file}`);
      passedChecks++;
    } else {
      log.error(`${file} - No encontrado`);
      criticalErrors++;
    }
  }

  // 5. Verificar variables de entorno
  log.header('5. Verificando variables de entorno');

  // Buscar archivos .env
  const envFiles = ['.env.local', '.env', '.env.development'];
  let envFound = false;

  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      log.info(`Archivo encontrado: ${envFile}`);
      envFound = true;

      // Cargar variables
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });

      // Verificar variables requeridas
      for (const envVar of checks.envVars) {
        totalChecks++;
        if (envVars[envVar.name] || process.env[envVar.name]) {
          log.success(`${envVar.name} - Configurado`);
          passedChecks++;
        } else if (envVar.required) {
          log.error(`${envVar.name} - REQUERIDO: No configurado`);
          criticalErrors++;
        } else {
          log.warning(`${envVar.name} - Opcional: No configurado`);
          passedChecks++;
        }
      }
      break;
    }
  }

  if (!envFound) {
    log.warning('No se encontraron archivos .env');
    totalChecks += checks.envVars.length;
    criticalErrors += checks.envVars.filter(v => v.required).length;
  }

  // 6. Verificar funcionalidades específicas
  log.header('6. Verificando funcionalidades específicas');

  // Puppeteer
  totalChecks++;
  try {
    const puppeteer = require('puppeteer');
    log.success('Puppeteer - Funcional para generación PDF');
    passedChecks++;
  } catch (error) {
    log.warning('Puppeteer - No disponible (PDF limitado)');
    passedChecks++; // No crítico
  }

  // OpenAI
  totalChecks++;
  try {
    const OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
      log.success('OpenAI SDK - Configurado con API key');
      passedChecks++;
    } else {
      log.error('OpenAI SDK - API key no configurada');
      criticalErrors++;
    }
  } catch (error) {
    log.error('OpenAI SDK - No disponible');
    criticalErrors++;
  }

  // Cron
  totalChecks++;
  try {
    const cron = require('node-cron');
    log.success('node-cron - Disponible para análisis automático');
    passedChecks++;
  } catch (error) {
    log.error('node-cron - No disponible (CRÍTICO)');
    criticalErrors++;
  }

  // 7. Resultados finales
  log.header('7. Resumen de verificación');

  console.log(`\n${colors.bold}Estadísticas:${colors.reset}`);
  console.log(`Total de verificaciones: ${totalChecks}`);
  console.log(`${colors.green}Exitosas: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Errores críticos: ${criticalErrors}${colors.reset}`);
  console.log(`${colors.yellow}Advertencias: ${totalChecks - passedChecks - criticalErrors}${colors.reset}`);

  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`\n${colors.bold}Tasa de éxito: ${successRate}%${colors.reset}`);

  if (criticalErrors === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ¡INSTALACIÓN EXITOSA!${colors.reset}`);
    console.log(`${colors.green}El sistema está listo para funcionar.${colors.reset}`);

    console.log(`\n${colors.blue}Próximos pasos:${colors.reset}`);
    console.log('1. Ejecutar migración SQL en Supabase');
    console.log('2. npm run dev');
    console.log('3. Ir a /admin para configurar el cron');
    console.log('4. Probar análisis manual');
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ INSTALACIÓN INCOMPLETA${colors.reset}`);
    console.log(`${colors.red}Se encontraron ${criticalErrors} errores críticos.${colors.reset}`);

    console.log(`\n${colors.blue}Acciones requeridas:${colors.reset}`);
    if (criticalErrors > 0) {
      console.log('1. npm install');
      console.log('2. Configurar variables de entorno (.env.local)');
      console.log('3. Volver a ejecutar: node verify-installation.js');
    }
  }

  // 8. Información adicional
  console.log(`\n${colors.blue}Información del sistema:${colors.reset}`);
  console.log(`SO: ${process.platform} ${process.arch}`);
  console.log(`Directorio: ${__dirname}`);
  console.log(`Fecha: ${new Date().toLocaleString()}`);

  // Código de salida
  process.exit(criticalErrors > 0 ? 1 : 0);
}

// Ejecutar verificación
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error fatal en verificación:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { main, checks };
