# 📊 Sistema Completo de Cotización, Monedas y Tasas

## 🎯 **Visión General**

El sistema de cotización de Viajes Nova es una plataforma integral que permite:
- **Cotización inteligente** de vuelos con conversión automática de monedas
- **Gestión completa** de monedas y tasas de cambio
- **Interfaz intuitiva** con feedback visual en tiempo real
- **Integración total** entre componentes de gestión y calculadora

---

## 🧮 **Sistema de Cotización (CotizadorForm.jsx)**

### 🎨 **Características Principales**

#### **🔄 Cálculo Automático**
- **Sin botón "Calcular"**: El cálculo se realiza automáticamente al ingresar datos
- **Debounce de 300ms**: Evita cálculos excesivos mientras el usuario escribe
- **Conversión inteligente**: Detecta automáticamente monedas según método de pago

#### **💱 Sistema de Monedas**
- **Moneda Base (FIJO)**: USD y EUR únicamente
- **Moneda Destino (DINÁMICO)**: Desde base de datos, solo monedas con tasas
- **Opción por defecto**: "Seleccione la moneda en la que desea cotizar"

#### **🎯 Flujo de Usuario**
1. **Ingresar precio** + fees de emisión y agencia
2. **Seleccionar moneda base** (USD/EUR)
3. **Seleccionar moneda destino** (dinámico desde DB)
4. **Configurar vuelo**: tipo, fechas, equipaje, método de pago
5. **Resultado automático**: Conversión + recargos + impuestos
6. **Exportar PDF**: Cotización profesional lista para enviar

### 🛠️ **Componentes Técnicos**

#### **📋 Estados Principales**
```javascript
// Sistema inteligente
const [monedaPrecio, setMonedaPrecio] = useState('USD')
const [monedaCotizacion, setMonedaCotizacion] = useState('USD')
const [tasaCambio, setTasaCambio] = useState('1.0')
const [resultadoConversion, setResultadoConversion] = useState(null)

// Monedas dinámicas desde DB
const [monedasDB, setMonedasDB] = useState([])
const [tasasDB, setTasasDB] = useState([])
const [loadingMonedas, setLoadingMonedas] = useState(true)

// Variables de formulario
const [precioBase, setPrecioBase] = useState('')
const [feeEmision, setFeeEmision] = useState('')
const [feeAgencia, setFeeAgencia] = useState('')
const [metodoPago, setMetodoPago] = useState('')
```

#### **🔄 Funciones Dinámicas**
```javascript
// Obtener monedas desde base de datos
const getMonedasDisponibles = () => {
  if (loadingMonedas || monedasDB.length === 0) {
    return [/* fallback hardcoded */]
  }
  return monedasDB.map(moneda => ({
    value: moneda.codigo,
    label: `${moneda.nombre} (${moneda.codigo})`,
    symbol: moneda.simbolo
  }))
}

// Monedas base (SIEMPRE FIJO: USD y EUR)
const monedasBase = [
  { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
]

// Monedas con tasas (filtrado inteligente)
const getMonedasConTasas = () => {
  const monedasConTasas = new Set()
  tasasDB.forEach(tasa => {
    monedasConTasas.add(tasa.moneda_destino.codigo)
    monedasConTasas.add(tasa.moneda_origen.codigo)
  })
  return getMonedasDisponibles().filter(moneda => 
    monedasConTasas.has(moneda.value)
  )
}
```

#### **⚡ useEffect Optimizado**
```javascript
// Cálculo automático con debounce y manejo de errores
useEffect(() => {
  if ((precioBase || feeEmision || feeAgencia) && monedaPrecio && monedaCotizacion) {
    const timeoutId = setTimeout(async () => {
      try {
        await calcularCotizacion()
      } catch (error) {
        console.error('❌ Error en cálculo automático:', error)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }
}, [precioBase, feeEmision, feeAgencia, monedaPrecio, monedaCotizacion, metodoPago])
```

### 🎨 **Métodos de Pago y Detección**

#### **💳 Métodos Disponibles**
```javascript
const metodosPago = [
  'Scalapay',
  'Depósitos en dólares (BNC USD)',
  'Binance (USDT)',
  'Arcadia Service',
  'Zelle',
  'Bancacolombia',
  'Davivienda',
  'Cuenta en Euros',
  'Banesco Panamá (ViajesNova)',
  'BNC - Transferencia en Bs',
  'Pago móvil',
  'Depósito oficina Venezuela (efectivo)',
  'Depósito oficina Colombia (efectivo)',
  'Depósito oficina Europa (efectivo)',
  'Chase Bank (Estados Unidos)',
  'Bizum (España)'
]
```

