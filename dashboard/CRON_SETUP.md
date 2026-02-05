# Configuración del Cron Job para Análisis Diario

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env` y a Vercel:

```env
# Cron Job Security
CRON_SECRET=tu_secreto_aleatorio_aqui_genera_uno_seguro

# OpenAI API (para análisis con IA)
OPENAI_API_KEY=tu_openai_api_key_aqui
```

## Generar CRON_SECRET

Puedes generar un secreto seguro con:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O en PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Configuración en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las siguientes variables:
   - `CRON_SECRET`: El secreto generado
   - `OPENAI_API_KEY`: Tu API key de OpenAI
   - `SUPABASE_SERVICE_ROLE_KEY`: Ya debería estar configurada

4. El archivo `vercel.json` ya está configurado para ejecutar el cron a las 00:00 (medianoche)

## Cómo Funciona

### Ejecución Automática
- **Horario**: Todos los días a las 00:00 (medianoche)
- **Endpoint**: `/api/cron/daily-performance-analysis`
- **Autenticación**: Requiere header `Authorization: Bearer ${CRON_SECRET}`

### Proceso
1. Obtiene todos los bots activos (asesores)
2. Filtra bots de prueba (Abraham, Abrahama, Paul Hernandez, etc.)
3. Para cada asesor:
   - Obtiene últimas 30 conversaciones
   - Filtra a 20 conversaciones válidas (excluye grupos, chats internos)
   - Analiza cada conversación con OpenAI GPT-4o-mini
   - Evalúa 7 métricas de rendimiento + 8 métricas de ventas
   - Calcula scores y estadísticas
   - Crea registro en `performance_analyses`
   - Guarda evaluaciones en `conversation_evaluations`
   - Crea reporte diario en `daily_sales_reports`

### Métricas Evaluadas

**Rendimiento (7 parámetros):**
- Tiempo de contacto (< 5 min)
- Tiempo de respuesta (< 2 min)
- Tiempo de cotización (< 10 min)
- Cierre con intención
- Ofrecimiento de Scalapay
- Más de 2 opciones presentadas
- Seguimiento de intención

**Ventas (8 parámetros):**
- Venta confirmada
- Lead caliente
- Cotización enviada
- Método de pago enviado
- Objeciones superadas
- Seguimiento efectivo
- Urgencia creada
- Valor agregado

## Prueba Manual

Puedes probar el endpoint manualmente:

```bash
curl -X GET https://tu-dominio.vercel.app/api/cron/daily-performance-analysis \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## Monitoreo

El endpoint retorna un JSON con:
```json
{
  "success": true,
  "message": "Análisis automático completado",
  "results": {
    "date": "2026-02-04",
    "totalAdvisors": 10,
    "analyzed": 8,
    "failed": 0,
    "skipped": 2,
    "details": [...]
  }
}
```

## Costos Estimados

**OpenAI API (GPT-4o-mini):**
- ~$0.15 por 1M tokens de entrada
- ~$0.60 por 1M tokens de salida
- Estimado por conversación: ~2000 tokens
- Costo por conversación: ~$0.002
- **Costo diario** (10 asesores × 20 conversaciones): ~$0.40/día
- **Costo mensual**: ~$12/mes

## Logs

Los logs se pueden ver en:
- Vercel Dashboard → Functions → Logs
- Busca por "daily-performance-analysis"

## Troubleshooting

### Error 401 Unauthorized
- Verifica que `CRON_SECRET` esté configurado en Vercel
- Asegúrate de que el header Authorization sea correcto

### Error 500 / Análisis fallan
- Verifica `OPENAI_API_KEY` en Vercel
- Revisa que `SUPABASE_SERVICE_ROLE_KEY` tenga permisos
- Chequea logs en Vercel para ver errores específicos

### No se ejecuta automáticamente
- Verifica que `vercel.json` esté en la raíz del proyecto dashboard
- Asegúrate de que el proyecto esté desplegado en Vercel
- Los cron jobs solo funcionan en producción, no en desarrollo
