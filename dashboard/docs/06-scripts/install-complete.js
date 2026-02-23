#!/usr/bin/env node

/**
 * Script de Instalación Automatizada Completa
 * Sistema de Análisis de Ventas con IA
 *
 * Ejecutar: node install-complete.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.bold}${colors.blue}PASO ${num}: ${msg}${colors.reset}`),
};

// Configuración
const config = {
  dependencies: {
    production: [
      'node-cron@^3.0.3',
      'puppeteer@^21.6.1',
      'html2canvas@^1.4.1',
      'recharts@^2.8.0',
      '@types/node@^20.10.5'
    ],
    fixes: [
      'jspdf@^2.5.1' // Downgrade por compatibilidad
    ]
  }
};

// Interface para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
  });
};

// Función principal
async function main() {
  console.clear();
  log.header('INSTALACIÓN AUTOMATIZADA\nSistema de Análisis de Ventas con IA');

  console.log(`${colors.blue}Este script instalará todas las dependencias necesarias para:`);
  console.log(`${colors.blue}✓ Sistema de cron automático (análisis diario)`);
  console.log(`${colors.blue}✓ Análisis IA de conversaciones y ventas`);
  console.log(`${colors.blue}✓ Generación de PDF profesional`);
  console.log(`${colors.blue}✓ Dashboard con gráficos avanzados`);
  console.log(`${colors.reset}`);

  const proceed = await askQuestion('¿Desea continuar con la instalación? (s/n): ');
  if (proceed.toLowerCase() !== 's' && proceed.toLowerCase() !== 'y') {
    log.warning('Instalación cancelada por el usuario');
    rl.close();
    return;
  }

  try {
    // Paso 1: Verificar prerrequisitos
    log.step(1, 'Verificando prerrequisitos');
    await checkPrerequisites();

    // Paso 2: Limpiar instalación previa
    log.step(2, 'Limpiando instalación previa (opcional)');
    const cleanInstall = await askQuestion('¿Desea limpiar node_modules antes de instalar? (recomendado) (s/n): ');
    if (cleanInstall.toLowerCase() === 's' || cleanInstall.toLowerCase() === 'y') {
      await cleanPreviousInstallation();
    }

    // Paso 3: Instalar dependencias base
    log.step(3, 'Instalando dependencias base');
    await installBaseDependencies();

    // Paso 4: Instalar dependencias específicas del sistema
    log.step(4, 'Instalando dependencias del sistema de análisis');
    await installSystemDependencies();

    // Paso 5: Configurar Puppeteer
    log.step(5, 'Configurando Puppeteer para generación PDF');
    await setupPuppeteer();

    // Paso 6: Configurar variables de entorno
    log.step(6, 'Configurando variables de entorno');
    await setupEnvironment();

    // Paso 7: Verificar instalación
    log.step(7, 'Verificando instalación');
    await verifyInstallation();

    // Paso 8: Configuración final
    log.step(8, 'Configuración final');
    await finalSetup();

    // Éxito
    console.log(`\n${colors.green}${colors.bold}`);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                 🎉 INSTALACIÓN EXITOSA 🎉               ║');
    console.log('║                                                          ║');
    console.log('║  Sistema de Análisis de Ventas con IA completamente     ║');
    console.log('║  instalado y configurado.                               ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    console.log(`\n${colors.cyan}${colors.bold}PRÓXIMOS PASOS:${colors.reset}`);
    console.log(`${colors.blue}1.${colors.reset} Ejecutar migración SQL: ${colors.yellow}SALES_DATABASE_MIGRATION_COMPATIBLE.sql${colors.reset}`);
    console.log(`${colors.blue}2.${colors.reset} Iniciar desarrollo: ${colors.yellow}npm run dev${colors.reset}`);
    console.log(`${colors.blue}3.${colors.reset} Acceder al panel admin: ${colors.yellow}http://localhost:3000/admin${colors.reset}`);
    console.log(`${colors.blue}4.${colors.reset} Configurar análisis automático en el panel`);
    console.log(`${colors.blue}5.${colors.reset} Probar análisis manual`);

  } catch (error) {
    log.error(`Error durante la instalación: ${error.message}`);
    console.log(`\n${colors.red}${colors.bold}INSTALACIÓN FALLIDA${colors.reset}`);
    console.log(`${colors.red}Revise los errores arriba y ejecute el script nuevamente${colors.reset}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function checkPrerequisites() {
  log.info('Verificando Node.js...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1));

  if (majorVersion < 18) {
    throw new Error(`Node.js ${nodeVersion} es muy antiguo. Se requiere Node.js 18+`);
  }
  log.success(`Node.js ${nodeVersion} ✓`);

  log.info('Verificando npm...');
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`npm ${npmVersion} ✓`);
  } catch (error) {
    throw new Error('npm no está disponible');
  }

  log.info('Verificando package.json...');
  if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
    throw new Error('package.json no encontrado');
  }
  log.success('package.json encontrado ✓');
}

async function cleanPreviousInstallation() {
  log.info('Eliminando node_modules...');
  try {
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
      execSync('rm -rf node_modules', { cwd: __dirname });
      log.success('node_modules eliminado');
    }
  } catch (error) {
    log.warning('No se pudo eliminar node_modules, continuando...');
  }

  log.info('Eliminando package-lock.json...');
  try {
    if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
      fs.unlinkSync(path.join(__dirname, 'package-lock.json'));
      log.success('package-lock.json eliminado');
    }
  } catch (error) {
    log.warning('No se pudo eliminar package-lock.json, continuando...');
  }
}

async function installBaseDependencies() {
  log.info('Ejecutando npm install...');
  try {
    execSync('npm install', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 300000 // 5 minutos timeout
    });
    log.success('Dependencias base instaladas');
  } catch (error) {
    throw new Error(`Error instalando dependencias base: ${error.message}`);
  }
}

async function installSystemDependencies() {
  log.info('Instalando node-cron...');
  try {
    execSync('npm install node-cron@^3.0.3', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    log.success('node-cron instalado ✓');
  } catch (error) {
    throw new Error(`Error instalando node-cron: ${error.message}`);
  }

  log.info('Instalando Puppeteer (puede tardar varios minutos)...');
  try {
    execSync('npm install puppeteer@^21.6.1', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 600000 // 10 minutos para Puppeteer
    });
    log.success('Puppeteer instalado ✓');
  } catch (error) {
    log.warning(`Error instalando Puppeteer: ${error.message}`);
    log.warning('Continuando sin Puppeteer (generación PDF limitada)');
  }

  log.info('Instalando html2canvas...');
  try {
    execSync('npm install html2canvas@^1.4.1', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    log.success('html2canvas instalado ✓');
  } catch (error) {
    log.warning(`Error instalando html2canvas: ${error.message}`);
  }

  log.info('Instalando recharts para gráficos...');
  try {
    execSync('npm install recharts@^2.8.0', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    log.success('recharts instalado ✓');
  } catch (error) {
    log.warning(`Error instalando recharts: ${error.message}`);
  }

  log.info('Actualizando jsPDF...');
  try {
    execSync('npm install jspdf@^2.5.1', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    log.success('jsPDF actualizado ✓');
  } catch (error) {
    log.warning(`Error actualizando jsPDF: ${error.message}`);
  }

  log.info('Instalando tipos TypeScript...');
  try {
    execSync('npm install --save-dev @types/node@^20.10.5', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    log.success('Tipos TypeScript instalados ✓');
  } catch (error) {
    log.warning(`Error instalando tipos TypeScript: ${error.message}`);
  }
}

async function setupPuppeteer() {
  try {
    log.info('Verificando instalación de Chromium...');
    const puppeteer = require('puppeteer');

    log.info('Descargando/verificando Chromium...');
    try {
      execSync('npx puppeteer browsers install chrome', {
        cwd: __dirname,
        stdio: 'inherit',
        timeout: 300000 // 5 minutos
      });
      log.success('Chromium configurado correctamente ✓');
    } catch (error) {
      log.warning('Error configurando Chromium, usando instalación por defecto');
    }
  } catch (error) {
    log.warning('Puppeteer no disponible, saltando configuración');
  }
}

async function setupEnvironment() {
  const envPath = path.join(__dirname, '.env.local');

  if (fs.existsSync(envPath)) {
    log.info('.env.local ya existe, verificando configuración...');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];

    let missingVars = [];
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      log.warning(`Variables faltantes en .env.local: ${missingVars.join(', ')}`);
      const addVars = await askQuestion('¿Desea agregar las variables faltantes ahora? (s/n): ');

      if (addVars.toLowerCase() === 's') {
        await addMissingEnvVars(envPath, missingVars);
      }
    } else {
      log.success('Todas las variables de entorno requeridas están configuradas ✓');
    }
  } else {
    log.info('Creando archivo .env.local...');
    const createEnv = await askQuestion('¿Desea crear el archivo .env.local ahora? (s/n): ');

    if (createEnv.toLowerCase() === 's') {
      await createEnvFile(envPath);
    } else {
      log.warning('IMPORTANTE: Configure .env.local manualmente antes de usar la aplicación');
    }
  }
}

async function addMissingEnvVars(envPath, missingVars) {
  let envContent = fs.readFileSync(envPath, 'utf8');

  for (const varName of missingVars) {
    const value = await askQuestion(`Ingrese valor para ${varName} (o presione Enter para omitir): `);
    if (value.trim()) {
      envContent += `\n${varName}=${value.trim()}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  log.success('Variables agregadas al .env.local ✓');
}

async function createEnvFile(envPath) {
  console.log(`\n${colors.cyan}Configurando variables de entorno...${colors.reset}`);

  const supabaseUrl = await askQuestion('NEXT_PUBLIC_SUPABASE_URL (URL de tu proyecto Supabase): ');
  const supabaseKey = await askQuestion('NEXT_PUBLIC_SUPABASE_ANON_KEY (Clave anónima de Supabase): ');
  const openaiKey = await askQuestion('OPENAI_API_KEY (Clave de OpenAI): ');

  const envContent = `# Variables de entorno - Sistema de Análisis de Ventas IA
# Generado automáticamente por install-complete.js

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# OpenAI
OPENAI_API_KEY=${openaiKey}

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Jobs (habilitar en desarrollo)
ENABLE_CRON_IN_DEV=true

# Configuración de producción
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  log.success('.env.local creado exitosamente ✓');
}

async function verifyInstallation() {
  log.info('Verificando instalación...');

  const criticalDeps = [
    'node-cron',
    'openai',
    '@supabase/supabase-js',
    'next',
    'react'
  ];

  let allCriticalInstalled = true;

  for (const dep of criticalDeps) {
    try {
      require.resolve(dep);
      log.success(`${dep} ✓`);
    } catch (error) {
      log.error(`${dep} - NO INSTALADO`);
      allCriticalInstalled = false;
    }
  }

  // Verificar dependencias opcionales
  const optionalDeps = ['puppeteer', 'html2canvas', 'recharts'];
  let optionalCount = 0;

  for (const dep of optionalDeps) {
    try {
      require.resolve(dep);
      log.success(`${dep} (opcional) ✓`);
      optionalCount++;
    } catch (error) {
      log.warning(`${dep} (opcional) - No instalado`);
    }
  }

  if (!allCriticalInstalled) {
    throw new Error('Faltan dependencias críticas');
  }

  log.success(`Verificación completa: ${criticalDeps.length}/${criticalDeps.length} críticas, ${optionalCount}/${optionalDeps.length} opcionales`);
}

async function finalSetup() {
  log.info('Configuración final...');

  // Verificar que los archivos del sistema existen
  const criticalFiles = [
    'src/lib/cronJobs.js',
    'src/lib/salesDetection.js',
    'src/app/api/cron/daily-analysis/route.js'
  ];

  let missingFiles = [];
  for (const file of criticalFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    log.warning(`Archivos faltantes del sistema: ${missingFiles.join(', ')}`);
    log.warning('Asegúrese de tener todos los archivos del sistema antes de continuar');
  } else {
    log.success('Todos los archivos del sistema están presentes ✓');
  }

  // Crear archivo de configuración de Next.js si no existe
  const nextConfigPath = path.join(__dirname, 'next.config.mjs');
  if (!fs.existsSync(nextConfigPath)) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'node-cron']
  }
};

export default nextConfig;
`;
    fs.writeFileSync(nextConfigPath, nextConfig);
    log.success('next.config.mjs creado ✓');
  }

  log.success('Configuración final completada ✓');
}

// Ejecutar instalación
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error fatal en instalación:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { main };
