import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'

interface ExportEvaluationsPdfParams {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  unitName?: string
  sellerName?: string
  period?: string
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function downloadEvaluationsPdf({
  evaluations,
  metrics,
  unitName = 'Todas as Unidades',
  sellerName = 'Todos os Atendentes',
  period = 'Todo o Histórico',
}: ExportEvaluationsPdfParams) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const logoUrl = `${window.location.origin}/images/masterclin-logo.png`
  const now = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return '<span class="badge badge-excellent">Ótimo</span>'
      case 'GOOD':
        return '<span class="badge badge-good">Bom</span>'
      case 'REGULAR':
        return '<span class="badge badge-regular">Regular</span>'
      case 'BAD':
        return '<span class="badge badge-bad">Ruim</span>'
      default:
        return `<span class="badge">${escapeHtml(rating)}</span>`
    }
  }

  const tableRowsHtml = evaluations
    .map((ev) => {
      const formattedDate = new Date(ev.createdAt).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })

      const rawComment = ev.observation || ev.presetComment
      const commentHtml = rawComment
        ? escapeHtml(rawComment)
        : '<em style="color: #94a3b8;">Sem comentário</em>'

      return `
      <tr>
        <td style="white-space: nowrap; font-family: monospace; font-size: 8.5pt;">${formattedDate}</td>
        <td>${getRatingBadge(ev.rating)}</td>
        <td style="font-weight: 600;">${escapeHtml(ev.clientName) || 'Anônimo'}</td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(ev.seller.name)}</div>
          ${ev.unit?.name ? `<div style="font-size: 8pt; color: #64748b;">${escapeHtml(ev.unit.name)}</div>` : ''}
        </td>
        <td style="font-size: 8.5pt; color: #334155; line-height: 1.3;">${commentHtml}</td>
      </tr>
    `
    })
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório de Avaliações - Masterclin</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            padding: 12mm 15mm 15mm 15mm;
            background: #ffffff;
            font-size: 9.5pt;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .logo {
            height: 48px;
            width: auto;
            object-fit: contain;
          }
          .header-info {
            text-align: right;
          }
          .title {
            font-size: 16pt;
            font-weight: 800;
            color: #0369a1;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 9pt;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .filter-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 8.5pt;
          }
          .filter-item strong {
            color: #334155;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
            background: #ffffff;
          }
          .metric-val {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
          }
          .metric-lbl {
            font-size: 7.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-top: 2px;
            letter-spacing: 0.3px;
          }
          .table-eval {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          .table-eval tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .table-eval th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8pt;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
          }
          .table-eval td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .table-eval tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-excellent {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
          }
          .badge-good {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
          }
          .badge-regular {
            background-color: #fef9c3;
            color: #a16207;
            border: 1px solid #fef08a;
          }
          .badge-bad {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
          }
          .signature-section {
            margin-top: 24px;
            padding-top: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 200px;
            border-top: 1px solid #94a3b8;
            margin-bottom: 4px;
          }
          .signature-name {
            font-weight: 700;
            font-size: 9pt;
            color: #1e293b;
            margin: 0;
          }
          .signature-role {
            font-size: 8pt;
            color: #64748b;
            margin: 0;
          }
          @media print {
            body {
              padding: 0;
            }
            .table-eval {
              page-break-inside: auto;
            }
            .table-eval tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Masterclin Logo" />
          <div class="header-info">
            <h1 class="title">Relatório de Avaliações</h1>
            <p class="subtitle">Clínica Masterclin — Gestão de Atendimento</p>
          </div>
        </div>

        <div class="filter-box">
          <div class="filter-item"><strong>Unidade:</strong> ${escapeHtml(unitName)}</div>
          <div class="filter-item"><strong>Atendente:</strong> ${escapeHtml(sellerName)}</div>
          <div class="filter-item"><strong>Período:</strong> ${escapeHtml(period)}</div>
          <div class="filter-item"><strong>Emissão:</strong> ${now}</div>
          <div class="filter-item"><strong>Total de Registros:</strong> ${evaluations.length}</div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-val">${metrics.total}</div>
            <div class="metric-lbl">Total de Avaliações</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color: #059669;">${metrics.satisfactionRate}%</div>
            <div class="metric-lbl">Taxa de Satisfação</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color: #0284c7;">${metrics.excellentCount + metrics.goodCount}</div>
            <div class="metric-lbl">Ótimo / Bom</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color: #dc2626;">${metrics.regularCount + metrics.badCount}</div>
            <div class="metric-lbl">Regular / Ruim</div>
          </div>
        </div>

        <table class="table-eval">
          <thead>
            <tr>
              <th style="width: 110px;">Data / Hora</th>
              <th style="width: 80px;">Nota</th>
              <th style="width: 140px;">Cliente</th>
              <th style="width: 140px;">Atendente / Unidade</th>
              <th>Comentário</th>
            </tr>
          </thead>
          <tbody>
            ${
              evaluations.length === 0
                ? '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Nenhuma avaliação encontrada com os filtros selecionados.</td></tr>'
                : tableRowsHtml
            }
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-name">Lidaiana Alves</p>
          <p class="signature-role">Gerência — Clínica Masterclin</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
