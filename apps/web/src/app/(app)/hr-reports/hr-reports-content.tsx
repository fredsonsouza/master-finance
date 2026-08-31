'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { HrReport, HrReportPagination, HrReportSummary } from '@/http/get-hr-reports'
import type { Unit } from '@/http/get-units'
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteHrReportAction, fetchHrReportsAction } from './actions'
import { HrReportDialog } from './hr-report-dialog'
import { ViewHrReportDialog } from './view-hr-report-dialog'

interface HrReportsContentProps {
  initialReports: HrReport[]
  initialSummary: HrReportSummary
  initialPagination: HrReportPagination
  units: Unit[]
  currentUser: {
    id: string
    name: string | null
    role: string
    unitId?: string | null
  }
}

export function HrReportsContent({
  initialReports,
  initialSummary,
  initialPagination,
  units,
  currentUser,
}: HrReportsContentProps) {
  const isManager =
    currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'

  const [reports, setReports] = useState<HrReport[]>(initialReports)
  const [summary, setSummary] = useState<HrReportSummary>(initialSummary)
  const [pagination, setPagination] = useState<HrReportPagination>(initialPagination)

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SENT'>('ALL')
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [activeSectorFilter, setActiveSectorFilter] = useState('')
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<HrReport | null>(null)
  const [viewingReport, setViewingReport] = useState<HrReport | null>(null)
  const [deletingReport, setDeletingReport] = useState<HrReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadReports(
    page: number,
    status = statusFilter,
    unitId = selectedUnitFilter,
    sector = activeSectorFilter,
    searchTerm = activeSearch
  ) {
    setIsLoading(true)
    const result = await fetchHrReportsAction({
      page,
      perPage: pagination.perPage || 20,
      status: status === 'ALL' ? undefined : status,
      unitId: unitId || undefined,
      sector: sector || undefined,
      search: searchTerm || undefined,
    })

    if (result.success && result.data) {
      setReports(result.data.reports)
      setPagination(result.data.pagination)
      if (result.data.summary) {
        setSummary(result.data.summary)
      }
    } else {
      toast.error('Erro ao carregar relatórios.')
    }
    setIsLoading(false)
  }

  function handleStatusChange(newStatus: 'ALL' | 'DRAFT' | 'SENT') {
    setStatusFilter(newStatus)
    loadReports(1, newStatus, selectedUnitFilter, activeSectorFilter, activeSearch)
  }

  function handleUnitChange(newUnitId: string) {
    setSelectedUnitFilter(newUnitId)
    loadReports(1, statusFilter, newUnitId, activeSectorFilter, activeSearch)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setActiveSearch(search)
    setActiveSectorFilter(sectorFilter)
    loadReports(1, statusFilter, selectedUnitFilter, sectorFilter, search)
  }

  function handleClearFilters() {
    setSearch('')
    setActiveSearch('')
    setSectorFilter('')
    setActiveSectorFilter('')
    loadReports(1, statusFilter, selectedUnitFilter, '', '')
  }

  async function confirmDelete() {
    if (!deletingReport) return
    setIsDeleting(true)
    const result = await deleteHrReportAction(deletingReport.id)
    if (result.success) {
      toast.success('Relatório excluído com sucesso!')
      setDeletingReport(null)
      loadReports(pagination.page)
    } else {
      toast.error(result.message || 'Erro ao excluir relatório.')
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Relatórios de Setor & RH
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Registro e envio de relatórios operacionais diários e mensais dos setores para o RH.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => handleStatusChange('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-primary bg-primary-container/20 ring-1 ring-primary'
              : 'border-surface-container bg-surface hover:bg-surface-container/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase">
              Total de Relatórios
            </span>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">
            {summary.totalCount}
          </div>
        </div>

        <div
          onClick={() => handleStatusChange('SENT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'SENT'
              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
              : 'border-surface-container bg-surface hover:bg-surface-container/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
              Enviados ao RH
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {summary.sentCount}
          </div>
          <div className="text-xs text-on-surface-variant mt-1 font-medium">
            Relatórios formalizados e registrados
          </div>
        </div>

        <div
          onClick={() => handleStatusChange('DRAFT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'DRAFT'
              ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-600'
              : 'border-surface-container bg-surface hover:bg-surface-container/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
              Rascunhos em Edição
            </span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {summary.draftCount}
          </div>
          <div className="text-xs text-on-surface-variant mt-1 font-medium">
            Relatórios em andamento (não entregues)
          </div>
        </div>
      </div>

      {/* Tabela e Filtros */}
      <Card className="border-surface-container shadow-sm">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-primary">
              {statusFilter === 'ALL'
                ? 'Todos os Relatórios'
                : statusFilter === 'SENT'
                  ? 'Relatórios Enviados ao RH'
                  : 'Rascunhos em Andamento'}
            </CardTitle>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg text-xs font-medium self-start md:self-auto">
              <button
                type="button"
                onClick={() => handleStatusChange('ALL')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-surface text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('SENT')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'SENT'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Enviados
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('DRAFT')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'DRAFT'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Rascunhos
              </button>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2"
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Buscar por título, conteúdo, setor ou colaborador..."
                className="bg-surface pl-8 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {(search || sectorFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Setor Filtro Texto */}
            <div className="relative w-full md:w-44 shrink-0">
              <Layers className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Filtrar por setor..."
                className="bg-surface pl-8 h-9 text-xs"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              />
            </div>

            {/* Unidade (apenas para Admin/Manager ou quem tem filiais) */}
            {isManager && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Building2 className="h-4 w-4 text-primary hidden sm:block" />
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="h-9 rounded-md border border-outline bg-surface text-on-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer w-full md:w-44"
                >
                  <option value="">Todas as Unidades</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="h-9 text-xs gap-1.5 cursor-pointer shrink-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Filter className="h-3.5 w-3.5" />
              )}
              Filtrar
            </Button>
          </form>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Carregando relatórios...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant px-4">
              <FileText className="h-12 w-12 text-primary/30 mb-3" />
              <p className="text-base font-semibold text-on-surface">
                Nenhum relatório encontrado
              </p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                {isManager
                  ? 'Nenhum relatório corresponde aos filtros selecionados.'
                  : 'Você ainda não registrou nenhum relatório. Clique em "+ Novo Relatório" para começar.'}
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                variant="outline"
                className="mt-4 gap-2 cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar Relatório Agora
              </Button>
            </div>
          ) : (
            <div className="border-t sm:border border-surface-container overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest/50 text-xs font-semibold uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-3.5">Título / Relatório</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Data Ref.</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Colaborador</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Setor / Unidade</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-center">Status</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Carimbo de Envio</th>
                      <th className="px-6 py-3.5 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {reports.map((report) => {
                      const isSent = report.status === 'SENT'
                      const isAuthor = report.user.id === currentUser.id
                      const canEdit = isAuthor && !isSent

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-surface-container/40 transition-colors"
                        >
                          {/* Título */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-on-surface flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="line-clamp-1">{report.title}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5 max-w-md">
                              {report.content}
                            </p>
                          </td>

                          {/* Data de Referência */}
                          <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>
                                {new Date(report.reportDate).toLocaleDateString(
                                  'pt-BR',
                                  { timeZone: 'UTC' }
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Colaborador */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs">
                            <div className="font-medium text-on-surface">
                              {report.user.name}
                            </div>
                          </td>

                          {/* Setor e Unidade */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-on-surface-variant">
                            <div className="font-medium text-on-surface">
                              {report.sector || 'Geral'}
                            </div>
                            <div className="text-[11px] text-primary">
                              {report.unit?.name || 'Todas as Unidades'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isSent
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                              }`}
                            >
                              {isSent ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Enviado
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Rascunho
                                </>
                              )}
                            </span>
                          </td>

                          {/* Carimbo de Envio */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-on-surface-variant">
                            {report.sentAt ? (
                              <div className="font-medium text-emerald-700 dark:text-emerald-400">
                                {new Date(report.sentAt).toLocaleString('pt-BR')}
                              </div>
                            ) : (
                              <span className="text-on-surface-variant italic">
                                Em elaboração
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Visualizar */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-on-surface hover:text-primary cursor-pointer"
                                onClick={() => setViewingReport(report)}
                                title="Visualizar / Imprimir Relatório"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {/* Editar (apenas rascunhos) */}
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-on-surface hover:text-primary cursor-pointer"
                                  onClick={() => setEditingReport(report)}
                                  title="Continuar Editando Rascunho"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Excluir (rascunhos ou admin) */}
                              {(canEdit || isManager) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-on-surface hover:text-error cursor-pointer"
                                  onClick={() => setDeletingReport(report)}
                                  title="Excluir Relatório"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-surface-container bg-surface-container-lowest text-xs text-on-surface-variant">
                  <span>
                    Página <strong>{pagination.page}</strong> de{' '}
                    <strong>{pagination.totalPages}</strong> ({pagination.totalCount} relatórios)
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || isLoading}
                      onClick={() => loadReports(pagination.page - 1)}
                      className="h-7 px-2 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                      onClick={() => loadReports(pagination.page + 1)}
                      className="h-7 px-2 cursor-pointer"
                    >
                      Próxima
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <HrReportDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        units={units}
        defaultUnitId={currentUser.unitId}
        onSaved={() => loadReports(1)}
      />

      {/* Modal de Edição */}
      {editingReport && (
        <HrReportDialog
          report={editingReport}
          open={!!editingReport}
          onOpenChange={(open) => !open && setEditingReport(null)}
          units={units}
          defaultUnitId={currentUser.unitId}
          onSaved={() => {
            setEditingReport(null)
            loadReports(pagination.page)
          }}
        />
      )}

      {/* Modal de Leitura / Impressão */}
      {viewingReport && (
        <ViewHrReportDialog
          report={viewingReport}
          open={!!viewingReport}
          onOpenChange={(open) => !open && setViewingReport(null)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={!!deletingReport}
        onOpenChange={(open) => !open && setDeletingReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Relatório</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o relatório{' '}
              <span className="font-semibold text-on-surface">
                &ldquo;{deletingReport?.title}&rdquo;
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingReport(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
