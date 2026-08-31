'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { HrReport } from '@/http/get-hr-reports'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Printer,
  User,
} from 'lucide-react'

interface ViewHrReportDialogProps {
  report: HrReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewHrReportDialog({
  report,
  open,
  onOpenChange,
}: ViewHrReportDialogProps) {
  if (!report) return null

  function handlePrint() {
    if (!report) return

    const reportDateStr = new Date(report.reportDate).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    })
    const sentAtStr = report.sentAt
      ? new Date(report.sentAt).toLocaleString('pt-BR')
      : 'Não enviado (Rascunho)'

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${report.title} - Relatório de Setor</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            margin: 40px;
            line-height: 1.6;
            background: #fff;
          }
          .header {
            border-bottom: 2px solid #0056b3;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title {
            font-size: 22px;
            font-weight: 700;
            color: #0056b3;
            margin: 0 0 6px 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
          }
          .meta-item strong {
            color: #475569;
          }
          .content-box {
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.8;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: #ffffff;
            min-height: 300px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${report.title}</h1>
            <div style="font-size: 13px; color: #64748b;">Master Finance — Relatório Operacional de Setor / RH</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #0284c7; font-weight: 600;">
            Status: ${report.status === 'SENT' ? 'OFICIAL / ENVIADO' : 'RASCUNHO'}
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><strong>Colaborador:</strong> ${report.user.name}</div>
          <div class="meta-item"><strong>Data de Referência:</strong> ${reportDateStr}</div>
          <div class="meta-item"><strong>Unidade:</strong> ${report.unit?.name || 'Não informada'}</div>
          <div class="meta-item"><strong>Setor:</strong> ${report.sector || 'Não informado'}</div>
          <div class="meta-item"><strong>Carimbo de Envio:</strong> ${sentAtStr}</div>
          <div class="meta-item"><strong>Criado em:</strong> ${new Date(report.createdAt).toLocaleString('pt-BR')}</div>
        </div>

        <div class="content-box">${report.content}</div>

        <div class="footer">
          Documento gerado eletronicamente pelo sistema Master Finance em ${new Date().toLocaleString('pt-BR')}.
        </div>
      </body>
      </html>
    `

    // Use an invisible iframe for reliable printing without opening blank tabs or getting popup-blocked
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1500)
      }, 300)
    }
  }

  const isSent = report.status === 'SENT'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-primary">
                {report.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Relatório de setor enviado por {report.user.name}
              </DialogDescription>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                isSent
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enviado ao RH
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  Rascunho
                </>
              )}
            </span>
          </div>
        </DialogHeader>

        {/* Metadados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg bg-surface-container/60 p-3.5 text-xs text-on-surface-variant border border-surface-container">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>Colaborador:</strong> {report.user.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>Data de Referência:</strong>{' '}
              {new Date(report.reportDate).toLocaleDateString('pt-BR', {
                timeZone: 'UTC',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>Unidade:</strong> {report.unit?.name || 'Não informada'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>Setor:</strong> {report.sector || 'Não informado'}
            </span>
          </div>
          {report.sentAt && (
            <div className="flex items-center gap-2 sm:col-span-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                <strong>Carimbo de Envio:</strong>{' '}
                {new Date(report.sentAt).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Corpo do Relatório */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-on-surface-variant">
            Conteúdo do Relatório
          </h4>
          <div className="rounded-md border border-outline/40 bg-surface p-4 text-sm text-on-surface whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-sans">
            {report.content}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Fechar
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            className="gap-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
