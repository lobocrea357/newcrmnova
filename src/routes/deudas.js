import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/deudas-proveedores - Listar deudas con proveedores
 */
router.get('/', async (req, res) => {
  try {
    const { proveedor, estado } = req.query;

    let query = supabase
      .from('deudas_proveedores')
      .select(`
        *,
        vuelo:vuelos(id, ruta, pax_nombre, localizador),
        pagos:pagos_deudas(*)
      `)
      .order('created_at', { ascending: false });

    if (proveedor) {
      query = query.eq('proveedor', proveedor);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data: deudas, error } = await query;

    if (error) throw error;

    // Calcular resumen
    const resumen = {
      total_adeudado: deudas.reduce((sum, d) => sum + parseFloat(d.monto_deuda), 0),
      total_pagado: deudas.reduce((sum, d) => 
        sum + (parseFloat(d.monto_deuda) - parseFloat(d.saldo_pendiente)), 0
      ),
      total_pendiente: deudas.reduce((sum, d) => sum + parseFloat(d.saldo_pendiente), 0)
    };

    res.json({
      deudas,
      resumen
    });

  } catch (error) {
    console.error('Error en GET /api/deudas-proveedores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/deudas-proveedores/pagos - Registrar pago de deuda
 */
router.post('/pagos', async (req, res) => {
  try {
    const {
      deuda_id,
      monto_pagado,
      moneda,
      metodo_pago,
      referencia_pago,
      comprobante_url,
      fecha_pago,
      registrado_por,
      observaciones
    } = req.body;

    // Validaciones
    if (!deuda_id || !monto_pagado || !fecha_pago || !registrado_por) {
      return res.status(400).json({
        error: 'deuda_id, monto_pagado, fecha_pago y registrado_por son requeridos'
      });
    }

    // Validar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', registrado_por)
      .single();

    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];
    if (!rolesPermitidos.includes(profile?.role?.name)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener deuda actual
    const { data: deuda, error: errorDeuda } = await supabase
      .from('deudas_proveedores')
      .select('*')
      .eq('id', deuda_id)
      .single();

    if (errorDeuda) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    // Registrar pago
    const { data: pago, error: errorPago } = await supabase
      .from('pagos_deudas')
      .insert({
        deuda_id,
        monto_pagado: parseFloat(monto_pagado),
        moneda: moneda || 'USD',
        metodo_pago,
        referencia_pago,
        comprobante_url,
        fecha_pago,
        registrado_por,
        observaciones
      })
      .select()
      .single();

    if (errorPago) throw errorPago;

    // Actualizar saldo de deuda
    const nuevoSaldo = parseFloat(deuda.saldo_pendiente) - parseFloat(monto_pagado);
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO_TOTAL' : 'PAGADO_PARCIAL';

    const { data: deudaActualizada, error: errorUpdate } = await supabase
      .from('deudas_proveedores')
      .update({
        saldo_pendiente: nuevoSaldo > 0 ? nuevoSaldo : 0,
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', deuda_id)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      pago,
      deuda_actualizada: deudaActualizada
    });

  } catch (error) {
    console.error('Error en POST /api/deudas-proveedores/pagos:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
