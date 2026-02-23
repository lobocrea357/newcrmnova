# Script para copiar el schema al portapapeles
Write-Host "📋 Copiando SCHEMA_COMPLETO_LIMPIO.sql al portapapeles..." -ForegroundColor Cyan

$schemaPath = Join-Path $PSScriptRoot "SCHEMA_COMPLETO_LIMPIO.sql"

if (Test-Path $schemaPath) {
    Get-Content $schemaPath -Raw | Set-Clipboard
    Write-Host "✅ ¡Schema copiado al portapapeles!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora:" -ForegroundColor Yellow
    Write-Host "1. Ve a https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Selecciona tu proyecto: cfklyrpftknzhpkzqeme" -ForegroundColor White
    Write-Host "3. Click en 'SQL Editor' > 'New Query'" -ForegroundColor White
    Write-Host "4. Presiona Ctrl+V para pegar" -ForegroundColor White
    Write-Host "5. Click en 'Run' o presiona Ctrl+Enter" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona cualquier tecla para abrir Supabase en el navegador..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Start-Process "https://supabase.com/dashboard"
} else {
    Write-Host "❌ Error: No se encontró el archivo SCHEMA_COMPLETO_LIMPIO.sql" -ForegroundColor Red
    Write-Host "Ruta buscada: $schemaPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
