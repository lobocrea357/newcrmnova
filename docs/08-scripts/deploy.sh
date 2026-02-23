#!/bin/bash

# ============================================
# Script de Despliegue Automático - VPS
# CRM WhatsApp con WAHA Plus
# ============================================

set -e  # Detener en caso de error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CRM WhatsApp - Despliegue Automático              ║"
echo "║         Un solo comando para iniciar todo                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# 1. VERIFICAR REQUISITOS
# ============================================

echo -e "${BLUE}[1/6]${NC} Verificando requisitos..."

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker instalado${NC}"

# Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose instalado${NC}"

# ============================================
# 2. VERIFICAR ARCHIVO .env
# ============================================

echo -e "${BLUE}[2/6]${NC} Verificando configuración..."

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ Archivo .env no encontrado${NC}"
    echo -e "${BLUE}Creando .env desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}✗ IMPORTANTE: Edita el archivo .env con tus credenciales${NC}"
    echo -e "${YELLOW}  Ejecuta: nano .env${NC}"
    exit 1
fi

# Verificar variables críticas
source .env

MISSING_VARS=()

if [ -z "$WAHA_API_KEY" ] || [ "$WAHA_API_KEY" == "your_secure_api_key_here" ]; then
    MISSING_VARS+=("WAHA_API_KEY")
fi

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" == "https://your-project.supabase.co" ]; then
    MISSING_VARS+=("SUPABASE_URL")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" == "your_service_role_key_here" ]; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Variables de entorno faltantes:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}Edita el archivo .env y configura estas variables${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Variables de entorno configuradas${NC}"

# ============================================
# 3. LOGIN EN DOCKER (si es necesario)
# ============================================

echo -e "${BLUE}[3/6]${NC} Verificando acceso a Docker Registry..."

# Intentar pull de la imagen WAHA Plus
if docker pull devlikeapro/waha-plus:latest &> /dev/null; then
    echo -e "${GREEN}✓ Acceso a WAHA Plus confirmado${NC}"
else
    echo -e "${YELLOW}⚠ No se puede acceder a WAHA Plus${NC}"
    echo -e "${BLUE}Intentando con credenciales...${NC}"
    
    # Si hay credenciales de Docker en el .env, usarlas
    if [ ! -z "$DOCKER_USERNAME" ] && [ ! -z "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
        echo -e "${GREEN}✓ Login exitoso${NC}"
    else
        echo -e "${YELLOW}Usando imagen WAHA gratuita${NC}"
        # Cambiar a imagen gratuita en docker-compose
        sed -i 's/devlikeapro\/waha-plus:latest/devlikeapro\/waha:latest/g' docker-compose.yml
    fi
fi

# ============================================
# 4. DETENER SERVICIOS EXISTENTES
# ============================================

echo -e "${BLUE}[4/6]${NC} Deteniendo servicios existentes..."

docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Servicios detenidos${NC}"

# ============================================
# 5. CONSTRUIR E INICIAR SERVICIOS
# ============================================

echo -e "${BLUE}[5/6]${NC} Construyendo e iniciando servicios..."

# Construir imágenes
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d

echo -e "${GREEN}✓ Servicios iniciados${NC}"

# ============================================
# 6. VERIFICAR ESTADO
# ============================================

echo -e "${BLUE}[6/6]${NC} Verificando estado de servicios..."

# Esperar un poco
sleep 15

# Verificar cada servicio
WAHA_STATUS=$(docker-compose ps waha | grep -c "Up" || echo "0")
EXPRESS_STATUS=$(docker-compose ps express | grep -c "Up" || echo "0")
DASHBOARD_STATUS=$(docker-compose ps dashboard | grep -c "Up" || echo "0")

echo ""
if [ "$WAHA_STATUS" -eq "1" ]; then
    echo -e "${GREEN}✓ WAHA Plus corriendo (Puerto 3000)${NC}"
else
    echo -e "${RED}✗ WAHA Plus no está corriendo${NC}"
fi

if [ "$EXPRESS_STATUS" -eq "1" ]; then
    echo -e "${GREEN}✓ Express API corriendo (Puerto 4000)${NC}"
else
    echo -e "${RED}✗ Express API no está corriendo${NC}"
fi

if [ "$DASHBOARD_STATUS" -eq "1" ]; then
    echo -e "${GREEN}✓ Dashboard corriendo (Puerto 3001)${NC}"
else
    echo -e "${RED}✗ Dashboard no está corriendo${NC}"
fi

# ============================================
# RESULTADO FINAL
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 DESPLIEGUE EXITOSO 🎉                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 URLs de Acceso:"
echo ""
echo "  🔹 WAHA Dashboard:"
echo "     http://$(hostname -I | awk '{print $1}'):3000"
echo "     Usuario: admin"
echo ""
echo "  🔹 Express API:"
echo "     http://$(hostname -I | awk '{print $1}'):4000"
echo ""
echo "  🔹 Dashboard CRM:"
echo "     http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📊 Comandos Útiles:"
echo ""
echo "  Ver logs:              docker-compose logs -f"
echo "  Ver estado:            docker-compose ps"
echo "  Reiniciar:             docker-compose restart"
echo "  Detener:               docker-compose down"
echo ""
echo "🔧 Próximos Pasos:"
echo ""
echo "  1. Accede a WAHA Dashboard y crea un worker"
echo "  2. Escanea el código QR con WhatsApp"
echo "  3. Accede al Dashboard CRM"
echo "  4. ¡Empieza a usar tu CRM!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Opción de ver logs
read -p "¿Deseas ver los logs en tiempo real? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker-compose logs -f
fi
