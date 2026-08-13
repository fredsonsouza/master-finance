'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PublicSeller } from '@/http/get-public-seller'
import {
  CheckCircle2,
  ExternalLink,
  Frown,
  Laugh,
  Meh,
  Smile,
  Star,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createEvaluationAction } from './actions'

interface Props {
  seller: PublicSeller
}

type RatingType = 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'

const GOOGLE_REVIEW_URL = 'https://g.page/r/Ce61mfXe8zjdEBM/review'

const RATING_OPTIONS: {
  value: RatingType
  label: string
  icon: typeof Smile
  colorClass: string
  bgClass: string
  borderClass: string
  preset: string
}[] = [
  {
    value: 'EXCELLENT',
    label: 'Ótimo',
    icon: Laugh,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-500',
    preset:
      'Excelente! O atendente foi muito educado, paciente e resolveu minha dúvida de forma rápida e clara.',
  },
  {
    value: 'GOOD',
    label: 'Bom',
    icon: Smile,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-500',
    preset:
      'Bom! A equipe demonstrou total conhecimento e resolveu meu problema logo no primeiro contato.',
  },
  {
    value: 'REGULAR',
    label: 'Regular',
    icon: Meh,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-500',
    preset: 'Regular! Atendimento mediano dentro do esperado.',
  },
  {
    value: 'BAD',
    label: 'Ruim',
    icon: Frown,
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    borderClass: 'border-rose-500',
    preset: 'Ruim! Atendimento demorado ou insatisfatório.',
  },
]

export function EvaluateForm({ seller }: Props) {
  const [clientName, setClientName] = useState('')
  const [selectedRating, setSelectedRating] = useState<RatingType | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [observation, setObservation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleRatingSelect(rating: RatingType) {
    setSelectedRating(rating)
    const found = RATING_OPTIONS.find((opt) => opt.value === rating)
    if (found) {
      setSelectedPreset(found.preset)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!clientName.trim()) {
      toast.error('Por favor, informe seu nome antes de enviar.')
      return
    }

    if (!selectedRating) {
      toast.error('Por favor, selecione uma nota para o atendimento.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createEvaluationAction({
        sellerId: seller.id,
        clientName: clientName.trim(),
        rating: selectedRating,
        presetComment: selectedPreset || null,
        observation: observation.trim() || null,
      })

      if (response.success) {
        setSubmitted(true)
      } else {
        toast.error(response.message || 'Erro ao enviar avaliação. Tente novamente.')
      }
    } catch (err: any) {
      toast.error('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-lg border-emerald-200 bg-white p-6 shadow-xl dark:border-emerald-900 dark:bg-surface text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            Muito obrigado, {clientName}!
          </h2>
          <p className="text-on-surface-variant text-sm">
            Sua avaliação sobre o atendimento de{' '}
            <strong className="text-on-surface">{seller.name}</strong> foi registrada com sucesso.
          </p>
        </div>

        {/* Google Review Card Invitation */}
        <div className="bg-gradient-to-r from-amber-500/10 via-surface to-blue-500/10 border border-amber-300 dark:border-amber-700/50 p-5 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star className="h-5 w-5 fill-amber-400" />
            <Star className="h-5 w-5 fill-amber-400" />
            <Star className="h-5 w-5 fill-amber-400" />
            <Star className="h-5 w-5 fill-amber-400" />
            <Star className="h-5 w-5 fill-amber-400" />
          </div>
          <h3 className="font-bold text-on-surface text-base">
            Avalie também a Masterclin no Google!
          </h3>
          <p className="text-xs text-on-surface-variant">
            Sua avaliação pública é muito importante para nossa clínica e leva menos de 1 minuto.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-4 shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            Deixar Avaliação no Google
          </a>
        </div>

        <p className="text-xs text-on-surface-variant italic">
          Sua opinião é fundamental para mantermos a excelência do nosso atendimento.
        </p>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg border-surface-container bg-surface p-6 shadow-xl space-y-6">
      <CardHeader className="p-0 text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-primary">
            Avaliação de Atendimento
          </CardTitle>
          <p className="text-sm text-on-surface-variant">
            Como você avalia o atendimento realizado por:
          </p>
          <h3 className="text-lg font-semibold text-on-surface">
            {seller.name}
          </h3>
          {seller.unit?.name && (
            <span className="inline-block rounded-full bg-surface-container-highest px-3 py-0.5 text-xs font-medium text-on-surface-variant">
              Unidade: {seller.unit.name}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Name Input (Mandatory) */}
          <div className="space-y-2">
            <label htmlFor="clientName" className="text-xs font-semibold text-on-surface flex items-center justify-between">
              <span>Seu Nome completo</span>
              <span className="text-xs font-bold text-rose-500">* Obrigatório</span>
            </label>
            <Input
              id="clientName"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="h-11 text-sm bg-surface-container-lowest focus:ring-primary"
            />
          </div>

          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
              <span>Nota do Atendimento</span>
              <span className="text-xs font-bold text-rose-500">* Obrigatório</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedRating === opt.value
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleRatingSelect(opt.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? `${opt.borderClass} ${opt.bgClass} shadow-md scale-105`
                        : 'border-surface-container hover:border-outline bg-surface-container-lowest'
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 mb-1.5 ${
                        isSelected ? opt.colorClass : 'text-on-surface-variant'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preset Comment Selection */}
          {selectedRating && (
            <div className="space-y-3 pt-1">
              <label className="text-xs font-medium text-on-surface-variant">
                Selecione o depoimento que melhor descreve:
              </label>
              <div className="space-y-2">
                {RATING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    onClick={() => setSelectedPreset(opt.preset)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedPreset === opt.preset
                        ? 'border-primary bg-primary/5 text-on-surface font-medium'
                        : 'border-surface-container hover:bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="presetComment"
                      checked={selectedPreset === opt.preset}
                      onChange={() => setSelectedPreset(opt.preset)}
                      className="mt-0.5 accent-primary h-4 w-4"
                    />
                    <span>{opt.preset}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Optional Observation Text */}
          <div className="space-y-2 pt-1">
            <label htmlFor="observation" className="text-xs font-medium text-on-surface-variant">
              Comentário adicional (opcional):
            </label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Escreva aqui caso queira adicionar mais algum detalhe..."
              rows={3}
              className="text-sm bg-surface-container-lowest"
            />
          </div>

          <Button
            type="submit"
            disabled={!clientName.trim() || !selectedRating || isSubmitting}
            className="w-full h-11 text-base font-semibold cursor-pointer"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>

          {/* Google Review Banner Link */}
          <div className="pt-2 text-center">
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              Avalie também a Masterclin no Google
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
