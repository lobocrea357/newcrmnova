#!/bin/bash

# Script de prueba de sincronización completa
# Uso: ./test-sync.sh [SESSION_NAME]

SESSION_NAME=${1:-"nova_colombia_moises"}
API_URL="http://localhost:4000"

echo "🚀 Iniciando prueba de sincronización completa"
echo "📱 Sesión: $SESSION_NAME"
echo "🔗 API: $API_URL"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Health check
echo "1️⃣ Verificando que el servidor esté activo..."
curl -s "$API_URL/health" > /dev/null
show_result $? "Servidor respondiendo"
echo ""

# 2. Sincronizar contactos
echo "2️⃣ Sincronizando contactos..."
CONTACTS_RESPONSE=$(curl -s -X POST "$API_URL/api/sync/$SESSION_NAME/contacts")
echo "$CONTACTS_RESPONSE" | jq '.'
show_result $? "Contactos sincronizados"
echo ""

# 3. Sincronizar chats
echo "3️⃣ Sincronizando chats..."
CHATS_RESPONSE=$(curl -s -X POST "$API_URL/api/sync/$SESSION_NAME/chats")
echo "$CHATS_RESPONSE" | jq '.'
show_result $? "Chats sincronizados"
echo ""

# 4. Sincronizar mensajes (primeros 50 de cada chat)
echo "4️⃣ Sincronizando mensajes históricos..."
echo -e "${YELLOW}⚠️  Esto puede tomar varios minutos...${NC}"
MESSAGES_RESPONSE=$(curl -s -X POST "$API_URL/api/full-sync/$SESSION_NAME/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50,
    "includeMedia": true,
    "transcribeAudio": true
  }')
echo "$MESSAGES_RESPONSE" | jq '.'
show_result $? "Mensajes sincronizados"
echo ""

# 5. Resumen
echo "📊 Resumen de sincronización:"
echo "$MESSAGES_RESPONSE" | jq -r '.data | "   • Chats procesados: \(.chats // 0)\n   • Mensajes guardados: \(.messages // 0)\n   • Archivos multimedia: \(.media // 0)\n   • Errores: \(.errors // 0)"'
echo ""

echo -e "${GREEN}✅ Sincronización completa finalizada${NC}"
echo ""
echo "🌐 Puedes ver los resultados en:"
echo "   Dashboard: http://localhost:3001/dashboard"
echo "   API: $API_URL/api/messages/bot/[BOT_ID]"
