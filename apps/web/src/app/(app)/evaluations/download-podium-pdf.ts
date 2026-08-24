import type { PodiumItem } from '@/http/get-evaluations'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

interface ExportPodiumPdfParams {
  podium: PodiumItem[]
  unitName: string
  podiumMonth: string // YYYY-MM
}

export function downloadPodiumPdf({
  podium,
  unitName,
  podiumMonth,
}: ExportPodiumPdfParams) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const logoUrl = `${window.location.origin}/images/masterclin-logo.png`
  const now = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  // Format month name (e.g., "Agosto de 2026")
  const formattedMonth = dayjs(podiumMonth).format('MMMM [de] YYYY')
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

  const bonusMap: Record<number, string> = {
    1: 'R$ 400,00',
    2: 'R$ 300,00',
    3: 'R$ 200,00',
  }

  const medalMap: Record<number, { title: string; badgeClass: string; borderClass: string; bgClass: string }> = {
    1: {
      title: '1º Lugar (Ouro 🥇)',
      badgeClass: 'background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b;',
      borderClass: 'border: 2px solid #f59e0b;',
      bgClass: 'background-color: #fffbeb;',
    },
    2: {
      title: '2º Lugar (Prata 🥈)',
      badgeClass: 'background-color: #f1f5f9; color: #334155; border: 1px solid #94a3b8;',
      borderClass: 'border: 2px solid #cbd5e1;',
      bgClass: 'background-color: #f8fafc;',
    },
    3: {
      title: '3º Lugar (Bronze 🥉)',
      badgeClass: 'background-color: #ffedd5; color: #9a3412; border: 1px solid #ea580c;',
      borderClass: 'border: 2px solid #fdba74;',
      bgClass: 'background-color: #fff7ed;',
    },
  }

  const cardsHtml = podium.map((item) => {
    const styleCfg = medalMap[item.position] || medalMap[3]
    const bonus = bonusMap[item.position] || 'R$ 0,00'

    return `
      <div style="border-radius: 8px; padding: 14px; margin-bottom: 12px; ${styleCfg.borderClass} ${styleCfg.bgClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; ${styleCfg.badgeClass}">
              ${styleCfg.title}
            </span>
            <span style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-left: 8px;">
              ${item.sellerName}
            </span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 8pt; color: #64748b; font-weight: 600; text-transform: uppercase;">Bonificação Oficial:</span>
            <span style="font-size: 11pt; font-weight: 800; color: #059669; margin-left: 4px;">${bonus}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 8.5pt; color: #334155;">
          <div>
            <span style="color: #64748b;">Nível de Satisfação:</span>
            <strong style="color: #059669; font-size: 9.5pt;"> ${item.satisfactionRate}%</strong>
          </div>
          <div>
            <span style="color: #64748b;">Total de Avaliações:</span>
            <strong> ${item.totalEvaluations}</strong> (${item.excellentCount} ótimas, ${item.goodCount} boas)
          </div>
        </div>
      </div>
    `
  }).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Pódio da Recepção - ${capitalizedMonth} - Masterclin</title>
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
            padding: 15mm 20mm 20mm 20mm;
            background: #ffffff;
            font-size: 10pt;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .logo {
            max-height: 65px;
            max-width: 240px;
            width: auto;
            object-fit: contain;
          }
          .header-info {
            text-align: right;
          }
          .title {
            font-size: 15pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 9pt;
            color: #0284c7;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 18px;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            font-size: 9pt;
            gap: 8px;
          }
          .info-item {
            color: #475569;
          }
          .info-item strong {
            color: #0f172a;
          }
          .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #0284c7;
            background-color: #f1f5f9;
            padding: 6px 10px;
            border-left: 4px solid #0284c7;
            margin-top: 16px;
            margin-bottom: 14px;
            text-transform: uppercase;
          }
          .table-podium {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 14px;
            margin-bottom: 20px;
          }
          .table-podium th {
            background-color: #0284c7;
            color: #ffffff;
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            font-size: 8.5pt;
            text-transform: uppercase;
          }
          .table-podium td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
          }
          .signature-section {
            margin-top: 40px;
            text-align: center;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 240px;
            border-top: 1.5px solid #334155;
            margin: 0 auto 8px auto;
          }
          .signature-name {
            font-size: 11pt;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .signature-role {
            font-size: 9pt;
            color: #475569;
            font-weight: 600;
            margin-top: 2px;
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
            <h1 class="title">Pódio da Recepção</h1>
            <p class="subtitle">Destaques do Mês e Bonificações</p>
          </div>
        </div>

        <div class="info-box">
          <div class="info-item"><strong>Unidade:</strong> ${unitName}</div>
          <div class="info-item"><strong>Mês de Referência:</strong> ${capitalizedMonth}</div>
          <div class="info-item"><strong>Emissão:</strong> ${now}</div>
          <div class="info-item"><strong>Classificados:</strong> ${podium.length}</div>
        </div>

        <div class="section-title">Classificação Oficial e Premiação</div>

        ${
          podium.length === 0
            ? '<div style="text-align: center; padding: 25px; color: #64748b; background-color: #f8fafc; border-radius: 8px;">Nenhuma avaliação computada para esta unidade no mês selecionado.</div>'
            : cardsHtml
        }

        <div class="section-title">Resumo Geral do Pódio</div>

        <table class="table-podium">
          <thead>
            <tr>
              <th style="width: 80px;">Posição</th>
              <th>Colaborador(a)</th>
              <th style="width: 140px;">Avaliações</th>
              <th style="width: 100px;">Satisfação</th>
              <th style="width: 110px;">Bonificação</th>
            </tr>
          </thead>
          <tbody>
            ${
              podium.length === 0
                ? '<tr><td colspan="5" style="text-align: center; padding: 12px; color: #94a3b8;">Sem registros para o período.</td></tr>'
                : podium.map((item) => `
                    <tr>
                      <td style="font-weight: 800; text-align: center;">${item.position}º</td>
                      <td style="font-weight: 600;">${item.sellerName}</td>
                      <td>${item.totalEvaluations} (${item.excellentCount} ótimas, ${item.goodCount} boas)</td>
                      <td style="font-weight: 700; color: #059669;">${item.satisfactionRate}%</td>
                      <td style="font-weight: 800; color: #059669;">${bonusMap[item.position] || 'R$ 0,00'}</td>
                    </tr>
                  `).join('')
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
