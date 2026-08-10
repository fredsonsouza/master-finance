'use client'

import type { Unit } from '@/http/get-units'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Props {
  units: Unit[]
  selectedUnitId?: string | null
}

export function DashboardUnitFilter({ units, selectedUnitId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleUnitChange(unitId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (unitId) {
      params.set('unitId', unitId)
    } else {
      params.delete('unitId')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (units.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-on-surface-variant text-sm font-medium whitespace-nowrap">
        Unidade:
      </span>
      <select
        value={selectedUnitId || ''}
        onChange={(e) => handleUnitChange(e.target.value)}
        className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none sm:w-60"
      >
        <option value="">Todas as Unidades</option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
    </div>
  )
}
