# Script para detener CRM WhatsApp Bot
# Ejecutar con: .\stop.ps1

Write-Host "🛑 Deteniendo CRM WhatsApp Bot..." -ForegroundColor Yellow
Write-Host ""

# Verificar que Docker está corriendo
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Error: Docker no está corriendo" -ForegroundColor Red
    exit 1
}

# Mostrar estado actual
Write-Host "📊 Estado actual de los contenedores:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Preguntar si desea eliminar volúmenes
Write-Host "⚠️  ¿Deseas eliminar también los volúmenes (datos de WAHA)?" -ForegroundColor Yellow
Write-Host "   Esto borrará todas las sesiones y archivos multimedia guardados" -ForegroundColor Yellow
$deleteVolumes = Read-Host "Eliminar volúmenes? (s/n)"

Write-Host ""
Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Cyan

if ($deleteVolumes -eq "s" -or $deleteVolumes -eq "S") {
    docker-compose down -v
    Write-Host "✅ Servicios detenidos y volúmenes eliminados" -ForegroundColor Green
} else {
    docker-compose down
    Write-Host "✅ Servicios detenidos (volúmenes preservados)" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Estado final:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""
Write-Host "✨ Servicios detenidos correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para volver a iniciar, ejecuta: .\start.ps1" -ForegroundColor Yellow
Write-Host ""
