# Script para monitorear logs en tiempo real
Write-Host "Monitoreando logs de Express..." -ForegroundColor Cyan
Write-Host "Envía una imagen desde WhatsApp AHORA" -ForegroundColor Yellow
Write-Host ""

docker-compose logs -f express
