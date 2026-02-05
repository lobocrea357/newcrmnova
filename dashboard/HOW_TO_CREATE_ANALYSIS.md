# Guía: Cómo Crear un Análisis de Rendimiento Correctamente

## Problema Actual

Los análisis están apareciendo como "Pendientes" con "0 conversaciones" porque:
1. El análisis se crea en la base de datos
2. Pero las evaluaciones NO se guardan correctamente
3. Sin evaluaciones, no se puede generar el reporte

## Solución: Crear Nuevo Análisis Correctamente

### Opción 1: Análisis Manual Individual (Recomendado para Probar)

1. Ve a `/rendimiento/new`
2. Selecciona un asesor (bot)
3. Click en "Cargar Conversaciones"
4. Espera a que carguen las conversaciones
5. Click en "Analizar con IA" o "Guardar Análisis"
6. **IMPORTANTE**: Verifica en la consola del navegador (F12) que:
   - ✅ Se crean las evaluaciones
   - ✅ Se guarda el análisis
   - ✅ Se genera el reporte

### Opción 2: Análisis Masivo

1. Ve a `/rendimiento/new`
2. Click en "Análisis Masivo"
3. Confirma la acción
4. Espera a que procese todos los asesores
5. Verifica que cada asesor muestre:
   - Número de conversaciones analizadas
   - Score promedio
   - Estado "Completado"

## Verificar que Funcionó

### En la Aplicación

1. Ve a `/rendimiento/reportes`
2. Deberías ver el análisis con:
   - ✅ Número de conversaciones > 0
   - ✅ Score visible (no 0/7)
   - ✅ Porcentaje visible (no 0%)
   - ✅ Estado "Reporte generado" (verde)

### En Supabase

Ejecuta este SQL para verificar:

\`\`\`sql
-- Ver último análisis con sus evaluaciones
SELECT 
    pa.id,
    pa.analysis_name,
    pa.total_conversations_analyzed,
    COUNT(ce.id) as evaluations_saved,
    pa.average_percentage,
    pa.created_at
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id, pa.analysis_name, pa.total_conversations_analyzed, pa.average_percentage, pa.created_at
ORDER BY pa.created_at DESC
LIMIT 5;
\`\`\`

Debe mostrar:
- `total_conversations_analyzed` > 0
- `evaluations_saved` > 0 (mismo número que conversations_analyzed)

## Limpiar Análisis Huérfanos

Si tienes análisis "Pendientes" sin evaluaciones:

1. Ejecuta `CLEANUP_ORPHAN_ANALYSES.sql` en Supabase
2. Revisa la lista de análisis huérfanos
3. Si quieres eliminarlos, descomenta la sección de DELETE
4. Ejecuta nuevamente

## Troubleshooting

### Error: "No se encontraron evaluaciones"

**Causa**: El análisis se creó pero las evaluaciones no se guardaron

**Solución**:
1. Elimina el análisis huérfano (usa script de cleanup)
2. Crea un nuevo análisis
3. Verifica en consola que `saveMultipleEvaluations` se ejecute sin errores

### Error: "Could not find table"

**Causa**: Cache de PostgREST no actualizado

**Solución**:
1. Ejecuta `REFRESH_SCHEMA_CACHE.sql`
2. Reinicia el servidor Next.js
3. Espera 1-2 minutos

### Las conversaciones no cargan

**Causa**: No hay chats para el bot seleccionado

**Solución**:
1. Verifica que el bot tenga conversaciones en la tabla `chats`
2. Verifica que los chats tengan mensajes en la tabla `messages`
3. Prueba con otro asesor

## Próximos Pasos

1. ✅ Ejecuta `REFRESH_SCHEMA_CACHE.sql` en Supabase
2. ✅ Reinicia el servidor Next.js (`Ctrl+C` y `npm run dev`)
3. ✅ Ejecuta `CLEANUP_ORPHAN_ANALYSES.sql` para ver análisis huérfanos
4. ✅ Crea un nuevo análisis en `/rendimiento/new`
5. ✅ Verifica que aparezca con evaluaciones en `/rendimiento/reportes`
6. ✅ Genera el reporte

Si todo funciona, el sistema estará listo para la Fase 2 (Automatización Diaria).
