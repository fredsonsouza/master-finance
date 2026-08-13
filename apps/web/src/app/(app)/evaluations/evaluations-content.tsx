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
import { Textarea } from '@/components/ui/textarea'
import type {
  EvaluationItem,
  EvaluationMetrics,
  EvaluationPagination,
  PodiumItem,
} from '@/http/get-evaluations'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import {
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Frown,
  Laugh,
  Loader2,
  Medal,
  Meh,
  MessageSquare,
  Pencil,
  Smile,
  Star,
  ThumbsUp,
  Trash2,
  Trophy,
  UserCheck,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  deleteEvaluationAction,
  fetchEvaluationsAction,
  updateEvaluationAction,
} from './actions'
import { QrCodeCard } from './qr-code-card'

interface Props {
  initialEvaluations: EvaluationItem[]
  initialMetrics: EvaluationMetrics
  initialPagination: EvaluationPagination
  initialPodium?: PodiumItem[]
  currentUser: {
    id: string
    name: string
    role: string
  }
  sellers?: User[]
  units?: Unit[]
}

const RATING_CONFIG = {
  EXCELLENT: {
    label: 'Ótimo',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    icon: Laugh,
  },
  GOOD: {
    label: 'Bom',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    icon: Smile,
  },
  REGULAR: {
    label: 'Regular',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    icon: Meh,
  },
  BAD: {
    label: 'Ruim',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    icon: Frown,
  },
}

