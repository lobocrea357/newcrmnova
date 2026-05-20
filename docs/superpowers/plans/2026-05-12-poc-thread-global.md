# PoC Thread Global por Cliente - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Demostrar arquitectura de threads unificados por cliente para resolver conversaciones fragmentadas, con sistema completamente aislado que no afecta funcionalidad actual.

**Architecture:** Sistema paralelo con tablas independientes (prefijo `poc_`), servicio backend que sincroniza threads desde mensajes existentes, y página frontend protegida (super_admin only) que compara vista actual fragmentada vs. vista unificada con métricas agregadas.

**Tech Stack:** Node.js/Express, Supabase, Next.js 14, React, TailwindCSS, Lucide Icons

---

## Contexto del Problema

**Situación Actual:**
- Cliente puede tener múltiples chats en diferentes bots (reasignaciones entre asesores)
- Cada chat tiene métricas independientes → métricas parciales e incorrectas
- Gerentes ven conversaciones fragmentadas → auditorías confusas

**Solución PoC:**
- Thread = concepto global por cliente (phone_number)
- Agrupa todos los chats del mismo cliente
- Métricas calculadas sobre el thread completo (150 msgs reales vs. 50+100 fragmentados)

**Criterios de Éxito:**
- Sistema 100% aislado (no afecta producción)
- Visualización clara de fragmentación
- Comparación lado a lado: actual vs. threads
- Datos correctos y convincentes para demostración

---

## Arquitectura de Archivos

### Backend (API REST)

**Nuevos archivos:**
- `src/services/pocThreadService.js` - Lógica de sincronización y cálculo de métricas
- `src/routes/poc.js` - Endpoints para PoC (GET threads, POST sync)

**Modificados:**
- `src/index.js` - Registrar rutas `/api/poc/*`

### Frontend (Next.js 14)

**Nuevos archivos:**
- `dashboard/src/app/(crm)/conversaciones-poc/page.js` - Página demo principal
- `dashboard/src/components/poc/ThreadRow.jsx` - Componente para mostrar thread
- `dashboard/src/components/poc/ComparisonBadge.jsx` - Badge de comparación

**Consideraciones:**
- Sin RLS en tablas PoC (solo protección frontend super_admin)
- No modificar sistema actual de webhooks
- Sincronización manual bajo demanda (botón)

---

## FASE 1: Backend - Servicio de Threads

### Task 1: Crear servicio PoC de threads

**Files:**
- Create: `src/services/pocThreadService.js`

- [ ] **Paso 1: Crear estructura base del servicio**

