import type { PodiumItem } from '@/http/get-evaluations'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

interface ExportPodiumPngParams {
  podium: PodiumItem[]
  unitName: string
  podiumMonth: string // YYYY-MM
}

export async function downloadPodiumPng({
  podium,
  unitName,
  podiumMonth,
}: ExportPodiumPngParams) {
  // Format month name (e.g., "Agosto de 2026")
  const formattedMonth = dayjs(podiumMonth).format('MMMM [de] YYYY')
  const capitalizedMonth =
    formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

  const logo = new Image()
  logo.crossOrigin = 'anonymous'
  logo.src = '/images/masterclin-logo.png'

  const bonusMap: Record<number, string> = {
    1: 'R$ 400,00',
    2: 'R$ 300,00',
    3: 'R$ 200,00',
  }

  const medalMap: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  }

  function roundRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.arcTo(x + w, y, x + w, y + h, r)
    c.arcTo(x + w, y + h, x, y + h, r)
    c.arcTo(x, y + h, x, y, r)
    c.arcTo(x, y, x + w, y, r)
    c.closePath()
  }

  const drawAndExport = () => {
    const width = 1080
    const cardHeight = 440
    const cardGap = 32
    const headerHeight = 330
    const bottomPadding = 60
    const count = Math.max(1, podium.length)
    const height =
      headerHeight + count * cardHeight + (count - 1) * cardGap + bottomPadding

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Background (Fundo cinza claro / azulado)
    ctx.fillStyle = '#f0f4f8'
    ctx.fillRect(0, 0, width, height)

    // 2. Logo Centralizada no Topo (Tamanho Ampliado)
    if (logo.complete && logo.naturalHeight > 0) {
      const maxLogoH = 120
      const maxLogoW = 440
      let logoW = logo.width
      let logoH = logo.height
      if (logoH > maxLogoH) {
        logoW = (maxLogoH / logoH) * logoW
        logoH = maxLogoH
      }
      if (logoW > maxLogoW) {
        logoH = (maxLogoW / logoW) * logoH
        logoW = maxLogoW
      }
      const logoX = (width - logoW) / 2
      const logoY = 35
      ctx.drawImage(logo, logoX, logoY, logoW, logoH)
    }

    // 3. Título Principal
    ctx.textAlign = 'center'
    ctx.fillStyle = '#0056b3'
    ctx.font = '800 34px "Inter", system-ui, -apple-system, sans-serif'
    ctx.fillText('DESTAQUES DO ATENDIMENTO', width / 2, 195)

    // 4. Subtitle Badge (Pill)
    const subtitleText = `UNIDADE ${unitName.toUpperCase()} • ${capitalizedMonth.toUpperCase()}`
    ctx.font = '600 16px "Inter", system-ui, -apple-system, sans-serif'
    const pillPaddingX = 22
    const pillWidth = ctx.measureText(subtitleText).width + pillPaddingX * 2
    const pillHeight = 38
    const pillX = (width - pillWidth) / 2
    const pillY = 220

    ctx.fillStyle = '#e6f0fa'
    roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 19)
    ctx.fill()
    ctx.strokeStyle = '#b3d4f5'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#0056b3'
    ctx.fillText(subtitleText, width / 2, pillY + 24)

    // 5. Renderização dos Cards do Pódio
    const cardWidth = 960
    const cardX = (width - cardWidth) / 2
    let currentY = 300

    if (podium.length === 0) {
      // Estado Vazio
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, cardX, currentY, cardWidth, 200, 24)
      ctx.fill()
      ctx.strokeStyle = '#b3d4f5'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#4a5568'
      ctx.font = '600 22px "Inter", system-ui, -apple-system, sans-serif'
      ctx.fillText(
        'Nenhuma avaliação apurada para esta unidade no período.',
        width / 2,
        currentY + 110
      )
    } else {
      podium.forEach((item) => {
        const medal = medalMap[item.position] || '🏅'
        const bonus = bonusMap[item.position] || 'R$ 0,00'

        // --- Card Container (Fundo Branco com Borda Azul e Border Radius) ---
        ctx.save()
        ctx.shadowColor = 'rgba(0, 86, 179, 0.12)'
        ctx.shadowBlur = 25
        ctx.shadowOffsetY = 10
        ctx.fillStyle = '#ffffff'
        roundRect(ctx, cardX, currentY, cardWidth, cardHeight, 28)
        ctx.fill()
        ctx.restore()

        ctx.strokeStyle = '#0056b3'
        ctx.lineWidth = 3
        roundRect(ctx, cardX, currentY, cardWidth, cardHeight, 28)
        ctx.stroke()

        // --- Topo do Card: Posição e Bonificação ---
        const innerPaddingX = 36
        const topY = currentY + 48

        // Rank Info (Esquerda)
        ctx.textAlign = 'left'
        ctx.fillStyle = '#0056b3'
        ctx.font = '800 20px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `${medal} ${item.position}º LUGAR — ATENDENTE DESTAQUE`,
          cardX + innerPaddingX,
          topY
        )

        // Bonus Badge (Direita)
        const bonusText = `BONIFICAÇÃO: ${bonus}`
        ctx.font = '800 17px "Inter", system-ui, -apple-system, sans-serif'
        const bPaddingX = 18
        const bWidth = ctx.measureText(bonusText).width + bPaddingX * 2
        const bHeight = 36
        const bX = cardX + cardWidth - innerPaddingX - bWidth
        const bY = currentY + 24

        ctx.save()
        ctx.shadowColor = 'rgba(245, 158, 11, 0.25)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 4
        ctx.fillStyle = '#f59e0b'
        roundRect(ctx, bX, bY, bWidth, bHeight, 18)
        ctx.fill()
        ctx.restore()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(bonusText, bX + bWidth / 2, bY + 23)

        // --- Nome do Atendente ---
        ctx.textAlign = 'left'
        ctx.fillStyle = '#1a202c'
        ctx.font = '800 42px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText(item.sellerName, cardX + innerPaddingX, currentY + 115)

        // --- Divisor Suave ---
        ctx.strokeStyle = '#e6f0fa'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cardX + innerPaddingX, currentY + 145)
        ctx.lineTo(cardX + cardWidth - innerPaddingX, currentY + 145)
        ctx.stroke()

        // --- Grid de Estatísticas (2 Caixas Lado a Lado) ---
        const gridY = currentY + 172
        const gridWidth = cardWidth - innerPaddingX * 2
        const statGap = 20
        const statBoxW = (gridWidth - statGap) / 2
        const statBoxH = 150

        // Caixa 1: Nível de Satisfação (Highlight / Destaque)
        const box1X = cardX + innerPaddingX
        ctx.fillStyle = '#e6f0fa'
        roundRect(ctx, box1X, gridY, statBoxW, statBoxH, 18)
        ctx.fill()
        ctx.strokeStyle = '#0056b3'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#0056b3'
        ctx.font = '800 52px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item.satisfactionRate}%`, box1X + 28, gridY + 68)

        ctx.fillStyle = '#4a5568'
        ctx.font = '600 15px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText('NÍVEL DE SATISFAÇÃO', box1X + 28, gridY + 108)

        // Caixa 2: Total de Avaliações
        const box2X = box1X + statBoxW + statGap
        ctx.fillStyle = '#fafcfd'
        roundRect(ctx, box2X, gridY, statBoxW, statBoxH, 18)
        ctx.fill()
        ctx.strokeStyle = '#b3d4f5'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#0056b3'
        ctx.font = '800 52px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item.totalEvaluations}`, box2X + 28, gridY + 68)

        ctx.fillStyle = '#4a5568'
        ctx.font = '600 15px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText('TOTAL DE AVALIAÇÕES', box2X + 28, gridY + 108)

        // --- Rodapé do Card (Sem ícone de brilho) ---
        const footerY = currentY + 368
        ctx.fillStyle = '#4a5568'
        ctx.font = '600 17px "Inter", system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `${item.excellentCount} avaliações Ótimas • ${item.goodCount} avaliações Boas`,
          cardX + innerPaddingX,
          footerY
        )

        currentY += cardHeight + cardGap
      })
    }

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `destaques-atendimento-${unitName.toLowerCase().replace(/\s+/g, '-')}-${podiumMonth}.png`
    link.click()
  }

  if (logo.complete) {
    drawAndExport()
  } else {
    logo.onload = () => drawAndExport()
    logo.onerror = () => drawAndExport()
  }
}
