# Script para iniciar el dashboard CRM
Write-Host "🚀 Iniciando Dashboard CRM..." -ForegroundColor Cyan

$dashboardPath = Join-Path $PSScriptRoot "dashboard"

if (Test-Path $dashboardPath) {
    Set-Location $dashboardPath
    
    Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "⚠️  No se encontraron dependencias. Instalando..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host ""
    Write-Host "✅ Iniciando servidor de desarrollo..." -ForegroundColor Green
    Write-Host ""
    Write-Host "El dashboard estará disponible en:" -ForegroundColor Cyan
    Write-Host "http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Credenciales de acceso:" -ForegroundColor Yellow
    Write-Host "Admin:" -ForegroundColor White
    Write-Host "  Email: admin@novapolointranet.xyz" -ForegroundColor Gray
    Write-Host "  Password: (la que configuraste)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Worker:" -ForegroundColor White
    Write-Host "  Email: Moisesnova923@gmail.com" -ForegroundColor Gray
    Write-Host "  Password: (la que configuraste)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
    Write-Host ""
    
    npm run dev
} else {
    Write-Host "❌ Error: No se encontró la carpeta dashboard" -ForegroundColor Red
    Write-Host "Ruta buscada: $dashboardPath" -ForegroundColor Yellow
}