```javascript
import { supabase } from '../config/supabase.js';

class PoCThreadService {
  /**
   * Sincroniza threads basándose en chats y mensajes existentes
   * Lee datos actuales sin modificarlos
   */
  async syncThreadsFromMessages() {
    console.log('[PoC Threads] Iniciando sincronización...');

    try {
      const chats = await this._fetchAllChatsWithContacts();
      const threadsByPhone = this._groupChatsByPhone(chats);
      
      let syncedCount = 0;
      for (const phone in threadsByPhone) {
        const threadData = threadsByPhone[phone];
        await this.createOrUpdateThread(threadData);
        syncedCount++;
      }

      console.log(`[PoC Threads] ✅ ${syncedCount} threads sincronizados`);
      return { success: true, count: syncedCount };
    } catch (error) {
      console.error('[PoC Threads] ❌ Error en sincronización:', error);
      throw error;
    }
  }

  async _fetchAllChatsWithContacts() {
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        id,
        created_at,
        contact:contacts(phone_number, name),
        bot:bots(session_name)
      `)
      .not('contact', 'is', null);

    if (error) throw error;
    return chats || [];
  }

  _groupChatsByPhone(chats) {
    const threadsByPhone = {};

    for (const chat of chats) {
      const phone = chat.contact?.phone_number;
      if (!phone) continue;

      if (!threadsByPhone[phone]) {
        threadsByPhone[phone] = {
          customer_phone: phone,
          customer_name: chat.contact?.name,
          chats: []
        };
      }

      threadsByPhone[phone].chats.push({
        chat_id: chat.id,
        bot_name: chat.bot?.session_name,
        started_at: chat.created_at
      });
    }

    return threadsByPhone;
  }

  async createOrUpdateThread(threadData) {
    const { customer_phone, customer_name, chats } = threadData;

    const dates = chats.map(c => new Date(c.started_at)).sort((a, b) => a - b);
    const first_message_at = dates[0]?.toISOString();
    const last_message_at = dates[dates.length - 1]?.toISOString();

    const { data: thread, error: threadError } = await supabase
      .from('poc_customer_threads')
      .upsert({
        customer_phone,
        customer_name,
        first_message_at,
        last_message_at
      }, { onConflict: 'customer_phone' })
      .select()
      .single();

    if (threadError) throw threadError;
    if (!thread) return;

    await this._linkChatsToThread(thread.id, chats);
    await this.calculateThreadMetrics(thread.id);
  }

  async _linkChatsToThread(threadId, chats) {
    const records = chats.map(chat => ({
      thread_id: threadId,
      chat_id: chat.chat_id,
      bot_name: chat.bot_name,
      started_at: chat.started_at
    }));

    for (const record of records) {
      await supabase
        .from('poc_thread_chats')
        .upsert(record, { onConflict: 'thread_id,chat_id' });
    }
  }

  async calculateThreadMetrics(threadId) {
    const { data: threadChats } = await supabase
      .from('poc_thread_chats')
      .select('chat_id, bot_name')
      .eq('thread_id', threadId);

    if (!threadChats || threadChats.length === 0) return;

    const chatIds = threadChats.map(tc => tc.chat_id);
    const advisors = [...new Set(threadChats.map(tc => tc.bot_name).filter(Boolean))];

    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds);

    const { count: paymentMentions } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds)
      .or('body.ilike.%pago%,body.ilike.%transferencia%,body.ilike.%zelle%,body.ilike.%paypal%');

    const { data: cotizacionMessages } = await supabase
      .from('messages')
      .select('body')
      .in('chat_id', chatIds)
      .ilike('body', '%Cotizacion%');

    const cotizacionCount = cotizacionMessages?.length || 0;

    const { data: responseTimes } = await supabase
      .rpc('calculate_poc_response_times', { p_chat_ids: chatIds })
      .single();

    const avgResponseMinutes = responseTimes?.avg_minutes || null;

    await supabase
      .from('poc_thread_metrics')
      .upsert({
        thread_id: threadId,
        total_messages: totalMessages || 0,
        total_chats: threadChats.length,
        advisors,
        avg_response_minutes: avgResponseMinutes,
        payment_mentions: paymentMentions || 0,
        cotizacion_count: cotizacionCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'thread_id' });
  }

  async getThreads(limit = 50) {
    const { data: threads, error } = await supabase
      .from('poc_customer_threads')
      .select(`
        *,
        metrics:poc_thread_metrics(*),
        chats:poc_thread_chats(chat_id, bot_name, started_at)
      `)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return threads || [];
  }
}

export default new PoCThreadService();
```

- [ ] **Paso 2: Commit del servicio**

```bash
git add src/services/pocThreadService.js
git commit -m "feat(poc): add thread sync service for customer conversation unification"
```

---

### Task 2: Crear endpoints REST para PoC

**Files:**
- Create: `src/routes/poc.js`

- [ ] **Paso 1: Crear rutas PoC siguiendo REST principles**

```javascript
import express from 'express';
import pocThreadService from '../services/pocThreadService.js';

const router = express.Router();

/**
 * POST /api/poc/threads/sync
 * Sincroniza threads desde chats existentes
 * @returns {success: boolean, count: number}
 */
