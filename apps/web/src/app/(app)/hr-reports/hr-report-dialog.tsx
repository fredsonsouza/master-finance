'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HrReport } from '@/http/get-hr-reports'
import type { Unit } from '@/http/get-units'
import {
  Building2,
  Calendar,
  FileText,
  Layers,
  Loader2,
  Save,
  Send,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { saveHrReportAction } from './actions'

interface HrReportDialogProps {
  report?: HrReport | null
  units: Unit[]
  defaultUnitId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (report: HrReport) => void
}

export function HrReportDialog({
  report,
  units,
  defaultUnitId,
  open,
  onOpenChange,
  onSaved,
}: HrReportDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [sector, setSector] = useState('')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Initialize or reset form state
  useEffect(() => {
    if (open) {
      if (report) {
        setTitle(report.title)
        setContent(report.content)
        setReportDate(
          report.reportDate
            ? new Date(report.reportDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        )
        setSelectedUnitId(report.unit?.id || defaultUnitId || '')
        setSector(report.sector || '')
      } else {
        setTitle('')
        setContent('')
        setReportDate(new Date().toISOString().split('T')[0])
        setSelectedUnitId(defaultUnitId || (units[0]?.id ?? ''))
        setSector('')
      }
    }
  }, [open, report, defaultUnitId, units])

  async function handleSave(status: 'DRAFT' | 'SENT') {
    if (!title.trim()) {
      toast.error('Informe o título do relatório.')
      return
    }

    if (!content.trim()) {
      toast.error('Escreva o conteúdo do relatório.')
      return
    }

    if (!reportDate) {
      toast.error('Selecione a data a que o relatório se refere.')
      return
    }

    if (status === 'DRAFT') {
      setIsSavingDraft(true)
    } else {
      setIsSending(true)
    }

    const result = await saveHrReportAction({
      id: report?.id,
      title: title.trim(),
      content: content.trim(),
      reportDate: new Date(reportDate).toISOString(),
      status,
      unitId: selectedUnitId || null,
      sector: sector.trim() || null,
    })

    if (result.success && result.report) {
      if (status === 'SENT') {
        toast.success('Relatório enviado ao RH com sucesso!')
      } else {
        toast.success('Rascunho salvo com sucesso!')
      }
      onOpenChange(false)
      if (onSaved) onSaved(result.report)
    } else {
      toast.error(result.message || 'Erro ao processar relatório.')
    }

    setIsSavingDraft(false)
    setIsSending(false)
  }

  const isSent = report?.status === 'SENT'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            <DialogTitle>
              {report
                ? isSent
                  ? 'Visualizar Relatório de Setor'
                  : 'Editar Relatório de Setor'
                : 'Novo Relatório de Setor'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isSent
              ? 'Este relatório já foi enviado ao RH e está formalizado.'
              : 'Escreva as informações do seu setor. Você pode salvar como rascunho e continuar depois ou enviar diretamente ao RH.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="report-title">Título do Relatório</Label>
            <Input
              id="report-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Relatório Operacional Diário, Ocorrências do Turno..."
              disabled={isSent || isSavingDraft || isSending}
              autoFocus
            />
          </div>

          {/* Grid de Metadados: Data, Unidade e Setor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Data do Relatório */}
            <div className="space-y-1.5">
              <Label htmlFor="report-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Data de Referência
              </Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                disabled={isSent || isSavingDraft || isSending}
              />
            </div>

            {/* Unidade */}
            <div className="space-y-1.5">
              <Label htmlFor="report-unit" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Unidade
              </Label>
              <select
                id="report-unit"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={isSent || isSavingDraft || isSending}
                className="h-9 w-full rounded-md border border-outline bg-surface text-on-surface px-3 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-60"
              >
                <option value="">Selecione a Unidade</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Setor Livre */}
            <div className="space-y-1.5">
              <Label htmlFor="report-sector" className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Setor
              </Label>
              <Input
                id="report-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Recepção, Coleta..."
                disabled={isSent || isSavingDraft || isSending}
              />
            </div>
          </div>

          {/* Conteúdo do Relatório */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-content">Conteúdo do Relatório</Label>
              <span className="text-xs text-on-surface-variant">
                {content.length} caracteres
              </span>
            </div>
            <textarea
              id="report-content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva detalhadamente as atividades do dia/mês, demandas, ocorrências, metas batidas ou pendências do setor..."
              disabled={isSent || isSavingDraft || isSending}
              className="w-full rounded-md border border-outline bg-surface p-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary resize-y font-sans leading-relaxed disabled:opacity-60"
            />
          </div>
        </div>

        {/* Rodapé e Ações */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-surface-container">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSavingDraft || isSending}
            className="w-full sm:w-auto cursor-pointer"
          >
            {isSent ? 'Fechar' : 'Cancelar'}
          </Button>

          {!isSent && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave('DRAFT')}
                disabled={isSavingDraft || isSending}
                className="gap-2 cursor-pointer"
              >
                {isSavingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Rascunho
              </Button>

              <Button
                type="button"
                onClick={() => handleSave('SENT')}
                disabled={isSavingDraft || isSending}
                className="gap-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar ao RH
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
