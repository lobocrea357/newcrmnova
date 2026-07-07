'use client'

import { useRanking } from '@/contexts/RankingContext'
import RankingGlobal from '@/components/ranking/RankingGlobal'
import TopAsesorCard from '@/components/ranking/TopAsesorCard'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  const { rankingData } = useRanking()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Rendimiento global del equipo en tiempo real</p>
          </div>
        </div>

        {/* Top performers */}
        {(rankingData?.topAsesor || rankingData?.topGerente) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankingData.topAsesor && (
              <TopAsesorCard asesor={rankingData.topAsesor} tipo="Asesor" />
            )}
            {rankingData.topGerente && (
              <TopAsesorCard asesor={rankingData.topGerente} tipo="Gerente" />
            )}
          </div>
        )}

        {/* Ranking global */}
        <RankingGlobal />
      </div>
    </div>
  )
}
