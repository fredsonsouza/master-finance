'use client'

import type { EmployeeBirthdayItem } from '@/http/employees'
import { Cake, CalendarClock, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface BirthdayAlertsBellProps {
  alerts: EmployeeBirthdayItem[]
  referenceDate: string
  todayCount: number
  upcomingCount: number
}

const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function formatShortDayMonth(day: number, month: number) {
  return `${String(day).padStart(2, '0')} ${MONTH_SHORT[month - 1] ?? ''}`
}

export function BirthdayAlertsBell({
  alerts,
  referenceDate,
  todayCount,
  upcomingCount,
}: BirthdayAlertsBellProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Daily non-intrusive reminder toast when there are birthdays today or in the next 3 days
  useEffect(() => {
    if (!referenceDate || alerts.length === 0) return

    const urgentAlerts = alerts.filter((item) => item.daysUntilBirthday <= 3)
    if (urgentAlerts.length === 0) return

    const storageKey = `master_birthdays_toast_${referenceDate}`
    try {
      if (window.localStorage.getItem(storageKey)) return
      window.localStorage.setItem(storageKey, '1')
    } catch {
      return
    }

    const todayItems = urgentAlerts.filter((item) => item.isToday)
    if (todayItems.length > 0) {
      const names = todayItems
        .slice(0, 2)
        .map((item) => item.fullName.split(' ')[0])
        .join(', ')
      const extra = todayItems.length > 2 ? ` e +${todayItems.length - 2}` : ''
      toast.info(`Aniversariante(s) de hoje: ${names}${extra}!`, {
        description:
          'Acesse RH → Aniversariantes para gerar o card comemorativo.',
        duration: 7000,
      })
    } else {
      const next = urgentAlerts[0]
      const whenLabel = next.isTomorrow
        ? 'amanhã'
        : `em ${next.daysUntilBirthday} dias`
      toast.info(
        `Próximo aniversário ${whenLabel}: ${next.fullName.split(' ')[0]}`,
        {
          description: `${urgentAlerts.length} colaborador(es) fazem aniversário nos próximos 3 dias.`,
          duration: 6000,
        }
      )
    }
  }, [alerts, referenceDate])

  const todayAlerts = alerts.filter((a) => a.isToday)
  const tomorrowAlerts = alerts.filter((a) => a.isTomorrow)
  const soonAlerts = alerts.filter((a) => a.daysUntilBirthday >= 2)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Avisos de aniversariantes próximos"
        aria-expanded={open}
        title="Aniversariantes próximos (7 dias)"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors cursor-pointer ${
          todayCount > 0
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : upcomingCount > 0
              ? 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-surface-container bg-surface-container/50 text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        <Cake className="h-4.5 w-4.5" />
        {upcomingCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ${
              todayCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-primary'
            }`}
          >
            {upcomingCount > 99 ? '99+' : upcomingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-surface-container bg-surface shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-surface-container bg-surface-container/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-on-surface">
                Aniversariantes Próximos
              </span>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Próximos 7 dias
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-container/70">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarClock className="mx-auto h-7 w-7 text-on-surface-variant/40 mb-2" />
                <p className="text-xs font-medium text-on-surface">
                  Nenhum aniversário nos próximos 7 dias
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Consulte o calendário completo do mês para planejar os cards.
                </p>
              </div>
            ) : (
              <>
                {todayAlerts.length > 0 && (
                  <div className="p-3 bg-amber-50/60">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hoje ({todayAlerts.length})
                    </p>
                    <ul className="space-y-1.5">
                      {todayAlerts.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-amber-200/80 shadow-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-on-surface">
                              {item.fullName}
                            </p>
                            <p className="truncate text-[11px] text-on-surface-variant">
                              {item.roleTitle}
                              {item.unit?.name ? ` • ${item.unit.name}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            Hoje!
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tomorrowAlerts.length > 0 && (
                  <div className="p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                      Amanhã ({tomorrowAlerts.length})
                    </p>
                    <ul className="space-y-1.5">
                      {tomorrowAlerts.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-surface-container/35 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-on-surface">
                              {item.fullName}
                            </p>
                            <p className="truncate text-[11px] text-on-surface-variant">
                              {item.roleTitle}
                              {item.unit?.name ? ` • ${item.unit.name}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {formatShortDayMonth(
                              item.birthDay,
                              item.birthMonth
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {soonAlerts.length > 0 && (
                  <div className="p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Em breve ({soonAlerts.length})
                    </p>
                    <ul className="space-y-1.5">
                      {soonAlerts.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-on-surface">
                              {item.fullName}
                            </p>
                            <p className="truncate text-[11px] text-on-surface-variant">
                              {formatShortDayMonth(
                                item.birthDay,
                                item.birthMonth
                              )}
                              {item.unit?.name ? ` • ${item.unit.name}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] font-medium text-on-surface-variant">
                            em {item.daysUntilBirthday}d
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-surface-container bg-surface-container/25 p-2.5">
            <Link
              href="/birthdays"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <span>Abrir Painel de Aniversariantes</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
