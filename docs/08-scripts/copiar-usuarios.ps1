# Script para copiar el script de usuarios al portapapeles
Write-Host "📋 Copiando INSERTAR_USUARIOS_Y_DATOS.sql al portapapeles..." -ForegroundColor Cyan

$usuariosPath = Join-Path $PSScriptRoot "INSERTAR_USUARIOS_Y_DATOS.sql"

if (Test-Path $usuariosPath) {
    Get-Content $usuariosPath -Raw | Set-Clipboard
    Write-Host "✅ ¡Script de usuarios copiado al portapapeles!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Primero debes crear los usuarios en Supabase Auth" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Yellow
    Write-Host "1. Ve a Supabase Dashboard > Authentication > Users" -ForegroundColor White
    Write-Host "2. Click en 'Add User'" -ForegroundColor White
    Write-Host "   - Email: admin@novapolointranet.xyz" -ForegroundColor White
    Write-Host "   - Password: (elige una contraseña)" -ForegroundColor White
    Write-Host "   - Auto Confirm User: ✓" -ForegroundColor White
    Write-Host "3. Click en 'Add User' nuevamente" -ForegroundColor White
    Write-Host "   - Email: Moisesnova923@gmail.com" -ForegroundColor White
    Write-Host "   - Password: (elige una contraseña)" -ForegroundColor White
    Write-Host "   - Auto Confirm User: ✓" -ForegroundColor White
    Write-Host ""
    Write-Host "Después de crear los usuarios:" -ForegroundColor Cyan
    Write-Host "1. Ve a SQL Editor > New Query" -ForegroundColor White
    Write-Host "2. Presiona Ctrl+V para pegar" -ForegroundColor White
    Write-Host "3. Click en 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona cualquier tecla para abrir Supabase en el navegador..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Start-Process "https://supabase.com/dashboard"
} else {
    Write-Host "❌ Error: No se encontró el archivo INSERTAR_USUARIOS_Y_DATOS.sql" -ForegroundColor Red
    Write-Host "Ruta buscada: $usuariosPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
