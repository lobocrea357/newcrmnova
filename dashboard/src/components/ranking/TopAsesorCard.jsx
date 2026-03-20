'use client'

import { Trophy, TrendingUp, DollarSign, Users } from 'lucide-react'

export default function TopAsesorCard({ asesor, tipo = 'Asesor' }) {
  if (!asesor) return null

  const initials = asesor.nombre
    ? asesor.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full translate-y-6 -translate-x-6" />

      <div className="relative z-10 flex items-center gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/50 shadow-inner">
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>
          {/* Medalla */}
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest mb-0.5">
            🥇 Top {tipo} del momento
          </p>
          <h3 className="text-xl font-black text-white leading-tight truncate">
            {asesor.nombre}
          </h3>
          {asesor.equipoNombre && (
            <span className="inline-block text-xs bg-white/25 px-2 py-0.5 rounded-full mt-1 font-medium">
              {asesor.equipoNombre}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex gap-4 mt-5 pt-4 border-t border-white/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-100" />
          <div>
            <p className="text-xl font-black">{asesor.emitidos}</p>
            <p className="text-xs text-amber-100">Emitidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-100" />
          <div>
            <p className="text-xl font-black">{formatMoney(asesor.montoTotal)}</p>
            <p className="text-xs text-amber-100">Monto total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-100" />
          <div>
            <p className="text-xl font-black">{asesor.porcentajeConversion}%</p>
            <p className="text-xs text-amber-100">Conversión</p>
          </div>
        </div>
      </div>
    </div>
  )
}
