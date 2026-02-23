# Script para configurar webhooks en WAHA

$API_KEY = "a317ec51b40e4ab597fa767f7bb13e1c"
$SESSION = "default"
$WEBHOOK_URL = "http://host.docker.internal:4000/webhooks/waha"

Write-Host "`nConfigurando webhooks en WAHA..." -ForegroundColor Yellow

# Configurar webhooks
$body = @{
    config = @{
        webhooks = @(
            @{
                url = $WEBHOOK_URL
                events = @("session.status", "message", "message.any", "message.ack", "message.reaction")
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/$SESSION" `
        -Method Put `
        -Headers @{"X-Api-Key" = $API_KEY; "Content-Type" = "application/json"} `
        -Body $body
    
    Write-Host "OK - Webhooks configurados" -ForegroundColor Green
    Write-Host "Sesion: $($response.name)" -ForegroundColor Gray
    Write-Host "Estado: $($response.status)" -ForegroundColor Gray
    
    # Reiniciar sesión
    Write-Host "`nReiniciando sesion..." -ForegroundColor Yellow
    
    # Stop
    Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/$SESSION/stop" `
        -Method Post `
        -Headers @{"X-Api-Key" = $API_KEY} | Out-Null
    
    Start-Sleep -Seconds 3
    
    # Start
    $startResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/$SESSION/start" `
        -Method Post `
        -Headers @{"X-Api-Key" = $API_KEY}
    
    Write-Host "OK - Sesion reiniciada" -ForegroundColor Green
    Write-Host "Estado: $($startResponse.status)" -ForegroundColor Gray
    
    Write-Host "`nEspera 10 segundos a que la sesion inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar configuración
    Write-Host "`nVerificando configuracion..." -ForegroundColor Yellow
    $verify = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/$SESSION" `
        -Headers @{"X-Api-Key" = $API_KEY}
    
    Write-Host "Webhooks configurados:" -ForegroundColor Cyan
    foreach ($wh in $verify.config.webhooks) {
        Write-Host "  URL: $($wh.url)" -ForegroundColor Gray
        Write-Host "  Events: $($wh.events -join ', ')" -ForegroundColor Gray
    }
    
    Write-Host "`nLISTO! Ahora envia un mensaje de prueba desde WhatsApp" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