export function EvaluationsContent({
  initialEvaluations,
  initialMetrics,
  initialPagination,
  initialPodium = [],
  currentUser,
  sellers = [],
  units = [],
}: Props) {
  const isSeller = currentUser.role === 'SELLER'
  const isManagement = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  const isAdmin = currentUser.role === 'ADMIN'

  // Data states
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(initialEvaluations)
  const [metrics, setMetrics] = useState<EvaluationMetrics>(initialMetrics)
  const [pagination, setPagination] = useState<EvaluationPagination>(initialPagination)
  const [podium, setPodium] = useState<PodiumItem[]>(initialPodium)

  // Filters
  const [selectedSellerId, setSelectedSellerId] = useState<string>(isSeller ? currentUser.id : '')
  const [selectedPodiumUnitId, setSelectedPodiumUnitId] = useState<string>('')
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [isFetchingPodium, setIsFetchingPodium] = useState(false)

  // Edit / Delete modal states
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationItem | null>(null)
  const [deletingEvaluation, setDeletingEvaluation] = useState<EvaluationItem | null>(null)

  const [editRating, setEditRating] = useState<'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'>('EXCELLENT')
  const [editPreset, setEditPreset] = useState('')
  const [editObservation, setEditObservation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch paginated history evaluations
  async function loadEvaluationsPage(page: number, sellerId = selectedSellerId) {
    setIsFetchingData(true)
    const res = await fetchEvaluationsAction({
      page,
      perPage: pagination.perPage || 10,
      sellerId: sellerId || undefined,
      podiumUnitId: selectedPodiumUnitId || undefined,
    })

    if (res.success && res.data) {
      setEvaluations(res.data.evaluations)
      setPagination(res.data.pagination)
      setMetrics(res.data.metrics)
      if (res.data.podium) setPodium(res.data.podium)
    } else {
      toast.error('Erro ao carregar histórico de avaliações.')
    }
    setIsFetchingData(false)
  }

  // Handle unit change specifically for Podium
  async function handlePodiumUnitChange(unitId: string) {
    setSelectedPodiumUnitId(unitId)
    if (!unitId) {
      setPodium([])
      return
    }

    setIsFetchingPodium(true)
    const res = await fetchEvaluationsAction({
      page: pagination.page,
      perPage: pagination.perPage,
      sellerId: selectedSellerId || undefined,
      podiumUnitId: unitId,
    })

    if (res.success && res.data) {
      setPodium(res.data.podium)
    } else {
      toast.error('Erro ao carregar pódio da unidade.')
    }
    setIsFetchingPodium(false)
  }

  // Handle seller filter change for evaluations history
  async function handleSellerChange(sellerId: string) {
    setSelectedSellerId(sellerId)
    await loadEvaluationsPage(1, sellerId)
  }

  function openEditModal(ev: EvaluationItem) {
    setEditingEvaluation(ev)
    setEditRating(ev.rating)
    setEditPreset(ev.presetComment || '')
    setEditObservation(ev.observation || '')
  }

  async function handleConfirmDelete() {
    if (!deletingEvaluation) return
    setIsSubmitting(true)
    const result = await deleteEvaluationAction(deletingEvaluation.id)
    if (result.success) {
      toast.success('Avaliação excluída com sucesso!')
      setDeletingEvaluation(null)
      await loadEvaluationsPage(pagination.page)
    } else {
      toast.error(result.message || 'Erro ao excluir avaliação.')
    }
    setIsSubmitting(false)
  }

  async function handleConfirmEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingEvaluation) return
    setIsSubmitting(true)

    const result = await updateEvaluationAction(editingEvaluation.id, {
      rating: editRating,
      presetComment: editPreset || null,
      observation: editObservation.trim() || null,
    })

    if (result.success) {
      toast.success('Avaliação atualizada com sucesso!')
      setEditingEvaluation(null)
      await loadEvaluationsPage(pagination.page)
    } else {
      toast.error(result.message || 'Erro ao atualizar avaliação.')
    }
    setIsSubmitting(false)
  }

  const activeSeller = sellers.find((s) => s.id === selectedSellerId)
  const currentSellerName = isSeller
    ? currentUser.name
    : activeSeller
      ? activeSeller.name
      : ''

  const selectedUnitObj = units.find((u) => u.id === selectedPodiumUnitId)

  return (
    <div className="space-y-6">
      {/* REDESIGNED PODIUM SECTION (ADMIN & MANAGER ONLY) - LIST FORMAT PER UNIT */}
      {isManagement && (
        <Card className="border-surface-container bg-surface shadow-sm overflow-hidden">
          <CardHeader className="bg-surface-container-lowest border-b border-surface-container pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Pódio dos Recepcionistas Mais Bem Avaliados
                </CardTitle>
                <p className="text-xs text-on-surface-variant">
                  Classificação individual por unidade baseada no nível de satisfação dos clientes.
                </p>
              </div>

              {/* Unit Filter dropdown with mandatory choice */}
              <div className="flex items-center gap-2 shrink-0">
                <Building2 className="h-4 w-4 text-primary hidden sm:block" />
                <span className="text-xs font-semibold text-on-surface whitespace-nowrap">
                  Filtrar Unidade:
                </span>
                <select
                  value={selectedPodiumUnitId}
                  onChange={(e) => handlePodiumUnitChange(e.target.value)}
                  className="h-9 rounded-md border border-outline bg-surface text-on-surface px-3 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer sm:w-56"
                >
                  <option value="">Escolha uma unidade</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {!selectedPodiumUnitId ? (
              /* State when no unit is selected */
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline/40">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <p className="text-sm font-semibold text-on-surface">
                    Selecione uma unidade para visualizar o pódio
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Escolha uma unidade no filtro acima para ver os 3 melhores atendentes da recepção daquela unidade.
                  </p>
                </div>
              </div>
            ) : isFetchingPodium ? (
              /* Loading state */
              <div className="flex items-center justify-center py-10 text-on-surface-variant gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Carregando pódio da unidade...
              </div>
            ) : podium.length === 0 ? (
              /* Empty state for selected unit */
              <div className="text-center py-8 text-on-surface-variant text-sm bg-surface-container-lowest/30 rounded-xl">
                Nenhum recepcionista com avaliações nesta unidade até o momento.
              </div>
            ) : (
              /* PODIUM LIST FORMAT */
              <div className="space-y-3">
                <div className="text-xs font-semibold text-on-surface-variant mb-2 flex items-center gap-1.5">
                  Top 3 Atendentes - <span className="text-primary font-bold">{selectedUnitObj?.name}</span>
                </div>

                {podium.map((item) => {
                  const isGold = item.position === 1
                  const isSilver = item.position === 2
                  const isBronze = item.position === 3

                  return (
                    <div
                      key={item.sellerId}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                        isGold
                          ? 'bg-gradient-to-r from-amber-500/10 via-surface to-surface border-amber-400/60 shadow-sm'
                          : isSilver
                            ? 'bg-gradient-to-r from-slate-300/10 via-surface to-surface border-slate-300/60'
                            : 'bg-gradient-to-r from-amber-800/10 via-surface to-surface border-amber-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position Badge / Medal */}
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full font-black text-sm flex items-center justify-center shadow-sm ${
                            isGold
                              ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-400/20'
                              : isSilver
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                : 'bg-amber-800 text-amber-100'
                          }`}
                        >
                          {isGold ? (
                            <Crown className="h-5 w-5 fill-amber-950" />
                          ) : isSilver ? (
                            <Medal className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          ) : (
                            <Award className="h-5 w-5 text-amber-200" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface text-base">
                              {item.position}º {item.sellerName}
                            </span>
                            {isGold && (
                              <span className="bg-amber-400/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-400/40">
                                Destaque #1
                              </span>
                            )}
                          </div>
                          {item.unitName && (
                            <span className="text-xs text-on-surface-variant font-medium">
                              {item.unitName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score & Metrics Pill */}
                      <div className="flex items-center gap-4 sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-outline/20">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.satisfactionRate}% de Satisfação
                          </div>
                          <div className="text-xs text-on-surface-variant font-normal">
                            {item.totalEvaluations} avaliações ({item.excellentCount} ótimas, {item.goodCount} boas)
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Controls for ADMIN / MANAGER */}
      {isManagement && sellers.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface p-4 rounded-xl border border-surface-container shadow-sm">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              Filtrar Histórico por Atendente:
            </span>
          </div>
          <select
            value={selectedSellerId}
            onChange={(e) => handleSellerChange(e.target.value)}
            className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none sm:w-72"
          >
            <option value="">Todos os Atendentes</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Grid: QR Code + Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(isSeller || (isManagement && selectedSellerId)) && (
          <div className="lg:col-span-1">
            <QrCodeCard
              sellerId={selectedSellerId || currentUser.id}
              sellerName={currentSellerName || currentUser.name}
            />
          </div>
        )}

        <div className={isSeller || (isManagement && selectedSellerId) ? 'lg:col-span-2 space-y-6' : 'lg:col-span-3 space-y-6'}>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-surface-container-lowest border-surface-container">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Total de Avaliações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-on-surface">
                  {metrics.total}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-lowest border-surface-container">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                  Taxa de Satisfação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.satisfactionRate}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-lowest border-surface-container">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                  <Laugh className="h-4 w-4 text-blue-500" />
                  Ótimo / Bom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.excellentCount + metrics.goodCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-surface-container">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Distribuição dos Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <Laugh className="h-3.5 w-3.5" /> Ótimo:
                </span>
                <span className="font-semibold">{metrics.excellentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                  <Smile className="h-3.5 w-3.5" /> Bom:
                </span>
                <span className="font-semibold">{metrics.goodCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <Meh className="h-3.5 w-3.5" /> Regular:
                </span>
                <span className="font-semibold">{metrics.regularCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                  <Frown className="h-3.5 w-3.5" /> Ruim:
                </span>
                <span className="font-semibold">{metrics.badCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evaluations Table / Feed with Pagination */}
      <Card className="border-surface-container">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Avaliações
          </CardTitle>

          {pagination.totalCount > 0 && (
            <div className="text-xs text-on-surface-variant font-medium">
              Mostrando {evaluations.length} de {pagination.totalCount} avaliações
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isFetchingData ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando avaliações...
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-on-surface-variant py-10 text-center text-sm">
              Nenhuma avaliação registrada até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Avaliação</th>
                      <th className="px-6 py-3 font-semibold">Atendente</th>
                      <th className="px-6 py-3 font-semibold">Comentário</th>
                      <th className="px-6 py-3 text-right font-semibold">Data</th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-right font-semibold">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {evaluations.map((ev) => {
                      const cfg = RATING_CONFIG[ev.rating] || RATING_CONFIG.GOOD
                      const Icon = cfg.icon
                      return (
                        <tr
                          key={ev.id}
                          className="hover:bg-surface-container-lowest transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badgeClass}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {ev.seller.name}
                            {ev.unit?.name && (
                              <span className="block text-xs text-on-surface-variant font-normal">
                                {ev.unit.name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs space-y-1">
                            {ev.presetComment && (
                              <p className="font-medium text-on-surface">
                                "{ev.presetComment}"
                              </p>
                            )}
                            {ev.observation && (
                              <p className="text-on-surface-variant italic">
                                Obs: {ev.observation}
                              </p>
                            )}
                            {!ev.presetComment && !ev.observation && (
                              <span className="text-on-surface-variant italic">
                                Sem comentário
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap text-xs text-on-surface-variant">
                            {new Date(ev.createdAt).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-on-surface hover:text-primary cursor-pointer"
                                  onClick={() => openEditModal(ev)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-on-surface hover:text-error cursor-pointer"
                                  onClick={() => setDeletingEvaluation(ev)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-outline/20 text-xs">
                  <div className="text-on-surface-variant">
                    Página <span className="font-bold text-on-surface">{pagination.page}</span> de{' '}
                    <span className="font-bold text-on-surface">{pagination.totalPages}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || isFetchingData}
                      onClick={() => loadEvaluationsPage(pagination.page - 1)}
                      className="h-8 gap-1 text-xs cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isFetchingData}
                      onClick={() => loadEvaluationsPage(pagination.page + 1)}
                      className="h-8 gap-1 text-xs cursor-pointer"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Evaluation Dialog */}
      <Dialog open={!!editingEvaluation} onOpenChange={(val) => !val && setEditingEvaluation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
            <DialogDescription>
              Altere a nota e os comentários registrados para o atendimento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmEdit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface">Nota do Atendimento</label>
              <select
                value={editRating}
                onChange={(e) => setEditRating(e.target.value as any)}
                className="w-full h-10 border border-outline rounded-md px-3 bg-surface text-sm font-medium"
              >
                <option value="EXCELLENT">Ótimo (Excelente)</option>
                <option value="GOOD">Bom</option>
                <option value="REGULAR">Regular</option>
                <option value="BAD">Ruim</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface">Depoimento Predefinido</label>
              <Textarea
                value={editPreset}
                onChange={(e) => setEditPreset(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface">Observação Adicional</label>
              <Textarea
                value={editObservation}
                onChange={(e) => setEditObservation(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-outline/30">
              <Button type="button" variant="outline" onClick={() => setEditingEvaluation(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Evaluation Confirmation Dialog */}
      <Dialog open={!!deletingEvaluation} onOpenChange={(val) => !val && setDeletingEvaluation(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-error">Excluir Avaliação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta avaliação de {deletingEvaluation?.seller.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4 border-t border-outline/30">
            <Button type="button" variant="outline" onClick={() => setDeletingEvaluation(null)}>
              Cancelar
            </Button>
            <Button variant="default" className="bg-error text-white hover:bg-error/90 cursor-pointer" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
