# Script de inicio rápido para CRM WhatsApp Bot
# Ejecutar con: .\start.ps1

Write-Host "🚀 Iniciando CRM WhatsApp Bot..." -ForegroundColor Green
Write-Host ""

# Verificar que Docker está corriendo
Write-Host "📋 Verificando Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker no está instalado o no está corriendo" -ForegroundColor Red
    Write-Host "   Por favor instala Docker Desktop y asegúrate de que esté corriendo" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe el archivo .env
Write-Host ""
Write-Host "📋 Verificando archivo .env..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "   Copia .env.example a .env y configura tus credenciales" -ForegroundColor Yellow
    Write-Host "   Comando: Copy-Item .env.example .env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Verificar que existen las credenciales de Supabase
Write-Host ""
Write-Host "📋 Verificando credenciales de Supabase..." -ForegroundColor Cyan
$envContent = Get-Content .env -Raw
if ($envContent -match "your_service_role_key" -or $envContent -match "your-project.supabase.co") {
    Write-Host "⚠️  Advertencia: Parece que no has configurado las credenciales de Supabase" -ForegroundColor Yellow
    Write-Host "   Por favor edita el archivo .env con tus credenciales reales" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar de todas formas? (s/n)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
}
Write-Host "✅ Credenciales configuradas" -ForegroundColor Green

# Detener contenedores existentes si los hay
Write-Host ""
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Cyan
docker-compose down 2>$null
Write-Host "✅ Contenedores detenidos" -ForegroundColor Green

# Construir y levantar los servicios
Write-Host ""
Write-Host "🏗️  Construyendo y levantando servicios..." -ForegroundColor Cyan
Write-Host "   Esto puede tomar unos minutos la primera vez..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Servicios iniciados correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📊 SERVICIOS DISPONIBLES" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 WAHA Dashboard:" -ForegroundColor Yellow
    Write-Host "   URL: http://localhost:3000/dashboard" -ForegroundColor White
    Write-Host "   Usuario: admin" -ForegroundColor White
    
    # Leer la contraseña del .env
    $password = (Get-Content .env | Select-String "WAHA_DASHBOARD_PASSWORD=").ToString().Split("=")[1]
    Write-Host "   Contraseña: $password" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📡 WAHA API:" -ForegroundColor Yellow
    Write-Host "   URL: http://localhost:3000" -ForegroundColor White
    Write-Host "   Swagger: http://localhost:3000/swagger" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🚀 Express API:" -ForegroundColor Yellow
    Write-Host "   URL: http://localhost:4000" -ForegroundColor White
    Write-Host "   Health: http://localhost:4000/health" -ForegroundColor White
    Write-Host "   Stats: http://localhost:4000/api/dashboard/stats" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📊 CRM Dashboard:" -ForegroundColor Yellow
    Write-Host "   URL: http://localhost:3001" -ForegroundColor White
    Write-Host "   Login con credenciales de Supabase Auth" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 COMANDOS ÚTILES:" -ForegroundColor Cyan
    Write-Host "   Ver logs:        docker-compose logs -f" -ForegroundColor White
    Write-Host "   Detener:         docker-compose stop" -ForegroundColor White
    Write-Host "   Reiniciar:       docker-compose restart" -ForegroundColor White
    Write-Host "   Estado:          docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Ver guías completas en README.md y DOCKER-GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    
    # Esperar un momento y verificar el estado
    Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "📊 Estado de los contenedores:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "✨ ¡Todo listo! Puedes empezar a usar el sistema." -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Error al iniciar los servicios" -ForegroundColor Red
    Write-Host "   Revisa los logs con: docker-compose logs" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
