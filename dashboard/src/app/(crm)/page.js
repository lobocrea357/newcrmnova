'use client'

import { useRanking } from '@/contexts/RankingContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import RankingGlobal from '@/components/ranking/RankingGlobal'
import TopAsesorCard from '@/components/ranking/TopAsesorCard'
import { Page, PageHeader } from '@/components/ui/kit'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function DashboardPage() {
  const { rankingData } = useRanking()
  const { profile } = useUserProfile()
  const nombre = profile?.full_name?.split(' ')[0]

  return (
    <Page>
      <PageHeader
        title={nombre ? `${saludo()}, ${nombre}` : saludo()}
        description="Así va el equipo hoy: quién lidera el ranking de ventas y cómo se reparten las metas."
      />

      <div className="space-y-6">
        {(rankingData?.topAsesor || rankingData?.topGerente) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rankingData.topAsesor && <TopAsesorCard asesor={rankingData.topAsesor} tipo="Asesor" />}
            {rankingData.topGerente && <TopAsesorCard asesor={rankingData.topGerente} tipo="Gerente" />}
          </div>
        )}
        <RankingGlobal />
      </div>
    </Page>
  )
}