#### **🔍 Detección Automática de Moneda**
```javascript
const metodosPorMoneda = {
  'USD': ['Scalapay', 'Depósitos en dólares (BNC USD)', /* ... */],
  'COP': ['Bancacolombia', 'Davivienda', /* ... */],
  'EUR': ['Cuenta en Euros', 'Bizum (España)', /* ... */],
  'VES': ['BNC - Transferencia en Bs', 'Pago móvil', /* ... */],
  'USDT': ['Binance (USDT)'],
  'FLEXIBLE': ['Depósito oficina Venezuela (efectivo)']
}

// Detección automática según método seleccionado
const detectarMonedaPorMetodo = (metodo) => {
  for (const [moneda, metodos] of Object.entries(metodosPorMoneda)) {
    if (metodos.includes(metodo)) {
      return moneda
    }
  }
  return null
}
```

### 📄 **Generación de PDF**

#### **🎨 Componentes del PDF**
- **Header**: Logo, nombre de agencia, fecha
- **Datos del Cliente**: Nombre, contacto (opcional)
- **Información del Vuelo**: Ruta, fechas, horas, aerolínea
- **Desglose de Precios**: Base, fees, conversión, recargos, impuestos
- **Servicios Incluidos**: Equipaje, seguro, hotel (según tipo)
- **Información de Pago**: Detalles bancarios según método
- **Footer**: Notas legales y contacto

#### **🛠️ Proceso de Exportación**
```javascript
const exportarPDF = async () => {
  try {
    setExportingPdf(true)
    const canvas = await html2canvas(pdfContentRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    
    pdf.addImage(imgData, 'PNG', marginX, startY, usableWidth, imgHeight)
    pdf.save(`cotizacion_${fecha}.pdf`)
  } catch (error) {
    console.error('Error exportando PDF:', error)
    alert('Ocurrió un error al generar el PDF. Intenta nuevamente.')
  } finally {
    setExportingPdf(false)
  }
}
```

---

## 💱 **Sistema de Monedas (MonedasManager.jsx)**

### 🎯 **Funcionalidades Principales**

#### **📋 Gestión Completa**
- **Ver monedas**: Listado con código, nombre, símbolo, estado
- **Editar inline**: Click en celda → Editar → ✓ Guardar/✗ Descartar
- **Crear nuevas**: Formulario con validación de código único
- **Eliminar**: Confirmación → SweetAlert loading → Toast resultado

#### **🎨 Componentes Visuales**
- **EditableCell**: Edición inline con botones explícitos
- **SweetAlert**: Loading durante operaciones CRUD
- **Toast Notifications**: Feedback de éxito/error
- **TutorialSection**: Guía descriptiva integrada

### 🛠️ **Implementación Técnica**

#### **📊 Estados y Datos**
```javascript
const [monedas, setMonedas] = useState([])
const [loading, setLoading] = useState(true)
const [editandoId, setEditandoId] = useState(null)
const [nuevaMoneda, setNuevaMoneda] = useState({
  codigo: '',
  nombre: '',
  simbolo: '',
  activa: true
})
```

#### **🔄 Operaciones CRUD**
```javascript
// Cargar monedas
const cargarMonedas = async () => {
  setLoading(true)
  try {
    const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()
    mostrarAlerta('Cargando monedas...')
    
    const { data, error } = await supabase
      .from('monedas')
      .select('*')
      .order('codigo')
    
    if (error) throw error
    setMonedas(data || [])
  } catch (error) {
    toast.error('Error al cargar monedas')
  } finally {
    setLoading(false)
    ocultarAlerta()
  }
}

// Crear moneda
const handleCrearMoneda = async () => {
  const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()
  mostrarAlerta('Creando moneda...')
  
  try {
    const response = await fetch('/api/tasas/monedas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaMoneda)
    })
    
    if (!response.ok) throw new Error('Error al crear moneda')
    
    toast.success('Moneda creada exitosamente')
    await cargarMonedas()
    resetForm()
  } catch (error) {
    toast.error('Error al crear moneda')
  } finally {
    ocultarAlerta()
  }
}

// Eliminar moneda
const handleEliminarMoneda = async (id) => {
  const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()
  mostrarAlerta('Eliminando moneda...')
  
  try {
    await fetch(`/api/tasas/monedas/${id}`, {
      method: 'DELETE'
    })
    
    toast.success('Moneda eliminada exitosamente')
    await cargarMonedas()
  } catch (error) {
    toast.error('Error al eliminar moneda')
  } finally {
    ocultarAlerta()
  }
}
```

