import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Usar Service Role Key para operaciones del servidor (bypasea RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const search = searchParams.get('search');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('anulables')
      .select(`
        *,
        vuelo:vuelos(
          id,
          pax_nombre,
          ruta,
          fecha_vuelo,
          localizador,
          monto_venta,
          aerolinea_codigo
        )
      `, { count: 'exact' });

    if (estado) {
      query = query.eq('estado_anulacion', estado);
    }

    if (search) {
      query = query.or(`pax_nombre.ilike.%${search}%,localizador.ilike.%${search}%,ruta.ilike.%${search}%`);
    }

    if (fecha_desde) {
      query = query.gte('fecha_limite', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_limite', fecha_hasta);
    }

    query = query
      .order('fecha_limite', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching anulables:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    console.error('Error in GET /api/anulables:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('anulables')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating anulable:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ anulable: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/anulables:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
