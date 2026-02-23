# 🎯 **Plan de Acción: Sistema de Análisis Diario Automatizado con Enfoque en Ventas**

## 📋 **Análisis del Sistema Actual vs Requerido**

### **✅ Lo que ya funciona bien:**
- Filtrado inteligente de conversaciones (IA + estructural)
- Análisis batch optimizado
- UI moderna con gráficas
- Generación automática de reportes
- Cache inteligente
- Funcionalidad manual existente

### **🔄 Lo que necesitamos mejorar/agregar:**
- **Detección específica de ventas**
- **Automatización diaria (cron)**
- **Generación de PDF**
- **Análisis enfocado en resultados comerciales**
- **Métricas de conversión**

---

## 🚀 **Plan de Implementación (4 Fases)**

### **🔵 FASE 1: Mejora del Análisis IA para Detectar Ventas** 
*Duración: 1 semana*

#### **1.1 Nuevos Parámetros de Evaluación**

Agregar a `PARAMETROS_EVALUACION`:

```javascript
// Nuevos parámetros enfocados en ventas
export const PARAMETROS_VENTAS = [
  { key: "venta_confirmada", label: "Venta Confirmada", icon: "💰" },
  { key: "lead_caliente", label: "Lead Caliente", icon: "🔥" },
  { key: "cotizacion_enviada", label: "Cotización Enviada", icon: "📊" },
  { key: "metodo_pago_enviado", label: "Método de Pago Enviado", icon: "💳" },
  { key: "seguimiento_post_cotizacion", label: "Seguimiento Post-Cotización", icon: "📞" },
  { key: "objeciones_manejadas", label: "Objeciones Bien Manejadas", icon: "🛡️" },
  { key: "urgencia_creada", label: "Urgencia/Escasez Creada", icon: "⏰" },
  { key: "valor_agregado", label: "Valor Agregado Comunicado", icon: "⭐" },
];
```

#### **1.2 Nueva Lógica de Detección de Ventas**

```javascript
// Archivo: src/lib/salesDetection.js
export const CRITERIOS_VENTAS_IA = {
  venta_confirmada: {
    descripcion: "Cliente confirma compra o reserva",
    keywords_confirmacion: [
      "confirmo", "reservo", "compro", "acepto", "perfecto", "dale", 
      "procede", "háganlo", "sí quiero", "me convence", "está bien",
      "transferencia", "pago", "depósito", "abono"
    ],
    keywords_negacion: [
      "no puedo", "no me alcanza", "muy caro", "lo pensaré", 
      "después", "más tarde", "no gracias"
    ],
    confidence_threshold: 0.8
  },
  lead_caliente: {
    descripcion: "Cliente muestra alto interés pero no confirma",
    keywords: [
      "me interesa", "me gusta", "está bueno", "qué buena opción",
      "cuándo", "cómo", "dónde", "requisitos", "condiciones",
      "presupuesto", "financiación"
    ],
    confidence_threshold: 0.7
  },
  cotizacion_enviada: {
    descripcion: "Asesor envía cotización o precios específicos",
    keywords: [
      "precio", "costo", "$", "USD", "COP", "cotización", "presupuesto",
      "paquete", "opción", "plan", "modalidad"
    ],
    debe_incluir_numero: true,
    confidence_threshold: 0.9
  }
};
```

#### **1.3 API Mejorada para Análisis de Ventas**

Crear: `src/app/api/analyze-sales/route.js`

```javascript
import OpenAI from 'openai';

export async function POST(request) {
  const { messages, contact_info } = await request.json();
  
  const salesPrompt = `Analiza esta conversación de ventas y determina:

1. ¿Se concretó una VENTA? (cliente confirmó compra/reserva)
2. ¿Es un LEAD CALIENTE? (alto interés, pidió detalles, preguntó precios)
3. ¿Se envió COTIZACIÓN? (asesor dio precios específicos)
4. ¿Se enviaron MÉTODOS DE PAGO? (transferencia, efectivo, tarjeta)
5. Valor aproximado de la venta (si aplica)
6. Errores críticos del asesor
7. Éxitos del asesor

