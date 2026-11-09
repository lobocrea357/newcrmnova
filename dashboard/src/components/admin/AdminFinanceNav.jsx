'use client'

import { usePathname } from 'next/navigation'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { NAV_GROUPS, canSeeItem, isActivePath } from '@/lib/navigation'
import { Tabs } from '@/components/ui/kit'

/**
 * Pestañas del área "Vuelos y pagos". Usa las mismas reglas de visibilidad que el
 * menú lateral; si el usuario solo tiene acceso a una sección, no se muestra.
 */
export default function AdminFinanceNav() {
  const pathname = usePathname()
  const { role, hasPermission } = useUserProfile()
  const group = NAV_GROUPS.find((g) => g.id === 'vuelos')
  const items = (group?.items || []).filter((i) => canSeeItem(i, { role: role?.toLowerCase(), hasPermission }))
  if (items.length < 2) return null
  const active = items.find((i) => isActivePath(pathname, i))?.href
  return (
    <Tabs
      className="mb-6"
      active={active}
      tabs={items.map((i) => ({ id: i.href, label: i.label, href: i.href }))}
    />
  )
}