### 🎨 **Tutorial Integrado**

#### **📋 Contenido del Tutorial**
```javascript
const tutorialMonedas = `
  <div class="space-y-4">
    <div>
      <h4 class="font-semibold text-white mb-2">🔍 ¿Qué puedes hacer aquí?</h4>
      <ul class="text-indigo-100 text-sm space-y-1">
        <li>• Ver todas las monedas registradas en el sistema</li>
        <li>• Editar monedas existentes (click en cualquier celda)</li>
        <li>• Crear nuevas monedas con código único</li>
        <li>• Activar/desactivar monedas según necesites</li>
      </ul>
    </div>
    
    <div>
      <h4 class="font-semibold text-white mb-2">⚙️ ¿Cómo funciona?</h4>
      <ul class="text-indigo-100 text-sm space-y-1">
        <li>• Click → Editar → ✓ Guardar o ✗ Descartar</li>
        <li>• Click → Nueva → Completar formulario → Agregar</li>
        <li>• Click → 🗑️ → Confirmar → Esperar resultado</li>
      </ul>
    </div>
    
    <div>
      <h4 class="font-semibold text-white mb-2">💡 Tips importantes</h4>
      <ul class="text-indigo-100 text-sm space-y-1">
        <li>• El código debe ser único (ej: USD, EUR, COP)</li>
        <li>• Usa símbolos reconocidos ($, €, £, etc.)</li>
        <li>• Al eliminar una moneda, se eliminan sus tasas</li>
      </ul>
    </div>
  </div>
`
```

---

## 🔄 **Sistema de Tasas (TasasManager.jsx)**

### 🎯 **Funcionalidades Principales**

#### **📋 Gestión de Conversiones**
- **Ver tasas**: Listado con origen, destino, tasa, fecha
- **Editar inline**: Click en tasa → Editar → ✓ Guardar/✗ Descartar
- **Crear conversiones**: Entre monedas con validación
- **Eliminar**: Confirmación → SweetAlert loading → Toast resultado
- **Historial**: Solo admin, registro completo de cambios

#### **🎨 Componentes Visuales**
- **EditableCell**: Edición inline de tasas con 4 decimales
- **SweetAlert**: Loading durante operaciones CRUD
- **Toast Notifications**: Feedback detallado
- **TutorialSection**: Guía específica para gestión de tasas

### 🛠️ **Implementación Técnica**

#### **📊 Estados y Datos**
```javascript
const [tasas, setTasas] = useState([])
const [loading, setLoading] = useState(true)
const [editandoId, setEditandoId] = useState(null)
const [nuevaTasa, setNuevaTasa] = useState({
  moneda_origen_id: '',
  moneda_destino_id: '',
  tasa: '',
  descripcion: '',
  activa: true
})
const [mostrarHistorial, setMostrarHistorial] = useState(false)
const [historial, setHistorial] = useState([])
```

#### **🔄 Operaciones CRUD**
```javascript
// Cargar tasas con relaciones
const cargarTasas = async () => {
  setLoading(true)
  try {
    const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()
    mostrarAlerta('Cargando tasas...')
    
    const { data, error } = await supabase
      .from('tasas_conversion')
      .select(`
        *,
        moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(codigo, nombre, simbolo),
        moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(codigo, nombre, simbolo)
      `)
      .eq('activa', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    setTasas(data || [])
  } catch (error) {
    toast.error('Error al cargar tasas')
  } finally {
    setLoading(false)
    ocultarAlerta()
  }
}

// Actualizar tasa
const handleActualizarTasa = async (id, nuevaTasa) => {
  const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()
  mostrarAlerta('Actualizando tasa...')
  
  try {
    const response = await fetch('/api/tasas/actualizar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, tasa: nuevaTasa, userId })
    })
    
    if (!response.ok) throw new Error('Error al actualizar tasa')
    
    toast.success('Tasa actualizada exitosamente')
    await cargarTasas()
  } catch (error) {
    toast.error('Error al actualizar tasa')
  } finally {
    ocultarAlerta()
  }
}
```

