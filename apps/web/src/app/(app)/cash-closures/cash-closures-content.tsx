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
import type { CashClosure } from '@/http/cash-closures'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { changeCashClosureStatus, deleteCashClosure } from './actions'
import { CreateCashClosureDialog } from './create-cash-closure-dialog'
import { UpdateCashClosureDialog } from './update-cash-closure-dialog'

interface Props {
  initialClosures: CashClosure[]
  sectors: Sector[]
  units: Unit[]
  users: User[]
  userRole: string
  userId: string
  activeUnitId: string | null
}

export function CashClosuresContent({
  initialClosures,
  sectors,
  units,
  users,
  userRole,
  userId,
  activeUnitId,
}: Props) {
  const [closures, setClosures] = useState(initialClosures)
  const [prevInitialClosures, setPrevInitialClosures] =
    useState(initialClosures)

  if (initialClosures !== prevInitialClosures) {
    setPrevInitialClosures(initialClosures)
    setClosures(initialClosures)
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

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Relatorio_Fechamento_Caixas',
  })

  const isFinancial = ['ADMIN', 'MANAGER', 'FINANCIAL'].includes(userRole)

  const filtered = closures.filter((c) => {
    const matchesSearch = c.user.name
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter

    const matchesUnit = unitFilter === 'ALL' || c.unit?.id === unitFilter

    let matchesDate = true
    if (startDate || endDate) {
      const closureDateStr = new Date(c.cashDate).toISOString().split('T')[0]
      if (startDate && closureDateStr < startDate) matchesDate = false
      if (endDate && closureDateStr > endDate) matchesDate = false
    }

    return matchesSearch && matchesStatus && matchesUnit && matchesDate
  })

  const totalValue = filtered.reduce((acc, c) => acc + c.value, 0)

  async function handleDelete() {
    if (!closureToDelete) return
    const res = await deleteCashClosure(closureToDelete)
    if (res.success) {
      toast.success('Lançamento excluído.')
      setClosures(closures.filter((c) => c.id !== closureToDelete))
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
      setClosures(
        closures.map((c) =>
          c.id === closureToConfirm ? { ...c, status: 'CLOSED' } : c
        )
      )
    } else {
      toast.error(res.message)
    }
    setClosureToConfirm(null)
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
              onClick={() => handlePrint()}
              className="gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Relatório (PDF)
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setUnitFilter(e.target.value)}
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
            onChange={setStartDate}
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
            onChange={setEndDate}
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
              <tbody className="divide-y divide-surface-container">
                {filtered.map((closure) => {
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
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-on-surface-variant"
                    >
                      Nenhum fechamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Impressão Oculta */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black print:block">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.png"
                  alt="Logo da Clínica"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Relatório de Fechamentos de Caixa
                </h2>
                <p className="text-gray-500 text-sm">
                  Gerado em {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border-b border-gray-300">Data do Caixa</th>
                <th className="p-2 border-b border-gray-300">Colaborador</th>
                {isFinancial && (
                  <th className="p-2 border-b border-gray-300">Unidade</th>
                )}
                <th className="p-2 border-b border-gray-300">Status</th>
                <th className="p-2 border-b border-gray-300">Observação</th>
                <th className="p-2 border-b border-gray-300 text-right">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="p-2">
                    {new Date(c.cashDate).toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                    })}
                  </td>
                  <td className="p-2">{c.user.name}</td>
                  {isFinancial && (
                    <td className="p-2">{c.unit?.name || '-'}</td>
                  )}
                  <td className="p-2">
                    {c.status === 'OPEN' ? 'Em Aberto' : 'Fechado'}
                  </td>
                  <td className="p-2 text-xs text-gray-500">
                    {c.observation || '-'}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(c.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td
                  colSpan={isFinancial ? 5 : 4}
                  className="p-4 text-right font-bold text-gray-700 text-lg uppercase"
                >
                  Valor Total no Período Selecionado:
                </td>
                <td className="p-4 text-right font-bold text-green-700 text-lg">
                  {formatCurrency(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

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
