import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/rankings/global
 * Devuelve el ranking global de ventas agrupado por asesor/gerente y equipo
 */
router.get('/global', async (req, res) => {
  try {
    // Obtener todos los vuelos con info del creador y su equipo
    const { data: vuelos, error: vuelosError } = await supabase
      .from('vuelos')
      .select(`
        id,
        estado,
        monto_venta,
        created_by,
        created_at,
        ruta,
        creator:profiles!created_by(
          id,
          full_name,
          email,
          equipo_id,
          equipo:equipos!equipo_id(id, nombre, color),
          role:roles(id, name)
        )
      `)
      .neq('estado', 'CANCELADO');

    if (vuelosError) throw vuelosError;

    // Agrupar por usuario
    const porUsuario = {};
    (vuelos || []).forEach(vuelo => {
      const userId = vuelo.created_by;
      const creator = vuelo.creator;
      if (!creator) return;

      if (!porUsuario[userId]) {
        porUsuario[userId] = {
          id: userId,
          nombre: creator.full_name || 'Sin nombre',
          email: creator.email || '',
          rol: creator.role?.name?.toLowerCase() || 'asesor',
          equipoId: creator.equipo_id || null,
          equipoNombre: creator.equipo?.nombre || null,
          equipoColor: creator.equipo?.color || '#6366f1',
          totalVuelos: 0,
          emitidos: 0,
          pendientesPago: 0,
          pendientesEmision: 0,
          montoTotal: 0
        };
      }

      const u = porUsuario[userId];
      u.totalVuelos += 1;
      u.montoTotal += parseFloat(vuelo.monto_venta) || 0;

      if (vuelo.estado === 'EMITIDO') u.emitidos += 1;
      if (vuelo.estado === 'PENDIENTE_CONFIRMACION_PAGO') u.pendientesPago += 1;
      if (vuelo.estado === 'PENDIENTE_EMISION') u.pendientesEmision += 1;
    });

    // Calcular % conversión y separar en asesores/gerentes
    const todos = Object.values(porUsuario).map(u => ({
      ...u,
      porcentajeConversion: u.totalVuelos > 0
        ? parseFloat(((u.emitidos / u.totalVuelos) * 100).toFixed(1))
        : 0
    }));

    const asesores = todos
      .filter(u => u.rol === 'asesor' || u.rol === 'advisor')
      .sort((a, b) => b.emitidos - a.emitidos);

    const gerentes = todos
      .filter(u => u.rol === 'gerente' || u.rol === 'manager' || u.rol === 'admin')
      .sort((a, b) => b.emitidos - a.emitidos);

    // Agrupar por equipo
    const porEquipo = {};
    todos.forEach(u => {
      if (!u.equipoId) {
        if (!porEquipo['sin-equipo']) {
          porEquipo['sin-equipo'] = {
            id: 'sin-equipo',
            nombre: 'Sin equipo',
            color: '#9ca3af',
            totalEmitidos: 0,
            montoTotal: 0,
            miembros: []
          };
        }
        porEquipo['sin-equipo'].totalEmitidos += u.emitidos;
        porEquipo['sin-equipo'].montoTotal += u.montoTotal;
        porEquipo['sin-equipo'].miembros.push(u);
        return;
      }

      if (!porEquipo[u.equipoId]) {
        porEquipo[u.equipoId] = {
          id: u.equipoId,
          nombre: u.equipoNombre || 'Equipo',
          color: u.equipoColor,
          totalEmitidos: 0,
          montoTotal: 0,
          miembros: []
        };
      }
      porEquipo[u.equipoId].totalEmitidos += u.emitidos;
      porEquipo[u.equipoId].montoTotal += u.montoTotal;
      porEquipo[u.equipoId].miembros.push(u);
    });

    // Ordenar miembros dentro de cada equipo
    Object.values(porEquipo).forEach(eq => {
      eq.miembros.sort((a, b) => b.emitidos - a.emitidos);
    });

    const equipos = Object.values(porEquipo).sort((a, b) => b.totalEmitidos - a.totalEmitidos);

    // Top performers
    const topAsesor = asesores[0] || null;
    const topGerente = gerentes[0] || null;
    const general = todos.sort((a, b) => b.emitidos - a.emitidos);

    res.json({
      general,
      asesores,
      gerentes,
      equipos,
      topAsesor,
      topGerente,
      totalVuelos: vuelos?.length || 0,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en GET /api/rankings/global:', error);
    res.status(500).json({
      error: 'Error al obtener ranking global',
      details: error.message
    });
  }
});

export default router;
