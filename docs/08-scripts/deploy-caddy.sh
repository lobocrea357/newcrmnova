#!/bin/bash

# ============================================
# Script de Despliegue con Caddy - VPS
# CRM WhatsApp con WAHA Plus
# ============================================

set -e  # Detener en caso de error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CRM WhatsApp - Despliegue con Caddy               ║"
echo "║         Configuración completa para VPS                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# 1. VERIFICAR REQUISITOS
# ============================================

echo -e "${BLUE}[1/8]${NC} Verificando requisitos del sistema..."

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    echo -e "${YELLOW}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker instalado${NC}"
else
    echo -e "${GREEN}✓ Docker instalado${NC}"
fi

# Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
fi

# Caddy
if ! command -v caddy &> /dev/null; then
    echo -e "${YELLOW}Instalando Caddy...${NC}"
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install -y caddy
    echo -e "${GREEN}✓ Caddy instalado${NC}"
else
    echo -e "${GREEN}✓ Caddy instalado${NC}"
fi

# ============================================
# 2. VERIFICAR ARCHIVO .env
# ============================================

echo -e "${BLUE}[2/8]${NC} Verificando configuración..."

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ Archivo .env no encontrado${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${BLUE}✓ Creado .env desde .env.example${NC}"
    fi
    echo -e "${RED}✗ IMPORTANTE: Edita el archivo .env con tus credenciales${NC}"
    echo -e "${YELLOW}  Ejecuta: nano .env${NC}"
    exit 1
fi

# Cargar variables
source .env

# Verificar variables críticas
MISSING_VARS=()

if [ -z "$WAHA_API_KEY" ] || [ "$WAHA_API_KEY" == "your_secure_api_key_here" ]; then
    MISSING_VARS+=("WAHA_API_KEY")
fi

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" == "https://your-project.supabase.co" ]; then
    MISSING_VARS+=("SUPABASE_URL")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
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
# 3. CONFIGURAR CADDY
# ============================================

echo -e "${BLUE}[3/8]${NC} Configurando Caddy..."

# Copiar Caddyfile
if [ -f Caddyfile ]; then
    sudo cp Caddyfile /etc/caddy/Caddyfile
    echo -e "${GREEN}✓ Caddyfile copiado${NC}"
else
    echo -e "${RED}✗ Caddyfile no encontrado${NC}"
    echo -e "${YELLOW}Creando Caddyfile básico...${NC}"
    
    cat > /tmp/Caddyfile << 'EOF'
waha.novapolointranet.xyz {
    reverse_proxy localhost:3000
}

api.novapolointranet.xyz {
    reverse_proxy localhost:4000
}

crm.novapolointranet.xyz {
    reverse_proxy localhost:3001
}
EOF
    
    sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile
    echo -e "${GREEN}✓ Caddyfile básico creado${NC}"
fi

# Crear directorio de logs
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

# Validar Caddyfile
if sudo caddy validate --config /etc/caddy/Caddyfile; then
    echo -e "${GREEN}✓ Caddyfile válido${NC}"
else
    echo -e "${RED}✗ Error en Caddyfile${NC}"
    exit 1
fi

# ============================================
# 4. CONFIGURAR FIREWALL
# ============================================

echo -e "${BLUE}[4/8]${NC} Configurando firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 22/tcp    # SSH
    sudo ufw --force enable
    echo -e "${GREEN}✓ Firewall configurado${NC}"
else
    echo -e "${YELLOW}⚠ UFW no disponible, omitiendo configuración de firewall${NC}"
fi

# ============================================
# 5. LOGIN EN DOCKER (si es necesario)
# ============================================

echo -e "${BLUE}[5/8]${NC} Verificando acceso a Docker Registry..."

if docker pull devlikeapro/waha-plus:latest &> /dev/null; then
    echo -e "${GREEN}✓ Acceso a WAHA Plus confirmado${NC}"
else
    echo -e "${YELLOW}⚠ No se puede acceder a WAHA Plus${NC}"
    if [ ! -z "$DOCKER_USERNAME" ] && [ ! -z "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
        echo -e "${GREEN}✓ Login exitoso${NC}"
    else
        echo -e "${YELLOW}Usando imagen WAHA gratuita${NC}"
        sed -i 's/devlikeapro\/waha-plus:latest/devlikeapro\/waha:latest/g' docker-compose.yml
    fi
fi

# ============================================
# 6. DETENER SERVICIOS EXISTENTES
# ============================================

echo -e "${BLUE}[6/8]${NC} Deteniendo servicios existentes..."

docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Servicios Docker detenidos${NC}"

# ============================================
# 7. CONSTRUIR E INICIAR SERVICIOS
# ============================================

echo -e "${BLUE}[7/8]${NC} Construyendo e iniciando servicios..."

# Construir imágenes
echo -e "${PURPLE}Construyendo imágenes Docker...${NC}"
docker-compose build --no-cache

# Iniciar servicios
echo -e "${PURPLE}Iniciando servicios...${NC}"
docker-compose up -d

echo -e "${GREEN}✓ Servicios Docker iniciados${NC}"

# Reiniciar Caddy
echo -e "${PURPLE}Reiniciando Caddy...${NC}"
sudo systemctl restart caddy
sudo systemctl enable caddy

echo -e "${GREEN}✓ Caddy reiniciado${NC}"

# ============================================
# 8. VERIFICAR ESTADO
# ============================================

echo -e "${BLUE}[8/8]${NC} Verificando estado de servicios..."

# Esperar un poco
sleep 20

# Verificar Docker
echo ""
echo -e "${PURPLE}Estado de contenedores Docker:${NC}"
docker-compose ps

# Verificar Caddy
echo ""
echo -e "${PURPLE}Estado de Caddy:${NC}"
sudo systemctl status caddy --no-pager | head -n 5

# Verificar cada servicio
WAHA_STATUS=$(docker-compose ps waha | grep -c "Up" || echo "0")
EXPRESS_STATUS=$(docker-compose ps express | grep -c "Up" || echo "0")
DASHBOARD_STATUS=$(docker-compose ps dashboard | grep -c "Up" || echo "0")
CADDY_STATUS=$(sudo systemctl is-active caddy)

echo ""
echo -e "${PURPLE}Resumen de servicios:${NC}"

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

if [ "$CADDY_STATUS" == "active" ]; then
    echo -e "${GREEN}✓ Caddy corriendo (Puertos 80/443)${NC}"
else
    echo -e "${RED}✗ Caddy no está corriendo${NC}"
fi

# ============================================
# RESULTADO FINAL
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              🎉 DESPLIEGUE EXITOSO CON CADDY 🎉            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 URLs de Acceso (con HTTPS automático):"
echo ""
echo "  🔹 WAHA Dashboard:"
echo "     https://waha.novapolointranet.xyz"
echo "     Usuario: admin"
echo ""
echo "  🔹 Express API:"
echo "     https://api.novapolointranet.xyz"
echo "     Health: https://api.novapolointranet.xyz/health"
echo ""
echo "  🔹 Dashboard CRM:"
echo "     https://crm.novapolointranet.xyz"
echo ""
echo "📊 Comandos Útiles:"
echo ""
echo "  Docker:"
echo "    Ver logs:              docker-compose logs -f"
echo "    Ver estado:            docker-compose ps"
echo "    Reiniciar:             docker-compose restart"
echo "    Detener:               docker-compose down"
echo ""
echo "  Caddy:"
echo "    Ver logs:              sudo journalctl -u caddy -f"
echo "    Reiniciar:             sudo systemctl restart caddy"
echo "    Estado:                sudo systemctl status caddy"
echo "    Validar config:        sudo caddy validate --config /etc/caddy/Caddyfile"
echo ""
echo "🔧 Próximos Pasos:"
echo ""
echo "  1. Accede a https://waha.novapolointranet.xyz"
echo "  2. Crea un worker y escanea el código QR"
echo "  3. Accede a https://crm.novapolointranet.xyz"
echo "  4. ¡Empieza a usar tu CRM!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Mostrar logs si hay errores
if [ "$WAHA_STATUS" -eq "0" ] || [ "$EXPRESS_STATUS" -eq "0" ] || [ "$DASHBOARD_STATUS" -eq "0" ]; then
    echo -e "${YELLOW}⚠ Algunos servicios no están corriendo. Mostrando logs...${NC}"
    echo ""
    docker-compose logs --tail=50
fi

# Opción de ver logs
echo ""
read -p "¿Deseas ver los logs en tiempo real? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker-compose logs -f
fi
