# Sistema de Ranking Gamificado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el ranking actual en un sistema gamificado que motive a los asesores mediante competición sana, metas claras y reconocimiento visual.

**Architecture:** Sistema multi-capa con helpers centralizados, backend modificado para filtros mensuales y datos de agencia, frontend con componentes reutilizables de barras de progreso y notificaciones en tiempo real.

**Tech Stack:** Node.js/Express (backend), Next.js/React (frontend), Supabase (BD), TailwindCSS (UI), JavaScript/ES6+.

---

## File Structure

**Backend Files:**
- `src/lib/rankingHelpers.js` - Helpers centralizados de fechas, metas, comisiones
- `src/routes/rankings.js` - Modificar endpoint existente y agregar nuevo endpoint personal

**Frontend Files:**
- `dashboard/src/lib/ranking/helpers.js` - Helpers de UI y visualización
- `dashboard/src/components/ranking/BarraProgresoMeta.jsx` - Barras de progreso para ranking global
- `dashboard/src/components/ranking/BarraPersonalHeader.jsx` - Barra personal para header
- `dashboard/src/hooks/useMetaNotifications.js` - Hook de notificaciones en tiempo real
- `dashboard/src/contexts/RankingContext.js` - Modificar para datos personales
- `dashboard/src/components/ranking/RankingGlobal.jsx` - Integrar barras de progreso
- `dashboard/src/components/layout/Navbar.jsx` - Agregar barra personal
- `dashboard/src/app/(crm)/layout.js` - Activar notificaciones
- `dashboard/src/config/apiConfig.js` - Agregar nuevo endpoint

**Documentation:**
- `docs/AUDITORIA_RANKING_GAMIFIED.md` - Auditoría completada
- `docs/2025-04-09-ranking-gamificado.md` - Este plan

---

### Task 1: Create Backend Helpers

**Files:**
- Create: `src/lib/rankingHelpers.js`

- [ ] **Step 1: Create ranking helpers file**

```javascript
/**
 * Helper centralizado para toda la lógica de ranking gamificado
 */

// 1. FECHAS
export const getRangoMesActual = () => {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = ahora.getMonth()
  
  const inicio = new Date(año, mes, 1)
  const fin = new Date(año, mes + 1, 0, 23, 59, 59)
  
  return { inicio, fin }
}

export const getRangoQuincenaActual = () => {
  const ahora = new Date()
  const dia = ahora.getDate()
  const mes = ahora.getMonth()
  const año = ahora.getFullYear()
  
  if (dia <= 15) {
    return {
      numero: 1,
      inicio: new Date(año, mes, 1),
      fin: new Date(año, mes, 15, 23, 59, 59)
    }
  } else {
    const ultimoDiaMes = new Date(año, mes + 1, 0).getDate()
    return {
      numero: 2,
      inicio: new Date(año, mes, 16),
      fin: new Date(año, mes, ultimoDiaMes, 23, 59, 59)
    }
  }
}

// 2. METAS POR AGENCIA
export const getMetaPorAgencia = (codigoAgencia) => {
  const metas = {
    'APOLO': 3000,
    'NOVA': 3500,
    'NOVA_FLASH': 3500,
    'NOVA_COLOMBIA': 3500,
    'SIN_AGENCIA': 3500
  }
  return metas[codigoAgencia] || 3500
}

// 3. COMISIONES
export const calcularComision = (feeQuincenal, alcanzoMetaMensual) => {
  if (!feeQuincenal || feeQuincenal <= 0) return 0
  
  const porcentaje = alcanzoMetaMensual ? 0.15 : 0.12
  return feeQuincenal * porcentaje
}

// 4. PROGRESO
export const calcularProgresoMeta = (feeActual, meta) => {
  if (!meta || meta <= 0) return 0
  return Math.min((feeActual / meta) * 100, 100)
}

// 5. PROYECCIONES
export const calcularProyeccionMeta = (feeActual, meta, diasTranscurridos) => {
  if (!diasTranscurridos || diasTranscurridos === 0) return null
  if (!feeActual || feeActual <= 0) return null
  
  const promedioDiario = feeActual / diasTranscurridos
  const faltante = Math.max(0, meta - feeActual)
  
  if (promedioDiario === 0) return null
  
  const diasNecesarios = Math.ceil(faltante / promedioDiario)
  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + diasNecesarios)
  
  const finDeMes = new Date()
  finDeMes.setDate(finDeMes.getDate() + (30 - new Date().getDate()))
  
  return {
    diasNecesarios,
    fechaEstimada,
    alcanzaraAntesDeFinMes: fechaEstimada <= finDeMes,
    promedioDiario: Math.round(promedioDiario * 100) / 100,
    faltante: Math.round(faltante * 100) / 100
  }
}

// 6. DIAS DE COBRO
export const calcularDiaCobro = (fecha) => {
  const diaSemana = fecha.getDay()
  
  if (diaSemana >= 5) {
    const diasAlLunes = diaSemana === 0 ? 1 : 8 - diaSemana
    const fechaAjustada = new Date(fecha.getTime() + (diasAlLunes * 24 * 60 * 60 * 1000))
    return fechaAjustada
  }
  
  return fecha
}
```