router.post('/threads/sync', async (req, res) => {
  try {
    const result = await pocThreadService.syncThreadsFromMessages();
    res.json(result);
  } catch (error) {
    console.error('[PoC API] Error syncing threads:', error);
    res.status(500).json({
      error: 'SyncError',
      message: 'Error sincronizando threads',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads
 * Obtiene threads con métricas y chats vinculados
 * @query {number} limit - Cantidad de threads (default: 50)
 * @returns {data: Thread[]}
 */
router.get('/threads', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Limit debe estar entre 1 y 200'
      });
    }

    const threads = await pocThreadService.getThreads(limit);
    
    res.json({
      data: threads,
      meta: {
        count: threads.length,
        limit
      }
    });
  } catch (error) {
    console.error('[PoC API] Error fetching threads:', error);
    res.status(500).json({
      error: 'FetchError',
      message: 'Error obteniendo threads',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads/stats
 * Estadísticas generales de threads
 * @returns {total: number, fragmented: number, reassignments: number}
 */
router.get('/threads/stats', async (req, res) => {
  try {
    const threads = await pocThreadService.getThreads(1000);
    
    const total = threads.length;
    const fragmented = threads.filter(t => (t.metrics?.[0]?.total_chats || 0) > 1).length;
    const reassignments = threads.reduce((sum, t) => {
      const chatsCount = t.metrics?.[0]?.total_chats || 1;
      return sum + (chatsCount - 1);
    }, 0);

    res.json({
      data: {
        total,
        fragmented,
        reassignments,
        fragmentation_rate: total > 0 ? (fragmented / total * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('[PoC API] Error calculating stats:', error);
    res.status(500).json({
      error: 'StatsError',
      message: 'Error calculando estadísticas'
    });
  }
});

export default router;
```

- [ ] **Paso 2: Registrar rutas en index.js**

Modificar `src/index.js`:

```javascript
// Importar rutas PoC
import pocRoutes from './routes/poc.js';

// ... después de otras rutas
app.use('/api/poc', pocRoutes);
```

- [ ] **Paso 3: Commit de rutas**

```bash
git add src/routes/poc.js src/index.js
git commit -m "feat(poc): add REST endpoints for thread management"
```

---

### Task 3: Crear función SQL para tiempos de respuesta (opcional pero recomendado)

**Files:**
- Execute SQL in Supabase

- [ ] **Paso 1: Crear función RPC para calcular avg response time**

Ejecutar en SQL Editor de Supabase:

```sql
CREATE OR REPLACE FUNCTION calculate_poc_response_times(p_chat_ids UUID[])
RETURNS TABLE (avg_minutes NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH all_messages AS (
    SELECT 
      timestamp,
      from_me
    FROM public.messages
    WHERE chat_id = ANY(p_chat_ids)
    ORDER BY timestamp
  ),
  response_pairs AS (
    SELECT 
      LAG(timestamp) OVER (ORDER BY timestamp) as client_time,
      timestamp as bot_time,
      from_me
    FROM all_messages
  )
  SELECT 
    AVG(EXTRACT(EPOCH FROM (bot_time - client_time)) / 60) as avg_minutes
  FROM response_pairs
  WHERE from_me = true 
    AND client_time IS NOT NULL
    AND EXTRACT(EPOCH FROM (bot_time - client_time)) / 60 BETWEEN 0 AND 10080;
END;
$$ LANGUAGE plpgsql;
```

**Nota:** Si no quieres crear esta función, puedes simplificar el servicio para que `avg_response_minutes` sea NULL por ahora.

- [ ] **Paso 2: Verificar función**

```sql
-- Test con un chat real
SELECT calculate_poc_response_times(ARRAY['<uuid-de-chat-real>']);
```

- [ ] **Paso 3: Commit de cambios**

```bash
git add .
git commit -m "feat(poc): add SQL function for response time calculation"
```

---

## FASE 2: Frontend - Componentes Reutilizables

### Task 4: Crear componente ComparisonBadge

**Files:**
- Create: `dashboard/src/components/poc/ComparisonBadge.jsx`

- [ ] **Paso 1: Crear badge de comparación**

```jsx
import { ArrowRight } from "lucide-react";

export default function ComparisonBadge({ isFragmented, chatsCount }) {
  if (!isFragmented) {
    return (
      <div className="bg-green-50 px-3 py-2 rounded border border-green-200">
        <p className="text-xs text-green-700 font-medium">✓ Sin fragmentación</p>
        <p className="text-[10px] text-green-600">1 conversación continua</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-1">Vista Actual</p>
        <div className="bg-red-50 px-3 py-1 rounded border border-red-200">
          <p className="text-sm font-bold text-red-600">{chatsCount} chats separados</p>
        </div>
      </div>
      
      <ArrowRight className="h-4 w-4 text-gray-400 mx-auto my-1" />
      
      <div>
        <p className="text-xs text-gray-500 mb-1">Vista Thread</p>
        <div className="bg-green-50 px-3 py-1 rounded border border-green-200">
          <p className="text-sm font-bold text-green-600">1 conversación unificada</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Commit del componente**

```bash
git add dashboard/src/components/poc/ComparisonBadge.jsx
git commit -m "feat(poc): add comparison badge component"
```

---

### Task 5: Crear componente ThreadRow

**Files:**
- Create: `dashboard/src/components/poc/ThreadRow.jsx`

- [ ] **Paso 1: Crear componente para mostrar thread**

```jsx
import { MessageSquare, FileText, CreditCard, ArrowRight } from "lucide-react";
import ComparisonBadge from "./ComparisonBadge";

export default function ThreadRow({ thread }) {
  const metrics = thread.metrics?.[0];
  const chats = thread.chats || [];
  const isFragmented = chats.length > 1;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${isFragmented ? 'bg-amber-50 border-l-4 border-amber-400' : ''}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          {/* Customer Info */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {thread.customer_name || 'Sin nombre'}
            </h3>
            <span className="text-sm text-gray-500 font-mono">
              {thread.customer_phone}
            </span>
            {isFragmented && (
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold border border-amber-300">
                🔀 FRAGMENTADO ({chats.length} chats)
              </span>
            )}
          </div>

          {/* Timeline de Reasignaciones */}
          {isFragmented && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Reasignaciones:</span>
              {chats.map((chat, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-200">
                    {chat.bot_name || 'Bot desconocido'}
                  </span>
                  {idx < chats.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Métricas */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded border border-slate-200">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                {metrics?.total_messages || 0}
              </span>
              <span className="text-xs text-gray-500">mensajes</span>
            </div>
            
            {metrics?.cotizacion_count > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {metrics.cotizacion_count}
                </span>
                <span className="text-xs text-green-600">cotización(es)</span>
              </div>
            )}

            {metrics?.payment_mentions > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  {metrics.payment_mentions}
                </span>
                <span className="text-xs text-amber-600">mención(es) pago</span>
              </div>
            )}

            {thread.last_message_at && (
              <span className="text-xs text-gray-500">
                Última actividad: {formatDate(thread.last_message_at)}
              </span>
            )}
          </div>
        </div>

        {/* Comparison Badge */}
        <div className="flex-shrink-0">
          <ComparisonBadge 
            isFragmented={isFragmented} 
            chatsCount={chats.length} 
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Commit del componente**

```bash
git add dashboard/src/components/poc/ThreadRow.jsx
git commit -m "feat(poc): add thread row component with metrics visualization"
```

---

## FASE 3: Frontend - Página Principal

### Task 6: Crear página /conversaciones-poc

**Files:**
- Create: `dashboard/src/app/(crm)/conversaciones-poc/page.js`

- [ ] **Paso 1: Crear página con protección super_admin**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users, MessageSquare, ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import ThreadRow from "@/components/poc/ThreadRow";

export default function ConversacionesPoCPage() {
  const { isSuperAdmin, loading: authLoading } = useUserProfile();
  const [threads, setThreads] = useState([]);
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      window.location.href = '/unauthorized';
    }
  }, [isSuperAdmin, authLoading]);

  const syncThreads = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/poc/threads/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Error syncing');
      
      const result = await response.json();
      console.log('[PoC] Sincronización completa:', result);
      
      await Promise.all([fetchThreads(), fetchStats()]);
    } catch (error) {
      console.error('Error syncing threads:', error);
      alert('Error sincronizando threads. Ver consola.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/poc/threads?limit=100');
      if (!response.ok) throw new Error('Error fetching threads');
      
      const { data } = await response.json();
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/poc/threads/stats');
      if (!response.ok) throw new Error('Error fetching stats');
      
      const { data } = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchThreads();
      fetchStats();
    }
  }, [isSuperAdmin]);

  if (authLoading || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">PoC: Thread Global por Cliente</h1>
              </div>
              <p className="text-purple-100 text-lg">
                Demostración de arquitectura con conversaciones unificadas
              </p>
              <p className="text-purple-200 text-sm mt-1">
                🔒 Solo visible para Super Admins • Sistema aislado sin afectar producción
              </p>
            </div>
            <button
              onClick={syncThreads}
              disabled={syncing}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Threads'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center gap-3">
                <Users className="h-10 w-10 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Threads Totales</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-10 w-10 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Con Fragmentación</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.fragmented}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-10 w-10 text-rose-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Reasignaciones</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.reassignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-10 w-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tasa Fragmentación</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.fragmentation_rate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threads List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">Conversaciones Unificadas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vista comparativa: sistema actual (fragmentado) vs. threads (unificado)
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Cargando threads...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No hay threads sincronizados</p>
                <p className="text-sm text-gray-400">
                  Haz clic en "Sincronizar Threads" para generar la demo
                </p>
              </div>
            ) : (
              threads.map(thread => (
                <ThreadRow key={thread.id} thread={thread} />
              ))
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información del PoC</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sistema completamente aislado con tablas prefijo <code className="bg-blue-100 px-1 rounded">poc_*</code></li>
            <li>• No afecta el funcionamiento actual del sistema de conversaciones</li>
            <li>• Los threads se sincronizan manualmente desde chats existentes</li>
            <li>• Las métricas se calculan agregando todos los chats del mismo cliente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Commit de la página**

```bash
git add dashboard/src/app/\(crm\)/conversaciones-poc/page.js
git commit -m "feat(poc): add conversaciones-poc page with super_admin protection"
```

---

## FASE 4: Integración y Testing

### Task 7: Verificar integración completa

**Files:**
- Test all components

- [ ] **Paso 1: Verificar servidor backend**

```bash
cd c:\Users\USUARIO\Documents\Programacion\trabajo\newcrmnova
npm run dev
```

Verificar consola:
- ✅ Sin errores de sintaxis
- ✅ Rutas `/api/poc/*` registradas

- [ ] **Paso 2: Verificar frontend**

```bash
cd dashboard
npm run dev
```

Abrir navegador: `http://localhost:3000`

Verificar:
- ✅ Login como super_admin
- ✅ Navegar a `/conversaciones-poc`
- ✅ No redirige a `/unauthorized`

- [ ] **Paso 3: Probar sincronización**

En la página PoC:
1. Click en "Sincronizar Threads"
2. Esperar respuesta
3. Verificar que aparecen threads
4. Verificar stats cards actualizadas

Comando de verificación manual:

```bash
# Verificar threads creados
curl http://localhost:3001/api/poc/threads | jq '.data | length'

# Verificar stats
curl http://localhost:3001/api/poc/threads/stats | jq '.data'
```

- [ ] **Paso 4: Verificar datos en Supabase**

Ejecutar en SQL Editor:

```sql
-- Verificar threads creados
SELECT COUNT(*) as total_threads FROM poc_customer_threads;

-- Verificar fragmentación
SELECT 
  customer_name,
  customer_phone,
  (SELECT COUNT(*) FROM poc_thread_chats WHERE thread_id = pct.id) as chat_count
FROM poc_customer_threads pct
WHERE (SELECT COUNT(*) FROM poc_thread_chats WHERE thread_id = pct.id) > 1
ORDER BY chat_count DESC
LIMIT 10;

-- Verificar métricas
SELECT 
  total_messages,
  total_chats,
  advisors,
  cotizacion_count
FROM poc_thread_metrics
ORDER BY total_messages DESC
LIMIT 10;
```

Resultado esperado:
- ✅ Threads con customer_phone único
- ✅ Algunos threads con chat_count > 1 (fragmentados)
- ✅ Métricas con total_messages > 0

- [ ] **Paso 5: Commit de verificación**

```bash
git add .
git commit -m "test(poc): verify thread sync and metrics calculation"
```

---

## FASE 5: Documentación y Preparación de Demo

### Task 8: Crear guía de demostración

**Files:**
- Create: `docs/poc/2026-05-12-thread-demo-guide.md`

- [ ] **Paso 1: Crear guía para presentar al senior developer**

```markdown
# Guía de Demostración: Thread Global por Cliente

## Contexto

**Problema actual:**
- Cliente X tiene conversación en Bot A (Asesor Moisés)
- Cliente X reasignado → nueva conversación en Bot B (Asesor Jesús)
- Sistema actual: 2 chats separados con métricas parciales
- Gerentes: confusión en auditorías

**Solución propuesta:**
- Thread = agrupación lógica por cliente (phone_number)
- Métricas agregadas de todos los chats
- Vista unificada para auditorías

---

## Datos de Demostración

### Preparación (antes de mostrar)

1. **Sincronizar threads:**
   - Abrir `/conversaciones-poc`
   - Click en "Sincronizar Threads"
   - Esperar 5-10 segundos

2. **Verificar datos interesantes:**

Ejecutar en Supabase SQL Editor:

```sql
-- Encontrar clientes con más fragmentación
SELECT 
  pct.customer_name,
  pct.customer_phone,
  ptm.total_chats as fragmentos,
  ptm.total_messages,
  ptm.advisors
FROM poc_customer_threads pct
JOIN poc_thread_metrics ptm ON ptm.thread_id = pct.id
WHERE ptm.total_chats > 1
ORDER BY ptm.total_chats DESC
LIMIT 5;
```

**Anotar** estos casos para mostrar en la demo.

---

## Script de Presentación

### 1. Mostrar el Problema (2 min)

**Abrir vista actual:** `/conversaciones`

Seleccionar un bot y mostrar:
- Cliente X: 30 mensajes
- Buscar mismo cliente en otro bot
- Cliente X (otra sesión): 70 mensajes

**Decir:**
> "Aquí tenemos 2 conversaciones del mismo cliente fragmentadas.
> El gerente tiene que abrir ambas manualmente para saber que 
> realmente son 100 mensajes, no 30+70 separados."

### 2. Mostrar la Solución (5 min)

**Abrir PoC:** `/conversaciones-poc`

**Señalar Stats Cards:**
- "X threads totales (clientes únicos)"
- "Y con fragmentación (clientes reasignados)"
- "Z reasignaciones totales"

**Mostrar Thread Fragmentado:**

Buscar un thread con badge "FRAGMENTADO (3 chats)":

**Señalar:**
1. **Timeline de reasignaciones:**
   - "Moisés → Jesús → Endry"
   - "Ves todo el historial de quién atendió"

2. **Métricas unificadas:**
   - "150 mensajes totales (no 50+60+40 separados)"
   - "2 cotizaciones enviadas (agregadas de los 3 chats)"

3. **Comparison Badge:**
   - "Sistema actual: 3 chats separados"
   - "Con threads: 1 conversación completa"

### 3. Explicar Arquitectura (3 min)

**Abrir diagrama mental:**

```
poc_customer_threads (thread por cliente)
    ├─ poc_thread_chats (vincula chats al thread)
    └─ poc_thread_metrics (métricas agregadas)
```

**Decir:**
> "Es una tabla nueva que agrupa por teléfono del cliente.
> No modifica nada del sistema actual. Todo tiene prefijo poc_.
> Si no funciona, DROP TABLE y listo."

### 4. Comparación Técnica (2 min)

**Mostrar query actual vs. thread:**

```sql
-- Sistema actual (fragmentado)
SELECT COUNT(*) FROM messages WHERE chat_id = 'chat-bot-a';  -- 50
SELECT COUNT(*) FROM messages WHERE chat_id = 'chat-bot-b';  -- 100
-- Gerente tiene que sumar mentalmente: 150

-- Con threads (unificado)
SELECT total_messages FROM poc_thread_metrics 
WHERE thread_id = 'thread-cliente-x';  -- 150 ✅
```

### 5. Responder Objeciones (según reacción)

**Objeción: "Es muy complejo"**

Respuesta:
> "3 tablas nuevas. El servicio reutiliza queries existentes.
> El frontend es solo una vista alternativa. Complejidad controlada."

**Objeción: "Puedes hacer esto en el frontend"**

Respuesta:
> "No puedes calcular avg_response_time correctamente en frontend.
> El promedio de promedios es matemáticamente incorrecto.
> Necesitas los mensajes individuales = necesitas modelo de datos."

**Objeción: "¿Cuántos clientes están fragmentados realmente?"**

Respuesta:
> "Mira las stats: X% de fragmentación. Y reasignaciones/semana.
> Este es dato real, no hipotético."

---

## Métricas de Éxito de la Demo

✅ Senior developer entiende el problema visualmente
✅ Ve la diferencia clara entre actual vs. threads
✅ Comprende que los datos actuales son incorrectos
✅ Acepta que la implementación es viable

---

## Siguientes Pasos (si aprueba)

1. **Migración gradual:**
   - Crear threads en paralelo durante 1 semana
   - Comparar precisión con sistema actual
   - Feature flag para cambiar entre vistas

2. **Integración con producción:**
   - Renombrar `poc_*` → `customer_threads`
   - Actualizar webhooks para mantener threads actualizados
   - Migrar frontend gradualmente

3. **Limpieza:**
   - Deprecar vista fragmentada
   - Documentar nueva arquitectura
```

- [ ] **Paso 2: Commit de documentación**

```bash
git add docs/poc/2026-05-12-thread-demo-guide.md
git commit -m "docs(poc): add demo presentation guide for senior developer"
```

---

## Checklist Final de Implementación

Antes de presentar la demo, verificar:

- [ ] ✅ Backend funciona sin errores
- [ ] ✅ Endpoints `/api/poc/*` responden correctamente
- [ ] ✅ Frontend carga sin errores de consola
- [ ] ✅ Solo super_admin puede acceder a `/conversaciones-poc`
- [ ] ✅ Botón "Sincronizar Threads" funciona
- [ ] ✅ Threads muestran datos correctos
- [ ] ✅ Stats cards muestran números reales
- [ ] ✅ Threads fragmentados tienen badge y timeline
- [ ] ✅ Comparison badge muestra diferencia clara
- [ ] ✅ Hay al menos 1 thread fragmentado para demostrar
- [ ] ✅ Documentación de demo lista

---

## Tiempo Estimado Total

- **FASE 1 (Backend):** 45 min
- **FASE 2 (Componentes):** 30 min
- **FASE 3 (Página):** 40 min
- **FASE 4 (Testing):** 30 min
- **FASE 5 (Docs):** 15 min

**Total:** ~2.5 horas

---

## Notas de Implementación

### Seguridad
- No se requiere RLS por ahora (solo super_admin en frontend)
- Si se implementa RLS después, agregar policy para super_admin

### Performance
- Índices ya creados en tablas PoC
- Sincronización manual (no automática) para evitar carga
- Límite de 100 threads en frontend

### Rollback
Si algo falla:
```sql
DROP TABLE IF EXISTS poc_thread_metrics CASCADE;
DROP TABLE IF EXISTS poc_thread_chats CASCADE;
DROP TABLE IF EXISTS poc_customer_threads CASCADE;
DROP FUNCTION IF EXISTS calculate_poc_response_times(UUID[]);
```

```bash
git revert HEAD~5  # Deshacer últimos 5 commits
```

---

## Ejecución del Plan

**Opción 1: Subagent-Driven (Recomendado)**
- Usa `superpowers:subagent-driven-development`
- Ejecuta task por task con revisión entre pasos

**Opción 2: Inline Execution**
- Usa `superpowers:executing-plans`
- Ejecuta en esta sesión con checkpoints

¿Qué opción prefieres?
