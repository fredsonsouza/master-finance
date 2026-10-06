'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CashClosure, CashClosurePagination } from '@/http/cash-closures'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  changeCashClosureStatus,
  deleteCashClosure,
  fetchCashClosuresAction,
} from './actions'
import { CreateCashClosureDialog } from './create-cash-closure-dialog'
import { downloadCashClosuresPdf } from './download-cash-closures-pdf'
import { UpdateCashClosureDialog } from './update-cash-closure-dialog'

interface Props {
  initialClosures: CashClosure[]
  initialPagination: CashClosurePagination
  sectors: Sector[]
  units: Unit[]
  users: User[]
  userRole: string
  userId: string
  activeUnitId: string | null
}

export function CashClosuresContent({
  initialClosures,
  initialPagination,
  sectors,
  units,
  users,
  userRole,
  userId,
  activeUnitId,
}: Props) {
  const [closures, setClosures] = useState(initialClosures)
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, startTransition] = useTransition()

  const [prevInitialClosures, setPrevInitialClosures] =
    useState(initialClosures)

  if (initialClosures !== prevInitialClosures) {
    setPrevInitialClosures(initialClosures)
    setClosures(initialClosures)
    setPagination(initialPagination)
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [unitFilter, setUnitFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClosure, setEditingClosure] = useState<CashClosure | null>(null)

  // Modal states
  const [closureToConfirm, setClosureToConfirm] = useState<string | null>(null)
  const [closureToDelete, setClosureToDelete] = useState<string | null>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const isFinancial = ['ADMIN', 'MANAGER', 'FINANCIAL'].includes(userRole)

  const loadClosures = useCallback(
    (
      page = 1,
      overrides?: {
        search?: string
        status?: string
        unitId?: string
        startDate?: string
        endDate?: string
      }
    ) => {
      const activeSearch =
        overrides?.search !== undefined ? overrides.search : search
      const activeStatus =
        overrides?.status !== undefined ? overrides.status : statusFilter
      const activeUnit =
        overrides?.unitId !== undefined ? overrides.unitId : unitFilter
      const activeStart =
        overrides?.startDate !== undefined ? overrides.startDate : startDate
      const activeEnd =
        overrides?.endDate !== undefined ? overrides.endDate : endDate

      startTransition(async () => {
        const res = await fetchCashClosuresAction({
          page,
          perPage: 20,
          search: activeSearch || undefined,
          status:
            activeStatus !== 'ALL'
              ? (activeStatus as 'OPEN' | 'CLOSED')
              : undefined,
          unitId: activeUnit !== 'ALL' ? activeUnit : undefined,
          startDate: activeStart || undefined,
          endDate: activeEnd || undefined,
        })

        if (res.success) {
          setClosures(res.closures)
          setPagination(res.pagination)
        } else {
          toast.error('Erro ao carregar fechamentos.')
        }
      })
    },
    [search, statusFilter, unitFilter, startDate, endDate]
  )

  // Debounced search
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      loadClosures(1, { search })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, loadClosures])

  function handleStatusChange(val: string) {
    setStatusFilter(val)
    loadClosures(1, { status: val })
  }

  function handleUnitChange(val: string) {
    setUnitFilter(val)
    loadClosures(1, { unitId: val })
  }

  function handleStartDateChange(val: string) {
    setStartDate(val)
    loadClosures(1, { startDate: val })
  }

  function handleEndDateChange(val: string) {
    setEndDate(val)
    loadClosures(1, { endDate: val })
  }

  async function handleExportPdf() {
    setIsExportingPdf(true)
    try {
      const res = await fetchCashClosuresAction({
        page: 1,
        perPage: 500,
        search: search || undefined,
        status:
          statusFilter !== 'ALL'
            ? (statusFilter as 'OPEN' | 'CLOSED')
            : undefined,
        unitId: unitFilter !== 'ALL' ? unitFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })

      if (res.success && res.closures) {
        const totalValue = res.closures.reduce((acc, c) => acc + c.value, 0)
        const activeUnitObj = units.find((u) => u.id === unitFilter)
        const statusLabel =
          statusFilter === 'CLOSED'
            ? 'Fechado'
            : statusFilter === 'OPEN'
              ? 'Em Aberto'
              : 'Todos os Status'

        await downloadCashClosuresPdf({
          closures: res.closures,
          totalValue,
          filters: {
            unitName: activeUnitObj ? activeUnitObj.name : 'Todas as Unidades',
            statusLabel,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            search: search || undefined,
          },
        })

        toast.success('Relatório em PDF gerado e baixado com sucesso!')
      } else {
        toast.error('Erro ao buscar dados para o relatório.')
      }
    } catch {
      toast.error('Erro ao gerar relatório em PDF.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleDelete() {
    if (!closureToDelete) return
    const res = await deleteCashClosure(closureToDelete)
    if (res.success) {
      toast.success('Lançamento excluído.')
      loadClosures(pagination.page)
    } else {
      toast.error(res.message)
    }
    setClosureToDelete(null)
  }

  async function handleBaixa() {
    if (!closureToConfirm) return
    const res = await changeCashClosureStatus(closureToConfirm, 'CLOSED')
    if (res.success) {
      toast.success('Caixa fechado com sucesso!')
      loadClosures(pagination.page)
    } else {
      toast.error(res.message)
    }
    setClosureToConfirm(null)
  }

  async function handleReopen(closureId: string) {
    const res = await changeCashClosureStatus(closureId, 'OPEN')
    if (res.success) {
      toast.success('Caixa reaberto com sucesso!')
      loadClosures(pagination.page)
    } else {
      toast.error(res.message)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Fechamentos de Caixa
          </h1>
          <p className="text-on-surface-variant">
            Gerencie as entregas de caixa diárias
          </p>
        </div>
        <div className="flex gap-2">
          {isFinancial && (
            <Button
              variant="outline"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="gap-2 cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          )}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Fechamento
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-surface p-4 rounded-md border border-surface-container">
        <div className="w-full sm:w-64 space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase">
            Colaborador
          </label>
          <Input
            placeholder="Buscar por nome..."
            className="w-full bg-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-40 space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full border border-surface-container bg-surface rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">Todos</option>
            <option value="OPEN">Em Aberto</option>
            <option value="CLOSED">Fechado</option>
          </select>
        </div>

        {isFinancial && (
          <div className="w-full sm:w-48 space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase">
              Unidade
            </label>
            <select
              value={unitFilter}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full border border-surface-container bg-surface rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">Todas</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="w-full sm:w-36 space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase">
            Data Inicial
          </label>
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            outputFormat="YYYY-MM-DD"
            className="w-full bg-surface"
          />
        </div>

        <div className="w-full sm:w-36 space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase">
            Data Final
          </label>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            outputFormat="YYYY-MM-DD"
            className="w-full bg-surface"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Envio</th>
                  <th className="px-6 py-3 font-semibold">Data do Caixa</th>
                  <th className="px-6 py-3 font-semibold">Colaborador</th>
                  {isFinancial && (
                    <th className="px-6 py-3 font-semibold">Unidade</th>
                  )}
                  <th className="px-6 py-3 font-semibold">Valor</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-surface-container ${isLoading ? 'opacity-60 transition-opacity' : ''}`}
              >
                {closures.map((closure) => {
                  const canEdit =
                    isFinancial ||
                    (closure.status === 'OPEN' && closure.user.id === userId)
                  const canDelete = isFinancial

                  return (
                    <tr
                      key={closure.id}
                      className="hover:bg-surface-container-lowest transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-xs">
                        {new Date(closure.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                        {new Date(closure.cashDate).toLocaleDateString(
                          'pt-BR',
                          { timeZone: 'UTC' }
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {closure.user.name}
                      </td>
                      {isFinancial && (
                        <td className="px-6 py-4 text-on-surface-variant">
                          {closure.unit?.name || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 font-bold tabular-nums">
                        {formatCurrency(closure.value)}
                      </td>
                      <td className="px-6 py-4">
                        {closure.status === 'OPEN' ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Em Aberto
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            Fechado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {closure.status === 'OPEN' && isFinancial && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Dar Baixa"
                              onClick={() => setClosureToConfirm(closure.id)}
                              className="text-success hover:text-success hover:bg-success/10 h-8 w-8 cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {closure.status === 'CLOSED' && isFinancial && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reabrir Caixa"
                              onClick={() => handleReopen(closure.id)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 h-8 w-8 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => setEditingClosure(closure)}
                              className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              onClick={() => setClosureToDelete(closure.id)}
                              className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {closures.length === 0 && (
                  <tr>
                    <td
                      colSpan={isFinancial ? 7 : 6}
                      className="px-6 py-8 text-center text-on-surface-variant"
                    >
                      {isLoading
                        ? 'Carregando fechamentos...'
                        : 'Nenhum fechamento encontrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-surface-container bg-surface-container-lowest text-xs text-on-surface-variant">
              <span>
                Página <strong>{pagination.page}</strong> de{' '}
                <strong>{pagination.totalPages}</strong> (
                {pagination.totalCount}{' '}
                {pagination.totalCount === 1 ? 'fechamento' : 'fechamentos'})
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => loadClosures(pagination.page - 1)}
                  className="h-7 px-2 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.page >= pagination.totalPages || isLoading
                  }
                  onClick={() => loadClosures(pagination.page + 1)}
                  className="h-7 px-2 cursor-pointer"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <CreateCashClosureDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sectors={sectors}
        users={users}
      />

      <UpdateCashClosureDialog
        closure={editingClosure}
        onClose={() => setEditingClosure(null)}
      />

      {/* Modal Confirmar Baixa */}
      <Dialog
        open={!!closureToConfirm}
        onOpenChange={(val) => !val && setClosureToConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Dar Baixa no Caixa
            </DialogTitle>
            <DialogDescription>
              Você está prestes a confirmar o recebimento deste caixa. O status
              será alterado para <strong>Fechado</strong> e ele não poderá mais
              ser editado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setClosureToConfirm(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-success text-white hover:bg-success/90 cursor-pointer"
              onClick={handleBaixa}
            >
              Confirmar Recebimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog
        open={!!closureToDelete}
        onOpenChange={(val) => !val && setClosureToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              Excluir Lançamento
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente este fechamento de
              caixa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setClosureToDelete(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-error text-white hover:bg-error/90 cursor-pointer"
              onClick={handleDelete}
            >
              Sim, Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
