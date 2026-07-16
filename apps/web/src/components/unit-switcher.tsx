'use client'

import type { Unit } from '@/http/get-units'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { setActiveUnit } from './unit-switcher-action'

interface UnitSwitcherProps {
  units: Unit[]
  initialActiveUnitId: string | null
}

export function UnitSwitcher({
  units,
  initialActiveUnitId,
}: UnitSwitcherProps) {
  const [selected, setSelected] = useState<string>(initialActiveUnitId || '')

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelected(val)
    await setActiveUnit(val || null)
    window.location.reload() // Recarrega a página para refletir no Dashboard/Tabelas
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="text-on-surface-variant h-4 w-4" />
      <select
        value={selected}
        onChange={handleChange}
        className="border-outline bg-surface text-on-surface focus:ring-primary h-9 w-48 cursor-pointer rounded-md border px-3 py-1 text-sm font-medium focus:ring-1 focus:outline-none"
      >
        <option value="">Todas as Unidades</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  )
}
