# Team Members Blacklist - Plan de Implementación

> **Para agentes autónomos:** REQUERIDO: Usar `executing-plans` para implementar este plan tarea por tarea.

**Objetivo:** Filtrar números de teléfonos corporativos (asesores) del sistema PoC Threads para que solo se muestren conversaciones de clientes reales.

**Arquitectura:** Tabla `team_members` para blacklist + filtro en `pocThreadService.updateThreadForNewMessage()` + API CRUD + UI admin simple para gestión.

**Tech Stack:** Supabase PostgreSQL, Express.js, Next.js 14 (App Router), TailwindCSS

---

## Estructura de Archivos

### **Backend (API + Servicio)**
- **Crear:** `src/routes/teamMembers.js` - CRUD endpoints
- **Crear:** `src/services/teamMembersService.js` - Lógica de negocio
- **Modificar:** `src/services/pocThreadService.js:277-503` - Agregar filtro blacklist
- **Modificar:** `src/index.js` - Registrar ruta `/api/team-members`

### **Frontend (UI)**
- **Crear:** `dashboard/src/app/(crm)/admin/team-members/page.js` - Vista principal
- **Modificar:** `dashboard/src/components/layout/Sidebar.jsx:53-54` - Agregar ruta al menú
- **Crear:** `dashboard/src/config/apiConfig.js` (modificar si existe) - Endpoints team members

### **Base de Datos**
- **SQL Migration:** Crear tabla `team_members` con 4 columnas

---

## FASE 1: Base de Datos

### Tarea 1.1: Crear Tabla team_members

**SQL a ejecutar manualmente en Supabase SQL Editor:**

```sql
-- ============================================================================
-- Migración: Tabla de Team Members (Blacklist de números corporativos)
-- Fecha: 2025-05-25
-- Propósito: Excluir teléfonos de asesores del sistema PoC Threads
-- ============================================================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Índice único para búsquedas rápidas por teléfono
CREATE UNIQUE INDEX IF NOT EXISTS team_members_phone_idx 
  ON public.team_members(phone_number);

-- Comentarios para documentación
COMMENT ON TABLE public.team_members IS 
  'Lista de teléfonos corporativos (asesores) que deben excluirse del sistema PoC Threads';

COMMENT ON COLUMN public.team_members.phone_number IS 
  'Número de teléfono corporativo en formato internacional (ej: 584244250905)';

COMMENT ON COLUMN public.team_members.full_name IS 
  'Nombre completo del asesor o persona asignada al número';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at_trigger
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION update_team_members_updated_at();

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar que la tabla existe
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'team_members';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'team_members';

-- Verificar trigger
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'team_members';
```

**Pasos:**
- [ ] Copiar el SQL completo de arriba
- [ ] Ir a Supabase Dashboard → SQL Editor
- [ ] Pegar y ejecutar el SQL
- [ ] Verificar que retorna "Success" y 3 queries de verificación muestran resultados
- [ ] Confirmar que tabla aparece en Table Editor

---

### Tarea 1.2: Poblar Datos Iniciales (Opcional)

**SQL para insertar lista inicial de asesores:**

```sql
-- Insertar asesores conocidos (actualizar con lista real de la empresa)
INSERT INTO public.team_members (phone_number, full_name) VALUES
('584244250905', 'Dulce Baptista'),
('581234567890', 'Ejemplo Asesor 1'),
('589876543210', 'Ejemplo Asesor 2')
ON CONFLICT (phone_number) DO NOTHING;

-- Verificar inserción
SELECT * FROM team_members ORDER BY created_at DESC;
```

**Pasos:**
- [ ] Actualizar el INSERT con la lista real de teléfonos corporativos
- [ ] Ejecutar en SQL Editor
- [ ] Verificar que aparecen los registros con `SELECT * FROM team_members`

---

## FASE 2: Backend - Servicio de Team Members

### Tarea 2.1: Crear Servicio teamMembersService.js

**Archivo:** `src/services/teamMembersService.js`

- [ ] **Crear archivo completo**

