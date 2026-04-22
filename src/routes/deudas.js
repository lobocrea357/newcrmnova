import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { subirComprobantePago } from '../services/storageService.js';

const router = express.Router();

// Configurar multer para memoria (no guardar en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, PNG, JPG.'));
    }
  }
});

/**
 * GET /api/deudas-proveedores - Listar deudas con proveedores
 */
router.get('/', async (req, res) => {
  try {
    const {
      proveedor,
      estado,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Query base con paginación
    let query = supabase
      .from('deudas_proveedores')
      .select(`
        *,
        vuelo:vuelos(id, ruta, pax_nombre, estado)
      `,
      { count: 'exact' }
      );

    // Filtros
    if (proveedor) {
      query = query.eq('proveedor', proveedor);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Paginación
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Calcular totales
    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      deudas: data || [],
      pagination: {
        current_page: parseInt(page),
        per_page: limitNum,
        total,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error en GET /api/deudas-proveedores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/deudas-proveedores/pagos - Registrar pago de deuda (con upload de comprobante)
 */
router.post('/pagos', upload.single('comprobante'), async (req, res) => {
  try {
    const {
      deuda_id,
      monto_pagado,
      moneda,
      metodo_pago,
      referencia_pago,
      fecha_pago,
      registrado_por,
      observaciones
    } = req.body;

    const userId = req.user?.id || registrado_por;

    // Validaciones
    if (!deuda_id || !monto_pagado || !fecha_pago || !userId) {
      return res.status(400).json({
        error: 'deuda_id, monto_pagado, fecha_pago y registrado_por son requeridos'
      });
    }

    // Validar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', userId)
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

    // Subir comprobante si se proporcionó
    let comprobanteUrl = null;
    if (req.file) {
      const uploadResult = await subirComprobantePago(
        req.file,
        deuda_id,
        userId
      );
      comprobanteUrl = uploadResult.url;
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
        comprobante_url: comprobanteUrl,
        fecha_pago,
        registrado_por: userId,
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
