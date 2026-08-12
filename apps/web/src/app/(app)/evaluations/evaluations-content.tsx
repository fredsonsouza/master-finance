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
import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'
import type { User } from '@/http/get-users'
import {
  Frown,
  Laugh,
  Meh,
  MessageSquare,
  Pencil,
  Smile,
  Star,
  ThumbsUp,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteEvaluationAction, updateEvaluationAction } from './actions'
import { QrCodeCard } from './qr-code-card'

interface Props {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  currentUser: {
    id: string
    name: string
    role: string
  }
  sellers?: User[]
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
  currentUser,
  sellers = [],
}: Props) {
  const isSeller = currentUser.role === 'SELLER'
  const isManagement = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  const isAdmin = currentUser.role === 'ADMIN'

  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    isSeller ? currentUser.id : ''
  )

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
      {/* Top Controls for ADMIN / MANAGER */}
      {isManagement && sellers.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface p-4 rounded-xl border border-surface-container shadow-sm">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              Filtrar por Atendente:
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
