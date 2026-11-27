'use client'

import { fetchEmployeeBirthdaysAction } from '@/app/(app)/employees/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import type { Department } from '@/http/departments'
import type {
  EmployeeBirthdayItem,
  EmployeeBirthdaysResponse,
} from '@/http/employees'
import type { Unit } from '@/http/get-units'
import {
  AlertCircle,
  Cake,
  CalendarClock,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Gift,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BirthdayCardDialog } from './birthday-card-dialog'
import { MONTH_NAMES_PT } from './birthday-card-generator'

interface BirthdaysContentProps {
  initialData: EmployeeBirthdaysResponse
  units: Unit[]
  departments: Department[]
  canManageEmployees: boolean
}

const MONTH_SHORT_PT = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
]

function buildWhatsappUrl(employee: EmployeeBirthdayItem): string | null {
  if (!employee.mobilePhone) return null
  const digits = employee.mobilePhone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`
  const firstName = employee.fullName.trim().split(/\s+/)[0]
  const text = encodeURIComponent(
    `Olá, ${firstName}! Feliz aniversário! 🎉 Desejamos muita saúde, alegria e sucesso neste novo ciclo. Parabéns de toda a equipe Masterclin!`
  )
  return `https://wa.me/${fullNumber}?text=${text}`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'C'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export function BirthdaysContent({
  initialData,
  units,
  departments,
  canManageEmployees,
}: BirthdaysContentProps) {
  const currentMonth = initialData.month

  const [data, setData] = useState<EmployeeBirthdaysResponse>(initialData)
  const [selectedMonth, setSelectedMonth] = useState<number>(initialData.month)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Card Studio modal states
  const [selectedEmployeeForCard, setSelectedEmployeeForCard] =
    useState<EmployeeBirthdayItem | null>(null)
  const [isCollectiveOpen, setIsCollectiveOpen] = useState(false)

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const res = await fetchEmployeeBirthdaysAction({
        month: selectedMonth,
        unitId: selectedUnitId || undefined,
        departmentId: selectedDepartmentId || undefined,
        search: search.trim() || undefined,
        upcomingDays: 7,
        includePhotos: true,
      })
      setIsLoading(false)

      if (res.success) {
        setData(res.data)
      } else {
        toast.error(res.message)
      }
    }, 220)

    return () => clearTimeout(timer)
  }, [selectedMonth, selectedUnitId, selectedDepartmentId, search])

  const selectedMonthName = MONTH_NAMES_PT[selectedMonth - 1] ?? ''

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = []
    if (selectedUnitId) {
      const unit = units.find((u) => u.id === selectedUnitId)
      if (unit) parts.push(`Unidade ${unit.name}`)
    }
    if (selectedDepartmentId) {
      const dept = departments.find((d) => d.id === selectedDepartmentId)
      if (dept) parts.push(dept.name)
    }
    return parts.length > 0 ? parts.join(' • ') : null
  }, [selectedUnitId, selectedDepartmentId, units, departments])

  const urgentSpotlight = useMemo(
    () => data.upcomingAlerts.filter((a) => a.daysUntilBirthday <= 1),
    [data.upcomingAlerts]
  )

  function handlePrevMonth() {
    setSelectedMonth((prev) => (prev === 1 ? 12 : prev - 1))
  }

  function handleNextMonth() {
    setSelectedMonth((prev) => (prev === 12 ? 1 : prev + 1))
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-surface-container">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cake className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-variant">
              Em {selectedMonthName}
            </p>
            <p className="text-2xl font-bold text-on-surface">
              {data.summary.monthTotal}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center gap-3.5 ${
            data.summary.todayCount > 0
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-surface-container'
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              data.summary.todayCount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-variant">
              Aniversariantes Hoje
            </p>
            <p className="text-2xl font-bold text-on-surface">
              {data.summary.todayCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-surface-container">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-variant">
              Próximos 7 Dias
            </p>
            <p className="text-2xl font-bold text-on-surface">
              {data.summary.upcomingCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-surface-container">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              data.summary.missingBirthDateCount > 0
                ? 'bg-amber-100/80 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {data.summary.missingBirthDateCount > 0 ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-on-surface-variant">
              Ativos sem Data Nasc.
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-on-surface">
                {data.summary.missingBirthDateCount}
              </p>
              {data.summary.missingBirthDateCount > 0 && canManageEmployees && (
                <Link
                  href="/employees"
                  className="text-[11px] font-medium text-primary hover:underline truncate"
                >
                  Revisar fichas
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Spotlight Banner for Today & Tomorrow */}
      {urgentSpotlight.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-amber-900">
              <Gift className="h-4.5 w-4.5 text-amber-600 shrink-0" />
              <h2 className="text-sm font-bold">
                Destaques Imediatos (Hoje e Amanhã)
              </h2>
            </div>
            <span className="text-xs text-amber-800/80">
              Gere e compartilhe o card comemorativo com um clique
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentSpotlight.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-white px-3.5 py-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={emp.fullName}
                      className="h-10 w-10 rounded-full object-cover border border-amber-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 shrink-0">
                      {getInitials(emp.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-on-surface">
                        {emp.fullName}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          emp.isToday
                            ? 'bg-amber-500 text-white'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {emp.isToday ? 'Hoje!' : 'Amanhã'}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-on-surface-variant">
                      {emp.roleTitle}
                      {emp.unit?.name ? ` • ${emp.unit.name}` : ''}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSelectedEmployeeForCard(emp)}
                  className="shrink-0 h-8 px-2.5 text-xs gap-1"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Card</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls & Filters Toolbar */}
      <Card className="p-4 border-surface-container space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-surface-container bg-surface-container/30 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <select
                aria-label="Selecionar mês"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent px-3 py-1 text-sm font-bold text-primary outline-none cursor-pointer"
              >
                {MONTH_NAMES_PT.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {selectedMonth !== currentMonth && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMonth(currentMonth)}
                className="text-xs h-9"
              >
                Voltar para mês atual
              </Button>
            )}
          </div>

          {/* Primary CTA: Collective Month Card */}
          <Button
            type="button"
            onClick={() => setIsCollectiveOpen(true)}
            disabled={data.monthBirthdays.length === 0}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Gerar Card de {selectedMonthName} (PNG)</span>
          </Button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, cargo ou matrícula..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <select
            aria-label="Filtrar por unidade"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="h-9 rounded-md border border-surface-container bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="">Todas as unidades</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por departamento"
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="h-9 rounded-md border border-surface-container bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="">Todos os departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Birthdays List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Carregando aniversariantes...</span>
        </div>
      ) : data.monthBirthdays.length === 0 ? (
        <EmptyState
          icon={Cake}
          title={`Nenhum aniversariante em ${selectedMonthName}`}
          description={
            search || selectedUnitId || selectedDepartmentId
              ? 'Nenhum colaborador ativo encontrado com os filtros aplicados.'
              : 'Não há colaboradores ativos com aniversário cadastrado para este mês.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.monthBirthdays.map((emp) => {
            const whatsappUrl = buildWhatsappUrl(emp)

            return (
              <Card
                key={emp.id}
                className={`p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
                  emp.isToday
                    ? 'border-amber-300 bg-amber-50/35 ring-1 ring-amber-200'
                    : emp.isTomorrow
                      ? 'border-primary/40 bg-primary/[0.02]'
                      : 'border-surface-container'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Day Badge */}
                  <div
                    className={`flex flex-col items-center justify-center h-14 w-13 shrink-0 rounded-xl font-bold ${
                      emp.isToday
                        ? 'bg-amber-500 text-white shadow-sm'
                        : emp.isTomorrow
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="text-lg leading-none">
                      {String(emp.birthDay).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] tracking-wider mt-0.5 opacity-90">
                      {MONTH_SHORT_PT[emp.birthMonth - 1]}
                    </span>
                  </div>

                  {/* Avatar + Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt={emp.fullName}
                        className="h-12 w-12 rounded-full object-cover border border-surface-container shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-on-surface-variant shrink-0">
                        {getInitials(emp.fullName)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-on-surface leading-snug truncate">
                          {emp.fullName}
                        </h3>
                      </div>

                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {emp.roleTitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {emp.isToday && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Sparkles className="h-2.5 w-2.5" />
                            Aniversário Hoje!
                          </span>
                        )}
                        {emp.isTomorrow && (
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Amanhã
                          </span>
                        )}
                        {!emp.isToday &&
                          !emp.isTomorrow &&
                          emp.daysUntilBirthday <= 7 && (
                            <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                              Em {emp.daysUntilBirthday} dias
                            </span>
                          )}

                        {emp.unit?.name && (
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                            {emp.unit.name}
                          </span>
                        )}
                        {emp.department?.name && (
                          <span className="rounded-full bg-surface-container/70 px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                            {emp.department.name}
                          </span>
                        )}
                        {!emp.photoUrl && (
                          <span
                            title="Nenhuma foto 3x4 cadastrada na ficha; você poderá enviar uma foto na hora de gerar o card."
                            className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                          >
                            Sem foto na ficha
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-surface-container/70">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSelectedEmployeeForCard(emp)}
                    className="gap-1.5 text-xs flex-1"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Gerar Card</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar parabéns no WhatsApp"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}

                    {canManageEmployees && (
                      <Link
                        href="/employees/requests"
                        title="Solicitações / Folga de Aniversário (Day-Off)"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-container bg-surface text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                      >
                        <CalendarHeart className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Individual Card Modal */}
      <BirthdayCardDialog
        mode="individual"
        open={Boolean(selectedEmployeeForCard)}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployeeForCard(null)
        }}
        employee={selectedEmployeeForCard}
      />

      {/* Collective Month Card Modal (Option A — Editorial) */}
      <BirthdayCardDialog
        mode="collective"
        open={isCollectiveOpen}
        onOpenChange={setIsCollectiveOpen}
        month={selectedMonth}
        employees={data.monthBirthdays}
        filterLabel={activeFilterLabel}
      />
    </div>
  )
}