- [ ] **Step 2: Test helpers work correctly**

```bash
node -e "
const { getRangoMesActual, getMetaPorAgencia, calcularComision } = require('./src/lib/rankingHelpers.js');
console.log('Mes actual:', getRangoMesActual());
console.log('Meta APOLO:', getMetaPorAgencia('APOLO'));
console.log('Meta NOVA:', getMetaPorAgencia('NOVA'));
console.log('Comisión 15%:', calcularComision(1000, true));
console.log('Comisión 12%:', calcularComision(1000, false));
"
```

Expected: Functions return correct values without errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/rankingHelpers.js
git commit -m "feat: add ranking helpers for gamified system"
```

---

### Task 2: Create Frontend UI Helpers

**Files:**
- Create: `dashboard/src/lib/ranking/helpers.js`

- [ ] **Step 1: Create frontend helpers file**

```javascript
/**
 * Utilidades de visualización para el ranking gamificado (Frontend)
 */

import { 
  formatearDinero, 
  formatearPorcentaje, 
  obtenerBadgeMeta, 
  obtenerMensajeMotivacional,
  obtenerColoresAgencia
} from '@/lib/ranking/helpers'

// 1. FORMATEO DE DATOS
export const formatearFee = (monto, moneda = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto || 0)
}

export const formatearPorcentajeSimple = (valor, decimales = 1) => {
  return `${valor.toFixed(decimales)}%`
}

