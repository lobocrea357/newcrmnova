#!/bin/bash

# ============================================
# Script de Despliegue para VPS
# CRM WhatsApp con WAHA + Express + Dashboard
# ============================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CRM WhatsApp - Despliegue en VPS                  ║"
echo "║         WAHA Plus + Express + Next.js Dashboard           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar requisitos
print_message "Verificando requisitos del sistema..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    echo "Instala Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
print_success "Docker instalado: $(docker --version)"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose no está instalado"
    echo "Instala Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose instalado"

# 2. Verificar archivo .env
print_message "Verificando configuración..."

if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado"
    print_message "Creando .env desde .env.example..."
    cp .env.example .env
    print_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales"
    print_warning "    nano .env"
    echo ""
    read -p "¿Has configurado el archivo .env? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Configura el archivo .env antes de continuar"
        exit 1
    fi
fi
print_success "Archivo .env encontrado"

# 3. Verificar variables críticas
print_message "Verificando variables de entorno críticas..."

source .env

REQUIRED_VARS=(
    "WAHA_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "your_"* ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Variables de entorno faltantes o sin configurar:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_warning "Edita el archivo .env y configura estas variables"
    exit 1
fi
print_success "Variables de entorno configuradas correctamente"

# 4. Detener servicios existentes (si existen)
print_message "Deteniendo servicios existentes..."
docker-compose down 2>/dev/null || true
print_success "Servicios detenidos"

# 5. Limpiar imágenes antiguas (opcional)
read -p "¿Deseas limpiar imágenes Docker antiguas? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_message "Limpiando imágenes antiguas..."
    docker system prune -f
    print_success "Imágenes limpiadas"
fi

# 6. Construir imágenes
print_message "Construyendo imágenes Docker..."
docker-compose build --no-cache
print_success "Imágenes construidas"

# 7. Iniciar servicios
print_message "Iniciando servicios..."
docker-compose up -d
print_success "Servicios iniciados"

# 8. Esperar a que los servicios estén listos
print_message "Esperando a que los servicios estén listos..."
sleep 10

# 9. Verificar estado de los servicios
print_message "Verificando estado de los servicios..."
echo ""

# Verificar WAHA
if docker-compose ps waha | grep -q "Up"; then
    print_success "WAHA está corriendo (Puerto 3000)"
else
    print_error "WAHA no está corriendo"
fi

# Verificar Express
if docker-compose ps express | grep -q "Up"; then
    print_success "Express API está corriendo (Puerto 4000)"
else
    print_error "Express API no está corriendo"
fi

# Verificar Dashboard
if docker-compose ps dashboard | grep -q "Up"; then
    print_success "Dashboard está corriendo (Puerto 3001)"
else
    print_error "Dashboard no está corriendo"
fi

# 10. Mostrar información de acceso
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 DESPLIEGUE EXITOSO 🎉                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 URLs de Acceso:"
echo ""
echo "  🔹 WAHA Dashboard:"
echo "     http://localhost:3000"
echo "     Usuario: ${WAHA_DASHBOARD_USERNAME:-admin}"
echo ""
echo "  🔹 Express API:"
echo "     http://localhost:4000"
echo "     Health: http://localhost:4000/health"
echo ""
echo "  🔹 Dashboard CRM:"
echo "     http://localhost:3001"
echo ""
echo "📊 Comandos Útiles:"
echo ""
echo "  Ver logs:              docker-compose logs -f"
echo "  Ver logs de WAHA:      docker-compose logs -f waha"
echo "  Ver logs de Express:   docker-compose logs -f express"
echo "  Ver logs de Dashboard: docker-compose logs -f dashboard"
echo ""
echo "  Detener servicios:     docker-compose down"
echo "  Reiniciar servicios:   docker-compose restart"
echo "  Ver estado:            docker-compose ps"
echo ""
echo "📚 Documentación:"
echo ""
echo "  - Arquitectura:        cat ARQUITECTURA.md"
echo "  - Guía Rápida:         cat GUIA-RAPIDA.md"
echo "  - README:              cat README.md"
echo ""
echo "🔧 Próximos Pasos:"
echo ""
echo "  1. Accede a WAHA Dashboard (http://localhost:3000)"
echo "  2. Crea un worker/bot de WhatsApp"
echo "  3. Escanea el código QR con WhatsApp"
echo "  4. Accede al Dashboard CRM (http://localhost:3001)"
echo "  5. ¡Empieza a usar tu CRM!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 11. Opción de ver logs
read -p "¿Deseas ver los logs en tiempo real? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_message "Mostrando logs (Ctrl+C para salir)..."
    docker-compose logs -f
fi
