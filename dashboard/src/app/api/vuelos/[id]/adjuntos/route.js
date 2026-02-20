import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { data: adjuntos, error } = await supabase
      .from('vuelos_adjuntos')
      .select('*')
      .eq('vuelo_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching adjuntos:', error);
      return NextResponse.json(
        { error: 'Error al obtener adjuntos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ adjuntos });
  } catch (error) {
    console.error('Error in GET /api/vuelos/[id]/adjuntos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    console.log('📎 POST /api/vuelos/[id]/adjuntos - Params:', params);
    console.log('📎 Vuelo ID recibido:', id);
    
    // Validar que el ID sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      console.error('❌ ID de vuelo inválido:', id);
      return NextResponse.json(
        { error: 'ID de vuelo inválido', receivedId: id },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    
    const file = formData.get('file');
    const tipo_adjunto = formData.get('tipo_adjunto');
    const uploaded_by = formData.get('uploaded_by');

    console.log('📎 Archivo:', file?.name, 'Tipo:', tipo_adjunto, 'Tamaño:', file?.size);

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo no proporcionado' },
        { status: 400 }
      );
    }

    if (!tipo_adjunto || !['COMPROBANTE_PAGO', 'PASAPORTE'].includes(tipo_adjunto)) {
      return NextResponse.json(
        { error: 'Tipo de adjunto inválido' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedFilename}`;
    const folder = tipo_adjunto === 'COMPROBANTE_PAGO' ? 'comprobantes' : 'pasaportes';
    const path = `${folder}/${id}/${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vuelos-adjuntos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir archivo', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('vuelos-adjuntos')
      .getPublicUrl(path);

    const adjuntoData = {
      vuelo_id: id,
      tipo_adjunto,
      nombre_archivo: file.name,
      url_storage: urlData.publicUrl,
      mime_type: file.type,
      tamano_bytes: file.size,
      uploaded_by,
    };

    console.log('💾 Insertando adjunto en BD:', {
      vuelo_id: id,
      tipo_adjunto,
      nombre_archivo: file.name,
      uploaded_by
    });

    const { data: adjunto, error: dbError } = await supabase
      .from('vuelos_adjuntos')
      .insert([adjuntoData])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error creating adjunto record:', dbError);
      
      // Eliminar archivo del storage si falla la BD
      await supabase.storage
        .from('vuelos-adjuntos')
        .remove([path]);

      return NextResponse.json(
        { error: 'Error al guardar adjunto', details: dbError.message, code: dbError.code },
        { status: 500 }
      );
    }

    console.log('✅ Adjunto guardado exitosamente en BD:', adjunto.id);

    return NextResponse.json(
      { adjunto, message: 'Adjunto subido exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/vuelos/[id]/adjuntos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const adjunto_id = searchParams.get('adjunto_id');

    if (!adjunto_id) {
      return NextResponse.json(
        { error: 'ID de adjunto no proporcionado' },
        { status: 400 }
      );
    }

    const { data: adjunto, error: fetchError } = await supabase
      .from('vuelos_adjuntos')
      .select('url_storage')
      .eq('id', adjunto_id)
      .eq('vuelo_id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Adjunto no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching adjunto:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener adjunto', details: fetchError.message },
        { status: 500 }
      );
    }

    const urlParts = adjunto.url_storage.split('/vuelos-adjuntos/');
    const path = urlParts[1];

    if (path) {
      const { error: storageError } = await supabase.storage
        .from('vuelos-adjuntos')
        .remove([path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    const { error: deleteError } = await supabase
      .from('vuelos_adjuntos')
      .delete()
      .eq('id', adjunto_id);

    if (deleteError) {
      console.error('Error deleting adjunto record:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar adjunto', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Adjunto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error in DELETE /api/vuelos/[id]/adjuntos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