```javascript
import { supabase } from '../config/supabase.js';

class TeamMembersService {
  /**
   * Obtiene todos los team members activos
   * @returns {Promise<Array>}
   */
  async getAll() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene solo los números de teléfono (para filtrado rápido)
   * @returns {Promise<Array<string>>}
   */
  async getPhoneNumbers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('phone_number');

    if (error) throw error;
    return (data || []).map(tm => tm.phone_number);
  }

  /**
   * Verifica si un teléfono está en la lista de team members
   * @param {string} phoneNumber - Número de teléfono a verificar
   * @returns {Promise<boolean>}
   */
  async isTeamMember(phoneNumber) {
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) {
      console.error('[TeamMembers] Error verificando teléfono:', error);
      return false; // En caso de error, no bloquear el flujo
    }

    return data !== null;
  }

  /**
   * Crea un nuevo team member
   * @param {Object} data - { phone_number, full_name }
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Validaciones
    if (!data.phone_number || !data.full_name) {
      throw new Error('phone_number y full_name son requeridos');
    }

    // Verificar que no exista
    const exists = await this.isTeamMember(data.phone_number);
    if (exists) {
      throw new Error('Este número de teléfono ya está registrado como team member');
    }

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        phone_number: data.phone_number,
        full_name: data.full_name
      })
      .select()
      .single();

    if (error) throw error;
    return teamMember;
  }

  /**
   * Actualiza el nombre de un team member
   * @param {string} id - UUID del team member
   * @param {Object} data - { full_name }
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    if (!data.full_name) {
      throw new Error('full_name es requerido');
    }

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update({
        full_name: data.full_name
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return teamMember;
  }

  /**
   * Elimina un team member permanentemente
   * @param {string} id - UUID del team member
   * @returns {Promise<void>}
   */
  async delete(id) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export default new TeamMembersService();
```

- [ ] **Guardar archivo**
- [ ] **Commit**
```bash
git add src/services/teamMembersService.js
git commit -m "feat(backend): add teamMembersService with CRUD operations"
```

---

### Tarea 2.2: Crear Rutas API teamMembers.js

**Archivo:** `src/routes/teamMembers.js`

- [ ] **Crear archivo completo**

```javascript
import { Router } from 'express';
import teamMembersService from '../services/teamMembersService.js';

const router = Router();

/**
 * GET /api/team-members
 * Lista todos los team members
 */
router.get('/', async (req, res) => {
  try {
    const teamMembers = await teamMembersService.getAll();
    res.json({
      success: true,
      data: teamMembers,
      meta: { count: teamMembers.length }
    });
  } catch (error) {
    console.error('[TeamMembers API] Error fetching:', error);
    res.status(500).json({
      success: false,
      error: 'FetchError',
      message: 'Error obteniendo team members',
      details: error.message
    });
  }
});

/**
 * POST /api/team-members
 * Crea un nuevo team member
 */
router.post('/', async (req, res) => {
  try {
    const teamMember = await teamMembersService.create(req.body);
    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('[TeamMembers API] Error creating:', error);
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: error.message
    });
  }
});

/**
 * PATCH /api/team-members/:id
 * Actualiza el nombre de un team member
 */
router.patch('/:id', async (req, res) => {
  try {
    const teamMember = await teamMembersService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('[TeamMembers API] Error updating:', error);
    res.status(400).json({
      success: false,
      error: 'UpdateError',
      message: error.message
    });
  }
});

/**
 * DELETE /api/team-members/:id
 * Elimina un team member permanentemente
 */
router.delete('/:id', async (req, res) => {
  try {
    await teamMembersService.delete(req.params.id);
    res.json({
      success: true,
      message: 'Team member eliminado correctamente'
    });
  } catch (error) {
    console.error('[TeamMembers API] Error deleting:', error);
    res.status(400).json({
      success: false,
      error: 'DeleteError',
      message: error.message
    });
  }
});

export default router;
```

- [ ] **Guardar archivo**
- [ ] **Commit**
```bash
git add src/routes/teamMembers.js
git commit -m "feat(backend): add team members API routes"
```

