import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createModel, evaluateChat } from '@/lib/server/evaluator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GATEWAY = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL;

/**
 * Evalúa ahora una conversación con el mismo motor que la auditoría continua.
 * Todo se hace con el token del usuario: el gateway decide si puede ver ese chat
 * (RBAC) y la evaluación queda guardada como las automáticas.
 */
export async function POST(request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!process.env.GOOGLE_API_KEY) return NextResponse.json({ error: 'Falta GOOGLE_API_KEY en el servidor' }, { status: 500 });

  let chatId;
  try {
    ({ chatId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }
  if (!chatId) return NextResponse.json({ error: 'Falta chatId' }, { status: 400 });

  const gw = async (path, body, method = 'POST') => {
    const r = await fetch(`${GATEWAY}/api/data/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.message || `gateway ${r.status}`), { status: r.status });
    return j.data;
  };
  const eq = (column, value) => [{ column, op: 'eq', value }];

  try {
    const chat = await gw('chats/query', { select: 'id, bot_id, contact_number', filters: eq('id', chatId), maybeSingle: true });
    if (!chat) return NextResponse.json({ error: 'Conversación no encontrada o fuera de tu alcance' }, { status: 404 });

    const messages = await gw('messages/query', {
      select: 'body, caption, type, from_me, timestamp, metadata',
      filters: eq('chat_id', chatId),
      order: [{ column: 'timestamp', ascending: true }],
    });
    if (!messages?.length || messages.length < 3) {
      return NextResponse.json({ error: 'La conversación es demasiado corta para evaluarla' }, { status: 422 });
    }

    const model = createModel(new GoogleGenerativeAI(process.env.GOOGLE_API_KEY));
    const { _estado, ...fields } = await evaluateChat(model, messages);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const prev = await gw('conversation_evaluations/query', {
      select: 'id, evaluation_date',
      filters: [...eq('chat_id', chatId), { column: 'evaluation_date', op: 'gte', value: startOfDay.toISOString() }],
      order: [{ column: 'evaluation_date', ascending: false }],
      limit: 1,
    });
    const values = {
      ...fields,
      chat_id: chatId,
      bot_id: chat.bot_id,
      numero_telefono: chat.contact_number,
      generated_by: 'manual',
      evaluation_date: new Date().toISOString(),
    };
    const saved = prev?.[0]
      ? await gw('conversation_evaluations', { values, filters: eq('id', prev[0].id), select: 'id', single: true }, 'PATCH')
      : await gw('conversation_evaluations/insert', { values, select: 'id' });
    const id = Array.isArray(saved) ? saved[0]?.id : saved?.id;
    return NextResponse.json({ data: { id, estado: _estado, percentage: fields.percentage } });
  } catch (e) {
    console.error('evaluar chat:', e.message);
    const status = e.status === 403 || e.status === 404 ? e.status : 500;
    return NextResponse.json({ error: status === 500 ? 'No se pudo evaluar la conversación. Inténtalo de nuevo.' : e.message }, { status });
  }
}
