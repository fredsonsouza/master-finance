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
import type { EvaluationItem, EvaluationMetrics, PodiumItem } from '@/http/get-evaluations'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import {
  Award,
  Crown,
  Frown,
  Laugh,
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
import { deleteEvaluationAction, updateEvaluationAction } from './actions'
import { QrCodeCard } from './qr-code-card'

interface Props {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  podium?: PodiumItem[]
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
  evaluations,
  metrics,
  podium = [],
  currentUser,
  sellers = [],
  units = [],
}: Props) {
  const isSeller = currentUser.role === 'SELLER'
  const isManagement = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  const isAdmin = currentUser.role === 'ADMIN'

  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    isSeller ? currentUser.id : ''
  )
  const [selectedPodiumUnitId, setSelectedPodiumUnitId] = useState<string>('')

  // Edit / Delete modal states
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationItem | null>(null)
  const [deletingEvaluation, setDeletingEvaluation] = useState<EvaluationItem | null>(null)

  const [editRating, setEditRating] = useState<'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'>('EXCELLENT')
  const [editPreset, setEditPreset] = useState('')
  const [editObservation, setEditObservation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } else {
      toast.error(result.message || 'Erro ao atualizar avaliação.')
    }
    setIsSubmitting(false)
  }

  // Filter evaluations for podium calculation dynamically
  const podiumEvaluations = evaluations.filter((ev) => {
    if (selectedPodiumUnitId) {
      return ev.unit?.id === selectedPodiumUnitId
    }
    return true
  })

  // Calculate dynamically sorted podium for selected unit
  const sellerMap = new Map<
    string,
    {
      sellerId: string
      sellerName: string
      sellerAvatarUrl: string | null
      unitName: string | null
      total: number
      excellent: number
      good: number
      regular: number
      bad: number
    }
  >()

  for (const ev of podiumEvaluations) {
    let s = sellerMap.get(ev.sellerId)
    if (!s) {
      s = {
        sellerId: ev.sellerId,
        sellerName: ev.seller.name,
        sellerAvatarUrl: ev.seller.avatarUrl,
        unitName: ev.unit?.name || null,
        total: 0,
        excellent: 0,
        good: 0,
        regular: 0,
        bad: 0,
      }
      sellerMap.set(ev.sellerId, s)
    }
    s.total++
    if (ev.rating === 'EXCELLENT') s.excellent++
    else if (ev.rating === 'GOOD') s.good++
    else if (ev.rating === 'REGULAR') s.regular++
    else if (ev.rating === 'BAD') s.bad++
  }

  const computedPodium = Array.from(sellerMap.values()).map((s) => {
    const positive = s.excellent + s.good
    const satRate = s.total > 0 ? Math.round((positive / s.total) * 100) : 0
    const score = s.excellent * 3 + s.good * 2 + s.regular * 1
    return {
      ...s,
      satisfactionRate: satRate,
      score,
    }
  })

  computedPodium.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.satisfactionRate !== a.satisfactionRate) return b.satisfactionRate - a.satisfactionRate
    return b.total - a.total
  })

  const top1 = computedPodium[0] || null
  const top2 = computedPodium[1] || null
  const top3 = computedPodium[2] || null

  const filteredEvaluations = evaluations.filter((ev) => {
    if (selectedSellerId) {
      return ev.sellerId === selectedSellerId
    }
    return true
  })

  const activeSeller = sellers.find((s) => s.id === selectedSellerId)
  const currentSellerName = isSeller
    ? currentUser.name
    : activeSeller
      ? activeSeller.name
      : ''

  return (
    <div className="space-y-6">
      {/* PODIUM SECTION (ADMIN & MANAGER ONLY) */}
      {isManagement && (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface to-surface p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                Pódio dos Recepcionistas Mais Bem Avaliados
              </h2>
              <p className="text-xs text-on-surface-variant">
                Destaques no atendimento com base na pontuação e índice de satisfação dos clientes.
              </p>
            </div>

            {units.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface whitespace-nowrap">
                  Filtrar Unidade:
                </span>
                <select
                  value={selectedPodiumUnitId}
                  onChange={(e) => setSelectedPodiumUnitId(e.target.value)}
                  className="h-9 rounded-md border border-outline bg-surface text-on-surface px-3 text-xs focus:ring-1 focus:ring-primary cursor-pointer"
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
          </div>

          {/* Podium Visual Cards (2nd, 1st, 3rd) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            {/* 2º Lugar - Silver */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="w-full rounded-2xl border-2 border-slate-300/60 bg-gradient-to-b from-slate-100/80 to-white dark:from-slate-900/80 dark:to-slate-950 p-5 text-center shadow-md hover:shadow-lg transition-all relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700">
                  <Medal className="h-3.5 w-3.5 text-slate-400" /> 2º Lugar
                </div>
                {top2 ? (
                  <div className="pt-2 space-y-2">
                    <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xl flex items-center justify-center mx-auto border-2 border-slate-400">
                      {top2.sellerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-base">{top2.sellerName}</h3>
                      {top2.unitName && (
                        <span className="text-xs text-on-surface-variant block">{top2.unitName}</span>
                      )}
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        {top2.satisfactionRate}% de Satisfação
                      </div>
                      <div className="text-on-surface-variant">
                        {top2.total} avaliações ({top2.excellent} ótimas, {top2.good} boas)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-on-surface-variant text-xs italic">
                    Nenhum atendente classificado em 2º lugar nesta unidade.
                  </div>
                )}
              </div>
            </div>

            {/* 1º Lugar - Gold (Center / Tallest) */}
            <div className="order-1 md:order-2 flex flex-col items-center">
              <div className="w-full rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-white dark:from-amber-950/40 dark:to-slate-950 p-6 text-center shadow-xl hover:shadow-2xl transition-all relative transform md:-translate-y-4">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
                  <Crown className="h-4 w-4 fill-amber-950" /> 1º LUGAR
                </div>
                {top1 ? (
                  <div className="pt-3 space-y-2">
                    <div className="h-16 w-16 rounded-full bg-amber-400 text-amber-950 font-black text-2xl flex items-center justify-center mx-auto border-4 border-amber-300 shadow-md">
                      {top1.sellerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-on-surface text-lg">{top1.sellerName}</h3>
                      {top1.unitName && (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">{top1.unitName}</span>
                      )}
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/60 rounded-xl p-3 text-xs space-y-1 border border-amber-200/50">
                      <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                        {top1.satisfactionRate}% de Satisfação
                      </div>
                      <div className="text-on-surface-variant font-medium">
                        {top1.total} avaliações ({top1.excellent} ótimas, {top1.good} boas)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-on-surface-variant text-xs italic">
                    Nenhum atendente avaliado para o 1º lugar.
                  </div>
                )}
              </div>
            </div>

            {/* 3º Lugar - Bronze */}
            <div className="order-3 md:order-3 flex flex-col items-center">
              <div className="w-full rounded-2xl border-2 border-amber-700/40 bg-gradient-to-b from-amber-900/10 to-white dark:from-amber-950/20 dark:to-slate-950 p-5 text-center shadow-md hover:shadow-lg transition-all relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-700">
                  <Award className="h-3.5 w-3.5 text-amber-300" /> 3º Lugar
                </div>
                {top3 ? (
                  <div className="pt-2 space-y-2">
                    <div className="h-14 w-14 rounded-full bg-amber-800 text-amber-100 font-bold text-xl flex items-center justify-center mx-auto border-2 border-amber-600">
                      {top3.sellerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-base">{top3.sellerName}</h3>
                      {top3.unitName && (
                        <span className="text-xs text-on-surface-variant block">{top3.unitName}</span>
                      )}
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-950/40 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        {top3.satisfactionRate}% de Satisfação
                      </div>
                      <div className="text-on-surface-variant">
                        {top3.total} avaliações ({top3.excellent} ótimas, {top3.good} boas)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-on-surface-variant text-xs italic">
                    Nenhum atendente classificado em 3º lugar nesta unidade.
                  </div>
                )}
              </div>
            </div>
          </div>
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
            onChange={(e) => setSelectedSellerId(e.target.value)}
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

      {/* Evaluations Table / Feed */}
      <Card className="border-surface-container">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvaluations.length === 0 ? (
            <div className="text-on-surface-variant py-10 text-center text-sm">
              Nenhuma avaliação registrada até o momento.
            </div>
          ) : (
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
                  {filteredEvaluations.map((ev) => {
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