Responde en JSON:
{
  "venta_confirmada": boolean,
  "valor_venta": number|null,
  "lead_caliente": boolean,
  "cotizacion_enviada": boolean,
  "metodo_pago_enviado": boolean,
  "errores_criticos": ["error1", "error2"],
  "exitos_asesor": ["éxito1", "éxito2"],
  "nivel_interes": "alto|medio|bajo",
  "siguiente_accion": "texto recomendación"
}`;

  // Llamada a OpenAI...
}
```

---

### **🟡 FASE 2: Sistema de Cron Automático**
*Duración: 3 días*

#### **2.1 Implementación de Cron Job**

```javascript
// Archivo: src/lib/cronJobs.js
import cron from 'node-cron';

// Ejecutar todos los días a las 24:00
export function initializeDailySalesAnalysis() {
  cron.schedule('0 0 * * *', async () => {
    console.log('🤖 Iniciando análisis diario automático...');
    
    try {
      await performDailySalesAnalysis();
      console.log('✅ Análisis diario completado');
    } catch (error) {
      console.error('❌ Error en análisis diario:', error);
      // Enviar notificación de error
    }
  }, {
    timezone: "America/Bogota"
  });
}

async function performDailySalesAnalysis() {
  // 1. Obtener todos los asesores activos
  const asesores = await getActiveAdvisors();
  
  // 2. Para cada asesor, analizar últimas 20 conversaciones
  for (const asesor of asesores) {
    const conversations = await getLastNConversations(asesor.id, 20);
    const analysis = await analyzeSalesConversations(conversations);
    
    // 3. Generar reporte y guardarlo
    await savedailyReport(asesor.id, analysis);
    
    // 4. Si hay ventas, enviar notificación
    if (analysis.total_ventas > 0) {
      await sendSalesNotification(asesor, analysis);
    }
  }
}
```

#### **2.2 Configuración en Next.js**

```javascript
// Archivo: src/app/api/cron/daily-analysis/route.js
export async function GET() {
  // Endpoint para trigger manual o webhook externo
  await performDailySalesAnalysis();
  return Response.json({ status: 'completed' });
}

// Archivo: src/app/api/cron/setup/route.js
export async function POST() {
  initializeDailySalesAnalysis();
  return Response.json({ message: 'Cron job initialized' });
}
```

---

### **🟢 FASE 3: Generación de PDF Avanzada**
*Duración: 4 días*

#### **3.1 Librería PDF y Templates**

```bash
npm install jspdf html2canvas puppeteer
```

#### **3.2 Generador de PDF**

