import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicSeller } from '@/http/get-public-seller'
import type { EvaluationAvailability } from '@/utils/evaluation-schedule'
import { CalendarClock, Clock, Moon, Sparkles, User } from 'lucide-react'

interface Props {
  seller: PublicSeller
  availability: EvaluationAvailability
}

export function EvaluationClosedCard({ seller, availability }: Props) {
  return (
    <Card className="w-full max-w-lg shadow-xl border border-surface-container overflow-hidden rounded-2xl bg-surface">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-center text-white relative">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <Moon className="h-7 w-7 text-amber-300" />
        </div>
        <h2 className="text-xl font-bold tracking-tight font-display">
          Horário de Avaliações Encerrado
        </h2>
        <p className="mt-1 text-xs text-slate-300">
          Atendimento da Recepção
        </p>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Recepcionista Info */}
        <div className="flex items-center gap-3.5 rounded-xl bg-surface-container/60 p-3.5 border border-surface-container">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Atendente
            </div>
            <div className="font-bold text-base text-on-surface truncate">
              {seller.name}
            </div>
            {seller.unit?.name && (
              <div className="text-xs text-primary font-medium">
                {seller.unit.name}
              </div>
            )}
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>Fora do Horário de Atendimento</span>
          </div>
          <p className="text-sm text-on-surface font-medium leading-relaxed">
            {availability.message ||
              'O período de avaliações está encerrado no momento e retornará no próximo horário de funcionamento.'}
          </p>
          {availability.nextOpening && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Próxima Abertura: {availability.nextOpening}</span>
              </span>
            </div>
          )}
        </div>

        {/* Tabela / Resumo de Horários */}
        <div className="space-y-2.5 rounded-xl border border-surface-container bg-surface-container-lowest p-4 text-xs">
          <div className="font-semibold text-on-surface text-center mb-2 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Horário Oficial de Avaliações (Horário de Roraima)</span>
          </div>
          <div className="divide-y divide-surface-container">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-on-surface-variant font-medium">Segunda a Sexta</span>
              <span className="font-bold text-on-surface">06:00 às 18:20</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-on-surface-variant font-medium">Sábado</span>
              <span className="font-bold text-on-surface">06:00 às 12:20</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-error">
              <span className="font-medium">Domingo</span>
              <span className="font-semibold">Fechado</span>
            </div>
          </div>
        </div>

        {/* Agradecimento */}
        <p className="text-center text-xs text-on-surface-variant leading-relaxed">
          Agradecemos a sua preferência e aguardamos sua avaliação em nosso próximo horário de funcionamento!
        </p>
      </CardContent>
    </Card>
  )
}
