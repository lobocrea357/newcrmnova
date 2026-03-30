import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/rankings/global?moneda=USD|EUR
 * Devuelve el ranking global de ventas agrupado por asesor/gerente y equipo
 * Incluye fee_agencia_total y convierte montos según moneda solicitada
 */
router.get('/global', async (req, res) => {
  try {
    const monedaVista = req.query.moneda || 'USD'; // USD o EUR

    // Obtener vuelos + pasajeros + equipos + tasas en paralelo
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
            role:roles(id, name)
          )
        `)
        .neq('estado', 'CANCELADO'),
      supabase
        .from('equipos')
        .select('id, nombre, color, gerente_id')
        .eq('is_active', true),
      supabase
        .from('tasas_conversion')
        .select(`
          tasa,
          moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(codigo),
          moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(codigo)
        `)
        .eq('activa', true)
    ]);

    const { data: vuelos, error: vuelosError } = vuelosResult;
    const { data: equiposRaw } = equiposResult;
    const { data: tasasRaw } = tasasResult;

    if (vuelosError) throw vuelosError;

    // Crear mapa de tasas para conversión rápida
    const tasasMap = {};
    (tasasRaw || []).forEach(t => {
      const origen = t.moneda_origen?.codigo;
      const destino = t.moneda_destino?.codigo;
      if (origen && destino) {
        tasasMap[`${origen}_${destino}`] = t.tasa;
      }
    });

    // Función helper para convertir entre monedas
    const convertirMoneda = (monto, monedaOrigen, monedaDestino) => {
      if (!monto || monedaOrigen === monedaDestino) return monto;
      
      // Buscar tasa directa
      const tasaDirecta = tasasMap[`${monedaOrigen}_${monedaDestino}`];
      if (tasaDirecta) return monto * tasaDirecta;
      
      // Buscar tasa inversa
      const tasaInversa = tasasMap[`${monedaDestino}_${monedaOrigen}`];
      if (tasaInversa) return monto / tasaInversa;
      
      // Si no hay tasa, retornar el monto original
      console.warn(`No se encontró tasa entre ${monedaOrigen} y ${monedaDestino}`);
      return monto;
    };

    // Mapa de equipo_id → equipo data y set de gerente_ids (sin hardcodear roles)
    const equiposMap = {};
    const gerenteIds = new Set();
    (equiposRaw || []).forEach(eq => {
      equiposMap[eq.id] = eq;
      if (eq.gerente_id) gerenteIds.add(eq.gerente_id);
    });

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
          montoTotal: 0,
          feeAgenciaTotal: 0
        };
      }

      const u = porUsuario[userId];
      u.totalVuelos += 1;

      // Calcular monto en la moneda de vista (USD o EUR)
      // Si total_cotizacion existe, usarlo (está en moneda_precio: USD o EUR)
      if (vuelo.total_cotizacion && vuelo.moneda_precio) {
        const montoEnMonedaVista = convertirMoneda(
          vuelo.total_cotizacion,
          vuelo.moneda_precio,
          monedaVista
        );
        u.montoTotal += parseFloat(montoEnMonedaVista) || 0;
      } else {
        // Fallback a monto_venta si no hay total_cotizacion
        u.montoTotal += parseFloat(vuelo.monto_venta) || 0;
      }

      // Sumar fee_agencia de todos los pasajeros (cantidad fija sin moneda)
      if (vuelo.pasajeros && Array.isArray(vuelo.pasajeros)) {
        vuelo.pasajeros.forEach(pasajero => {
          u.feeAgenciaTotal += parseFloat(pasajero.fee_agencia) || 0;
        });
      }

      if (vuelo.estado === 'EMITIDO') u.emitidos += 1;
      if (vuelo.estado === 'PENDIENTE_CONFIRMACION_PAGO') u.pendientesPago += 1;
      if (vuelo.estado === 'PENDIENTE_EMISION') u.pendientesEmision += 1;
    });

    // Calcular % conversión
    const todos = Object.values(porUsuario).map(u => ({
      ...u,
      porcentajeConversion: u.totalVuelos > 0
        ? parseFloat(((u.emitidos / u.totalVuelos) * 100).toFixed(1))
        : 0
    }));

    // Ordenar por cantidad de ventas registradas (totalVuelos) → emitidos → montoTotal
    const sortByVentas = (a, b) => {
      if (b.totalVuelos !== a.totalVuelos) return b.totalVuelos - a.totalVuelos;
      if (b.emitidos !== a.emitidos) return b.emitidos - a.emitidos;
      return b.montoTotal - a.montoTotal;
    };

    // Separar asesores de gerentes usando gerenteIds del DB (sin hardcodear roles)
    const asesores = todos
      .filter(u => !gerenteIds.has(u.id))
      .sort(sortByVentas);

    const gerentes = todos
      .filter(u => gerenteIds.has(u.id))
      .sort(sortByVentas);

    // Agrupar por equipo — SOLO usuarios que pertenecen a un equipo (equipo_id != null)
    // Los gerentes gestionan equipos pero no son miembros (no tienen equipo_id), por lo que quedan fuera naturalmente
    const porEquipo = {};
    todos
      .filter(u => u.equipoId !== null)
      .forEach(u => {
        if (!porEquipo[u.equipoId]) {
          porEquipo[u.equipoId] = {
            id: u.equipoId,
            nombre: u.equipoNombre || 'Equipo',
            color: u.equipoColor,
            totalVuelos: 0,
            totalEmitidos: 0,
            montoTotal: 0,
            feeAgenciaTotal: 0,
            miembros: []
          };
        }
        porEquipo[u.equipoId].totalVuelos += u.totalVuelos;
        porEquipo[u.equipoId].totalEmitidos += u.emitidos;
        porEquipo[u.equipoId].montoTotal += u.montoTotal;
        porEquipo[u.equipoId].feeAgenciaTotal += u.feeAgenciaTotal;
        porEquipo[u.equipoId].miembros.push(u);
      });

    // Ordenar miembros dentro de cada equipo
    Object.values(porEquipo).forEach(eq => {
      eq.miembros.sort(sortByVentas);
    });

    // Ordenar equipos: por totalVuelos → totalEmitidos → montoTotal
    const equipos = Object.values(porEquipo).sort((a, b) => {
      if (b.totalVuelos !== a.totalVuelos) return b.totalVuelos - a.totalVuelos;
      if (b.totalEmitidos !== a.totalEmitidos) return b.totalEmitidos - a.totalEmitidos;
      return b.montoTotal - a.montoTotal;
    });

    // Top performers
    const topAsesor = asesores[0] || null;
    const topGerente = gerentes[0] || null;
    const general = [...todos].sort(sortByVentas);

    res.json({
      general,
      asesores,
      gerentes,
      equipos,
      topAsesor,
      topGerente,
      totalVuelos: vuelos?.length || 0,
      monedaVista,
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
