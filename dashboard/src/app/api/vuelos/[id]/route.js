import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularFee } from '@/lib/utils/vuelos-calculations';

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

    const { data: vuelo, error } = await supabase
      .from('vuelos')
      .select(`
        *,
        adjuntos:vuelos_adjuntos(*),
        anulable:anulables(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vuelo no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching vuelo:', error);
      return NextResponse.json(
        { error: 'Error al obtener vuelo', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ vuelo });
  } catch (error) {
    console.error('Error in GET /api/vuelos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const { data: existingVuelo, error: fetchError } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vuelo no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching vuelo:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener vuelo', details: fetchError.message },
        { status: 500 }
      );
    }

    if (body.monto_venta !== undefined || body.monto_sabre !== undefined || 
        body.monto_expedia !== undefined || body.monto_emision !== undefined) {
      body.monto_fee = calcularFee(
        body.monto_venta ?? existingVuelo.monto_venta,
        body.monto_sabre ?? existingVuelo.monto_sabre,
        body.monto_expedia ?? existingVuelo.monto_expedia,
        body.monto_emision ?? existingVuelo.monto_emision
      );
    }

    const { data: vuelo, error: updateError } = await supabase
      .from('vuelos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vuelo:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar vuelo', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vuelo,
      message: 'Vuelo actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error in PUT /api/vuelos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { data: vuelo, error: fetchError } = await supabase
      .from('vuelos')
      .select('anulable_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vuelo no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching vuelo:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener vuelo', details: fetchError.message },
        { status: 500 }
      );
    }

    if (vuelo.anulable_id) {
      const { error: anulableError } = await supabase
        .from('anulables')
        .delete()
        .eq('id', vuelo.anulable_id);

      if (anulableError) {
        console.error('Error deleting anulable:', anulableError);
      }
    }

    const { error: deleteError } = await supabase
      .from('vuelos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting vuelo:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar vuelo', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vuelo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error in DELETE /api/vuelos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
