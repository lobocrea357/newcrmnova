import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/metricas/emisiones
router.get('/emisiones', async (req, res) => {
  try {
    const { periodo = 'semana' } = req.query;

    // Calcular fecha de inicio según periodo
    const ahora = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
        break;
      case 'mes':
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1));
        break;
      default:
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
    }

    // Métricas de autorizaciones
    const { data: vuelosAutorizados, error: errorAutorizados } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada, fecha_autorizacion_emision')
      .eq('autorizado_emision', true)
      .gte('fecha_autorizacion_emision', fechaInicio.toISOString());

    // Métricas de emisiones completadas
    const { data: vuelosEmitidos, error: errorEmitidos } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada, updated_at')
      .eq('estado', 'EMITIDO')
      .gte('updated_at', fechaInicio.toISOString());

    // Vuelos pendientes de autorización
    const { data: vuelosPendientes, error: errorPendientes } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada')
      .eq('autorizado_emision', false)
      .in('estado', ['PENDIENTE_EMISION']);

    // Deudas por proveedor
    const { data: deudas, error: errorDeudas } = await supabase
      .from('deudas_proveedores')
      .select('proveedor, monto_deuda, saldo_pendiente, estado')
      .in('estado', ['PENDIENTE', 'PAGADO_PARCIAL']);

    // Distribución por cuenta
    const distribucionCuenta = {};
    vuelosAutorizados?.forEach(v => {
      const cuenta = v.cuenta_emision_asignada || 'Sin cuenta';
      distribucionCuenta[cuenta] = (distribucionCuenta[cuenta] || 0) + 1;
    });

    // Deudas por proveedor
    const deudasPorProveedor = {};
    deudas?.forEach(d => {
      const proveedor = d.proveedor;
      if (!deudasPorProveedor[proveedor]) {
        deudasPorProveedor[proveedor] = {
          total: 0,
          pendiente: 0
        };
      }
      deudasPorProveedor[proveedor].total += d.monto_deuda;
      deudasPorProveedor[proveedor].pendiente += d.saldo_pendiente;
    });

    res.json({
      periodo,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: new Date().toISOString(),
      autorizados: {
        total: vuelosAutorizados?.length || 0,
        por_cuenta: distribucionCuenta
      },
      emitidos: {
        total: vuelosEmitidos?.length || 0
      },
      pendientes: {
        total: vuelosPendientes?.length || 0
      },
      deudas: {
        por_proveedor: deudasPorProveedor,
        total_pendiente: Object.values(deudasPorProveedor).reduce((sum, d) => sum + d.pendiente, 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