// 2. COLORES DINÁMICOS
export const obtenerColorProgreso = (porcentaje) => {
  if (porcentaje >= 100) return 'bg-emerald-500'
  if (porcentaje >= 85) return 'bg-green-500'
  if (porcentaje >= 70) return 'bg-yellow-500'
  if (porcentaje >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

export const obtenerColorTextoProgreso = (porcentaje) => {
  if (porcentaje >= 70) return 'text-white'
  return 'text-gray-700'
}

// 3. COLORES POR AGENCIA
export const obtenerClasesAgencia = (codigoAgencia) => {
  const colores = {
    'APOLO': {
      primario: 'amber',
      secundario: 'amber',
      texto: 'amber',
      gradiente: 'from-amber-400 to-orange-500'
    },
    'NOVA': {
      primario: 'indigo',
      secundario: 'indigo',
      texto: 'indigo',
      gradiente: 'from-indigo-400 to-purple-500'
    },
    'NOVA_FLASH': {
      primario: 'purple',
      secundario: 'purple',
      texto: 'purple',
      gradiente: 'from-purple-400 to-pink-500'
    },
    'NOVA_COLOMBIA': {
      primario: 'blue',
      secundario: 'blue',
      texto: 'blue',
      gradiente: 'from-blue-400 to-cyan-500'
    },
    'SIN_AGENCIA': {
      primario: 'gray',
      secundario: 'gray',
      texto: 'gray',
      gradiente: 'from-gray-400 to-slate-500'
    }
  }
  return colores[codigoAgencia] || colores['SIN_AGENCIA']
}

// 4. BADGES Y GAMIFICACIÓN
export const obtenerBadgeMetaUI = (alcanzoMeta, progreso) => {
  if (alcanzoMeta) return '??'
  if (progreso >= 95) return '??'
  if (progreso >= 85) return '??'
  if (progreso >= 70) return '??'
  return ''
}

export const obtenerMensajeMotivacionalUI = (progreso, diasRestantes) => {
  if (progreso >= 100) return '¡Meta alcanzada! Sigue así'
  if (progreso >= 85) return '¡Muy cerca! Un último esfuerzo'
  if (progreso >= 70) return 'Buen progreso, mantén el ritmo'
  if (progreso >= 50) return 'Vas bien, falta más'
  if (diasRestantes <= 10) return '¡El tiempo corre! Acelera'
  return 'Sigue adelante, tú puedes'
}

// 5. ANIMACIONES CSS
export const animacionesBarra = {
  entrada: 'animate-in fade-in slide-in-from-left-2 duration-500',
  pulso: 'animate-pulse',
  shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]',
  celebracion: 'animate-bounce'
}

// 6. PROYECCIONES
export const formatearProyeccion = (proyeccion) => {
  if (!proyeccion) return 'Sin datos suficientes'
  
  const { diasNecesarios, fechaEstimada, alcanzaraAntesDeFinMes } = proyeccion
  
  if (alcanzaraAntesDeFinMes) {
    return `Al ritmo actual, alcanzarás meta el ${fechaEstimada.toLocaleDateString('es', { 
      day: 'numeric', 
      month: 'short' 
    })}`
  } else {
    return `Necesitas aumentar el ritmo para alcanzar meta este mes`
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/lib/ranking/helpers.js
git commit -m "feat: add frontend UI helpers for ranking gamification"
```

---

### Task 3: Modify Backend API - Global Ranking

**Files:**
- Modify: `src/routes/rankings.js:15-45`

- [ ] **Step 1: Add imports and modify query**

```javascript
// Add at top
import { 
  getRangoMesActual, 
  getMetaPorAgencia, 
  calcularProyeccionMeta 
} from '../lib/rankingHelpers.js';

// Modify the query in GET /api/rankings/global
router.get('/global', async (req, res) => {
  try {
    const monedaVista = req.query.moneda || 'USD';
    const { inicio, fin } = getRangoMesActual();

    // Obtener vuelos + pasajeros + equipos + agencias en paralelo
    const [vuelosResult, equiposResult, tasasResult] = await Promise.all([
      supabase
        .from('vuelos')
        .select(`
          id,
          estado,
          monto_venta,
          total_cotizacion,
          moneda_precio,
          moneda_cotizacion,
          tasa_cambio,
          created_by,
          created_at,
          ruta,
          pasajeros:vuelos_pasajeros(
            fee_agencia
          ),
          creator:profiles!created_by(
            id,
            full_name,
            email,
            equipo_id,
            equipo:equipos!equipo_id(id, nombre, color),
            role:roles(id, name),
            agencia_usuario:usuario_agencias(
              is_primary, 
              agencia:agencias!agencia_id(id, codigo, nombre)
            )
          )
        `)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fin.toISOString())
        .neq('estado', 'CANCELADO'),
      // ... rest of existing queries
    ]);
```

- [ ] **Step 2: Modify user processing logic**

```javascript
// Find the user processing section and modify
vuelos.forEach(vuelo => {
  const userId = vuelo.created_by;
  const creator = vuelo.creator;
  if (!creator) return;

  // Obtener agencia primaria
  const agenciaUsuario = creator.agencia_usuario?.find(au => au.is_primary);
  const agencia = agenciaUsuario?.agencia || { codigo: 'SIN_AGENCIA', nombre: 'Sin Agencia' };
  
  if (!porUsuario[userId]) {
    const meta = getMetaPorAgencia(agencia.codigo);
    
    porUsuario[userId] = {
      id: userId,
      nombre: creator.full_name || 'Sin nombre',
      email: creator.email || '',
      rol: creator.role?.name?.toLowerCase() || 'asesor',
      equipoId: creator.equipo_id || null,
      equipoNombre: creator.equipo?.nombre || null,
      equipoColor: creator.equipo?.color || '#6366f1',
      agenciaCodigo: agencia.codigo,
      agenciaNombre: agencia.nombre,
      metaIndividual: meta,
      totalVuelos: 0,
      emitidos: 0,
      pendientesPago: 0,
      pendientesEmision: 0,
      montoTotal: 0,
      feeAgenciaTotal: 0
    };
  }

  const u = porUsuario[userId];
  // ... existing counting logic
  
  // Sumar fee_agencia (ya está filtrado por mes)
  if (vuelo.pasajeros && Array.isArray(vuelo.pasajeros)) {
    vuelo.pasajeros.forEach(pasajero => {
      u.feeAgenciaTotal += parseFloat(pasajero.fee_agencia) || 0;
    });
  }
});
```

- [ ] **Step 3: Add gamification metrics**

```javascript
// Add after user processing, before sorting
const todos = Object.values(porUsuario).map(u => {
  const progreso = calcularProgresoMeta(u.feeAgenciaTotal, u.metaIndividual);
  const alcanzoMeta = u.feeAgenciaTotal >= u.metaIndividual;
  const diaDelMes = new Date().getDate();
  const proyeccion = calcularProyeccionMeta(u.feeAgenciaTotal, u.metaIndividual, diaDelMes);
  
  return {
    ...u,
    porcentajeConversion: u.totalVuelos > 0 ? ((u.emitidos / u.totalVuelos) * 100).toFixed(1) : 0,
    progresoMeta: Math.min(progreso, 100),
    alcanzoMeta,
    proyeccionMeta: proyeccion,
    estaCercaDeMeta: progreso >= 85 && !alcanzoMeta
  };
});
```

- [ ] **Step 4: Test modified endpoint**

```bash
curl -s "http://localhost:4000/api/rankings/global?moneda=USD" | jq '.general[0] | {nombre, agenciaCodigo, metaIndividual, feeAgenciaTotal, progresoMeta, alcanzoMeta}'
```

Expected: User data includes new fields: agenciaCodigo, metaIndividual, progresoMeta, alcanzoMeta

- [ ] **Step 5: Commit**

```bash
git add src/routes/rankings.js
git commit -m "feat: modify global ranking API for gamification with monthly filters and agency data"
```

---

### Task 4: Add Personal Ranking Endpoint

**Files:**
- Modify: `src/routes/rankings.js:230`

- [ ] **Step 1: Add new endpoint before export**

```javascript
// NUEVO: GET /api/rankings/personal/:userId
router.get('/personal/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { inicio, fin } = getRangoMesActual();
    const quincena = getRangoQuincenaActual();
    
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    // Obtener datos del usuario con agencia
    const { data: usuario, error: usuarioError } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email,
        agencia_usuario:usuario_agencias(
          is_primary, 
          agencia:agencias!agencia_id(id, codigo, nombre)
        )
      `)
      .eq('id', userId)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener agencia primaria
    const agenciaUsuario = usuario.agencia_usuario?.find(au => au.is_primary);
    const agencia = agenciaUsuario?.agencia || { codigo: 'SIN_AGENCIA', nombre: 'Sin Agencia' };
    const meta = getMetaPorAgencia(agencia.codigo);

    // Obtener vuelos del mes
    const { data: vuelosMes, error: vuelosError } = await supabase
      .from('vuelos')
      .select(`
        created_at,
        pasajeros:vuelos_pasajeros(fee_agencia)
      `)
      .eq('created_by', userId)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fin.toISOString())
      .neq('estado', 'CANCELADO');

    if (vuelosError) throw vuelosError;

    // Calcular fees
    let feeMensual = 0;
    let feeQuincenal = 0;
    
    vuelosMes.forEach(vuelo => {
      const fechaVuelo = new Date(vuelo.created_at);
      const estaEnQuincenaActual = fechaVuelo >= quincena.inicio && fechaVuelo <= quincena.fin;
      
      if (vuelo.pasajeros && Array.isArray(vuelo.pasajeros)) {
        vuelo.pasajeros.forEach(pasajero => {
          const fee = parseFloat(pasajero.fee_agencia) || 0;
          feeMensual += fee;
          if (estaEnQuincenaActual) {
            feeQuincenal += fee;
          }
        });
      }
    });

    const alcanzoMeta = feeMensual >= meta;
    const comision = calcularComision(feeQuincenal, alcanzoMeta);
    
    // Determinar estado de cobro
    const hoy = new Date();
    const diaCobro = calcularDiaCobro(quincena.fin);
    const yaCobro = hoy > diaCobro;
    
    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.full_name,
        email: usuario.email,
        agencia: agencia
      },
      mensual: {
        fee: feeMensual,
        meta,
        progreso: Math.min((feeMensual / meta) * 100, 100),
        alcanzoMeta
      },
      quincenal: {
        numero: quincena.numero,
        fee: feeQuincenal,
        comision,
        porcentajeComision: alcanzoMeta ? 15 : 12,
        estado: yaCobro ? 'cobrado' : 'estimado',
        diaCobro: diaCobro.toISOString()
      },
      mesActual: {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        quincenaActual: {
          numero: quincena.numero,
          inicio: quincena.inicio.toISOString(),
          fin: quincena.fin.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error en GET /api/rankings/personal/:userId:', error);
    res.status(500).json({
      error: 'Error al obtener ranking personal',
      details: error.message
    });
  }
});
```

- [ ] **Step 2: Test new endpoint**

```bash
# First get a user ID from existing ranking
USER_ID=$(curl -s "http://localhost:4000/api/rankings/global" | jq -r '.general[0].id')

# Test personal endpoint
curl -s "http://localhost:4000/api/rankings/personal/$USER_ID" | jq '.usuario, .mensual, .quincenal'
```

Expected: Returns personal data with monthly and quincenal breakdown

- [ ] **Step 3: Commit**

```bash
git add src/routes/rankings.js
git commit -m "feat: add personal ranking endpoint with monthly/quincenal data and commission calculation"
```

---

### Task 5: Update API Configuration

**Files:**
- Modify: `dashboard/src/config/apiConfig.js:68-71`

- [ ] **Step 1: Add personal endpoint to API config**

```javascript
// Find RANKINGS_API section and modify
export const RANKINGS_API = {
  global: buildApiUrl('/api/rankings/global'),
  personal: buildApiUrl('/api/rankings/personal/:userId')
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "feat: add personal ranking endpoint to API configuration"
```

---

### Task 6: Create Progress Bar Component

**Files:**
- Create: `dashboard/src/components/ranking/BarraProgresoMeta.jsx`

- [ ] **Step 1: Create progress bar component**

```jsx
'use client'

import { useState, useEffect } from 'react'
import { obtenerColorProgreso, obtenerBadgeMeta, animacionesBarra } from '@/lib/ranking/helpers'
import { Target, TrendingUp, Calendar } from 'lucide-react'

export default function BarraProgresoMeta({ 
  feeActual, 
  meta, 
  nombre, 
  alcanzóMeta, 
  mostrarCantidades = false,
  compacta = false,
  animada = true 
}) {
  const [progresoAnimado, setProgresoAnimado] = useState(0)
  const progresoReal = Math.min((feeActual / meta) * 100, 100)
  
  // Animación de entrada
  useEffect(() => {
    if (!animada) {
      setProgresoAnimado(progresoReal)
      return
    }
    
    const timer = setTimeout(() => {
      setProgresoAnimado(progresoReal)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [progresoReal, animada])

  const colorBarra = obtenerColorProgreso(progresoReal)
  const badge = obtenerBadgeMeta(alcanzóMeta, progresoReal)
  
  if (compacta) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${colorBarra} transition-all duration-1000 ease-out ${animacionesBarra.shimmer}`}
            style={{ width: `${progresoAnimado}%` }}
          />
        </div>
        {badge && (
          <span className={`text-lg ${animacionesBarra.entrada}`}>
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${animacionesBarra.entrada}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Target className="w-3 h-3" />
          <span>Meta</span>
        </div>
        
        {mostrarCantidades && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">
              ${feeActual.toLocaleString()}
            </span>
            <span className="text-gray-400">/ ${meta.toLocaleString()}</span>
          </div>
        )}
        
        {badge && (
          <span className={`text-sm ${animacionesBarra.celebracion}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="relative">
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full ${colorBarra} transition-all duration-1000 ease-out relative ${alcanzóMeta ? animacionesBarra.pulso : ''}`}
            style={{ width: `${progresoAnimado}%` }}
          >
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
          </div>
        </div>
        
        {/* Indicador de porcentaje */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${
            progresoReal > 50 ? 'text-white' : 'text-gray-700'
          }`}>
            {progresoReal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Footer informativo */}
      {alcanzóMeta && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <TrendingUp className="w-3 h-3" />
          <span>Meta alcanzada</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/ranking/BarraProgresoMeta.jsx
git commit -m "feat: create progress bar component for ranking gamification"
```

---

### Task 7: Create Personal Header Bar Component

**Files:**
- Create: `dashboard/src/components/ranking/BarraPersonalHeader.jsx`

- [ ] **Step 1: Create personal header component**

```jsx
'use client'

import { useState, useEffect } from 'react'
import { useRanking } from '@/contexts/RankingContext'
import { obtenerClasesAgencia, formatearFee, formatearProyeccion, obtenerMensajeMotivacional } from '@/lib/ranking/helpers'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Target, 
  Award,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import BarraProgresoMeta from './BarraProgresoMeta'

export default function BarraPersonalHeader({ userId }) {
  const { datosPersonales, loadingPersonal, recargarPersonal } = useRanking()
  const [expandida, setExpandida] = useState(false)
  const [animando, setAnimando] = useState(false)

  // Efecto de celebración cuando alcanza meta
  useEffect(() => {
    if (datosPersonales?.mensual?.alcanzoMeta && !animando) {
      setAnimando(true)
      setTimeout(() => setAnimando(false), 3000)
    }
  }, [datosPersonales?.mensual?.alcanzoMeta])

  if (loadingPersonal || !datosPersonales) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  const { usuario, mensual, quincenal } = datosPersonales
  const clasesAgencia = obtenerClasesAgencia(usuario.agencia.codigo)
  const diasRestantes = Math.max(0, 30 - new Date().getDate())

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
      animando ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
    }`}>
      {/* Header principal */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandida(!expandida)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar/Icono */}
            <div className={`w-10 h-10 rounded-full bg-${clasesAgencia.secundario}-100 flex items-center justify-center`}>
              <Award className={`w-5 h-5 text-${clasesAgencia.texto}-700`} />
            </div>
            
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Mi Progreso
              </p>
              <p className="text-xs text-gray-500">
                {usuario.agencia.nombre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador principal */}
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatearFee(mensual.fee)}
              </p>
              <p className="text-xs text-gray-500">
                de {formatearFee(mensual.meta)}
              </p>
            </div>

            {/* Toggle expandir */}
            {expandida ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Barra de progreso compacta */}
        <div className="mt-3">
          <BarraProgresoMeta
            feeActual={mensual.fee}
            meta={mensual.meta}
            nombre={usuario.nombre}
            alcanzóMeta={mensual.alcanzoMeta}
            mostrarCantidades={false}
            compacta={true}
            animada={true}
          />
        </div>
      </div>

      {/* Contenido expandido */}
      {expandida && (
        <div className="border-t border-gray-200 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <Target className="w-3 h-3" />
                <span>Meta</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {mensual.progreso.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <DollarSign className="w-3 h-3" />
                <span>Comisión</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatearFee(quincenal.comision)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Días</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {diasRestantes}
              </p>
            </div>
          </div>

          {/* Detalle de comisión quincenal */}
          <div className={`bg-gray-50 rounded-lg p-3 bg-${clasesAgencia.secundario}-50`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 text-${clasesAgencia.texto}-700`} />
                <span className="text-sm font-medium text-gray-700">
                  Quincena {quincenal.numero}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                quincenal.estado === 'cobrado' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {quincenal.estado === 'cobrado' ? 'Cobrado' : 'Estimado'}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Fee quincenal:</span>
                <span className="font-medium">{formatearFee(quincenal.fee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Porcentaje:</span>
                <span className={`font-bold text-${clasesAgencia.texto}-700`}>
                  {quincenal.porcentajeComision}%
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700">Comisión:</span>
                <span className={`text-${clasesAgencia.texto}-700`}>
                  {formatearFee(quincenal.comision)}
                </span>
              </div>
            </div>
            
            {quincenal.estado === 'estimado' && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>
                  Se cobra el {new Date(quincenal.diaCobro).toLocaleDateString('es', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Proyección */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Proyección</span>
            </div>
            <p className="text-xs text-blue-700">
              {formatearProyeccion(mensual.proyeccionMeta)}
            </p>
          </div>

          {/* Mensaje motivacional */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 italic">
              "{obtenerMensajeMotivacional(mensual.progreso, diasRestantes)}"
            </p>
          </div>

          {/* Botón de recargar */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              recargarPersonal(userId)
            }}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Actualizar datos
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/ranking/BarraPersonalHeader.jsx
git commit -m "feat: create personal header bar component with detailed metrics and projections"
```

---

### Task 8: Update Ranking Context

**Files:**
- Modify: `dashboard/src/contexts/RankingContext.js:16-35`

- [ ] **Step 1: Add personal data states**

```javascript
// Add new states after existing ones
const [datosPersonales, setDatosPersonales] = useState(null)
const [loadingPersonal, setLoadingPersonal] = useState(false)

// Add to the provider value
<RankingContext.Provider value={{
  rankingData,
  loadingRanking,
  filtroVista,
  setFiltroVista,
  monedaVista,
  setMonedaVista,
  realtimeActivo,
  ultimaActualizacion,
  recargar: cargarRanking,
  // NUEVOS
  datosPersonales,
  loadingPersonal,
  recargarPersonal: cargarDatosPersonales
}}>
```

- [ ] **Step 2: Add personal data loading function**

```javascript
// Add after cargarRanking function
const cargarDatosPersonales = useCallback(async (userId) => {
  if (!userId) return
  
  try {
    setLoadingPersonal(true)
    const url = `${RANKINGS_API.personal.replace(':userId', userId)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error obteniendo datos personales')
    const data = await res.json()
    setDatosPersonales(data)
  } catch (err) {
    console.error('Error cargando datos personales:', err)
    setDatosPersonales(null)
  } finally {
    setLoadingPersonal(false)
  }
}, [])

// Add user import at top
import { useAuth } from '@/contexts/AuthContext'
```

- [ ] **Step 3: Add user data loading effect**

```javascript
// Add after existing useEffect
const { user } = useAuth()

useEffect(() => {
  if (user) {
    cargarDatosPersonales(user.id)
  }
}, [cargarDatosPersonales, user])
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/contexts/RankingContext.js
git commit -m "feat: update ranking context to support personal data loading"
```

---

### Task 9: Integrate Progress Bars in Ranking Global

**Files:**
- Modify: `dashboard/src/components/ranking/RankingGlobal.jsx:29-78`

- [ ] **Step 1: Add imports**

```javascript
// Add at top with other imports
import BarraProgresoMeta from './BarraProgresoMeta'
import { obtenerClasesAgencia, obtenerBadgeMeta } from '@/lib/ranking/helpers'
```

- [ ] **Step 2: Modify FilaUsuario component**

```javascript
function FilaUsuario({ usuario, index, monedaVista }) {
  const clasesAgencia = obtenerClasesAgencia(usuario.agenciaCodigo || 'SIN_AGENCIA')
  const badgeMeta = obtenerBadgeMeta(usuario.alcanzoMeta, usuario.progresoMeta)

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
      usuario.alcanzoMeta ? 'bg-emerald-50/50' : ''
    }`}>
      <td className="px-4 py-3 text-sm font-bold text-gray-700 w-10">
        <div className="flex items-center gap-1">
          {getMedalla(index)}
          {badgeMeta && (
            <span className="animate-in zoom-in duration-300">
              {badgeMeta}
            </span>
          )}
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-700">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
            {usuario.equipoNombre && (
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: usuario.equipoColor || '#6366f1' }}
              >
                {usuario.equipoNombre}
              </span>
            )}
            {/* Badge de agencia */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-${clasesAgencia.secundario}-100 text-${clasesAgencia.texto}-700 ml-1`}>
              {usuario.agenciaNombre}
            </span>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {usuario.rol}
        </span>
      </td>
      
      <td className="px-4 py-3 text-center font-bold text-gray-900">{usuario.emitidos}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-600">{usuario.totalVuelos}</td>
      
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-medium">{usuario.porcentajeConversion}%</span>
          {parseFloat(usuario.porcentajeConversion) >= 60
            ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          }
        </div>
      </td>
      
      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
        {formatMoney(usuario.montoTotal, monedaVista)}
      </td>
      
      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
        {formatFee(usuario.feeAgenciaTotal)}
      </td>
      
      {/* NUEVA: Columna de Progreso Meta */}
      <td className="px-4 py-3 w-48">
        <BarraProgresoMeta
          feeActual={usuario.feeAgenciaTotal}
          meta={usuario.metaIndividual}
          nombre={usuario.nombre}
          alcanzóMeta={usuario.alcanzoMeta}
          mostrarCantidades={false}
          compacta={true}
          animada={true}
        />
      </td>
    </tr>
  )
}
```

- [ ] **Step 3: Update table headers**

```javascript
// Find the table headers in TablaUsuarios and add new column
<th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Progreso Meta</th>
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/ranking/RankingGlobal.jsx
git commit -m "feat: integrate progress bars into global ranking with agency badges and gamification"
```

---

### Task 10: Add Personal Bar to Navbar

**Files:**
- Modify: `dashboard/src/components/layout/Navbar.jsx`

- [ ] **Step 1: Add import and personal bar**

```javascript
// Add at top
import BarraPersonalHeader from '@/components/ranking/BarraPersonalHeader'
import { useAuth } from '@/contexts/AuthContext'

// Add inside Navbar component
export default function Navbar() {
  const { user } = useAuth()
  
  // ... existing navbar code ...

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ... existing navbar content ... */}
        </div>
        
        {/* NUEVO: Barra personal debajo del navbar principal */}
        {user && (
          <div className="border-t border-gray-100 py-3">
            <div className="max-w-4xl mx-auto">
              <BarraPersonalHeader userId={user.id} />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/layout/Navbar.jsx
git commit -m "feat: add personal progress bar to navbar"
```

---

### Task 11: Create Notifications Hook

**Files:**
- Create: `dashboard/src/hooks/useMetaNotifications.js`

- [ ] **Step 1: Create notifications hook**

```javascript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { getMetaPorAgencia } from '@/lib/ranking/helpers'

export const useMetaNotifications = () => {
  const { user } = useAuth()
  const [notificacionesActivas, setNotificacionesActivas] = useState(new Set())
  const [ultimaVerificacion, setUltimaVerificacion] = useState(null)

  // Verificar si un usuario alcanzó meta
  const verificarMetaAlcanzada = useCallback(async (userId, feeActual, meta) => {
    if (feeActual < meta) return
    
    const notifKey = `meta_alcanzada_${userId}_${new Date().getMonth()}`
    
    // Evitar notificar múltiples veces el mismo mes
    if (notificacionesActivas.has(notifKey)) return
    
    // Obtener datos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()
    
    if (profile) {
      // Notificación global (visible para todos)
      toast.success(
        `?? ¡${profile.full_name} alcanzó su meta del mes!`,
        {
          duration: 5000,
          icon: '??',
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      )
      
      // Notificación personal si es el usuario actual
      if (userId === user?.id) {
        toast.success(
          `?? ¡Felicidades! Alcanzaste tu meta de $${meta.toLocaleString()}`,
          {
            duration: 6000,
            icon: '??',
            style: {
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 'bold'
            }
          }
        )
      }
      
      setNotificacionesActivas(prev => new Set([...prev, notifKey]))
    }
  }, [user, notificacionesActivas])

  // Verificar si está cerca de la meta
  const verificarCercaDeMeta = useCallback(async (userId, feeActual, meta) => {
    const progreso = (feeActual / meta) * 100
    
    if (progreso < 85 || progreso >= 100) return
    
    const notifKey = `cerca_meta_${userId}_${new Date().getDate()}`
    
    // Evitar notificar múltiples veces el mismo día
    if (notificacionesActivas.has(notifKey)) return
    
    const faltante = meta - feeActual
    
    // Solo notificar al usuario afectado
    if (userId === user?.id) {
      toast(
        `?? ¡Estás muy cerca! Solo faltan $${faltante.toLocaleString()} para tu meta`,
        {
          duration: 4000,
          icon: '??',
          style: {
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      )
      
      setNotificacionesActivas(prev => new Set([...prev, notifKey]))
    }
  }, [user, notificacionesActivas])

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('meta-notificaciones')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vuelos'
        },
        async (payload) => {
          const { new: nuevoVuelo } = payload
          
          if (nuevoVuelo && nuevoVuelo.created_by) {
            // Recalcular fee del mes para el usuario afectado
            const { data: vuelosMes } = await supabase
              .from('vuelos')
              .select(`
                created_at,
                pasajeros:vuelos_pasajeros(fee_agencia),
                creator:profiles!created_by(
                  agencia_usuario:usuario_agencias(
                    is_primary, 
                    agencia:agencias!agencia_id(id, codigo)
                  )
                )
              `)
              .eq('created_by', nuevoVuelo.created_by)
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
              .neq('estado', 'CANCELADO')

            let feeTotal = 0
            let agenciaCodigo = 'SIN_AGENCIA'
            
            vuelosMes.forEach(vuelo => {
              if (vuelo.pasajeros) {
                vuelo.pasajeros.forEach(p => {
                  feeTotal += parseFloat(p.fee_agencia) || 0
                })
              }
              
              if (vuelo.creator?.agencia_usuario) {
                const agenciaPrimaria = vuelo.creator.agencia_usuario.find(au => au.is_primary)
                if (agenciaPrimaria?.agencia) {
                  agenciaCodigo = agenciaPrimaria.agencia.codigo
                }
              }
            })
            
            // Determinar meta según agencia
            const meta = getMetaPorAgencia(agenciaCodigo)
            
            // Verificar notificaciones
            await verificarMetaAlcanzada(nuevoVuelo.created_by, feeTotal, meta)
            await verificarCercaDeMeta(nuevoVuelo.created_by, feeTotal, meta)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, verificarMetaAlcanzada, verificarCercaDeMeta])

  // Resetear notificaciones activas cada mes
  useEffect(() => {
    const resetMensual = () => {
      setNotificacionesActivas(new Set())
      setUltimaVerificacion(new Date())
    }

    // Resetear el día 1 de cada mes
    const ahora = new Date()
    const diaDelMes = ahora.getDate()
    const hora = ahora.getHours()
    
    if (diaDelMes === 1 && hora === 0) {
      resetMensual()
    }
  }, [])

  return {
    notificacionesActivas,
    ultimaVerificacion
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/hooks/useMetaNotifications.js
git commit -m "feat: create real-time notifications hook for meta achievements"
```

---

### Task 12: Activate Notifications in Layout

**Files:**
- Modify: `dashboard/src/app/(crm)/layout.js`

- [ ] **Step 1: Add notifications hook**

```javascript
// Add at top with other imports
import { useMetaNotifications } from '@/hooks/useMetaNotifications'

// Add inside CRMLayout component
export default function CRMLayout({ children }) {
  // ... existing hooks ...

  // NUEVO: Activar sistema de notificaciones de metas
  useMetaNotifications()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... rest of layout ... */}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/layout.js
git commit -m "feat: activate meta notifications system in CRM layout"
```

---

### Task 13: Test Complete System

**Files:**
- Test: All components and endpoints

- [ ] **Step 1: Test backend endpoints**

```bash
# Test global ranking with new data
curl -s "http://localhost:4000/api/rankings/global" | jq '.general[0] | {nombre, agenciaCodigo, metaIndividual, feeAgenciaTotal, progresoMeta, alcanzoMeta}'

# Test personal endpoint
USER_ID=$(curl -s "http://localhost:4000/api/rankings/global" | jq -r '.general[0].id')
curl -s "http://localhost:4000/api/rankings/personal/$USER_ID" | jq '{usuario, mensual, quincenal}'
```

Expected: Both endpoints return gamified data with agency info, progress, and projections

- [ ] **Step 2: Test frontend components**

```bash
# Start dashboard if not running
cd dashboard && npm run dev

# Navigate to http://localhost:3000 and verify:
# 1. Ranking global shows progress bars
# 2. Header shows personal progress bar
# 3. Agency badges are displayed
# 4. Progress percentages are calculated correctly
```

Expected: All UI components render correctly with gamification features

- [ ] **Step 3: Test notifications**

```bash
# Create a test sale to trigger notifications
# Monitor browser console for notification events
# Verify toast notifications appear for meta achievements
```

Expected: Real-time notifications work when users reach or approach goals

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete gamified ranking system implementation

- Backend: Monthly filters, agency data, personal endpoint
- Frontend: Progress bars, personal header, real-time notifications
- Features: Meta tracking, commission calculation, projections
- UI: Agency badges, gamification elements, responsive design

Closes: #ranking-gamification"
```

---

## Testing Strategy

### Backend Tests
- Verify monthly date filtering works correctly
- Test agency-based meta calculation
- Validate commission percentages (12% vs 15%)
- Check personal endpoint data accuracy

### Frontend Tests
- Progress bar animations and visual states
- Personal header expand/collapse functionality
- Agency badge color coding
- Notification toast appearance and styling

### Integration Tests
- Real-time updates when new sales are recorded
- Monthly reset behavior (test with date manipulation)
- Cross-component data consistency
- Responsive design on mobile devices

### Performance Tests
- Ranking query performance with monthly filters
- Real-time subscription efficiency
- Component render optimization
- Memory usage with notifications

---

Plan complete and saved to `docs/2025-04-09-ranking-gamificado.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