### 📊 **Historial de Cambios**

#### **🔍 Funcionalidad Admin Only**
```javascript
const cargarHistorial = async () => {
  try {
    const { data, error } = await supabase
      .from('tasas_historial')
      .select(`
        *,
        moneda_origen:monedas(id, codigo, nombre, simbolo),
        moneda_destino:monedas(id, codigo, nombre, simbolo),
        modificado_por_usuario:profiles(id, full_name, email)
      `)
      .order('fecha_cambio', { ascending: false })
      .limit(50)
    
    if (error) throw error
    setHistorial(data || [])
  } catch (error) {
    toast.error('Error al cargar historial')
  }
}
```

---

## 🎨 **Componentes Reutilizables**

### 📋 **TutorialSection.jsx**

#### **🎯 Modos de Operación**
```javascript
// Modo pasos (secuencia numerada)
<TutorialSection
  title="Título"
  subtitle="Subtítulo"
  steps={[...]} // Array de objetos {icon, title, description}
  defaultExpanded={false}
/>

// Modo descripción (HTML personalizado)
<TutorialSection
  title="Título"
  subtitle="Subtítulo"
  mode="description"
  description={`<div>HTML content...</div>`}
  defaultExpanded={false}
/>
```

#### **🎨 Características**
- **Colapsable por defecto**: No invade la UI
- **Gradientes diferentes**: Cada sección con identidad visual
- **HTML soportado**: Contenido rico en modo descripción
- **Responsive**: Adaptado a móviles y desktop

### 🔄 **EditableCell.jsx**

#### **🎯 Funcionalidad**
```javascript
<EditableCell
  value={valor}
  onChange={setValor}
  editando={editandoId === id}
  onToggleEdit={() => setEditandoId(editandoId === id ? null : id)}
  onSave={handleGuardar}
  onCancel={handleCancelar}
  type="text" // o "number"
  placeholder="Texto..."
  className="clases-adicionales"
/>
```

#### **🎨 Características**
- **Edición inline**: Click para editar, botones para guardar/cancelar
- **Tipos soportados**: text, number
- **Validación**: Props adicionales pasadas al input
- **Estilos consistentes**: Integración con Tailwind

### 🎭 **useLoadingAlert Hook**

#### **🎯 Uso**
```javascript
const { mostrarAlerta, ocultarAlerta } = useLoadingAlert()

// Mostrar loading
mostrarAlerta('Procesando...')

// Ocultar manualmente
ocultarAlerta()

// Auto-ocultar después de operación
try {
  mostrarAlerta('Eliminando...')
  await eliminarItem()
  toast.success('Eliminado exitosamente')
} finally {
  ocultarAlerta()
}
```

---

## 🗄️ **Estructura de Base de Datos**

### 📊 **Tablas Principales**