---

### Tarea 2.3: Registrar Rutas en index.js

**Archivo:** `src/index.js`

- [ ] **Buscar línea donde se importan las rutas**
```javascript
import webhooksRouter from './routes/webhooks.js';
import pocRouter from './routes/poc.js';
// AGREGAR AQUÍ:
import teamMembersRouter from './routes/teamMembers.js';
```

- [ ] **Buscar línea donde se registran las rutas**
```javascript
app.use('/api/webhooks', webhooksRouter);
app.use('/api/poc', pocRouter);
// AGREGAR AQUÍ:
app.use('/api/team-members', teamMembersRouter);
```

- [ ] **Guardar cambios**
- [ ] **Commit**
```bash
git add src/index.js
git commit -m "feat(backend): register team-members routes"
```

- [ ] **Reiniciar backend**
```bash
docker compose restart backend
```

- [ ] **Verificar que arranca sin errores**
```bash
docker compose logs backend --tail=50
```

---

## FASE 3: Backend - Integrar Filtro en PoC

### Tarea 3.1: Modificar pocThreadService.js

**Archivo:** `src/services/pocThreadService.js`

- [ ] **Importar servicio al inicio del archivo**

Buscar línea 2-3:
```javascript
import { supabase } from '../config/supabase.js';
import { getPoCBots } from '../config/pocConfig.js';
// AGREGAR:
import teamMembersService from './teamMembersService.js';
```

- [ ] **Agregar verificación de blacklist en updateThreadForNewMessage**

Buscar línea 300 (después de validación de parámetros):
```javascript
console.log(`[PoC Threads] Actualizando thread para nuevo mensaje - Teléfono: ${contactPhone}, Chat UUID: ${chatId}`);

// AGREGAR AQUÍ (ANTES de obtener nombre del bot):
// ============================================================================
// FILTRO: Verificar si el contacto es team member (blacklist)
// ============================================================================
console.log(`[PoC Threads] 🔍 Verificando si ${contactPhone} está en blacklist...`);
const isTeamMember = await teamMembersService.isTeamMember(contactPhone);

if (isTeamMember) {
  console.log(`[PoC Threads] 🚫 BLACKLIST: ${contactPhone} es team member - OMITIENDO thread`);
  console.log(`[PoC Threads] Motivo: Los números corporativos no deben aparecer en threads de clientes`);
  return; // Exit early - no crear/actualizar thread
}

console.log(`[PoC Threads] ✅ ${contactPhone} NO está en blacklist - Continuando...`);
// ============================================================================
```

- [ ] **Guardar cambios**
- [ ] **Commit**
```bash
git add src/services/pocThreadService.js
git commit -m "feat(poc): add team members blacklist filter in updateThreadForNewMessage"
```

- [ ] **Reiniciar backend para aplicar cambios**
```bash
docker compose restart backend
```

---

### Tarea 3.2: Verificar Filtro Funciona

- [ ] **Agregar temporalmente un número de prueba a team_members**
```sql
INSERT INTO team_members (phone_number, full_name) 
VALUES ('581111111111', 'Prueba Filtro') 
ON CONFLICT DO NOTHING;
```

- [ ] **Ver logs en tiempo real**
```bash
docker compose logs -f backend
```

- [ ] **Simular webhook con número blacklisted (usar Postman o curl)**
```bash
# Enviar un mensaje de prueba al número blacklisted
# Ver que en logs aparece:
# [PoC Threads] 🚫 BLACKLIST: 581111111111 es team member - OMITIENDO thread
```

- [ ] **Simular webhook con número NO blacklisted**
```bash
# Ver que en logs aparece:
# [PoC Threads] ✅ 581111111111 NO está en blacklist - Continuando...
```

- [ ] **Eliminar registro de prueba**
```sql
DELETE FROM team_members WHERE phone_number = '581111111111';
```

---

## FASE 4: Frontend - UI de Gestión

### Tarea 4.1: Crear Página team-members/page.js

**Archivo:** `dashboard/src/app/(crm)/admin/team-members/page.js`

