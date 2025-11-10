# Script de Prueba Completa del Sistema
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA COMPLETA DEL SISTEMA CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar servicios
Write-Host "1. SERVICIOS DOCKER" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# 2. Verificar Express
Write-Host "2. EXPRESS API" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "   Status: ERROR" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar WAHA
Write-Host "3. WAHA SESSION" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
try {
    $headers = @{ "X-Api-Key" = "a317ec51b40e4ab597fa767f7bb13e1c" }
    $session = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/default" -Headers $headers
    Write-Host "   Session: $($session.name)" -ForegroundColor Green
    Write-Host "   Status: $($session.status)" -ForegroundColor $(if ($session.status -eq "WORKING") { "Green" } else { "Yellow" })
    
    if ($session.config.webhooks) {
        Write-Host "   Webhooks:" -ForegroundColor Cyan
        foreach ($wh in $session.config.webhooks) {
            Write-Host "     - URL: $($wh.url)" -ForegroundColor Gray
            Write-Host "       Events: $($wh.events -join ', ')" -ForegroundColor Gray
        }
    } else {
        Write-Host "   Webhooks: NO CONFIGURADOS" -ForegroundColor Red
    }
} catch {
    Write-Host "   Status: ERROR" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar Dashboard
Write-Host "4. DASHBOARD" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   Status: OK" -ForegroundColor Green
        Write-Host "   URL: http://localhost:3001" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Status: ERROR" -ForegroundColor Red
}
Write-Host ""

# 5. Instrucciones de Prueba
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTRUCCIONES DE PRUEBA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1: Verificar Bucket de Supabase" -ForegroundColor Yellow
Write-Host "  1. Abre Supabase SQL Editor" -ForegroundColor White
Write-Host "  2. Ejecuta: verify-supabase-storage.sql" -ForegroundColor Cyan
Write-Host "  3. Si el bucket no existe, crealo" -ForegroundColor Gray
Write-Host ""

Write-Host "PASO 2: Enviar Mensaje de Texto" -ForegroundColor Yellow
Write-Host "  1. Envia 'Hola' desde WhatsApp al bot (584122330928)" -ForegroundColor White
Write-Host "  2. Responde 'Hola de vuelta' desde WhatsApp" -ForegroundColor White
Write-Host ""

Write-Host "PASO 3: Verificar en Logs" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f express | Select-String 'PROCESANDO MENSAJE'" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Debes ver:" -ForegroundColor Gray
Write-Host "    - fromMe: false (mensaje entrante)" -ForegroundColor Gray
Write-Host "    - fromMe: true (mensaje saliente)" -ForegroundColor Gray
Write-Host ""

Write-Host "PASO 4: Enviar Imagen" -ForegroundColor Yellow
Write-Host "  1. Envia una imagen desde WhatsApp" -ForegroundColor White
Write-Host "  2. Verifica en logs:" -ForegroundColor White
Write-Host "     - Descargando desde WAHA" -ForegroundColor Gray
Write-Host "     - Subiendo a Supabase Storage" -ForegroundColor Gray
Write-Host "     - Archivo subido" -ForegroundColor Gray
Write-Host ""

Write-Host "PASO 5: Verificar en Base de Datos" -ForegroundColor Yellow
Write-Host "  1. Ejecuta: debug-messages-fixed.sql" -ForegroundColor Cyan
Write-Host "  2. Verifica:" -ForegroundColor White
Write-Host "     - Mensajes con from_me = true y false" -ForegroundColor Gray
Write-Host "     - Archivos en media_files con file_url" -ForegroundColor Gray
Write-Host ""

Write-Host "PASO 6: Verificar en Dashboard" -ForegroundColor Yellow
Write-Host "  1. Abre: http://localhost:3001" -ForegroundColor Cyan
Write-Host "  2. Navega a un chat" -ForegroundColor White
Write-Host "  3. Verifica:" -ForegroundColor White
Write-Host "     - Mensajes entrantes (blanco con borde)" -ForegroundColor Gray
Write-Host "     - Mensajes salientes (azul gradiente)" -ForegroundColor Gray
Write-Host "     - Imagenes se cargan correctamente" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMANDOS UTILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f express" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reiniciar servicios:" -ForegroundColor Yellow
Write-Host "  docker-compose restart" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver estado:" -ForegroundColor Yellow
Write-Host "  docker-compose ps" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configurar webhooks:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File configure-waha-webhooks.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
