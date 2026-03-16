'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, UserMinus, UserPlus, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { EQUIPOS_API } from '@/config/apiConfig'

export default function EquiposTab({ allUsers = [], roles = [], onDataChange }) {
  const [equipos, setEquipos] = useState([])
  const [sinEquipo, setSinEquipo] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCrearForm, setShowCrearForm] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState(null)
  const [expandedEquipos, setExpandedEquipos] = useState({})
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', descripcion: '', color: '#6366f1', gerenteId: '' })
  const [saving, setSaving] = useState(false)

  const gerentes = allUsers.filter(u => {
    const roleName = u.role?.name?.toLowerCase()
    return roleName === 'gerente' || roleName === 'manager'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [equiposRes, sinEquipoRes] = await Promise.all([
        fetch(EQUIPOS_API.listar),
        fetch(EQUIPOS_API.sinEquipo)
      ])
      if (equiposRes.ok) {
        const d = await equiposRes.json()
        setEquipos(d.data || [])
        const expanded = {}
        ;(d.data || []).forEach(e => { expanded[e.id] = true })
        setExpandedEquipos(expanded)
      }
      if (sinEquipoRes.ok) {
        const d = await sinEquipoRes.json()
        setSinEquipo(d.data || [])
      }
    } catch (err) {
      console.error('Error cargando equipos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearEquipo = async () => {
    if (!nuevoEquipo.nombre || !nuevoEquipo.gerenteId) return
    setSaving(true)
    try {
      const res = await fetch(EQUIPOS_API.crear, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoEquipo)
      })
      if (res.ok) {
        setNuevoEquipo({ nombre: '', descripcion: '', color: '#6366f1', gerenteId: '' })
        setShowCrearForm(false)
        loadData()
        onDataChange?.()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditarEquipo = async (equipoId) => {
    if (!editingEquipo?.nombre) return
    setSaving(true)
    try {
      const res = await fetch(EQUIPOS_API.actualizar(equipoId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editingEquipo.nombre,
          color: editingEquipo.color,
          gerenteId: editingEquipo.gerente_id
        })
      })
      if (res.ok) {
        setEditingEquipo(null)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAsignar = async (userId, equipoId) => {
    const res = await fetch(EQUIPOS_API.asignar, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, equipoId })
    })
    if (res.ok) { loadData(); onDataChange?.() }
  }

  const handleRemover = async (userId) => {
    const res = await fetch(EQUIPOS_API.remover(userId), { method: 'PATCH' })
    if (res.ok) { loadData(); onDataChange?.() }
  }

  const handleEliminarEquipo = async (equipoId) => {
    if (!confirm('¿Eliminar este equipo? Los miembros quedarán sin equipo asignado.')) return
    const res = await fetch(EQUIPOS_API.eliminar(equipoId), { method: 'DELETE' })
    if (res.ok) { loadData(); onDataChange?.() }
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Equipos de Trabajo</h3>
          <p className="text-sm text-gray-500 mt-0.5">Asigna asesores a los equipos de cada gerente</p>
        </div>
        <button
          onClick={() => setShowCrearForm(!showCrearForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Equipo
        </button>
      </div>

      {/* Formulario crear equipo */}
      {showCrearForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-blue-900">Crear Nuevo Equipo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del equipo *</label>
              <input
                type="text"
                value={nuevoEquipo.nombre}
                onChange={e => setNuevoEquipo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Equipo Norte"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gerente responsable *</label>
              <select
                value={nuevoEquipo.gerenteId}
                onChange={e => setNuevoEquipo(p => ({ ...p, gerenteId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar gerente...</option>
                {gerentes.map(g => (
                  <option key={g.id} value={g.id}>{g.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNuevoEquipo(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${nuevoEquipo.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={nuevoEquipo.descripcion}
                onChange={e => setNuevoEquipo(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción breve..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCrearForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleCrearEquipo}
              disabled={saving || !nuevoEquipo.nombre || !nuevoEquipo.gerenteId}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear Equipo'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de equipos */}
      <div className="space-y-4">
        {equipos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No hay equipos creados</p>
            <p className="text-sm">Crea el primer equipo para asignar asesores</p>
          </div>
        )}

        {equipos.map(equipo => (
          <div key={equipo.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header del equipo */}
            <div className="flex items-center justify-between p-4" style={{ borderLeft: `4px solid ${equipo.color}` }}>
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setExpandedEquipos(p => ({ ...p, [equipo.id]: !p[equipo.id] }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expandedEquipos[equipo.id]
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>

                {editingEquipo?.id === equipo.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editingEquipo.nombre}
                      onChange={e => setEditingEquipo(p => ({ ...p, nombre: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <div className="flex gap-1">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditingEquipo(p => ({ ...p, color: c }))}
                          className={`w-5 h-5 rounded-full border ${editingEquipo.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button onClick={() => handleEditarEquipo(equipo.id)} className="text-green-600 hover:text-green-800">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingEquipo(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{equipo.nombre}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {(equipo.miembros || []).length} miembro{(equipo.miembros || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Gerente: <span className="font-medium">{equipo.gerente?.full_name || '—'}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingEquipo({ id: equipo.id, nombre: equipo.nombre, color: equipo.color, gerente_id: equipo.gerente?.id })}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEliminarEquipo(equipo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Miembros del equipo */}
            {expandedEquipos[equipo.id] && (
              <div className="border-t border-gray-100 p-4">
                {(equipo.miembros || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Sin miembros asignados</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {(equipo.miembros || []).map(miembro => (
                      <div key={miembro.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{miembro.full_name}</p>
                          <p className="text-xs text-gray-500">{miembro.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemover(miembro.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Asignar asesor a este equipo */}
                {sinEquipo.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) {
                          handleAsignar(e.target.value, equipo.id)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">+ Agregar asesor al equipo...</option>
                      {sinEquipo.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Usuarios sin equipo */}
      {sinEquipo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Usuarios sin equipo asignado ({sinEquipo.length})
          </h4>
          <div className="space-y-2">
            {sinEquipo.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.role?.name} · {u.email}</p>
                </div>
                {equipos.length > 0 && (
                  <select
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAsignar(u.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Asignar a equipo...</option>
                    {equipos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
