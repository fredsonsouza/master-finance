'use client'

import {
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  PRIVILEGED_PERMISSIONS,
  type Permission,
  type Role,
} from '@/lib/permissions'
import { Check, Lock, ShieldCheck } from 'lucide-react'

interface PermissionsSelectorProps {
  value: Permission[]
  onChange: (next: Permission[]) => void
  actorRole?: Role
  actorPermissions?: Permission[]
  disabled?: boolean
  compact?: boolean
}

export function PermissionsSelector({
  value,
  onChange,
  actorRole = 'ADMIN',
  actorPermissions = [],
  disabled = false,
  compact = false,
}: PermissionsSelectorProps) {
  const isActorAdmin = actorRole === 'ADMIN'
  const actorPermSet = new Set(actorPermissions)

  function isPermissionLocked(key: Permission): boolean {
    if (disabled) return true
    if (isActorAdmin) return false
    return PRIVILEGED_PERMISSIONS.includes(key) && !actorPermSet.has(key)
  }

  function togglePermission(key: Permission) {
    if (isPermissionLocked(key)) return
    if (value.includes(key)) {
      onChange(value.filter((p) => p !== key))
    } else {
      onChange([...value, key])
    }
  }

  function applyPreset(presetPermissions: Permission[]) {
    if (disabled) return
    const allowed = presetPermissions.filter((p) => !isPermissionLocked(p))
    onChange(Array.from(new Set(allowed)))
  }

  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Modelos Rápidos (Preenchimento Automático)
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {value.length} selecionada{value.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_PRESETS.map((preset) => {
            const allowedPresetPerms = preset.permissions.filter(
              (p) => !isPermissionLocked(p)
            )
            const isExactMatch =
              allowedPresetPerms.length === value.length &&
              allowedPresetPerms.every((p) => value.includes(p))

            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => applyPreset(preset.permissions)}
                title={preset.description}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isExactMatch
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isExactMatch && <Check className="h-3 w-3" />}
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grouped Checkboxes */}
      <div
        className={`grid grid-cols-1 gap-3 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}
      >
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2.5"
          >
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                {group.label}
              </h4>
              {!compact && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {group.description}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              {group.permissions.map((perm) => {
                const checked = value.includes(perm.key)
                const locked = isPermissionLocked(perm.key)

                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 rounded-md border p-2 transition-colors ${
                      locked
                        ? 'cursor-not-allowed border-slate-200/70 bg-slate-100/70 opacity-60'
                        : checked
                          ? 'cursor-pointer border-indigo-200 bg-indigo-50/70'
                          : 'cursor-pointer border-transparent bg-white hover:border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900">
                          {perm.label}
                        </span>
                        {locked && (
                          <span
                            title="Permissão administrativa restrita"
                            className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug text-slate-500">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Base self-service info */}
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
        <span>
          <strong>Acesso base incluído automaticamente:</strong> todo
          colaborador ativo já pode abrir solicitações de documentos no RH e
          enviar seus próprios relatórios de atividades, sem precisar marcar
          nenhuma caixa acima.
        </span>
      </div>
    </div>
  )
}
