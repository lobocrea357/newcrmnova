import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service role key para acceso completo sin RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * API Route para obtener mensajes de un chat
 * Server-side para evitar problemas de CORS/RLS
 */
export async function POST(request) {
  try {
    const { chatId, chatWhatsAppId, limit = 30 } = await request.json();

    if (!chatId && !chatWhatsAppId) {
      return NextResponse.json(
        { error: 'chatId o chatWhatsAppId es requerido' },
        { status: 400 }
      );
    }

    console.log(`📥 [get-messages] Obteniendo ${limit} mensajes`);
    console.log(`   Chat UUID: ${chatId}`);
    console.log(`   Chat WhatsApp ID: ${chatWhatsAppId}`);
    console.log(`   Service Key presente: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    // Primero, obtener información del chat
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('id, chat_id, contact_name')
      .eq('id', chatId)
      .single();

    if (chatError) {
      console.error('❌ Chat no encontrado:', chatError);
      return NextResponse.json(
        { error: 'Chat no encontrado', details: chatError.message },
        { status: 404 }
      );
    }

    console.log(`   ✓ Chat encontrado: ${chatData.contact_name || 'Sin nombre'}`);
    console.log(`   ✓ chat_id en BD: ${chatData.chat_id}`);

    // IMPORTANTE: La tabla messages usa chat_id (WhatsApp ID) NO el UUID
    const whatsappChatId = chatWhatsAppId || chatData.chat_id;
    
    if (!whatsappChatId) {
      console.error('❌ No se pudo determinar el chat_id de WhatsApp');
      return NextResponse.json(
        { error: 'No se pudo determinar el chat_id de WhatsApp' },
        { status: 400 }
      );
    }

    console.log(`   🔍 Consultando mensajes con chat_id: ${whatsappChatId}`);

    // Consultar mensajes usando el chat_id de WhatsApp
    const { data, error, count } = await supabase
      .from('messages')
      .select('from_me, body, content, timestamp, type', { count: 'exact' })
      .eq('chat_id', whatsappChatId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo mensajes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 500 }
      );
    }

    console.log(`   ✅ ${data?.length || 0} mensajes obtenidos de ${count || 0} totales`);
    
    if (data && data.length > 0) {
      console.log(`   ✓ Primer mensaje: "${data[0].body?.substring(0, 50) || '[sin body]'}..."`);
    } else if (count > 0) {
      console.warn(`   ⚠️ Hay ${count} mensajes pero no se cargaron - posible problema de RLS`);
    } else {
      console.warn(`   ⚠️ No hay mensajes en la BD para este chat`);
    }

    return NextResponse.json({
      messages: data || [],
      count: data?.length || 0,
      totalInDb: count || 0,
    });
  } catch (error) {
    console.error('❌ Error en /api/get-messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
