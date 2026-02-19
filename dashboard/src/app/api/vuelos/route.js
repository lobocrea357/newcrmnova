import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularFee, calcularFechaLimiteAnulacion } from '@/lib/utils/vuelos-calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const tipo_vuelo = searchParams.get('tipo_vuelo');
    const aerolinea_codigo = searchParams.get('aerolinea_codigo');
    const created_by = searchParams.get('created_by');
    const requiere_anulable = searchParams.get('requiere_anulable');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('vuelos')
      .select('*, anulable:anulables(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (fecha_desde) {
      query = query.gte('fecha_vuelo', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_vuelo', fecha_hasta);
    }

    if (tipo_vuelo) {
      query = query.eq('tipo_vuelo', tipo_vuelo);
    }

    if (aerolinea_codigo) {
      query = query.eq('aerolinea_codigo', aerolinea_codigo);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (requiere_anulable !== null && requiere_anulable !== undefined) {
      query = query.eq('requiere_anulable', requiere_anulable === 'true');
    }

    if (search) {
      query = query.or(`pax_nombre.ilike.%${search}%,localizador.ilike.%${search}%,ruta.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching vuelos:', error);
      return NextResponse.json(
        { error: 'Error al obtener vuelos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/vuelos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const monto_fee = calcularFee(
      body.monto_venta,
      body.monto_sabre,
      body.monto_expedia,
      body.monto_emision
    );

    const vueloData = {
      ...body,
      monto_fee,
      created_by: body.created_by,
    };

    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .insert([vueloData])
      .select()
      .single();

    if (vueloError) {
      console.error('Error creating vuelo:', vueloError);
      return NextResponse.json(
        { error: 'Error al crear vuelo', details: vueloError.message },
        { status: 500 }
      );
    }

    if (body.requiere_anulable) {
      const fecha_limite = calcularFechaLimiteAnulacion(body.fecha_vuelo, 7);

      const anulableData = {
        vuelo_id: vuelo.id,
        pax_nombre: body.pax_nombre,
        contacto_nombre: body.contacto_nombre,
        contacto_telefono: body.contacto_telefono,
        fecha_vuelo: body.fecha_vuelo,
        ruta: body.ruta,
        localizador: body.localizador,
        estado_anulacion: 'PENDIENTE',
        fecha_limite,
        observaciones: `Vuelo tipo ${body.tipo_vuelo}${body.observaciones ? ' - ' + body.observaciones : ''}`,
      };

      const { data: anulable, error: anulableError } = await supabase
        .from('anulables')
        .insert([anulableData])
        .select()
        .single();

      if (anulableError) {
        console.error('Error creating anulable:', anulableError);
        return NextResponse.json(
          { error: 'Vuelo creado pero error al crear anulable', details: anulableError.message },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from('vuelos')
        .update({ anulable_id: anulable.id })
        .eq('id', vuelo.id);

      if (updateError) {
        console.error('Error updating vuelo with anulable_id:', updateError);
      }

      return NextResponse.json(
        {
          vuelo: { ...vuelo, anulable_id: anulable.id },
          anulable,
          message: 'Vuelo y anulable creados exitosamente',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { vuelo, message: 'Vuelo creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/vuelos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
