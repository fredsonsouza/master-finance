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
import { Textarea } from '@/components/ui/textarea'
import type {
  EvaluationItem,
  EvaluationMetrics,
  EvaluationPagination,
  PodiumItem,
} from '@/http/get-evaluations'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import dayjs from 'dayjs'
import {
  Award,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Frown,
  ImageIcon,
  Laugh,
  Loader2,
  Medal,
  Meh,
  MessageSquare,
  Pencil,
  Printer,
  RotateCcw,
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
import { downloadEvaluationsPdf } from './download-evaluations-pdf'
import { downloadPodiumPdf } from './download-podium-pdf'
import { downloadPodiumPng } from './download-podium-png'
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

  // Filters - History
  const [selectedSellerId, setSelectedSellerId] = useState<string>(isSeller ? currentUser.id : '')
  const [selectedHistoryUnitId, setSelectedHistoryUnitId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Filters - Podium (synchronized to current month by default)
  const [selectedPodiumUnitId, setSelectedPodiumUnitId] = useState<string>('')
  const [selectedPodiumMonth, setSelectedPodiumMonth] = useState<string>(dayjs().format('YYYY-MM'))

  // Loading states
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [isFetchingPodium, setIsFetchingPodium] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingPodiumPdf, setIsExportingPodiumPdf] = useState(false)
  const [isExportingPodiumPng, setIsExportingPodiumPng] = useState(false)

  // Edit / Delete modal states
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationItem | null>(null)
  const [deletingEvaluation, setDeletingEvaluation] = useState<EvaluationItem | null>(null)

  const [editRating, setEditRating] = useState<'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'>('EXCELLENT')
  const [editPreset, setEditPreset] = useState('')
  const [editObservation, setEditObservation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch paginated history evaluations
  async function loadEvaluationsPage(
    page: number,
    sellerId = selectedSellerId,
    unitId = selectedHistoryUnitId,
    start = startDate,
    end = endDate
  ) {
    setIsFetchingData(true)
    const res = await fetchEvaluationsAction({
      page,
      perPage: pagination.perPage || 10,
      sellerId: sellerId || undefined,
      unitId: unitId || undefined,
      startDate: start || undefined,
      endDate: end || undefined,
      podiumUnitId: selectedPodiumUnitId || undefined,
      podiumMonth: selectedPodiumMonth || undefined,
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
  async function handlePodiumUnitChange(unitId: string, month = selectedPodiumMonth) {
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
      unitId: selectedHistoryUnitId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      podiumUnitId: unitId,
      podiumMonth: month || undefined,
    })

    if (res.success && res.data) {
      setPodium(res.data.podium)
    } else {
      toast.error('Erro ao carregar pódio da unidade.')
    }
    setIsFetchingPodium(false)
  }

  // Handle month change for Podium
  async function handlePodiumMonthChange(month: string) {
    setSelectedPodiumMonth(month)
    if (selectedPodiumUnitId) {
      await handlePodiumUnitChange(selectedPodiumUnitId, month)
    }
  }

  // Handle unit filter change for evaluations history
  async function handleHistoryUnitChange(unitId: string) {
    setSelectedHistoryUnitId(unitId)
    await loadEvaluationsPage(1, selectedSellerId, unitId, startDate, endDate)
  }

  // Handle seller filter change for evaluations history
  async function handleSellerChange(sellerId: string) {
    setSelectedSellerId(sellerId)
    await loadEvaluationsPage(1, sellerId, selectedHistoryUnitId, startDate, endDate)
  }

  // Handle date changes for history
  async function handleStartDateChange(date: string) {
    setStartDate(date)
    await loadEvaluationsPage(1, selectedSellerId, selectedHistoryUnitId, date, endDate)
  }

  async function handleEndDateChange(date: string) {
    setEndDate(date)
    await loadEvaluationsPage(1, selectedSellerId, selectedHistoryUnitId, startDate, date)
  }

  // Clear history filters
  async function handleClearFilters() {
    setSelectedSellerId(isSeller ? currentUser.id : '')
    setSelectedHistoryUnitId('')
    setStartDate('')
    setEndDate('')
    await loadEvaluationsPage(1, isSeller ? currentUser.id : '', '', '', '')
  }

  // Export PDF of current filtered dataset
  async function handleExportPdf() {
    setIsExportingPdf(true)
    try {
      // Fetch all items (up to 500) matching the current filter
      const res = await fetchEvaluationsAction({
        page: 1,
        perPage: 500,
        sellerId: selectedSellerId || undefined,
        unitId: selectedHistoryUnitId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })

      const dataToExport = res.success && res.data ? res.data.evaluations : evaluations
      const metricsToExport = res.success && res.data ? res.data.metrics : metrics

      const activeUnitObj = units.find((u) => u.id === selectedHistoryUnitId)
      const activeSellerObj = sellers.find((s) => s.id === selectedSellerId)

      let periodDescription = 'Todo o Histórico'
      if (startDate && endDate) {
        periodDescription = `${dayjs(startDate).format('DD/MM/YYYY')} até ${dayjs(endDate).format('DD/MM/YYYY')}`
      } else if (startDate) {
        periodDescription = `A partir de ${dayjs(startDate).format('DD/MM/YYYY')}`
      } else if (endDate) {
        periodDescription = `Até ${dayjs(endDate).format('DD/MM/YYYY')}`
      }

      downloadEvaluationsPdf({
        evaluations: dataToExport,
        metrics: metricsToExport,
        unitName: activeUnitObj ? activeUnitObj.name : 'Todas as Unidades',
        sellerName: isSeller ? currentUser.name : activeSellerObj ? activeSellerObj.name : 'Todos os Atendentes',
        period: periodDescription,
      })
    } catch (err) {
      toast.error('Erro ao gerar relatório em PDF.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Export Podium in PDF
  function handleExportPodiumPdf() {
    if (!selectedPodiumUnitId || podium.length === 0) {
      toast.error('Selecione uma unidade com pódio gerado para exportar.')
      return
    }

    setIsExportingPodiumPdf(true)
    try {
      const activeUnit = units.find((u) => u.id === selectedPodiumUnitId)
      downloadPodiumPdf({
        podium,
        unitName: activeUnit ? activeUnit.name : 'Unidade Selecionada',
        podiumMonth: selectedPodiumMonth,
      })
    } catch (err) {
      toast.error('Erro ao exportar pódio em PDF.')
    } finally {
      setIsExportingPodiumPdf(false)
    }
  }

  // Export Podium in PNG (for WhatsApp Status / Instagram Stories)
  async function handleExportPodiumPng() {
    if (!selectedPodiumUnitId || podium.length === 0) {
      toast.error('Selecione uma unidade com pódio gerado para exportar.')
      return
    }

    setIsExportingPodiumPng(true)
    try {
      const activeUnit = units.find((u) => u.id === selectedPodiumUnitId)
      await downloadPodiumPng({
        podium,
        unitName: activeUnit ? activeUnit.name : 'Unidade Selecionada',
        podiumMonth: selectedPodiumMonth,
      })
      toast.success('Card do Pódio (PNG) gerado com sucesso para Stories e WhatsApp!')
    } catch (err) {
      toast.error('Erro ao gerar card do pódio em PNG.')
    } finally {
      setIsExportingPodiumPng(false)
    }
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

  // Filter sellers shown in dropdown based on selected unit if any
  const filteredSellers = selectedHistoryUnitId
    ? sellers.filter((s) => s.unitId === selectedHistoryUnitId)
    : sellers

  return (
    <div className="space-y-6">
      {/* REDESIGNED PODIUM SECTION (ADMIN & MANAGER ONLY) - LIST FORMAT PER UNIT & MONTH */}
      {isManagement && (
        <Card className="border-surface-container bg-surface shadow-sm overflow-hidden">
          <CardHeader className="bg-surface-container-lowest border-b border-surface-container pb-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Pódio dos Recepcionistas Mais Bem Avaliados
                </CardTitle>
                <p className="text-xs text-on-surface-variant">
                  Classificação mensal por unidade baseada no nível de satisfação dos clientes e bonificações.
                </p>
              </div>

              {/* Filters & Export buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Month Picker Input */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary hidden sm:block" />
                  <input
                    type="month"
                    value={selectedPodiumMonth}
                    onChange={(e) => handlePodiumMonthChange(e.target.value)}
                    className="h-9 rounded-md border border-outline bg-surface text-on-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer w-38"
                    title="Mês de Referência do Pódio"
                  />
                </div>

                {/* Unit Filter dropdown */}
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary hidden sm:block" />
                  <select
                    value={selectedPodiumUnitId}
                    onChange={(e) => handlePodiumUnitChange(e.target.value)}
                    className="h-9 rounded-md border border-outline bg-surface text-on-surface px-3 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer sm:w-50"
                  >
                    <option value="">Escolha uma unidade</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Podium PNG (Stories / Status) Button */}
                <Button
                  onClick={handleExportPodiumPng}
                  disabled={isExportingPodiumPng || !selectedPodiumUnitId || podium.length === 0}
                  variant="default"
                  size="sm"
                  className="h-9 gap-1.5 text-xs cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Baixar Card em PNG (Stories e WhatsApp)"
                >
                  {isExportingPodiumPng ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  Baixar Card (PNG)
                </Button>

                {/* Export Podium PDF Button */}
                <Button
                  onClick={handleExportPodiumPdf}
                  disabled={isExportingPodiumPdf || !selectedPodiumUnitId || podium.length === 0}
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs cursor-pointer"
                  title="Exportar pódio e bonificações em PDF"
                >
                  {isExportingPodiumPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Exportar PDF
                </Button>
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
                    Selecione uma unidade para visualizar o pódio do mês
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Escolha uma unidade e o mês no filtro acima para ver os 3 melhores atendentes da recepção e seus respectivos prêmios.
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
              /* Empty state for selected unit & month */
              <div className="text-center py-8 text-on-surface-variant text-sm bg-surface-container-lowest/30 rounded-xl">
                Nenhum recepcionista com avaliações nesta unidade no mês selecionado ({dayjs(selectedPodiumMonth).format('MM/YYYY')}).
              </div>
            ) : (
              /* PODIUM LIST FORMAT */
              <div className="space-y-3">
                <div className="text-xs font-semibold text-on-surface-variant mb-2 flex items-center justify-between">
                  <div>
                    Top 3 Atendentes — <span className="text-primary font-bold">{selectedUnitObj?.name}</span> ({dayjs(selectedPodiumMonth).format('MMMM [de] YYYY')})
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    1º: R$ 400 | 2º: R$ 300 | 3º: R$ 200
                  </div>
                </div>

                {podium.map((item) => {
                  const isGold = item.position === 1
                  const isSilver = item.position === 2
                  const isBronze = item.position === 3
                  const bonusText = isGold ? 'R$ 400,00' : isSilver ? 'R$ 300,00' : 'R$ 200,00'

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
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.unitName && (
                              <span className="text-xs text-on-surface-variant font-medium">
                                {item.unitName}
                              </span>
                            )}
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              • Bonificação: {bonusText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Pill */}
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

      {/* History Filters for ADMIN / MANAGER */}
      {isManagement && (
        <div className="flex flex-col gap-4 bg-surface p-4 rounded-xl border border-surface-container shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-on-surface">
                Filtros do Histórico:
              </span>
            </div>

            {(selectedHistoryUnitId || selectedSellerId || startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 gap-1.5 text-xs cursor-pointer ml-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Unit Filter */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">
                Unidade:
              </label>
              <select
                value={selectedHistoryUnitId}
                onChange={(e) => handleHistoryUnitChange(e.target.value)}
                className="w-full border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-9 cursor-pointer rounded-md border px-3 text-xs focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">Todas as Unidades</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller Filter */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">
                Atendente:
              </label>
              <select
                value={selectedSellerId}
                onChange={(e) => handleSellerChange(e.target.value)}
                className="w-full border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-9 cursor-pointer rounded-md border px-3 text-xs focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">Todos os Atendentes</option>
                {filteredSellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">
                Data Inicial:
              </label>
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                outputFormat="YYYY-MM-DD"
                className="w-full h-9"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">
                Data Final:
              </label>
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                outputFormat="YYYY-MM-DD"
                className="w-full h-9"
              />
            </div>
          </div>
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

      {/* Evaluations Table / Feed with Pagination & PDF Export */}
      <Card className="border-surface-container">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Histórico de Avaliações
            </CardTitle>
            {pagination.totalCount > 0 && (
              <p className="text-xs text-on-surface-variant font-medium">
                Mostrando <span className="font-bold text-on-surface">{evaluations.length}</span> de{' '}
                <span className="font-bold text-on-surface">{pagination.totalCount}</span> avaliações
              </p>
            )}
          </div>

          <Button
            onClick={handleExportPdf}
            disabled={isExportingPdf || evaluations.length === 0}
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer shrink-0"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Exportar Histórico (PDF)
          </Button>
        </CardHeader>
        <CardContent>
          {isFetchingData ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando avaliações...
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-on-surface-variant py-10 text-center text-sm">
              Nenhuma avaliação registrada até o momento com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Avaliação</th>
                      <th className="px-6 py-3 font-semibold">Cliente</th>
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
                          <td className="px-6 py-4 font-medium text-on-surface whitespace-nowrap">
                            {ev.clientName || 'Anônimo'}
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
                            {ev.observation && (
                              <p className="font-medium text-on-surface leading-relaxed">
                                {ev.observation}
                              </p>
                            )}
                            {ev.presetComment && !ev.observation && (
                              <p className="font-medium text-on-surface">
                                "{ev.presetComment}"
                              </p>
                            )}
                            {!ev.presetComment && !ev.observation && (
                              <span className="text-on-surface-variant italic">
                                Sem comentário
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap text-xs text-on-surface-variant font-mono">
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
                  <div className="text-on-surface-variant font-medium">
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
              Altere a nota e o comentário registrado para o atendimento.
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
              <label className="text-xs font-semibold text-on-surface">Comentário do Atendimento</label>
              <Textarea
                value={editObservation}
                onChange={(e) => setEditObservation(e.target.value)}
                rows={3}
                className="text-sm"
                placeholder="Deixe seu comentário sobre o atendimento recebido..."
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