```javascript
// Archivo: src/lib/pdfGenerator.js
import puppeteer from 'puppeteer';

export async function generateSalesReportPDF(reportData, asesorName) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; border-radius: 10px; }
            .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
            .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
            .success { color: #059669; font-weight: bold; }
            .error { color: #dc2626; font-weight: bold; }
            .sale-item { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 Reporte de Ventas Diario</h1>
            <h2>Asesor: ${asesorName}</h2>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <h3>💰 Ventas Confirmadas</h3>
                <div style="font-size: 2em; font-weight: bold; color: #059669;">
                    ${reportData.ventas_confirmadas}
                </div>
            </div>
            <div class="metric-card">
                <h3>🔥 Leads Calientes</h3>
                <div style="font-size: 2em; font-weight: bold; color: #f59e0b;">
                    ${reportData.leads_calientes}
                </div>
            </div>
            <div class="metric-card">
                <h3>💵 Valor Total</h3>
                <div style="font-size: 2em; font-weight: bold; color: #8b5cf6;">
                    $${reportData.valor_total.toLocaleString()}
                </div>
            </div>
        </div>
        
        <h2>🎯 Ventas Exitosas</h2>
        ${reportData.ventas_exitosas.map(venta => `
            <div class="sale-item">
                <h4>Cliente: ${venta.cliente}</h4>
                <p><strong>Valor:</strong> $${venta.valor.toLocaleString()}</p>
                <p><strong>Cómo lo logró:</strong></p>
                <ul>
                    ${venta.exitos.map(exito => `<li class="success">${exito}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
        
        <h2>⚠️ Oportunidades Perdidas</h2>
        ${reportData.oportunidades_perdidas.map(oportunidad => `
            <div class="sale-item" style="background: #fef2f2; border-left-color: #ef4444;">
                <h4>Cliente: ${oportunidad.cliente}</h4>
                <p><strong>Valor Estimado:</strong> $${oportunidad.valor_estimado?.toLocaleString() || 'N/A'}</p>
                <p><strong>Errores identificados:</strong></p>
                <ul>
                    ${oportunidad.errores.map(error => `<li class="error">${error}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlTemplate);
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });
  
  await browser.close();
  return pdf;
}
```

#### **3.3 API de Generación**

```javascript
// Archivo: src/app/api/generate-pdf/route.js
export async function POST(request) {
  const { reportId } = await request.json();
  
  // Obtener datos del reporte
  const reportData = await getReportData(reportId);
  
  // Generar PDF
  const pdfBuffer = await generateSalesReportPDF(reportData, reportData.asesor_name);
  
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${reportData.asesor_name}-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}
```

---

### **🟣 FASE 4: Mejoras de UI y Dashboard**
*Duración: 5 días*

#### **4.1 Nuevos Componentes de Ventas**

```javascript
// Archivo: src/components/ventas/SalesMetricsCard.jsx
export default function SalesMetricsCard({ metrics, asesorName }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Métricas de Ventas - {asesorName}
        </h3>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-ES')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricItem 
          label="Ventas Confirmadas" 
          value={metrics.ventas_confirmadas}
          color="green"
          icon="💰"
        />
        <MetricItem 
          label="Leads Calientes" 
          value={metrics.leads_calientes}
          color="orange"
          icon="🔥"
        />
        <MetricItem 
          label="Cotizaciones Enviadas" 
          value={metrics.cotizaciones_enviadas}
          color="blue"
          icon="📊"
        />
        <MetricItem 
          label="Valor Total" 
          value={`$${metrics.valor_total.toLocaleString()}`}
          color="purple"
          icon="💵"
        />
      </div>
    </div>
  );
}
```

#### **4.2 Dashboard de Ventas Mejorado**

```javascript
// Archivo: src/app/(crm)/rendimiento/ventas/page.js
export default function VentasPage() {
  const [reportes, setReportes] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState(null);
  const [dateRange, setDateRange] = useState('today');
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con controles */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">📊 Dashboard de Ventas</h1>
            <div className="flex gap-3">
              <button 
                onClick={triggerManualAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔄 Análisis Manual
              </button>
              <button 
                onClick={downloadPDFReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Descargar PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Métricas globales */}
        <GlobalSalesMetrics data={globalMetrics} />
        
        {/* Lista de asesores con métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportes.map(reporte => (
            <SalesMetricsCard 
              key={reporte.id}
              metrics={reporte.metrics}
              asesorName={reporte.asesor_name}
              onClick={() => setSelectedAsesor(reporte)}
            />
          ))}
        </div>
        
        {/* Modal de detalle */}
        {selectedAsesor && (
          <SalesDetailModal 
            reporte={selectedAsesor}
            onClose={() => setSelectedAsesor(null)}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 📊 **Nueva Estructura de Base de Datos**

### **Tabla: daily_sales_reports**

```sql
CREATE TABLE daily_sales_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id UUID NOT NULL,
    worker_id UUID,
    report_date DATE NOT NULL,
    
    -- Métricas de ventas
    ventas_confirmadas INTEGER DEFAULT 0,
    leads_calientes INTEGER DEFAULT 0,
    cotizaciones_enviadas INTEGER DEFAULT 0,
    valor_total_ventas DECIMAL(15,2) DEFAULT 0,
    
    -- Análisis detallado
    conversaciones_analizadas INTEGER DEFAULT 0,
    ventas_exitosas JSONB DEFAULT '[]',
    oportunidades_perdidas JSONB DEFAULT '[]',
    
    -- Métricas de rendimiento
    tasa_conversion DECIMAL(5,2) DEFAULT 0,
    valor_promedio_venta DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(asesor_id, report_date)
);
```

### **Tabla: sales_conversations**

```sql
CREATE TABLE sales_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_sales_reports(id),
    conversation_id UUID NOT NULL,
    contact_name TEXT,
    contact_number TEXT,
    
    -- Resultado de venta
    venta_confirmada BOOLEAN DEFAULT FALSE,
    lead_caliente BOOLEAN DEFAULT FALSE,
    valor_venta DECIMAL(15,2),
    
    -- Análisis IA
    exitos_asesor TEXT[],
    errores_criticos TEXT[],
    siguiente_accion TEXT,
    confidence_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **Funcionalidades Clave del Sistema Mejorado**

### **✅ Análisis Automático Diario**
- Cron job a las 24:00
- Análisis de últimas 20 conversaciones por asesor
- Detección automática de ventas y leads

### **✅ Detección Inteligente de Ventas**
- IA especializada en identificar confirmaciones de compra
- Extracción de valor de venta
- Clasificación de nivel de interés

### **✅ Reportes PDF Profesionales**
- Diseño moderno con métricas visuales
- Sección de éxitos detallados
- Análisis de oportunidades perdidas
- Descarga automática

### **✅ Dashboard de Ventas**
- Vista en tiempo real de métricas
- Comparación entre asesores
- Filtros por fecha y equipo
- Análisis manual bajo demanda

### **✅ Notificaciones Inteligentes**
- Alertas por ventas confirmadas
- Reportes automáticos por email
- Métricas de rendimiento crítico

---

## 📅 **Cronograma de Implementación**

| Semana | Fase | Entregables |
|--------|------|-------------|
| 1 | Análisis IA Ventas | APIs de detección, nuevos parámetros |
| 2 | Sistema Cron | Automatización diaria, triggers |
| 3 | Generación PDF | Templates, descarga automática |
| 4 | UI Dashboard | Componentes visuales, navegación |
| 5 | Testing & Deploy | Pruebas, optimización, producción |

---

## 🔧 **Comandos de Implementación**

### **Instalar dependencias**
```bash
cd crmnovabots/dashboard
npm install node-cron jspdf html2canvas puppeteer
```

### **Ejecutar migraciones**
```bash
# En Supabase SQL Editor
-- Ejecutar scripts de creación de tablas
```

### **Configurar cron**
```javascript
// En src/app/layout.js o middleware
if (process.env.NODE_ENV === 'production') {
  initializeDailySalesAnalysis();
}
```

### **Testing**
```bash
# Test manual del análisis
npm run test:sales-analysis

# Test de generación PDF
npm run test:pdf-generation
```

---

## 🎊 **Resultado Final**

Con esta implementación tendrás:

1. **🤖 Sistema 100% automático** que analiza diariamente a las 24:00
2. **📊 Detección precisa de ventas** con IA especializada
3. **📄 PDFs profesionales** con éxitos y errores detallados
4. **🎯 Dashboard moderno** con métricas en tiempo real
5. **📱 Funcionalidad manual** para análisis específicos
6. **🔔 Notificaciones inteligentes** de resultados

**Mantienes toda la UI actual + nuevas funcionalidades enfocadas en ventas reales.**

El sistema transformará completamente la gestión de rendimiento de tu equipo, proporcionando insights accionables y automatizando el seguimiento diario de resultados comerciales.

¿Te parece bien este enfoque? ¿Hay algún aspecto específico que quisieras ajustar o profundizar?