import { NextResponse } from 'next/server';

/**
 * API Route proxy para reintentar transcripciones fallidas
 * Reenvía la solicitud al backend Express
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // En Docker: express:4000, en local: localhost:4000
    const EXPRESS_URL = process.env.EXPRESS_INTERNAL_URL || 'http://express:4000';

    const response = await fetch(`${EXPRESS_URL}/api/media/retry-failed-transcriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Error en proxy retry-failed-transcriptions:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
