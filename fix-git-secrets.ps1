# ============================================
# CORREGIR COMMIT CON SECRETOS
# ============================================

Write-Host "🔒 Corrigiendo commit con secretos..." -ForegroundColor Yellow

# 1. Eliminar .env del tracking de git
Write-Host "`n1️⃣ Eliminando .env del tracking..." -ForegroundColor Cyan
git rm --cached .env

# 2. Verificar que .gitignore tiene .env
Write-Host "`n2️⃣ Verificando .gitignore..." -ForegroundColor Cyan
if (Select-String -Path .gitignore -Pattern "^\.env$" -Quiet) {
    Write-Host "✅ .env ya está en .gitignore" -ForegroundColor Green
} else {
    Write-Host "❌ .env NO está en .gitignore" -ForegroundColor Red
    exit 1
}

# 3. Hacer nuevo commit
Write-Host "`n3️⃣ Creando nuevo commit..." -ForegroundColor Cyan
git add .gitignore
git commit -m "fix: remove .env from tracking and add to .gitignore"

# 4. Forzar push (reescribir historia)
Write-Host "`n4️⃣ Forzando push..." -ForegroundColor Cyan
Write-Host "⚠️  ADVERTENCIA: Esto reescribirá la historia del repositorio" -ForegroundColor Yellow
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -eq "s") {
    git push -f origin main
    Write-Host "`n✅ ¡Listo! El .env ya no está en el repositorio" -ForegroundColor Green
} else {
    Write-Host "`n❌ Operación cancelada" -ForegroundColor Red
}

Write-Host "`n📝 IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. El archivo .env sigue en tu máquina local (no se borra)" -ForegroundColor White
Write-Host "2. En el VPS, deberás crear el .env manualmente con tus secretos" -ForegroundColor White
Write-Host "3. Usa .env.example como referencia" -ForegroundColor White
