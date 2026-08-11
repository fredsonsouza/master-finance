'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'
import type { User } from '@/http/get-users'
import {
  Frown,
  Laugh,
  Meh,
  MessageSquare,
  Smile,
  Star,
  ThumbsUp,
  UserCheck,
} from 'lucide-react'
import { useState } from 'react'
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

  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    isSeller ? currentUser.id : ''
  )

  const filteredEvaluations = evaluations.filter((ev) => {
    if (selectedSellerId) {
      return ev.sellerId === selectedSellerId
    }
    return true
  })

  // Recalculate metrics for filtered seller if selected
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
        {/* QR Code Card if SELLER or specific Seller selected by Admin */}
        {(isSeller || (isManagement && selectedSellerId)) && (
          <div className="lg:col-span-1">
            <QrCodeCard
              sellerId={selectedSellerId || currentUser.id}
              sellerName={currentSellerName || currentUser.name}
            />
          </div>
        )}

        {/* Metrics Grid */}
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

          {/* Ratings Breakdown Progress */}
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
