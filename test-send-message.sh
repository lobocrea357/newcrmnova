#!/bin/bash

# Script para enviar un mensaje de prueba y verificar que se captura

API_KEY="${WAHA_API_KEY:-your_api_key_here}"
SESSION="default"
PHONE="584121234567"  # Cambia por un número real
MESSAGE="Mensaje de prueba desde el script - $(date)"

echo "📤 Enviando mensaje de prueba..."
echo "Sesión: $SESSION"
echo "Destino: $PHONE"
echo "Mensaje: $MESSAGE"
echo ""

# Enviar mensaje
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/sendText" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d "{
    \"session\": \"$SESSION\",
    \"chatId\": \"$PHONE@c.us\",
    \"text\": \"$MESSAGE\"
  }")

echo "Respuesta de WAHA:"
echo "$RESPONSE" | jq '.'

# Esperar un momento para que se procese
echo ""
echo "⏳ Esperando 3 segundos para que se procese..."
sleep 3

# Verificar en la base de datos (necesitas tener psql o usar Supabase)
echo ""
echo "✅ Verifica en la base de datos:"
echo "   SELECT * FROM messages WHERE from_me = true ORDER BY timestamp DESC LIMIT 5;"
echo ""
echo "📊 O verifica en el dashboard:"
echo "   http://localhost:3001"
