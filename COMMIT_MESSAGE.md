fix: corrección crítica en cotizaciones y renderizado de imágenes

🔥 **CAMBIOS PRINCIPALES:**

## 📝 Cotizaciones
- ✅ Edición completa: carga tipo_vuelo, aerolínea, pasajeros, fees, equipajes, escalas
- ✅ Estado inicial: nuevas cotizaciones se crean como "EN_REVISION"
- ✅ Botones simplificados: solo "Aprobar" y "Rechazar" (eliminado "Marcar en Revisión")
- ✅ Bug corregido: botones desaparecen correctamente al cambiar estado

## 🖼️ Imágenes en Vuelos
- ✅ Identificado problema: bucket "vuelos-adjuntos" sin RLS público
- ✅ Script SQL creado para configurar bucket público
- 📋 **REQUIRE EJECUTAR:** fix_vuelos_adjuntos_storage_public.sql en Supabase

## 📚 Tutoriales Implementados
- ✅ TutorialCotizaciones: guía para vista de cotizaciones
- ✅ TutorialVuelos: guía para formulario de vuelos  
- ✅ HeroTutorial actualizado con nueva información

## 📁 Archivos Modificados
- `cotizador/CotizadorForm.jsx` - edición completa
- `cotizaciones/CotizacionDetail.jsx` - botones simplificados
- `cotizaciones/page.jsx` - actualización estado
- `vuelos/VueloDetail.jsx` - imágenes directas
- `admin/confirmar-pagos/page.jsx` - imágenes directas
- `cotizacionesService.js` - estado EN_REVISION

## 📁 Archivos Nuevos
- `cotizaciones/TutorialCotizaciones.jsx`
- `vuelos/TutorialVuelos.jsx`
- `migrations/fix_vuelos_adjuntos_storage_public.sql`
- `migrations/README_EJECUTAR_FIX_IMAGENES.md`

## 🚀 Impacto
- Edición de cotizaciones: 100% funcional
- Renderizado de imágenes: requiere ejecución SQL
- UX mejorada con tutoriales
- Botones actualizan correctamente

⚠️ **IMPORTANTE:** Ejecutar script SQL en Supabase para que las imágenes funcionen.