#### **monedas**
```sql
CREATE TABLE monedas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(3) UNIQUE NOT NULL, -- USD, EUR, COP
  nombre TEXT NOT NULL,              -- Dólares Americanos
  simbolo VARCHAR(10) NOT NULL,      -- $
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **tasas_conversion**
```sql
CREATE TABLE tasas_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moneda_origen_id UUID REFERENCES monedas(id),
  moneda_destino_id UUID REFERENCES monedas(id),
  tasa DECIMAL(15,8) NOT NULL,       -- 4 decimales de precisión
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(moneda_origen_id, moneda_destino_id)
);
```

#### **tasas_historial**
```sql
CREATE TABLE tasas_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasa_conversion_id UUID REFERENCES tasas_conversion(id),
  moneda_origen_id UUID REFERENCES monedas(id),
  moneda_destino_id UUID REFERENCES monedas(id),
  tasa_anterior DECIMAL(15,8),
  tasa_nueva DECIMAL(15,8),
  descripcion TEXT,
  modificado_por UUID REFERENCES profiles(id),
  fecha_cambio TIMESTAMP DEFAULT NOW()
);
```

### 🔗 **Relaciones y Restricciones**

#### **🎯 Reglas de Negocio**
1. **Código único**: Cada moneda tiene un código de 3 letras único
2. **Conversión única**: No puede haber dos tasas activas para el mismo par
3. **Auto-conversión**: Una moneda no puede convertirse a sí misma
4. **Historial automático**: Cada cambio crea un registro en historial
5. **Soft delete**: Las monedas/tasas se desactivan, no se eliminan

---

## 🔄 **API Endpoints**

### 📊 **Endpoints de Monedas**

#### **GET /api/tasas/monedas**
```javascript
// Obtener todas las monedas activas
Response: {
  success: true,
  data: [
    {
      id: "uuid",
      codigo: "USD",
      nombre: "Dólares Americanos",
      simbolo: "$",
      activa: true,
      created_at: "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### **POST /api/tasas/monedas**
```javascript
// Crear nueva moneda
Request: {
  codigo: "JPY",
  nombre: "Yenes Japoneses",
  simbolo: "¥"
}

Response: {
  success: true,
  data: { /* moneda creada */ }
}
```

#### **PUT /api/tasas/monedas/:id**
```javascript
// Actualizar moneda existente
Request: {
  codigo: "JPY",
  nombre: "Yenes Japoneses",
  simbolo: "¥"
}
```

#### **DELETE /api/tasas/monedas/:id**
```javascript
// Desactivar moneda (soft delete)
Response: {
  success: true,
  message: "Moneda eliminada exitosamente"
}
```

### 🔄 **Endpoints de Tasas**

#### **GET /api/tasas/conversiones**
```javascript
// Obtener todas las tasas activas con relaciones
Response: {
  success: true,
  data: [
    {
      id: "uuid",
      moneda_origen: { id, codigo, nombre, simbolo },
      moneda_destino: { id, codigo, nombre, simbolo },
      tasa: 0.85,
      descripcion: "Tasa EUR/USD",
      activa: true,
      created_at: "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### **POST /api/tasas/conversiones**
```javascript
// Crear nueva tasa de conversión
Request: {
  origenId: "uuid-moneda-origen",
  destinoId: "uuid-moneda-destino",
  tasa: 0.85,
  descripcion: "Tasa EUR/USD",
  userId: "uuid-usuario"
}
```

#### **PUT /api/tasas/conversiones/:id**
```javascript
// Actualizar tasa existente
Request: {
  id: "uuid-tasa",
  tasa: 0.86,
  userId: "uuid-usuario"
}
```

#### **DELETE /api/tasas/conversiones/:id**
```javascript
// Desactivar tasa (soft delete)
Request: {
  userId: "uuid-usuario"
}
```

#### **GET /api/tasas/historial**
```javascript
// Obtener historial de cambios (admin only)
Response: {
  success: true,
  data: [
    {
      id: "uuid",
      moneda_origen: { codigo, nombre },
      moneda_destino: { codigo, nombre },
      tasa_anterior: 0.85,
      tasa_nueva: 0.86,
      modificado_por_usuario: { full_name, email },
      fecha_cambio: "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

## 🎨 **Guía de Usuario**

### 🧮 **Uso de la Calculadora**

#### **📋 Paso a Paso**
1. **Ingresar Precio Base**: Precio de pantalla + fees
2. **Seleccionar Moneda Base**: USD o EUR (fijo)
3. **Seleccionar Moneda Destino**: Dinámico desde DB
4. **Configurar Vuelo**: Tipo, fechas, rutas, equipaje
5. **Elegir Método Pago**: Detecta moneda automáticamente
6. **Ver Resultado**: Conversión + recargos + impuestos
7. **Exportar PDF**: Listo para enviar al cliente

#### **💡 Tips de Uso**
- **Precios exactos**: Incluye TODOS los costos
- **Conversión inteligente**: El sistema detecta moneda según método
- **Fechas correctas**: Formato DD/MM/AAAA
- **Equipaje adecuado**: Cada pieza tiene fee adicional
- **Impuestos**: 4x1000 solo para VES

### 💱 **Gestión de Monedas**

#### **📋 Operaciones Básicas**
- **Ver listado**: Todas las monedas con estado
- **Editar inline**: Click en celda → Editar → Guardar
- **Crear nueva**: Formulario con código único
- **Eliminar**: Desactiva moneda y sus tasas

#### **💡 Buenas Prácticas**
- **Códigos estándar**: USD, EUR, COP, VES, etc.
- **Símbolos reconocidos**: $, €, £, ¥, etc.
- **Nombres descriptivos**: Claros y únicos
- **Estado activo**: Solo monedas en uso aparecen en calculadora

### 🔄 **Gestión de Tasas**

#### **📋 Operaciones Básicas**
- **Ver conversiones**: Todas las tasas activas
- **Editar tasa**: 4 decimales de precisión
- **Crear conversión**: Entre monedas existentes
- **Ver historial**: Registro completo de cambios

#### **💡 Buenas Prácticas**
- **Precisión**: Usar 4 decimales para tasas
- **Descripciones**: Claras y consistentes
- **Actualizaciones regulares**: Mantener tasas al día
- **Historial**: Revisar cambios periódicamente

---

## 🚀 **Consideraciones Técnicas**

### ⚡ **Performance**

#### **🎯 Optimizaciones Implementadas**
- **Debounce 300ms**: Evita cálculos excesivos
- **Lazy loading**: Carga datos bajo demanda
- **Cache local**: Estados en memoria para acceso rápido
- **Batch operations**: Operaciones en lote cuando es posible

#### **🔍 Monitoreo**
- **Console logs**: Traza completa de operaciones
- **Error boundaries**: Captura de errores graceful
- **Toast notifications**: Feedback claro al usuario
- **Loading states**: Indicadores visuales durante operaciones

### 🔒 **Seguridad**

#### **🛡️ Validaciones**
- **Códigos únicos**: Prevención de duplicados
- **Sanitización de inputs**: XSS prevention
- **RLS policies**: Acceso restringido por rol
- **Admin only**: Operaciones sensibles protegidas

#### **🔐 Autenticación**
- **JWT tokens**: Sesiones seguras
- **Role-based access**: Diferentes niveles de permiso
- **API protection**: Endpoints protegidos
- **Session management**: Manejo seguro de sesiones

### 🔄 **Escalabilidad**

#### **📈 Arquitectura Modular**
- **Componentes reutilizables**: TutorialSection, EditableCell
- **Hooks personalizados**: useLoadingAlert, useDebounce
- **Servicios centralizados**: tasasHelpers, conversorInteligente
- **API layer**: Abstracción de operaciones de base de datos

#### **🎯 Mantenimiento**
- **Código limpio**: Separación de responsabilidades
- **Documentación completa**: Guías y comentarios
- **Testing**: Cobertura de casos críticos
- **Versionado**: Control de cambios semántico

---

## 🎯 **Resumen de Funcionalidades**

### 🧮 **Calculadora de Cotizaciones**
- ✅ Cálculo automático con debounce
- ✅ Conversión inteligente de monedas
- ✅ Detección automática según método de pago
- ✅ PDF profesional con todos los detalles
- ✅ Integración con monedas y tasas dinámicas

### 💱 **CRUD de Monedas**
- ✅ Listado con estado y detalles
- ✅ Edición inline con confirmación
- ✅ Creación con validación de código único
- ✅ Eliminación segura (soft delete)
- ✅ Tutorial integrado con guías

### 🔄 **CRUD de Tasas**
- ✅ Listado con relaciones de monedas
- ✅ Edición inline con 4 decimales
- ✅ Creación con validación de pares únicos
- ✅ Historial completo de cambios (admin)
- ✅ Tutorial específico para gestión

### 🎨 **Componentes y UX**
- ✅ SweetAlert con loading en todas las operaciones
- ✅ Toast notifications para feedback
- ✅ Tutoriales colapsables descriptivos
- ✅ Edición inline con botones explícitos
- ✅ Diseño responsive y consistente

---

## 📞 **Soporte y Mantenimiento**

### 🐛 **Troubleshooting Común**

#### **❌ ReferenceError: monedas is not defined**
- **Causa**: Variable eliminada pero referenciada
- **Solución**: Usar `getMonedasDisponibles()` en lugar de `monedas`

#### **⚠️ useEffect asíncrono sin manejo**
- **Causa**: Llamada directa a función async en useEffect
- **Solución**: Envolver en función async con try-catch

#### **🔄 Bucle infinito en cálculo**
- **Causa**: Dependencias circulares en useEffect
- **Solución**: Usar debounce y limpiar timeouts

### 📞 **Contacto de Soporte**
- **Documentación**: Este archivo y comentarios en código
- **Logs**: Consola del navegador y servidor
- **Testing**: Verificar en ambiente de desarrollo
- **Monitoreo**: Revisar performance regularmente

---

**🎯 Este documento cubre todo el funcionamiento actual del sistema de cotización, gestión de monedas y tasas. Mantener actualizado con cada cambio significativo.**