- [ ] **Crear archivo completo** (código largo - ver abajo)

```javascript
"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users, Plus, Trash2, Edit2, Check, X, Phone, User, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function TeamMembersPage() {
  const { isSuperAdmin, isAdmin, isManager, loading: authLoading, profile } = useUserProfile();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  // Verificar permisos
  const hasAccess = isSuperAdmin || isAdmin || isManager;

  useEffect(() => {
    if (!authLoading && profile && !hasAccess) {
      window.location.href = '/no-autorizado';
    }
  }, [authLoading, profile, hasAccess]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/team-members');
      if (!response.ok) throw new Error('Error fetching team members');
      const { data } = await response.json();
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar los team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchTeamMembers();
    }
  }, [hasAccess]);

  const handleAdd = async () => {
    if (!newPhone || !newName) {
      Swal.fire('Error', 'Teléfono y nombre son requeridos', 'error');
      return;
    }

    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: newPhone,
          full_name: newName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      Swal.fire('Éxito', 'Team member agregado correctamente', 'success');
      setNewPhone('');
      setNewName('');
      setShowAddForm(false);
      fetchTeamMembers();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName) {
      Swal.fire('Error', 'El nombre no puede estar vacío', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/team-members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: editName })
      });

      if (!response.ok) throw new Error('Error actualizando');

      Swal.fire('Éxito', 'Nombre actualizado correctamente', 'success');
      setEditingId(null);
      setEditName('');
      fetchTeamMembers();
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: '¿Eliminar team member?',
      html: `Se eliminará <strong>${name}</strong> de la lista.<br><br>Este número volverá a aparecer en threads PoC.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/team-members/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error eliminando');

        Swal.fire('Eliminado', 'Team member eliminado correctamente', 'success');
        fetchTeamMembers();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  if (authLoading || !hasAccess || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Gestión de Team Members</h1>
              </div>
              <p className="text-indigo-100 text-lg">
                Números corporativos excluidos de threads PoC
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Agregar
            </button>
          </div>
        </div>

        {/* Formulario Agregar */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-indigo-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Nuevo Team Member</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Teléfono
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="584244250905"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPhone('');
                  setNewName('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <X className="h-5 w-5" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Alert Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Función:</strong> Los números agregados aquí NO aparecerán en el sistema de threads PoC.
            Esto evita que conversaciones entre asesores contaminen las métricas de clientes.
          </div>
        </div>

        {/* Lista de Team Members */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">
              Team Members ({teamMembers.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-16 text-center">
                <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Cargando...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No hay team members registrados</p>
                <p className="text-sm text-gray-400">
                  Agrega números corporativos para excluirlos de threads PoC
                </p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        {editingId === member.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <>
                            <h3 className="text-lg font-bold text-gray-900">
                              {member.full_name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4" />
                              {member.phone_number}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {editingId === member.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(member.id)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditName('');
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(member.id);
                              setEditName(member.full_name);
                            }}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.full_name)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Guardar archivo**
- [ ] **Commit**
```bash
git add dashboard/src/app/\(crm\)/admin/team-members/page.js
git commit -m "feat(frontend): add team members management UI"
```

---

### Tarea 4.2: Agregar Ruta al Sidebar

**Archivo:** `dashboard/src/components/layout/Sidebar.jsx`

- [ ] **Buscar línea 53-54 (después de conversaciones-poc)**

```javascript
{ href: '/conversaciones-poc', label: 'Conversaciones POC', icon: Clock, superAdminOnly: true },
{ href: '/dashboard-poc', label: 'Dashboard Leads POC', icon: UsersIcon, superAdminOnly: true },
// AGREGAR AQUÍ:
{ href: '/admin/team-members', label: 'Team Members', icon: Users, adminOnly: true },
```

- [ ] **Importar icono Users si no está** (verificar línea 7-30)
```javascript
import {
  // ... otros iconos
  Users, // Ya debería estar
  // ... otros iconos
} from 'lucide-react'
```

- [ ] **Modificar función isRouteVisible para soportar adminOnly**

Buscar línea 98-107:
```javascript
const isRouteVisible = (href, superAdminOnly = false) => {
  if (!permissionsLoaded) return false;
  if (superAdminOnly && !isSuperAdmin) return false;
  // AGREGAR:
  if (item.adminOnly && !(isSuperAdmin || isAdmin || isManager)) return false;
  if (allowedRoutes === null) return true;
  return allowedRoutes.some(allowed => href === allowed || href.startsWith(allowed + '/'))
}
```

- [ ] **Actualizar llamada a isRouteVisible** (línea 190)
```javascript
if (!isRouteVisible(item.href, item.superAdminOnly)) {
  return null
}
```

Cambiar a:
```javascript
if (!isRouteVisible(item.href, item.superAdminOnly, item.adminOnly)) {
  return null
}
```

**O mejor aún, simplificar pasando el item completo:**

```javascript
const isRouteVisible = (item) => {
  if (!permissionsLoaded) return false;
  if (item.superAdminOnly && !isSuperAdmin) return false;
  if (item.adminOnly && !(isSuperAdmin || isAdmin || isManager)) return false;
  if (allowedRoutes === null) return true;
  return allowedRoutes.some(allowed => item.href === allowed || item.href.startsWith(allowed + '/'))
}

// Y en el map (línea 190):
if (!isRouteVisible(item)) {
  return null
}
```

- [ ] **Guardar cambios**
- [ ] **Commit**
```bash
git add dashboard/src/components/layout/Sidebar.jsx
git commit -m "feat(frontend): add team members route to sidebar (admin+)"
```

---

## FASE 5: Testing y Verificación

### Tarea 5.1: Testing Backend

- [ ] **Test 1: Crear team member via API**
```bash
curl -X POST http://localhost:4000/api/team-members \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"585555555555","full_name":"Test Asesor"}'
```
**Esperado:** Status 201, retorna objeto con id

- [ ] **Test 2: Listar team members**
```bash
curl http://localhost:4000/api/team-members
```
**Esperado:** Status 200, array con el team member creado

- [ ] **Test 3: Actualizar nombre**
```bash
curl -X PATCH http://localhost:4000/api/team-members/{ID_DEL_TEST1} \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Nombre Actualizado"}'
```
**Esperado:** Status 200, retorna objeto actualizado

- [ ] **Test 4: Eliminar team member**
```bash
curl -X DELETE http://localhost:4000/api/team-members/{ID_DEL_TEST1}
```
**Esperado:** Status 200, mensaje de éxito

---

### Tarea 5.2: Testing Filtro PoC

- [ ] **Test 1: Agregar número real de asesor a blacklist**
```sql
INSERT INTO team_members (phone_number, full_name) 
VALUES ('584244250905', 'Dulce Baptista');
```

- [ ] **Test 2: Ver logs del backend en tiempo real**
```bash
docker compose logs -f backend | grep "PoC Threads"
```

- [ ] **Test 3: Enviar mensaje desde bot a Dulce Baptista**

**Esperado en logs:**
```
[PoC Threads] 🔍 Verificando si 584244250905 está en blacklist...
[PoC Threads] 🚫 BLACKLIST: 584244250905 es team member - OMITIENDO thread
```

- [ ] **Test 4: Verificar que NO se creó thread**
```sql
SELECT * FROM poc_customer_threads WHERE customer_phone = '584244250905';
```
**Esperado:** 0 registros (o el thread antiguo sin actualizar)

- [ ] **Test 5: Eliminar de blacklist y probar de nuevo**
```sql
DELETE FROM team_members WHERE phone_number = '584244250905';
```

- [ ] **Test 6: Enviar otro mensaje**

**Esperado en logs:**
```
[PoC Threads] ✅ 584244250905 NO está en blacklist - Continuando...
[PoC Threads] ✅ Thread obtenido/creado: {uuid}
```

---

### Tarea 5.3: Testing Frontend

- [ ] **Test 1: Verificar acceso a ruta**
   - Ir a `/admin/team-members` como super_admin ✅
   - Ir a `/admin/team-members` como admin ✅
   - Ir a `/admin/team-members` como gerente ✅
   - Ir a `/admin/team-members` como asesor ❌ (debería redirigir)

- [ ] **Test 2: Verificar sidebar muestra ruta**
   - Login como admin → ver "Team Members" en sidebar ✅
   - Login como asesor → NO ver "Team Members" ✅

- [ ] **Test 3: CRUD completo desde UI**
   - Agregar team member → Verificar aparece en lista
   - Editar nombre → Verificar se actualiza
   - Eliminar → Verificar desaparece

- [ ] **Test 4: Validaciones**
   - Intentar agregar sin teléfono → Error
   - Intentar agregar sin nombre → Error
   - Intentar agregar duplicado → Error

---

## FASE 6: Documentación

### Tarea 6.1: Actualizar README o Docs

- [ ] **Crear o actualizar documentación**

Archivo sugerido: `docs/features/team-members-blacklist.md`

```markdown
# Team Members Blacklist

Sistema para excluir números de teléfonos corporativos del sistema PoC Threads.

## Propósito

Los asesores tienen bots propios, lo que significa que otros asesores pueden hablarles.
Sin este filtro, los threads PoC mezclarían:
- ✅ Conversaciones donde el asesor atiende a clientes
- ❌ Conversaciones donde otros asesores le hablan al asesor

## Arquitectura

- **Tabla:** `team_members` - Lista de números corporativos
- **Filtro:** `pocThreadService.updateThreadForNewMessage()` - Verifica blacklist antes de crear thread
- **API:** `/api/team-members` - CRUD para gestión
- **UI:** `/admin/team-members` - Interfaz para admin/gerentes

## Uso

1. Ir a `/admin/team-members` (requiere rol: admin o gerente)
2. Agregar números de asesores/personal corporativo
3. Los números agregados NO aparecerán en threads PoC automáticamente

## Logs

Buscar en logs del backend:
```
[PoC Threads] 🚫 BLACKLIST: {phone} es team member - OMITIENDO thread
```

## SQL Manual

```sql
-- Agregar team member
INSERT INTO team_members (phone_number, full_name) 
VALUES ('584244250905', 'Nombre Completo');

-- Ver todos
SELECT * FROM team_members ORDER BY created_at DESC;

-- Eliminar
DELETE FROM team_members WHERE phone_number = '584244250905';
```
```

- [ ] **Guardar documentación**
- [ ] **Commit final**
```bash
git add docs/features/team-members-blacklist.md
git commit -m "docs: add team members blacklist documentation"
```

---

## ✅ Checklist Final

Antes de considerar completa la implementación:

- [ ] Tabla `team_members` existe en Supabase
- [ ] Backend arranca sin errores
- [ ] API `/api/team-members` responde correctamente
- [ ] Filtro en `pocThreadService` funciona (verificado con logs)
- [ ] UI carga sin errores
- [ ] Sidebar muestra ruta solo a admin/gerente
- [ ] CRUD funciona desde UI
- [ ] Números en blacklist NO generan threads PoC
- [ ] Documentación actualizada

---

## Comandos Git Resumen

```bash
# Después de completar todas las tareas
git log --oneline -n 10  # Ver commits realizados

# Resumen esperado:
# - feat(backend): add teamMembersService with CRUD operations
# - feat(backend): add team members API routes
# - feat(backend): register team-members routes
# - feat(poc): add team members blacklist filter
# - feat(frontend): add team members management UI
# - feat(frontend): add team members route to sidebar
# - docs: add team members blacklist documentation
```

---

## Notas de Implementación

1. **No reinventar la rueda:** Reutilizar patrones existentes de `pocRouter` y `conversaciones-poc`
2. **Logs abundantes:** Mantener console.log para debugging (sistema PoC)
3. **Sin RLS por ahora:** API maneja seguridad, RLS puede agregarse después
4. **Performance:** Índice único en `phone_number` asegura búsquedas rápidas
5. **UX:** SweetAlert2 para confirmaciones (ya usado en el proyecto)

---

**Fin del Plan de Implementación**
