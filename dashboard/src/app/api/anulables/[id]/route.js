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

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('anulables')
      .select(`
        *,
        vuelo:vuelos(
          id,
          pax_nombre,
          num_adultos,
          num_ninos,
          num_infantes,
          contacto_nombre,
          contacto_telefono,
          fecha_vuelo,
          ruta,
          horario,
          aerolinea_codigo,
          aerolinea_nombre,
          localizador,
          proveedor,
          monto_venta,
          monto_sabre,
          monto_expedia,
          monto_emision,
          monto_fee,
          metodo_pago,
          tipo_vuelo,
          observaciones
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Anulable no encontrado' }, { status: 404 });
      }
      console.error('Error fetching anulable:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ anulable: data });
  } catch (error) {
    console.error('Error in GET /api/anulables/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('anulables')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating anulable:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ anulable: data });
  } catch (error) {
    console.error('Error in PUT /api/anulables/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('anulables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting anulable:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Anulable eliminado exitosamente' });
  } catch (error) {
    console.error('Error in DELETE /api/anulables/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
