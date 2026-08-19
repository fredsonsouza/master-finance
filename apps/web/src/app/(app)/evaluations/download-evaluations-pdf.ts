import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'

interface ExportEvaluationsPdfParams {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  unitName?: string
  sellerName?: string
}

export function downloadEvaluationsPdf({
  evaluations,
  metrics,
  unitName = 'Todas as Unidades',
  sellerName = 'Todos os Atendentes',
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
        return `<span class="badge">${rating}</span>`
    }
  }

  const tableRowsHtml = evaluations.map((ev) => {
    const formattedDate = new Date(ev.createdAt).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    const comment = ev.observation
      ? ev.observation
      : ev.presetComment
        ? ev.presetComment
        : '<em style="color: #94a3b8;">Sem comentário</em>'

    return `
      <tr>
        <td style="white-space: nowrap; font-family: monospace; font-size: 8.5pt;">${formattedDate}</td>
        <td>${getRatingBadge(ev.rating)}</td>
        <td style="font-weight: 600;">${ev.clientName || 'Anônimo'}</td>
        <td>
          <div style="font-weight: 600;">${ev.seller.name}</div>
          ${ev.unit?.name ? `<div style="font-size: 8pt; color: #64748b;">${ev.unit.name}</div>` : ''}
        </td>
        <td style="font-size: 8.5pt; color: #334155; line-height: 1.3;">${comment}</td>
      </tr>
    `
  }).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório de Avaliações - Masterclin</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
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
            max-height: 60px;
            max-width: 220px;
            width: auto;
            object-fit: contain;
          }
          .header-info {
            text-align: right;
          }
          .title {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 8.5pt;
            color: #0284c7;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
          }
          .filter-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            font-size: 8.5pt;
            gap: 8px;
          }
          .filter-item {
            color: #475569;
          }
          .filter-item strong {
            color: #0f172a;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .metric-card {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
          }
          .metric-val {
            font-size: 13pt;
            font-weight: 800;
            color: #0284c7;
          }
          .metric-lbl {
            font-size: 7.5pt;
            color: #475569;
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 2px;
          }
          .table-eval {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 20px;
          }
          .table-eval th {
            background-color: #0284c7;
            color: #ffffff;
            padding: 6px 8px;
            text-align: left;
            font-weight: 700;
            font-size: 8pt;
            text-transform: uppercase;
          }
          .table-eval td {
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 8px;
            vertical-align: top;
          }
          .table-eval tr:nth-child(even) {
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
            background-color: #d1fae5;
            color: #065f46;
          }
          .badge-good {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .badge-regular {
            background-color: #fef3c7;
            color: #92400e;
          }
          .badge-bad {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .signature-section {
            margin-top: 30px;
            text-align: center;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 220px;
            border-top: 1.5px solid #334155;
            margin: 0 auto 6px auto;
          }
          .signature-name {
            font-size: 10pt;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .signature-role {
            font-size: 8.5pt;
            color: #475569;
            font-weight: 600;
            margin-top: 1px;
          }
          @media print {
            body { background: transparent; }
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
          <div class="filter-item"><strong>Unidade:</strong> ${unitName}</div>
          <div class="filter-item"><strong>Atendente:</strong> ${sellerName}</div>
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
