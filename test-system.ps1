# Script de prueba del sistema
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS DEL SISTEMA CRM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar servicios
Write-Host "1. Estado de servicios:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# 2. Verificar Express
Write-Host "2. Verificando Express API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get
    Write-Host "   OK - Express funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ERROR - Express no responde" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar WAHA
Write-Host "3. Verificando WAHA..." -ForegroundColor Yellow
try {
    $headers = @{ "X-Api-Key" = "a317ec51b40e4ab597fa767f7bb13e1c" }
    $session = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/default" -Headers $headers
    Write-Host "   OK - Sesion: $($session.name)" -ForegroundColor Green
    Write-Host "   Estado: $($session.status)" -ForegroundColor Gray
    
    if ($session.config.webhooks) {
        Write-Host "   Webhooks configurados:" -ForegroundColor Cyan
        foreach ($wh in $session.config.webhooks) {
            Write-Host "     - URL: $($wh.url)" -ForegroundColor Gray
            Write-Host "     - Events: $($wh.events -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ERROR - WAHA no responde" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar Workers
Write-Host "4. Verificando Workers..." -ForegroundColor Yellow
try {
    $workers = Invoke-RestMethod -Uri "http://localhost:4000/api/workers"
    Write-Host "   OK - Total workers: $($workers.total)" -ForegroundColor Green
    foreach ($w in $workers.workers) {
        Write-Host "     - $($w.name) ($($w.email))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   INFO - No hay workers registrados" -ForegroundColor Yellow
}
Write-Host ""

# 5. Instrucciones
Write-Host "================================" -ForegroundColor Cyan
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre el dashboard:" -ForegroundColor White
Write-Host "   http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Envia un mensaje de prueba desde WhatsApp" -ForegroundColor White
Write-Host ""
Write-Host "3. Ver logs en tiempo real:" -ForegroundColor White
Write-Host "   docker-compose logs -f express" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Ejecuta debug-messages.sql en Supabase" -ForegroundColor White
Write-Host "   para ver los mensajes guardados" -ForegroundColor Gray
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
