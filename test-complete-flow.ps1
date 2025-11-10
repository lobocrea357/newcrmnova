# Script de prueba completo para verificar el flujo de mensajes

Write-Host "`n🧪 INICIANDO PRUEBAS COMPLETAS`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Variables
$API_KEY = "a317ec51b40e4ab597fa767f7bb13e1c"
$SESSION = "default"
$BASE_URL = "http://localhost:3000"
$EXPRESS_URL = "http://localhost:4000"

# 1. Verificar que los servicios estén corriendo
Write-Host "`n📊 1. Verificando servicios..." -ForegroundColor Yellow
docker-compose ps

# 2. Verificar salud de Express
Write-Host "`n💚 2. Verificando salud de Express..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$EXPRESS_URL/health" -Method Get
    Write-Host "   ✅ Express está funcionando" -ForegroundColor Green
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Express no responde" -ForegroundColor Red
    exit 1
}

# 3. Verificar estado de la sesión en WAHA
Write-Host "`n📱 3. Verificando sesión en WAHA..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
    }
    $session = Invoke-RestMethod -Uri "$BASE_URL/api/sessions/$SESSION" -Method Get -Headers $headers
    Write-Host "   ✅ Sesión: $($session.name)" -ForegroundColor Green
    Write-Host "   Estado: $($session.status)" -ForegroundColor Gray
    Write-Host "   Engine: $($session.config.engine)" -ForegroundColor Gray
    
    # Verificar webhooks configurados
    if ($session.config.webhooks) {
        Write-Host "`n   📡 Webhooks configurados:" -ForegroundColor Cyan
        foreach ($webhook in $session.config.webhooks) {
            Write-Host "      URL: $($webhook.url)" -ForegroundColor Gray
            Write-Host "      Events: $($webhook.events -join ', ')" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No hay webhooks configurados" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error al obtener sesión: $_" -ForegroundColor Red
}

# 4. Verificar workers en la API
Write-Host "`n👷 4. Verificando workers..." -ForegroundColor Yellow
try {
    $workers = Invoke-RestMethod -Uri "$EXPRESS_URL/api/workers" -Method Get
    Write-Host "   ✅ Total de workers: $($workers.total)" -ForegroundColor Green
    foreach ($worker in $workers.workers) {
        Write-Host "      - $($worker.name) ($($worker.email)) - $($worker.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  No hay workers registrados aún" -ForegroundColor Yellow
}

# 5. Verificar mensajes en la base de datos
Write-Host "`n💬 5. Para verificar mensajes en Supabase:" -ForegroundColor Yellow
Write-Host "   Ejecuta este SQL en Supabase SQL Editor:" -ForegroundColor Gray
Write-Host @"
   
   -- Ver últimos 10 mensajes
   SELECT 
       message_id,
       from_me,
       from_number,
       to_number,
       body,
       type,
       timestamp
   FROM messages 
   ORDER BY timestamp DESC 
   LIMIT 10;
   
   -- Contar mensajes por tipo
   SELECT 
       from_me,
       COUNT(*) as total
   FROM messages
   GROUP BY from_me;
"@ -ForegroundColor DarkGray

# 6. Instrucciones para prueba manual
Write-Host "`n🧪 6. PRUEBA MANUAL:" -ForegroundColor Yellow
Write-Host "   a) Abre WhatsApp Web o la app" -ForegroundColor Gray
Write-Host "   b) Envía un mensaje a tu bot (número: 584122330928)" -ForegroundColor Gray
Write-Host "   c) Responde desde WhatsApp" -ForegroundColor Gray
Write-Host "   d) Verifica en el dashboard: http://localhost:3001" -ForegroundColor Gray

# 7. Ver logs en tiempo real
Write-Host "`n📋 7. Para ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   " -NoNewline
Write-Host "docker-compose logs -f express | Select-String '📨'" -ForegroundColor White
Write-Host "   (Presiona Ctrl+C para detener)" -ForegroundColor DarkGray

# 8. Accesos rápidos
Write-Host "`n🔗 8. ACCESOS RÁPIDOS:" -ForegroundColor Yellow
Write-Host "   Dashboard:     http://localhost:3001" -ForegroundColor Cyan
Write-Host "   WAHA:          http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "   Express API:   http://localhost:4000" -ForegroundColor Cyan
Write-Host "   Health Check:  http://localhost:4000/health" -ForegroundColor Cyan

# 9. Comandos útiles
Write-Host "`n⚡ 9. COMANDOS ÚTILES:" -ForegroundColor Yellow
Write-Host "   Ver logs Express:   " -NoNewline -ForegroundColor Gray
Write-Host "docker-compose logs -f express" -ForegroundColor White
Write-Host "   Ver logs WAHA:      " -NoNewline -ForegroundColor Gray
Write-Host "docker-compose logs -f waha" -ForegroundColor White
Write-Host "   Ver logs Dashboard: " -NoNewline -ForegroundColor Gray
Write-Host "docker-compose logs -f dashboard" -ForegroundColor White
Write-Host "   Reiniciar todo:     " -NoNewline -ForegroundColor Gray
Write-Host "docker-compose restart" -ForegroundColor White

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ VERIFICACIÓN COMPLETA`n" -ForegroundColor Green
