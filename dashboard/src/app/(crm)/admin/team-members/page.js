"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TEAM_MEMBERS_API } from "@/config/apiConfig";
import { Users, Plus, Trash2, Edit2, Check, X, Phone, User, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { PageHeader, Button } from '@/components/ui/kit'

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
      const response = await fetch(TEAM_MEMBERS_API.listar);
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
      const response = await fetch(TEAM_MEMBERS_API.crear, {
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
      const response = await fetch(TEAM_MEMBERS_API.actualizar(id), {
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
        const response = await fetch(TEAM_MEMBERS_API.eliminar(id), {
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
    <div>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Números del equipo"
          description="Teléfonos corporativos (asesores, pagos, emisiones). Sus chats no cuentan como clientes en la auditoría IA ni en los seguimientos."
          actions={
            <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4" /> Agregar número
            </Button>
          }
        />

        {/* Formulario Agregar */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-linea p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-tinta mb-4">Agregar número del equipo</h2>
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
        <div className="bg-white rounded-xl border border-linea overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
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
                      <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
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
